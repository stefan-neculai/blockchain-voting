/**
 * @fileoverview Vote tracking utility for UX purposes
 * @description Tracks which polls a user has voted in locally.
 * 
 * IMPORTANT PRIVACY NOTES:
 * 1. This is purely for UX - to show "You already voted" before attempting
 * 2. We DO NOT store which option was chosen (that would break anonymity)
 * 3. The real protection is on-chain (nullifier prevents double voting)
 * 4. Clearing browser data will clear this, but blockchain still prevents re-voting
 * 5. This data is stored per-account so switching wallets shows correct state
 */

const STORAGE_KEY_PREFIX = 'zkvote_voted_';

/**
 * Gets the storage key for an account
 * @param {string} account - The wallet address
 * @returns {string} The storage key
 */
function getStorageKey(account) {
  if (!account) return null;
  return `${STORAGE_KEY_PREFIX}${account.toLowerCase()}`;
}

/**
 * Gets all voted polls for an account
 * @param {string} account - The wallet address
 * @returns {Object} Map of pollId -> { timestamp, txHash? }
 */
export function getVotedPolls(account) {
  const key = getStorageKey(account);
  if (!key) return {};
  
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : {};
  } catch (err) {
    console.error('[VoteTracker] Error reading voted polls:', err);
    return {};
  }
}

/**
 * Checks if a user has voted in a specific poll
 * @param {string} account - The wallet address
 * @param {number|string} pollId - The poll ID
 * @returns {boolean} True if voted
 */
export function hasVotedInPoll(account, pollId) {
  const votedPolls = getVotedPolls(account);
  return !!votedPolls[String(pollId)];
}

/**
 * Records that a user has voted in a poll
 * NOTE: We intentionally do NOT store which option was chosen
 * @param {string} account - The wallet address
 * @param {number|string} pollId - The poll ID
 * @param {string} [txHash] - Optional transaction hash for reference
 */
export function recordVote(account, pollId, txHash = null) {
  const key = getStorageKey(account);
  if (!key) return;
  
  try {
    const votedPolls = getVotedPolls(account);
    votedPolls[String(pollId)] = {
      timestamp: Date.now(),
      txHash: txHash || null
      // NOTE: We do NOT store the option/choice - that would break privacy!
    };
    localStorage.setItem(key, JSON.stringify(votedPolls));
    console.log(`[VoteTracker] Recorded vote for poll ${pollId}`);
  } catch (err) {
    console.error('[VoteTracker] Error recording vote:', err);
  }
}

/**
 * Gets vote info for a specific poll
 * @param {string} account - The wallet address
 * @param {number|string} pollId - The poll ID
 * @returns {Object|null} Vote info { timestamp, txHash } or null if not voted
 */
export function getVoteInfo(account, pollId) {
  const votedPolls = getVotedPolls(account);
  return votedPolls[String(pollId)] || null;
}

/**
 * Clears all vote records for an account (for testing/debugging)
 * @param {string} account - The wallet address
 */
export function clearVoteRecords(account) {
  const key = getStorageKey(account);
  if (!key) return;
  localStorage.removeItem(key);
  console.log('[VoteTracker] Vote records cleared');
}

const voteTracker = {
  getVotedPolls,
  hasVotedInPoll,
  recordVote,
  getVoteInfo,
  clearVoteRecords
};

export default voteTracker;
