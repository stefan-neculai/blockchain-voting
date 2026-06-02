import React, { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useWeb3 } from '../contexts/Web3Context';
import { ChevronUp, ChevronDown, Copy, LogOut } from 'lucide-react';
import './Header.css';

const Header = () => {
  const { account, isConnected, isLoading, error, chainId, balance, connectWallet, disconnectWallet } = useWeb3();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNetworkName = (id) => {
    const networks = {
      1: 'Ethereum',
      11155111: 'Sepolia',
      31337: 'Localhost',
    };
    return networks[id] || `Chain ${id}`;
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(account);
    alert('Address copied!');
  };

  const truncateAddress = (address) => `${address.slice(0, 6)}...${address.slice(-4)}`;

  return (
    <>
      <header className="app-header">
        <div className="logo">
          <NavLink to="/">ZK-VOTE</NavLink> 
        </div>

        <nav className="main-nav">
          <NavLink 
            to="/how-it-works" 
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          >
            How It Works
          </NavLink>
          <NavLink 
            to="/" 
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          >
            Polls
          </NavLink>
          <NavLink 
            to="/create" 
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          >
            Create Poll
          </NavLink>
          <NavLink 
            to="/profile" 
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          >
            Profile
          </NavLink>
        </nav>

        <div className="wallet-actions">
          {isConnected ? (
            <div className="wallet-dropdown" ref={dropdownRef}>
              <button 
                className="wallet-info"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <span className="dot-connected"></span>
                <span>{truncateAddress(account)}</span>
                <span className="dropdown-arrow">{showDropdown ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</span>
              </button>
              
              {showDropdown && (
                <div className="dropdown-menu">
                  <div className="dropdown-header">
                    <span className="network-badge">{getNetworkName(chainId)}</span>
                  </div>
                  <div className="dropdown-address">
                    <span>{truncateAddress(account)}</span>
                    <button onClick={copyAddress} className="copy-btn" title="Copy address">
                      <Copy size={14} />
                    </button>
                  </div>
                  <div className="dropdown-balance">
                    <span className="balance-label">Balance</span>
                    <span className="balance-value">
                      {balance ? `${parseFloat(balance).toFixed(4)} ETH` : 'Loading...'}
                    </span>
                  </div>
                  <hr />
                  <button className="dropdown-item" onClick={copyAddress}>
                    <Copy size={14} /> Copy Address
                  </button>
                  <button 
                    className="dropdown-item disconnect"
                    onClick={() => {
                      disconnectWallet();
                      setShowDropdown(false);
                    }}
                  >
                    <LogOut size={14} /> Disconnect
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              className="connect-button"
              onClick={connectWallet}
              disabled={isLoading}
            >
              {isLoading ? 'Connecting...' : 'Connect Wallet'}
            </button>
          )}
        </div>
      </header>
      {error && (
        <div className="error-banner">
          <p>{error}</p>
        </div>
      )}
    </>
  );
};

export default Header;