/**
 * @fileoverview Semaphore utility functions for the anonymous voting system
 * @description Provides helper functions for fetching group members, building Merkle trees,
 *              and formatting proofs for the smart contract.
 */

import { Group } from "@semaphore-protocol/group";
import { ethers } from "ethers";

// Cache for group members to reduce RPC calls
const groupMembersCache = new Map();
const CACHE_TTL = 60000; // 1 minute cache

/**
 * @typedef {Object} CachedGroup
 * @property {bigint[]} members - Array of identity commitments
 * @property {number} timestamp - Cache timestamp
 */

/**
 * Fetches group members from VoterRegistered events
 * @param {ethers.Contract} contract - The AnonymousVoting contract instance
 * @param {number|string} pollId - The poll ID to fetch members for
 * @param {boolean} useCache - Whether to use cached data
 * @returns {Promise<bigint[]>} Array of identity commitments
 */
export async function fetchGroupMembers(contract, pollId, useCache = true) {
  const cacheKey = `${contract.target}-${pollId}`;
  
  // Check cache first
  if (useCache && groupMembersCache.has(cacheKey)) {
    const cached = groupMembersCache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`[Semaphore] Using cached group members for poll ${pollId}`);
      return cached.members;
    }
  }
  
  console.log(`[Semaphore] Fetching group members for poll ${pollId}...`);
  
  try {
    // Query VoterRegistered events for this poll
    const filter = contract.filters.VoterRegistered(pollId);
    const events = await contract.queryFilter(filter);
    
    // Extract identity commitments from events
    const members = events.map(event => BigInt(event.args.identityCommitment));
    
    console.log(`[Semaphore] Found ${members.length} registered voters for poll ${pollId}`);
    
    // Update cache
    groupMembersCache.set(cacheKey, {
      members,
      timestamp: Date.now()
    });
    
    return members;
  } catch (error) {
    console.error("[Semaphore] Error fetching group members:", error);
    throw new Error(`Failed to fetch group members: ${error.message}`);
  }
}

/**
 * Builds a Semaphore Group from member commitments
 * @param {bigint[]} members - Array of identity commitments
 * @returns {Group} Semaphore Group instance
 */
export function buildGroup(members) {
  console.log(`[Semaphore] Building group with ${members.length} members...`);
  
  const group = new Group();
  
  for (const member of members) {
    group.addMember(member);
  }
  
  console.log(`[Semaphore] Group built. Root: ${group.root.toString().slice(0, 20)}...`);
  
  return group;
}

/**
 * Formats a Semaphore proof for the smart contract
 * @param {Object} proof - The generated Semaphore proof
 * @returns {Object} Formatted proof object matching ISemaphore.SemaphoreProof struct
 */
export function formatProofForContract(proof) {
  return {
    merkleTreeDepth: proof.merkleTreeDepth,
    merkleTreeRoot: proof.merkleTreeRoot,
    nullifier: proof.nullifier,
    message: proof.message,
    scope: proof.scope,
    points: proof.points
  };
}

/**
 * Checks if an identity commitment is registered in a poll's group
 * @param {ethers.Contract} contract - The AnonymousVoting contract instance
 * @param {number|string} pollId - The poll ID
 * @param {bigint} commitment - The identity commitment to check
 * @returns {Promise<boolean>} True if registered
 */
export async function isCommitmentRegistered(contract, pollId, commitment) {
  const members = await fetchGroupMembers(contract, pollId);
  return members.some(m => m === commitment);
}

/**
 * Gets the current Merkle root for a poll's group
 * @param {ethers.Contract} contract - The AnonymousVoting contract instance
 * @param {number|string} pollId - The poll ID
 * @returns {Promise<bigint>} The Merkle root
 */
export async function getMerkleRoot(contract, pollId) {
  try {
    const root = await contract.getMerkleRoot(pollId);
    return BigInt(root);
  } catch (error) {
    console.error("[Semaphore] Error fetching Merkle root:", error);
    throw error;
  }
}

/**
 * Clears the group members cache
 * @param {string} pollId - Optional poll ID to clear specific cache
 */
export function clearCache(pollId = null) {
  if (pollId) {
    // Clear specific poll cache
    for (const key of groupMembersCache.keys()) {
      if (key.endsWith(`-${pollId}`)) {
        groupMembersCache.delete(key);
      }
    }
  } else {
    // Clear all cache
    groupMembersCache.clear();
  }
  console.log("[Semaphore] Cache cleared");
}

/**
 * Validates that a proof was generated correctly
 * @param {Object} proof - The Semaphore proof
 * @param {number|string} expectedPollId - Expected poll ID (scope)
 * @param {number|string} expectedOption - Expected vote option (message)
 * @returns {boolean} True if proof appears valid
 */
export function validateProofLocally(proof, expectedPollId, expectedOption) {
  if (!proof || !proof.points || proof.points.length !== 8) {
    console.error("[Semaphore] Invalid proof structure");
    return false;
  }
  
  if (BigInt(proof.scope) !== BigInt(expectedPollId)) {
    console.error("[Semaphore] Proof scope doesn't match poll ID");
    return false;
  }
  
  if (BigInt(proof.message) !== BigInt(expectedOption)) {
    console.error("[Semaphore] Proof message doesn't match vote option");
    return false;
  }
  
  return true;
}

export default {
  fetchGroupMembers,
  buildGroup,
  formatProofForContract,
  isCommitmentRegistered,
  getMerkleRoot,
  clearCache,
  validateProofLocally
};
