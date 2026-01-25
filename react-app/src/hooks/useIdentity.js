/**
 * @fileoverview React hook for managing Semaphore identity
 * @description Handles identity generation, storage, and recovery for anonymous voting
 */

import { useState, useCallback, useEffect } from 'react';
import { Identity } from '@semaphore-protocol/identity';
import { useWeb3 } from '../contexts/Web3Context';

// LocalStorage key for identity
const IDENTITY_STORAGE_KEY = 'semaphore_identity_secret';

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
   * Loads existing identity from localStorage on mount
   */
  useEffect(() => {
    const loadStoredIdentity = () => {
      try {
        const storedSecret = localStorage.getItem(IDENTITY_STORAGE_KEY);
        if (storedSecret) {
          const restoredIdentity = new Identity(storedSecret);
          setIdentity(restoredIdentity);
          console.log("[Identity] Restored identity from storage");
        }
      } catch (err) {
        console.error("[Identity] Failed to restore identity:", err);
        localStorage.removeItem(IDENTITY_STORAGE_KEY);
      } finally {
        setIsInitialized(true);
      }
    };
    
    loadStoredIdentity();
  }, []);
  
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
      
      // Store the signature (secret) for recovery
      localStorage.setItem(IDENTITY_STORAGE_KEY, signature);
      
      setIdentity(newIdentity);
      console.log("[Identity] Created new identity");
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
   * Clears the stored identity
   */
  const clearIdentity = useCallback(() => {
    localStorage.removeItem(IDENTITY_STORAGE_KEY);
    setIdentity(null);
    console.log("[Identity] Identity cleared");
  }, []);
  
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
    if (!identity) return null;
    
    const secret = localStorage.getItem(IDENTITY_STORAGE_KEY);
    return {
      commitment: identity.commitment.toString(),
      secret: secret,
      exportedAt: new Date().toISOString()
    };
  }, [identity]);
  
  /**
   * Imports identity from backup data
   * @param {string} secret - The identity secret (signature)
   * @returns {Identity} The imported identity
   */
  const importIdentity = useCallback((secret) => {
    try {
      const importedIdentity = new Identity(secret);
      localStorage.setItem(IDENTITY_STORAGE_KEY, secret);
      setIdentity(importedIdentity);
      console.log("[Identity] Imported identity successfully");
      return importedIdentity;
    } catch (err) {
      console.error("[Identity] Failed to import identity:", err);
      throw new Error("Invalid identity secret");
    }
  }, []);
  
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
