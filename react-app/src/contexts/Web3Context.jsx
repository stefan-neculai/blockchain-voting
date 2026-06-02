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
  const [balance, setBalance] = useState(null);

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

  // --- Get the creator of a specific poll ---
  const getPollCreator = useCallback(async (pollId) => {
    const contract = await getAnonymousVotingContract(false);
    if (!contract) return null;
    try {
      const creator = await contract.getPollCreator(pollId);
      return creator;
    } catch (err) {
      console.error("Failed to get poll creator:", err);
      return null;
    }
  }, [getAnonymousVotingContract]);

  // --- Check if current account is the creator of a poll ---
  const isPollCreator = useCallback(async (pollId) => {
    if (!account) return false;
    const creator = await getPollCreator(pollId);
    if (!creator) return false;
    return creator.toLowerCase() === account.toLowerCase();
  }, [account, getPollCreator]);

  // --- Register a single voter for a poll (only poll creator can call) ---
  const registerVoterForPoll = useCallback(async (pollId, commitment) => {
    const contract = await getAnonymousVotingContract(true);
    if (!contract) throw new Error("Contract not available");
    const tx = await contract.registerVoter(pollId, commitment);
    await tx.wait();
    return tx;
  }, [getAnonymousVotingContract]);

  // --- Register multiple voters for a poll (only poll creator can call) ---
  const registerVotersForPoll = useCallback(async (pollId, commitments) => {
    const contract = await getAnonymousVotingContract(true);
    if (!contract) throw new Error("Contract not available");
    const tx = await contract.registerVoters(pollId, commitments);
    await tx.wait();
    return tx;
  }, [getAnonymousVotingContract]);

  // --- Disconnect wallet ---
  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setChainId(null);
    setError(null);
    setBalance(null);
    // Clear remembered connection preference
    localStorage.removeItem('walletConnected');
    console.log("Wallet disconnected");
  }, []);

  const connectWallet = useCallback(async () => {
    // Prevent duplicate requests
    if (isLoading) {
      console.log("Connection already in progress...");
      return;
    }
    
    if (!window.ethereum) {
      setError("MetaMask is not installed.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      
      // Force MetaMask to show account picker dialog
      await window.ethereum.request({
        method: 'wallet_requestPermissions',
        params: [{ eth_accounts: {} }],
      });
      
      // Now get the selected account
      const accounts = await browserProvider.send("eth_requestAccounts", []);
      
      // Get network info
      const network = await browserProvider.getNetwork();
      
      // Get signer
      const signerInstance = await browserProvider.getSigner();
      
      setProvider(browserProvider);
      setSigner(signerInstance);
      setAccount(accounts[0]);
      setChainId(Number(network.chainId));
      
      // Fetch account balance
      const balanceWei = await browserProvider.getBalance(accounts[0]);
      const formattedBalance = ethers.formatEther(balanceWei);
      console.log("Balance fetched:", formattedBalance, "ETH");
      setBalance(formattedBalance);
      
      // Remember that user connected
      localStorage.setItem('walletConnected', 'true');

      console.log("Connected:", accounts[0], "on chain", network.chainId);

    } catch (err) {
      console.error("Connection failed:", err);
      if (err.code === 4001) {
        setError("You rejected the connection request.");
      } else if (err.code === -32002) {
        setError("Please check MetaMask - a connection request is already pending.");
      } else {
        setError("An error occurred while connecting.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  // Auto-reconnect on page load if previously connected
  useEffect(() => {
    const autoConnect = async () => {
      const wasConnected = localStorage.getItem('walletConnected');
      if (wasConnected === 'true' && window.ethereum && !account) {
        try {
          const browserProvider = new ethers.BrowserProvider(window.ethereum);
          // Check if we already have permission (won't prompt)
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          
          if (accounts.length > 0) {
            const network = await browserProvider.getNetwork();
            const signerInstance = await browserProvider.getSigner();
            
            setProvider(browserProvider);
            setSigner(signerInstance);
            setAccount(accounts[0]);
            setChainId(Number(network.chainId));
            
            const balanceWei = await browserProvider.getBalance(accounts[0]);
            setBalance(ethers.formatEther(balanceWei));
            
            console.log("Auto-reconnected:", accounts[0]);
          }
        } catch (err) {
          console.log("Auto-reconnect failed:", err);
          localStorage.removeItem('walletConnected');
        }
      }
    };
    
    autoConnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Refresh balance function
  const refreshBalance = useCallback(async () => {
    if (provider && account) {
      try {
        const balanceWei = await provider.getBalance(account);
        setBalance(ethers.formatEther(balanceWei));
      } catch (err) {
        console.error('Failed to refresh balance:', err);
      }
    }
  }, [provider, account]);

  const value = {
    account,
    provider,
    signer,
    isLoading,
    error,
    chainId,
    balance,
    isConnected: !!account,
    connectWallet,
    disconnectWallet,
    refreshBalance,
    getContract,  // Legacy
    getAnonymousVotingContract,  // New ZK voting
    // Per-poll creator functions
    getPollCreator,
    isPollCreator,
    registerVoterForPoll,
    registerVotersForPoll,
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
};

export const useWeb3 = () => {
  return useContext(Web3Context);
};