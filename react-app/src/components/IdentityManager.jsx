/**
 * @fileoverview Identity Manager component for anonymous voting
 * @description UI component for creating and managing Semaphore identities
 */

import React, { useState, useEffect } from 'react';
import { useIdentity } from '../hooks/useIdentity';
import { useWeb3 } from '../contexts/Web3Context';
import { 
  Lock, Check, Copy, Download, Trash2, AlertTriangle, 
  Info, ChevronUp, ChevronDown, Loader, CheckCircle, Fingerprint
} from 'lucide-react';
import './IdentityManager.css';

/**
 * IdentityManager component
 * Allows users to create, view, and manage their anonymous identity
 */
const IdentityManager = () => {
  const { isConnected } = useWeb3();
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
  const [showFullCommitment, setShowFullCommitment] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  /**
   * Shows a toast notification
   */
  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
  };
  
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
      showToast('Commitment copied to clipboard!', 'success');
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      showToast('Failed to copy commitment', 'error');
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
      showToast('Identity exported successfully!', 'success');
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
          <div className="identity-icon"><Lock size={32} /></div>
          <h3>Anonymous Identity</h3>
          <p>Connect your wallet to create an anonymous identity for voting.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="identity-manager">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`identity-toast toast-${toastMessage.type}`}>
          {toastMessage.message}
        </div>
      )}

      <div className={`identity-card ${hasIdentity ? 'identity-active' : 'identity-inactive'}`}>
        <div className="identity-header" onClick={() => setIsCollapsed(!isCollapsed)}>
          <div className="identity-header-left">
            <div className="identity-icon-wrapper">
              <span className="identity-icon">{hasIdentity ? <CheckCircle size={24} /> : <Lock size={24} />}</span>
              {hasIdentity && <span className="identity-status-dot"></span>}
            </div>
            <div className="identity-title-section">
              <h3>Anonymous Identity</h3>
              {hasIdentity && (
                <span className="identity-mini-status">Active & Ready to Vote</span>
              )}
            </div>
          </div>
          <button className="collapse-toggle" aria-label="Toggle identity panel">
            {isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
          </button>
        </div>
        
        {!isCollapsed && (
          <>
            {hasIdentity ? (
              // Identity exists
              <div className="identity-content">
                <div className="identity-status">
                  <span className="status-badge status-active">
                    <span className="status-dot"></span>
                    Identity Active
                  </span>
                </div>
                
                <div className="identity-details commitment-section">
                  <div className="commitment-header">
                    <label>Your Commitment (Public ID):</label>
                    <button 
                      className="show-full-btn"
                      onClick={() => setShowFullCommitment(!showFullCommitment)}
                    >
                      {showFullCommitment ? 'Show Less' : 'Show Full'}
                    </button>
                  </div>
                  <div className="commitment-display">
                    <code className={`commitment-value ${showFullCommitment ? 'commitment-full' : ''}`}>
                      {showFullCommitment 
                        ? commitment 
                        : `${commitment?.slice(0, 20)}...${commitment?.slice(-10)}`
                      }
                    </code>
                  </div>
                  <div className="commitment-actions">
                    <button 
                      className={`btn btn-copy ${copySuccess ? 'btn-copy-success' : ''}`}
                      onClick={handleCopyCommitment}
                      title="Copy full commitment to clipboard"
                    >
                      <span className="btn-copy-icon">{copySuccess ? <Check size={16} /> : <Copy size={16} />}</span>
                      <span className="btn-copy-text">
                        {copySuccess ? 'Copied!' : 'Copy Commitment'}
                      </span>
                    </button>
                  </div>
                  <p className="commitment-hint">
                    <strong><Info size={14} className="icon-inline" /> Tip:</strong> Share this commitment with poll creators to register as a voter. 
                    This is your public identifier for anonymous voting.
                  </p>
                </div>
                
                <div className="identity-info">
                  <p>
                    <strong><Lock size={14} className="icon-inline" /> Privacy Protected:</strong> Your identity is stored locally 
                    and never shared. Only the commitment (a hash) is used on-chain.
                  </p>
                </div>
                
                <div className="identity-actions">
              <button 
                className="btn btn-secondary"
                onClick={handleExport}
              >
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
              <span className="status-badge status-inactive">
                <span className="status-dot"></span>
                No Identity
              </span>
            </div>
            
            <div className="create-identity-prompt">
              <div className="prompt-icon"><Fingerprint size={48} /></div>
              <h4>Create Your Anonymous Identity</h4>
              <p className="identity-description">
                Create an anonymous identity to participate in private voting. 
                You'll sign a message with your wallet - this creates a unique 
                identity that can't be linked to your address.
              </p>
            </div>
            
            <div className="identity-actions">
              <button 
                className="btn btn-primary btn-lg btn-create-identity"
                onClick={handleCreateIdentity}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="loading-spinner"></span>
                    Creating Identity...
                  </>
                ) : (
                  <>
                    <span className="btn-icon"><Lock size={18} /></span>
                    Create Anonymous Identity
                  </>
                )}
              </button>
            </div>
            
            {error && (
              <div className="identity-error">
                <span><AlertTriangle size={16} /> {error}</span>
              </div>
            )}
            
            <div className="identity-note">
              <strong><Info size={14} className="icon-inline" /> Note:</strong> Your wallet will ask you to sign a message. 
              This is free and doesn't cost any gas.
            </div>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
};

export default IdentityManager;
