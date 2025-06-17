import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';

// --- CONTRACT CONFIGURATION ---
// 1. Get the ABI from your project's artifacts
import PollFactoryAbi from '../abis/PollFactory.json'; // Adjust the path as necessary
const contractABI = PollFactoryAbi.abi;

// 2. Get the address from your deployment script's output
const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;

const Web3Context = createContext(null);

export const Web3Provider = ({ children }) => {
  console.log("Web3Provider initialized with contract address:", contractAddress);
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- NEW: The getContract function ---
  const getContract = useCallback(async () => {
    if (!provider) {
      console.error("Provider not initialized");
      return null;
    }
    // To perform write operations (like creating a poll), we need a Signer.
    const signer = await provider.getSigner();
    return new ethers.Contract(contractAddress, contractABI, signer);
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
      
      // Request accounts and set state
      const accounts = await browserProvider.send("eth_requestAccounts", []);
      
      setProvider(browserProvider);
      setAccount(accounts[0]);

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

  const value = {
    account,
    isLoading,
    error,
    isConnected: !!account,
    connectWallet,
    getContract, // <-- Expose the function to the rest of the app
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
};

export const useWeb3 = () => {
  return useContext(Web3Context);
};