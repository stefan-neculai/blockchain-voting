import React, { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { useIdentity } from '../hooks/useIdentity';
import { getNickname, setNickname as saveNickname } from '../utils/nicknames';
import { 
  User, Wallet, Lock, Shield, BarChart3, Copy, Edit2, 
  Download, Trash2, AlertTriangle, Check, CheckCircle, 
  FileText, Info, Loader
} from 'lucide-react';
import './ProfilePage.css';

const ProfilePage = () => {
  const { account, isConnected, chainId, balance, getAnonymousVotingContract } = useWeb3();
  const { 
    hasIdentity, 
    commitment, 
    isLoading: identityLoading, 
    error: identityError,
    isInitialized,
    createIdentity, 
    clearIdentity,
    exportIdentity 
  } = useIdentity();
  
  const [nickname, setNickname] = useState('');
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showFullCommitment, setShowFullCommitment] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [createdPolls, setCreatedPolls] = useState([]);
  const [loadingPolls, setLoadingPolls] = useState(false);

  // Load nickname on mount
  useEffect(() => {
    if (account) {
      const saved = getNickname(account);
      if (saved) setNickname(saved);
    }
  }, [account]);

  // Fetch polls created by this user
  const fetchCreatedPolls = useCallback(async () => {
    if (!account || !isConnected) return;
    
    setLoadingPolls(true);
    try {
      const contract = await getAnonymousVotingContract(false);
      if (!contract) return;
      
      const pollCount = await contract.pollCount();
      const polls = [];
      
      for (let i = 0; i < Number(pollCount); i++) {
        try {
          const creator = await contract.pollCreators(i);
          if (creator.toLowerCase() === account.toLowerCase()) {
            const pollData = await contract.getPoll(i);
            polls.push({
              id: i,
              question: pollData.question,
              isActive: pollData.isActive,
              totalVotes: Number(pollData.totalVotes),
              endTime: Number(pollData.endTime)
            });
          }
        } catch (err) {
          console.warn(`Error fetching poll ${i}:`, err);
        }
      }
      
      setCreatedPolls(polls);
    } catch (err) {
      console.error('Error fetching created polls:', err);
    } finally {
      setLoadingPolls(false);
    }
  }, [account, isConnected, getAnonymousVotingContract]);

  useEffect(() => {
    fetchCreatedPolls();
  }, [fetchCreatedPolls]);

  const handleSaveNickname = () => {
    if (account && nickname.trim()) {
      saveNickname(account, nickname.trim());
      setIsEditingNickname(false);
    }
  };

  const handleCopyCommitment = async () => {
    if (!commitment) return;
    try {
      await navigator.clipboard.writeText(commitment);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(account);
      alert('Address copied!');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleExport = () => {
    const exportData = exportIdentity();
    if (exportData) {
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `identity-backup-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleClearIdentity = () => {
    clearIdentity();
    setShowConfirmClear(false);
  };

  const getNetworkName = (id) => {
    const networks = { 1: 'Ethereum', 11155111: 'Sepolia', 31337: 'Localhost' };
    return networks[id] || `Chain ${id}`;
  };

  const truncateAddress = (addr) => `${addr.slice(0, 8)}...${addr.slice(-6)}`;

  // Not connected state
  if (!isConnected) {
    return (
      <div className="profile-page">
        <div className="profile-hero">
          <div className="hero-icon"><User size={48} /></div>
          <h1>Your Profile</h1>
          <p className="hero-subtitle">Connect your wallet to view your profile</p>
        </div>
        <div className="connect-prompt-card">
          <p>Connect your wallet using the button in the header to access your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-hero">
        <div className="hero-icon"><User size={48} /></div>
        <h1>Your Profile</h1>
        <p className="hero-subtitle">Manage your identity and view your activity</p>
      </div>

      <div className="profile-grid">
        {/* Wallet Info Card */}
        <section className="profile-card wallet-card">
          <div className="card-header">
            <span className="card-icon"><Wallet size={24} /></span>
            <h2>Wallet</h2>
          </div>
          <div className="card-content">
            <div className="wallet-info-row">
              <span className="label">Network</span>
              <span className="network-badge">{getNetworkName(chainId)}</span>
            </div>
            <div className="wallet-info-row">
              <span className="label">Address</span>
              <div className="address-display">
                <code>{truncateAddress(account)}</code>
                <button className="icon-btn" onClick={handleCopyAddress} title="Copy full address">
                  <Copy size={16} />
                </button>
              </div>
            </div>
            <div className="wallet-info-row">
              <span className="label">Balance</span>
              <span className="balance">{balance ? `${parseFloat(balance).toFixed(4)} ETH` : 'Loading...'}</span>
            </div>
            
            {/* Nickname Section */}
            <div className="nickname-section">
              <span className="label">Display Name</span>
              {isEditingNickname ? (
                <div className="nickname-edit">
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="Enter a nickname"
                    maxLength={30}
                  />
                  <button className="btn btn-sm btn-primary" onClick={handleSaveNickname}>Save</button>
                  <button className="btn btn-sm btn-secondary" onClick={() => setIsEditingNickname(false)}>Cancel</button>
                </div>
              ) : (
                <div className="nickname-display">
                  <span>{nickname || 'Not set'}</span>
                  <button className="icon-btn" onClick={() => setIsEditingNickname(true)} title="Edit nickname">
                    <Edit2 size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Identity Card */}
        <section className="profile-card identity-card">
          <div className="card-header">
            <span className="card-icon"><Lock size={24} /></span>
            <h2>Anonymous Identity</h2>
            {hasIdentity && <span className="status-pill active">Active</span>}
          </div>
          <div className="card-content">
            {!isInitialized ? (
              <div className="loading-state">
                <span className="loading-spinner"></span>
                Loading identity...
              </div>
            ) : hasIdentity ? (
              <>
                <div className="identity-active-section">
                  <div className="commitment-section">
                    <div className="commitment-header">
                      <span className="label">Your Commitment (Public ID)</span>
                      <button 
                        className="show-toggle"
                        onClick={() => setShowFullCommitment(!showFullCommitment)}
                      >
                        {showFullCommitment ? 'Show Less' : 'Show Full'}
                      </button>
                    </div>
                    <code className={`commitment-value ${showFullCommitment ? 'full' : ''}`}>
                      {showFullCommitment 
                        ? commitment 
                        : `${commitment?.slice(0, 20)}...${commitment?.slice(-10)}`
                      }
                    </code>
                    <button 
                      className={`btn btn-copy ${copySuccess ? 'success' : ''}`}
                      onClick={handleCopyCommitment}
                    >
                      {copySuccess ? <><Check size={16} /> Copied!</> : <><Copy size={16} /> Copy Commitment</>}
                    </button>
                    <p className="hint">
                      <Info size={14} className="icon-inline" /> Share this with poll creators to register as a voter.
                    </p>
                  </div>
                  
                  <div className="identity-actions">
                    <button className="btn btn-secondary" onClick={handleExport}>
                      <Download size={16} /> Export Backup
                    </button>
                    {!showConfirmClear ? (
                      <button 
                        className="btn btn-danger-outline"
                        onClick={() => setShowConfirmClear(true)}
                      >
                        <Trash2 size={16} /> Clear Identity
                      </button>
                    ) : (
                      <div className="confirm-clear">
                        <span>Are you sure?</span>
                        <button className="btn btn-danger btn-sm" onClick={handleClearIdentity}>
                          Yes, Clear
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={() => setShowConfirmClear(false)}>
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="no-identity-section">
                <div className="create-prompt">
                  <div className="prompt-icon"><Lock size={48} /></div>
                  <h3>Create Your Anonymous Identity</h3>
                  <p>
                    Generate an anonymous identity to vote privately. Your wallet will sign a 
                    message to create a unique identity that can't be linked to your address.
                  </p>
                  <button 
                    className="btn btn-primary btn-lg"
                    onClick={createIdentity}
                    disabled={identityLoading}
                  >
                    {identityLoading ? (
                      <>
                        <span className="loading-spinner"></span>
                        Creating...
                      </>
                    ) : (
                      <><Lock size={18} /> Create Anonymous Identity</>
                    )}
                  </button>
                  {identityError && (
                    <div className="error-message"><AlertTriangle size={16} /> {identityError}</div>
                  )}
                  <p className="note">
                    <Info size={14} className="icon-inline" /> This is free and doesn't cost any gas.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Activity Card - Polls Created (Public Info) */}
        <section className="profile-card activity-card">
          <div className="card-header">
            <span className="card-icon"><BarChart3 size={24} /></span>
            <h2>Polls Created</h2>
            <span className="count-badge">{createdPolls.length}</span>
          </div>
          <div className="card-content">
            {loadingPolls ? (
              <div className="loading-state">
                <span className="loading-spinner"></span>
                Loading your polls...
              </div>
            ) : createdPolls.length > 0 ? (
              <div className="polls-list">
                {createdPolls.map(poll => (
                  <a 
                    key={poll.id} 
                    href={`/poll/${poll.id}`} 
                    className="poll-item"
                  >
                    <div className="poll-item-main">
                      <span className="poll-question">{poll.question}</span>
                      <span className={`poll-status ${poll.isActive ? 'active' : 'ended'}`}>
                        {poll.isActive ? 'Active' : 'Ended'}
                      </span>
                    </div>
                    <div className="poll-item-meta">
                      <span>{poll.totalVotes} votes</span>
                      {poll.endTime > 0 && (
                        <span>Ends: {new Date(poll.endTime * 1000).toLocaleDateString()}</span>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <span className="empty-icon"><FileText size={48} /></span>
                <p>You haven't created any polls yet.</p>
                <a href="/create" className="btn btn-primary">Create Your First Poll</a>
              </div>
            )}
          </div>
        </section>

        {/* Privacy Notice */}
        <section className="profile-card privacy-card">
          <div className="card-header">
            <span className="card-icon"><Shield size={24} /></span>
            <h2>Privacy Notice</h2>
          </div>
          <div className="card-content">
            <div className="privacy-info">
              <div className="privacy-item safe">
                <span className="icon"><CheckCircle size={20} /></span>
                <div>
                  <strong>Polls you create</strong>
                  <p>Visible on your profile (creator address is public on-chain)</p>
                </div>
              </div>
              <div className="privacy-item protected">
                <span className="icon"><Lock size={20} /></span>
                <div>
                  <strong>Polls you vote in</strong>
                  <p>NOT shown here - this would break anonymity! ZK proofs keep your voting private.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ProfilePage;
