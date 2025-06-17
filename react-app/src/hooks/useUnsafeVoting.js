import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../contexts/Web3Context';

// Import your contract's ABI
import VotingContractABI from '../abis/MultiCandidateVoting.json';

// Get the contract address from your environment variables
const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;


export const useUnsafeVoting = () => {
  const { provider, signer, isConnected } = useWeb3();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // A helper function to get an instance of your contract
  const getContract = useCallback((withSigner = false) => {
    if (!provider) {
      console.error("Provider not available");
      return null;
    }
    // Use the signer for transactions, or the provider for read-only calls
    const contractProviderOrSigner = withSigner ? signer : provider;
    return new ethers.Contract(contractAddress, VotingContractABI.abi, contractProviderOrSigner);
  }, [provider, signer]);


  // THE CORE FUNCTION TO CAST A VOTE
  const castVote = useCallback(async (pollId, candidateId) => {
    if (!isConnected) {
      setError("Please connect your wallet to vote.");
      return;
    }

    const contract = getContract(true); // Get a contract instance with the signer
    if (!contract) return;

    setIsLoading(true);
    setError(null);
    setSuccessMessage('');

    try {
      // --- This is the "Mocked" ZK Proof Part ---
      // Since we are using MockVerifier.sol, the contract will accept any garbage data here.
      // This allows us to test the entire on-chain flow.
      console.log("Preparing mock proof data...");

      // We still need to create these values, even if they are fake.
      const mockMerkleRoot = ethers.encodeBytes32String("test_root_1"); // Must match the root on the poll
      const mockNullifier = ethers.id(`${signer.address}-${pollId}`); // A simple, predictable nullifier for testing
      
      const mockProof = {
        a: ["0", "0"],
        b: [["0", "0"], ["0", "0"]],
        c: ["0", "0"],
      };

      const mockPublicInputs = [
        ethers.hexlify(mockMerkleRoot),
        mockNullifier,
        String(candidateId),
        String(pollId)
      ];

      // --- Sending the actual transaction ---
      console.log(`Sending vote transaction for Poll ${pollId}, Candidate ${candidateId}...`);
      
      const tx = await contract.castVote(
        pollId,
        mockProof.a,
        mockProof.b,
        mockProof.c,
        mockPublicInputs
      );

      setSuccessMessage("Transaction submitted! Waiting for confirmation...");
      await tx.wait(); // Wait for 1 confirmation

      setSuccessMessage(`Vote successfully cast for poll #${pollId}!`);

    } catch (err) {
      console.error("Voting transaction failed:", err);
      // Try to extract a human-readable error from the transaction failure
      const message = err.reason || "The transaction was rejected or failed.";
      setError(`Error: ${message}`);
    } finally {
      setIsLoading(false);
    }
  }, [getContract, isConnected, signer]);


  // A function to get the results for a specific poll
  const getPollResults = useCallback(async (pollId, numCandidates) => {
    const contract = getContract(false); // Read-only instance
    if (!contract) return null;

    try {
      const counts = {};
      for (let i = 0; i < numCandidates; i++) {
        const count = await contract.getVoteCount(pollId, i);
        counts[i] = Number(count); // Convert BigInt to Number for easy use
      }
      return counts;
    } catch (err) {
      console.error("Failed to fetch results:", err);
      return null;
    }
  }, [getContract]);


const fetchAllPolls = useCallback(async () => {
    const contract = getContract(false); // Read-only instance
    if (!contract) return [];

    try {
      // 1. Get the total number of polls from the public `pollCounter` variable
      const totalPolls = await contract.pollCounter();
      const totalPollsNum = Number(totalPolls);

      if (totalPollsNum === 0) {
        return []; // No polls created yet
      }
      
      const polls = [];
      // 2. Loop from 1 to the total number of polls
      for (let i = 1; i <= totalPollsNum; i++) {
        // 3. Fetch each poll by its ID
        const pollData = await contract.polls(i);
        
        // The contract returns a struct as an array-like object.
        // Let's format it into a nice JavaScript object.
        if (pollData.id > 0) { // Check if the poll actually exists
          polls.push({
            id: Number(pollData.id),
            title: pollData.title,
            numCandidates: Number(pollData.numCandidates),
            merkleRoot: pollData.merkleRoot,
            totalVotes: Number(pollData.totalVotes),
            isActive: pollData.isActive,
            // For the description, you might store it off-chain.
            // For this example, we'll generate a placeholder.
            description: `A poll with ${pollData.numCandidates} candidates.`
          });
        }
      }
      return polls;
    } catch (err) {
      console.error("Failed to fetch polls:", err);
      // You could set an error state here as well
      return []; // Return an empty array on failure
    }
  }, [getContract]);

  // Make sure to return the new function from the hook
  return { isLoading, error, successMessage, castVote, getPollResults, fetchAllPolls };
};