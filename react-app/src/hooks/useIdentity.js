/**
 * @fileoverview React hook for managing Semaphore identity
 * @description Handles identity generation, storage, and recovery for anonymous voting
 */

import { useState, useCallback, useEffect } from 'react';
import { Identity } from '@semaphore-protocol/identity';
import { useWeb3 } from '../contexts/Web3Context';

// LocalStorage key prefix for identity (will be combined with account address)
const IDENTITY_STORAGE_PREFIX = 'semaphore_identity_';

/**
 * Gets the storage key for a specific account
 * @param {string} account - The wallet address
 * @returns {string} The storage key
 */
const getStorageKey = (account) => {
  if (!account) return null;
  return `${IDENTITY_STORAGE_PREFIX}${account.toLowerCase()}`;
};

/**
 * Custom hook for managing Semaphore identity
 * @returns {Object} Identity management functions and state
 */
export function useIdentity() {
  const { account, provider } = useWeb3();
  
  // State
  const [identity, setIdentity] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  /**
   * Loads existing identity from localStorage when account changes
   */
  useEffect(() => {
    const loadStoredIdentity = () => {
      // Reset identity when account changes
      setIdentity(null);
      setIsInitialized(false);
      
      if (!account) {
        setIsInitialized(true);
        return;
      }
      
      try {
        const storageKey = getStorageKey(account);
        const storedSecret = localStorage.getItem(storageKey);
        if (storedSecret) {
          const restoredIdentity = new Identity(storedSecret);
          setIdentity(restoredIdentity);
          console.log("[Identity] Restored identity for account:", account);
        } else {
          console.log("[Identity] No stored identity for account:", account);
        }
      } catch (err) {
        console.error("[Identity] Failed to restore identity:", err);
        const storageKey = getStorageKey(account);
        if (storageKey) localStorage.removeItem(storageKey);
      } finally {
        setIsInitialized(true);
      }
    };
    
    loadStoredIdentity();
  }, [account]); // Re-run when account changes
  
  /**
   * Creates a new identity by signing a message with MetaMask
   * The signature is used as entropy for deterministic identity generation
   * @returns {Promise<Identity>} The created identity
   */
  const createIdentity = useCallback(async () => {
    if (!provider || !account) {
      throw new Error("Please connect your wallet first");
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const signer = await provider.getSigner();
      
      // Create a deterministic message that includes the account address
      // This ensures the same wallet always generates the same identity
      const message = `Sign this message to create your anonymous voting identity.\n\nWallet: ${account}\nPurpose: Semaphore Identity Generation\n\nThis signature will be used to generate a unique identity that allows you to vote anonymously. Your identity will be stored locally in your browser.`;
      
      console.log("[Identity] Requesting signature...");
      const signature = await signer.signMessage(message);
      
      // Create identity from signature
      const newIdentity = new Identity(signature);
      
      // Store the signature (secret) for recovery - PER ACCOUNT
      const storageKey = getStorageKey(account);
      localStorage.setItem(storageKey, signature);
      
      setIdentity(newIdentity);
      console.log("[Identity] Created new identity for account:", account);
      console.log("[Identity] Commitment:", newIdentity.commitment.toString());
      
      return newIdentity;
    } catch (err) {
      console.error("[Identity] Error creating identity:", err);
      
      if (err.code === 4001 || err.code === "ACTION_REJECTED") {
        setError("You rejected the signature request");
      } else {
        setError(err.message || "Failed to create identity");
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [provider, account]);
  
  /**
   * Gets the current identity or null if not created
   * @returns {Identity|null}
   */
  const getIdentity = useCallback(() => {
    return identity;
  }, [identity]);
  
  /**
   * Clears the stored identity for the current account
   */
  const clearIdentity = useCallback(() => {
    const storageKey = getStorageKey(account);
    if (storageKey) {
      localStorage.removeItem(storageKey);
    }
    setIdentity(null);
    console.log("[Identity] Identity cleared for account:", account);
  }, [account]);
  
  /**
   * Gets the identity commitment (public identifier)
   * @returns {string|null} The commitment as a string, or null
   */
  const getCommitment = useCallback(() => {
    if (!identity) return null;
    return identity.commitment.toString();
  }, [identity]);
  
  /**
   * Exports identity data for backup
   * @returns {Object|null} Identity export data
   */
  const exportIdentity = useCallback(() => {
    if (!identity || !account) return null;
    
    const storageKey = getStorageKey(account);
    const secret = localStorage.getItem(storageKey);
    return {
      commitment: identity.commitment.toString(),
      secret: secret,
      account: account,
      exportedAt: new Date().toISOString()
    };
  }, [identity, account]);
  
  /**
   * Imports identity from backup data
   * @param {string} secret - The identity secret (signature)
   * @returns {Identity} The imported identity
   */
  const importIdentity = useCallback((secret) => {
    if (!account) {
      throw new Error("Please connect your wallet first");
    }
    
    try {
      const importedIdentity = new Identity(secret);
      const storageKey = getStorageKey(account);
      localStorage.setItem(storageKey, secret);
      setIdentity(importedIdentity);
      console.log("[Identity] Imported identity for account:", account);
      return importedIdentity;
    } catch (err) {
      console.error("[Identity] Failed to import identity:", err);
      throw new Error("Invalid identity secret");
    }
  }, [account]);
  
  return {
    // State
    identity,
    hasIdentity: identity !== null,
    isLoading,
    error,
    isInitialized,
    
    // Computed
    commitment: getCommitment(),
    
    // Actions
    createIdentity,
    getIdentity,
    clearIdentity,
    exportIdentity,
    importIdentity
  };
}

export default useIdentity;
