/**
 * @fileoverview Identity Manager component for anonymous voting
 * @description UI component for creating and managing Semaphore identities
 */

import React, { useState } from 'react';
import { useIdentity } from '../hooks/useIdentity';
import { useWeb3 } from '../contexts/Web3Context';
import './IdentityManager.css';

/**
 * IdentityManager component
 * Allows users to create, view, and manage their anonymous identity
 */
const IdentityManager = () => {
  const { isConnected, account } = useWeb3();
  const { 
    hasIdentity, 
    commitment, 
    isLoading, 
    error,
    isInitialized,
    createIdentity, 
    clearIdentity,
    exportIdentity 
  } = useIdentity();
  
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showExport, setShowExport] = useState(false);
  
  /**
   * Handles identity creation
   */
  const handleCreateIdentity = async () => {
    try {
      await createIdentity();
    } catch (err) {
      // Error is handled by the hook
      console.error("Failed to create identity:", err);
    }
  };
  
  /**
   * Handles copying commitment to clipboard
   */
  const handleCopyCommitment = async () => {
    if (!commitment) return;
    
    try {
      await navigator.clipboard.writeText(commitment);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };
  
  /**
   * Handles identity export
   */
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
  
  /**
   * Handles identity clearing with confirmation
   */
  const handleClearIdentity = () => {
    clearIdentity();
    setShowConfirmClear(false);
  };
  
  // Show loading state while initializing
  if (!isInitialized) {
    return (
      <div className="identity-manager">
        <div className="identity-loading">
          <span className="loading-spinner"></span>
          Loading identity...
        </div>
      </div>
    );
  }
  
  // Not connected state
  if (!isConnected) {
    return (
      <div className="identity-manager">
        <div className="identity-card identity-disconnected">
          <div className="identity-icon">🔐</div>
          <h3>Anonymous Identity</h3>
          <p>Connect your wallet to create an anonymous identity for voting.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="identity-manager">
      <div className={`identity-card ${hasIdentity ? 'identity-active' : 'identity-inactive'}`}>
        <div className="identity-header">
          <div className="identity-icon">{hasIdentity ? '✅' : '🔐'}</div>
          <h3>Anonymous Identity</h3>
        </div>
        
        {hasIdentity ? (
          // Identity exists
          <div className="identity-content">
            <div className="identity-status">
              <span className="status-badge status-active">Identity Active</span>
            </div>
            
            <div className="identity-details">
              <label>Your Commitment (Public ID):</label>
              <div className="commitment-display">
                <code className="commitment-value">
                  {commitment?.slice(0, 20)}...{commitment?.slice(-10)}
                </code>
                <button 
                  className="btn-icon" 
                  onClick={handleCopyCommitment}
                  title="Copy full commitment"
                >
                  {copySuccess ? '✓' : '📋'}
                </button>
              </div>
              <p className="commitment-hint">
                Share this with poll administrators to register for voting.
              </p>
            </div>
            
            <div className="identity-info">
              <p>
                <strong>🔒 Privacy Protected:</strong> Your identity is stored locally 
                and never shared. Only the commitment (a hash) is used on-chain.
              </p>
            </div>
            
            <div className="identity-actions">
              <button 
                className="btn btn-secondary"
                onClick={handleExport}
              >
                💾 Export Backup
              </button>
              
              {!showConfirmClear ? (
                <button 
                  className="btn btn-danger-outline"
                  onClick={() => setShowConfirmClear(true)}
                >
                  🗑️ Clear Identity
                </button>
              ) : (
                <div className="confirm-clear">
                  <span>Are you sure?</span>
                  <button 
                    className="btn btn-danger btn-sm"
                    onClick={handleClearIdentity}
                  >
                    Yes, Clear
                  </button>
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={() => setShowConfirmClear(false)}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          // No identity yet
          <div className="identity-content">
            <div className="identity-status">
              <span className="status-badge status-inactive">No Identity</span>
            </div>
            
            <p className="identity-description">
              Create an anonymous identity to participate in private voting. 
              You'll sign a message with your wallet - this creates a unique 
              identity that can't be linked to your address.
            </p>
            
            <div className="identity-actions">
              <button 
                className="btn btn-primary btn-lg"
                onClick={handleCreateIdentity}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="loading-spinner"></span>
                    Creating Identity...
                  </>
                ) : (
                  '🔐 Create Anonymous Identity'
                )}
              </button>
            </div>
            
            {error && (
              <div className="identity-error">
                <span>⚠️ {error}</span>
              </div>
            )}
            
            <div className="identity-note">
              <strong>Note:</strong> Your wallet will ask you to sign a message. 
              This is free and doesn't cost any gas.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IdentityManager;
