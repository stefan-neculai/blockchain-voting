import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

// --- CONTRACT CONFIGURATION ---
// Legacy PollFactory (unsafe)
import PollFactoryAbi from '../abis/PollFactory.json';
// New AnonymousVoting contract (ZK-enabled)
import AnonymousVotingAbi from '../abis/AnonymousVoting.json';

// Contract addresses from environment
const POLL_FACTORY_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS;
const ANONYMOUS_VOTING_ADDRESS = process.env.REACT_APP_ANONYMOUS_VOTING_ADDRESS;

const Web3Context = createContext(null);

export const Web3Provider = ({ children }) => {
  console.log("Web3Provider initialized");
  console.log("  - PollFactory address:", POLL_FACTORY_ADDRESS);
  console.log("  - AnonymousVoting address:", ANONYMOUS_VOTING_ADDRESS);
  
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chainId, setChainId] = useState(null);

  // --- Get legacy PollFactory contract ---
  const getContract = useCallback(async () => {
    if (!provider) {
      console.error("Provider not initialized");
      return null;
    }
    const signer = await provider.getSigner();
    return new ethers.Contract(POLL_FACTORY_ADDRESS, PollFactoryAbi.abi, signer);
  }, [provider]);

  // --- Get new AnonymousVoting contract ---
  const getAnonymousVotingContract = useCallback(async (withSigner = true) => {
    if (!provider) {
      console.error("Provider not initialized");
      return null;
    }
    if (withSigner) {
      const signer = await provider.getSigner();
      return new ethers.Contract(ANONYMOUS_VOTING_ADDRESS, AnonymousVotingAbi.abi, signer);
    }
    return new ethers.Contract(ANONYMOUS_VOTING_ADDRESS, AnonymousVotingAbi.abi, provider);
  }, [provider]);

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      setError("MetaMask is not installed.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      
      // Request accounts
      const accounts = await browserProvider.send("eth_requestAccounts", []);
      
      // Get network info
      const network = await browserProvider.getNetwork();
      
      // Get signer
      const signerInstance = await browserProvider.getSigner();
      
      setProvider(browserProvider);
      setSigner(signerInstance);
      setAccount(accounts[0]);
      setChainId(Number(network.chainId));

      console.log("Connected:", accounts[0], "on chain", network.chainId);

    } catch (err) {
      console.error("Connection failed:", err);
      if (err.code === 4001) {
        setError("You rejected the connection request.");
      } else {
        setError("An error occurred while connecting.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Listen for account/chain changes
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          setAccount(null);
          setSigner(null);
        } else {
          setAccount(accounts[0]);
        }
      };

      const handleChainChanged = () => {
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  const value = {
    account,
    provider,
    signer,
    isLoading,
    error,
    chainId,
    isConnected: !!account,
    connectWallet,
    getContract,  // Legacy
    getAnonymousVotingContract,  // New ZK voting
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
};

export const useWeb3 = () => {
  return useContext(Web3Context);
};