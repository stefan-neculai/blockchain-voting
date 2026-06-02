/**
 * @fileoverview Nickname utility for user-friendly addresses
 * @description Stores and retrieves nicknames for wallet addresses in localStorage
 */

const NICKNAMES_STORAGE_KEY = 'voting_nicknames';

/**
 * Gets all stored nicknames
 * @returns {Object} Map of address -> nickname
 */
export const getAllNicknames = () => {
  try {
    const stored = localStorage.getItem(NICKNAMES_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

/**
 * Gets the nickname for an address
 * @param {string} address - The wallet address
 * @returns {string|null} The nickname or null
 */
export const getNickname = (address) => {
  if (!address) return null;
  const nicknames = getAllNicknames();
  return nicknames[address.toLowerCase()] || null;
};

/**
 * Sets a nickname for an address
 * @param {string} address - The wallet address
 * @param {string} nickname - The nickname to set
 */
export const setNickname = (address, nickname) => {
  if (!address) return;
  const nicknames = getAllNicknames();
  nicknames[address.toLowerCase()] = nickname.trim();
  localStorage.setItem(NICKNAMES_STORAGE_KEY, JSON.stringify(nicknames));
};

/**
 * Removes a nickname for an address
 * @param {string} address - The wallet address
 */
export const removeNickname = (address) => {
  if (!address) return;
  const nicknames = getAllNicknames();
  delete nicknames[address.toLowerCase()];
  localStorage.setItem(NICKNAMES_STORAGE_KEY, JSON.stringify(nicknames));
};

/**
 * Gets display name for an address (nickname or shortened address)
 * @param {string} address - The wallet address
 * @param {boolean} showAddress - Whether to append shortened address
 * @returns {string} Display name
 */
export const getDisplayName = (address, showAddress = false) => {
  if (!address) return 'Unknown';
  
  const nickname = getNickname(address);
  const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
  
  if (nickname) {
    return showAddress ? `${nickname} (${shortAddress})` : nickname;
  }
  return shortAddress;
};

const nicknameUtils = {
  getAllNicknames,
  getNickname,
  setNickname,
  removeNickname,
  getDisplayName
};

export default nicknameUtils;
