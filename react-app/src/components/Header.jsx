import React from 'react';
import { NavLink } from 'react-router-dom'; // Import NavLink
import { useWeb3 } from '../contexts/Web3Context';
import './Header.css';

const Header = () => {
  const { account, isConnected, isLoading, error, connectWallet } = useWeb3();

  const truncateAddress = (address) => `${address.slice(0, 6)}...${address.slice(-4)}`;

  return (
    <>
      <header className="app-header">
        <div className="logo">
          <NavLink to="/">ZK-VOTE</NavLink> 
        </div>

        <nav className="main-nav">
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
        </nav>

        <div className="wallet-actions">
          {isConnected ? (
            <div className="wallet-info">
              <span className="dot-connected"></span>
              <span>{truncateAddress(account)}</span>
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