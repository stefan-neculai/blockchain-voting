/**
 * @fileoverview React hook for anonymous voting with ZK proofs
 * @description Handles proof generation and vote submission using Semaphore
 */

/* global BigInt */

import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { generateProof } from '@semaphore-protocol/proof';
import { useWeb3 } from '../contexts/Web3Context';
import { useIdentity } from './useIdentity';
import { 
  fetchGroupMembers, 
  buildGroup, 
  formatProofForContract,
  isCommitmentRegistered,
  validateProofLocally 
} from '../utils/semaphore';

// Import the AnonymousVoting ABI
import AnonymousVotingABI from '../abis/AnonymousVoting.json';

// Contract address from environment
const VOTING_CONTRACT_ADDRESS = process.env.REACT_APP_ANONYMOUS_VOTING_ADDRESS;

/**
 * Voting state enum
 */
export const VotingState = {
  IDLE: 'idle',
  CHECKING_REGISTRATION: 'checking_registration',
  FETCHING_GROUP: 'fetching_group',
  GENERATING_PROOF: 'generating_proof',
  SUBMITTING_VOTE: 'submitting_vote',
  SUCCESS: 'success',
  ERROR: 'error'
};

/**
 * Custom hook for anonymous voting with ZK proofs
 * @returns {Object} Voting functions and state
 */
export function useAnonymousVoting() {
  const { provider, isConnected } = useWeb3();
  const { identity, hasIdentity, commitment } = useIdentity();
  
  // State
  const [votingState, setVotingState] = useState(VotingState.IDLE);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [proofGenerationTime, setProofGenerationTime] = useState(null);
  const [transactionHash, setTransactionHash] = useState(null);
  
  /**
   * Gets the contract instance
   * @param {boolean} withSigner - Whether to get with signer for write operations
   * @returns {ethers.Contract|null}
   */
  const getContract = useCallback((withSigner = false) => {
    if (!provider) {
      console.error("[Voting] Provider not available");
      return null;
    }
    
    const providerOrSigner = withSigner ? provider.getSigner() : provider;
    return new ethers.Contract(
      VOTING_CONTRACT_ADDRESS, 
      AnonymousVotingABI.abi, 
      providerOrSigner
    );
  }, [provider]);
  
  /**
   * Gets the contract with signer (async version)
   * @returns {Promise<ethers.Contract>}
   */
  const getSignedContract = useCallback(async () => {
    if (!provider) throw new Error("Provider not available");
    const signer = await provider.getSigner();
    return new ethers.Contract(VOTING_CONTRACT_ADDRESS, AnonymousVotingABI.abi, signer);
  }, [provider]);
  
  /**
   * Checks if the current user is registered for a poll
   * @param {number|string} pollId - The poll ID
   * @returns {Promise<boolean>}
   */
  const isRegistered = useCallback(async (pollId) => {
    if (!hasIdentity || !commitment) {
      return false;
    }
    
    try {
      const contract = getContract(false);
      if (!contract) return false;
      
      return await isCommitmentRegistered(contract, pollId, BigInt(commitment));
    } catch (err) {
      console.error("[Voting] Error checking registration:", err);
      return false;
    }
  }, [getContract, hasIdentity, commitment]);
  
  /**
   * Casts an anonymous vote for a poll option
   * @param {number|string} pollId - The poll ID
   * @param {number} optionIndex - The option to vote for
   * @returns {Promise<{success: boolean, txHash?: string}>}
   */
  const castVote = useCallback(async (pollId, optionIndex) => {
    // Reset state
    setError(null);
    setSuccessMessage('');
    setTransactionHash(null);
    setProofGenerationTime(null);
    
    // Validation
    if (!isConnected) {
      setError("Please connect your wallet first");
      setVotingState(VotingState.ERROR);
      return { success: false };
    }
    
    if (!hasIdentity || !identity) {
      setError("Please create your anonymous identity first");
      setVotingState(VotingState.ERROR);
      return { success: false };
    }
    
    setIsLoading(true);
    
    try {
      const contract = await getSignedContract();
      
      // Step 1: Check if registered
      setVotingState(VotingState.CHECKING_REGISTRATION);
      console.log("[Voting] Checking registration status...");
      
      const registered = await isCommitmentRegistered(
        contract, 
        pollId, 
        identity.commitment
      );
      
      if (!registered) {
        throw new Error("You are not registered to vote in this poll. Please contact the poll administrator.");
      }
      
      // Step 2: Fetch group members
      setVotingState(VotingState.FETCHING_GROUP);
      console.log("[Voting] Fetching group members...");
      
      const members = await fetchGroupMembers(contract, pollId);
      if (members.length === 0) {
        throw new Error("No voters registered for this poll");
      }
      
      // Step 3: Build the group (Merkle tree)
      const group = buildGroup(members);
      
      // Step 4: Generate ZK proof
      setVotingState(VotingState.GENERATING_PROOF);
      console.log("[Voting] Generating ZK proof... This may take a few seconds.");
      
      const proofStartTime = performance.now();
      
      const proof = await generateProof(
        identity,
        group,
        optionIndex,    // message: the vote choice
        pollId          // scope: poll-specific nullifier
      );
      
      const proofEndTime = performance.now();
      const proofTime = ((proofEndTime - proofStartTime) / 1000).toFixed(2);
      setProofGenerationTime(proofTime);
      
      console.log(`[Voting] Proof generated in ${proofTime}s`);
      console.log("[Voting] Nullifier:", proof.nullifier.toString().slice(0, 20) + "...");
      
      // Validate proof locally before submitting
      if (!validateProofLocally(proof, pollId, optionIndex)) {
        throw new Error("Proof validation failed locally");
      }
      
      // Step 5: Submit vote transaction
      setVotingState(VotingState.SUBMITTING_VOTE);
      console.log("[Voting] Submitting vote transaction...");
      
      const formattedProof = formatProofForContract(proof);
      
      const tx = await contract.vote(pollId, optionIndex, formattedProof);
      
      console.log("[Voting] Transaction submitted:", tx.hash);
      setTransactionHash(tx.hash);
      
      // Wait for confirmation
      setSuccessMessage("Transaction submitted! Waiting for confirmation...");
      await tx.wait();
      
      // Success!
      setVotingState(VotingState.SUCCESS);
      setSuccessMessage(`Vote successfully cast! Your vote is anonymous and cannot be traced back to you.`);
      console.log("[Voting] Vote confirmed!");
      
      return { success: true, txHash: tx.hash };
      
    } catch (err) {
      console.error("[Voting] Error casting vote:", err);
      setVotingState(VotingState.ERROR);
      
      // Parse error message
      let errorMessage = "Failed to cast vote";
      
      if (err.code === 4001 || err.code === "ACTION_REJECTED") {
        errorMessage = "Transaction was rejected";
      } else if (err.message?.includes("AlreadyVoted") || err.message?.includes("nullifier")) {
        errorMessage = "You have already voted in this poll";
      } else if (err.message?.includes("PollNotActive")) {
        errorMessage = "This poll is not currently active";
      } else if (err.message?.includes("PollEnded")) {
        errorMessage = "This poll has ended";
      } else if (err.message?.includes("InvalidOption")) {
        errorMessage = "Invalid voting option";
      } else if (err.message?.includes("not registered")) {
        errorMessage = err.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      return { success: false };
      
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, hasIdentity, identity, getSignedContract]);
  
  /**
   * Resets the voting state
   */
  const resetState = useCallback(() => {
    setVotingState(VotingState.IDLE);
    setError(null);
    setSuccessMessage('');
    setTransactionHash(null);
    setProofGenerationTime(null);
  }, []);
  
  /**
   * Gets a human-readable status message
   * @returns {string}
   */
  const getStatusMessage = useCallback(() => {
    switch (votingState) {
      case VotingState.CHECKING_REGISTRATION:
        return "Checking registration status...";
      case VotingState.FETCHING_GROUP:
        return "Fetching voter registry...";
      case VotingState.GENERATING_PROOF:
        return "Generating zero-knowledge proof... (this may take a few seconds)";
      case VotingState.SUBMITTING_VOTE:
        return "Submitting your anonymous vote...";
      case VotingState.SUCCESS:
        return successMessage;
      case VotingState.ERROR:
        return error;
      default:
        return "";
    }
  }, [votingState, successMessage, error]);
  
  return {
    // State
    votingState,
    isLoading,
    error,
    successMessage,
    proofGenerationTime,
    transactionHash,
    
    // Computed
    canVote: isConnected && hasIdentity,
    statusMessage: getStatusMessage(),
    
    // Actions
    castVote,
    isRegistered,
    resetState,
    
    // Contract helper
    getContract
  };
}

export default useAnonymousVoting;
