import React, { useState, useCallback } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import './AdminPanel.css';

const AdminPanel = ({ pollId, pollCreator }) => {
  const { account, getAnonymousVotingContract, signer } = useWeb3();
  
  // Single voter registration
  const [singleCommitment, setSingleCommitment] = useState('');
  const [singleLoading, setSingleLoading] = useState(false);
  
  // Bulk voter registration
  const [bulkCommitments, setBulkCommitments] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);
  
  // Poll status toggle
  const [toggleLoading, setToggleLoading] = useState(false);
  const [isPollActive, setIsPollActive] = useState(true);
  
  // Messages
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Clear messages after timeout
  const showSuccess = useCallback((message) => {
    setSuccessMessage(message);
    setErrorMessage('');
    setTimeout(() => setSuccessMessage(''), 5000);
  }, []);

  const showError = useCallback((message) => {
    setErrorMessage(message);
    setSuccessMessage('');
    setTimeout(() => setErrorMessage(''), 5000);
  }, []);

  // Register a single voter
  const handleRegisterVoter = async () => {
    if (!singleCommitment.trim()) {
      showError('Please enter a voter commitment');
      return;
    }

    setSingleLoading(true);
    try {
      const contract = getAnonymousVotingContract(signer);
      const tx = await contract.registerVoter(pollId, singleCommitment.trim());
      await tx.wait();
      showSuccess('Voter registered successfully!');
      setSingleCommitment('');
    } catch (error) {
      console.error('Error registering voter:', error);
      const message = error.reason || error.message || 'Failed to register voter';
      showError(message);
    } finally {
      setSingleLoading(false);
    }
  };

  // Register multiple voters in batch
  const handleBulkRegister = async () => {
    const commitments = bulkCommitments
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (commitments.length === 0) {
      showError('Please enter at least one voter commitment');
      return;
    }

    setBulkLoading(true);
    let successCount = 0;
    let failCount = 0;

    try {
      const contract = getAnonymousVotingContract(signer);
      
      for (const commitment of commitments) {
        try {
          const tx = await contract.registerVoter(pollId, commitment);
          await tx.wait();
          successCount++;
        } catch (error) {
          console.error(`Failed to register commitment: ${commitment}`, error);
          failCount++;
        }
      }

      if (failCount === 0) {
        showSuccess(`Successfully registered ${successCount} voter(s)!`);
        setBulkCommitments('');
      } else {
        showError(`Registered ${successCount} voter(s), ${failCount} failed`);
      }
    } catch (error) {
      console.error('Error in bulk registration:', error);
      const message = error.reason || error.message || 'Bulk registration failed';
      showError(message);
    } finally {
      setBulkLoading(false);
    }
  };

  // Toggle poll active status
  const handleTogglePollStatus = async () => {
    setToggleLoading(true);
    try {
      const contract = getAnonymousVotingContract(signer);
      
      if (isPollActive) {
        const tx = await contract.deactivatePoll(pollId);
        await tx.wait();
        setIsPollActive(false);
        showSuccess('Poll deactivated successfully!');
      } else {
        const tx = await contract.activatePoll(pollId);
        await tx.wait();
        setIsPollActive(true);
        showSuccess('Poll activated successfully!');
      }
    } catch (error) {
      console.error('Error toggling poll status:', error);
      const message = error.reason || error.message || 'Failed to toggle poll status';
      showError(message);
    } finally {
      setToggleLoading(false);
    }
  };

  // Only show panel if current user is the poll creator
  if (!account || !pollCreator) {
    return null;
  }

  if (account.toLowerCase() !== pollCreator.toLowerCase()) {
    return null;
  }

  return (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <h3>Poll Admin Controls</h3>
        <span className="admin-badge">Admin</span>
      </div>

      <p className="admin-message">
        You are the admin of this poll
      </p>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="message success-message">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="message error-message">
          {errorMessage}
        </div>
      )}

      {/* Single Voter Registration */}
      <div className="admin-section">
        <h4>Register Single Voter</h4>
        <div className="input-group">
          <input
            type="text"
            placeholder="Enter voter commitment"
            value={singleCommitment}
            onChange={(e) => setSingleCommitment(e.target.value)}
            disabled={singleLoading}
            className="admin-input"
          />
          <button
            onClick={handleRegisterVoter}
            disabled={singleLoading || !singleCommitment.trim()}
            className="admin-button primary"
          >
            {singleLoading ? 'Registering...' : 'Register Voter'}
          </button>
        </div>
      </div>

      {/* Bulk Voter Registration */}
      <div className="admin-section">
        <h4>Bulk Voter Registration</h4>
        <p className="section-description">
          Enter one commitment per line
        </p>
        <textarea
          placeholder="Enter voter commitments (one per line)"
          value={bulkCommitments}
          onChange={(e) => setBulkCommitments(e.target.value)}
          disabled={bulkLoading}
          className="admin-textarea"
          rows={5}
        />
        <button
          onClick={handleBulkRegister}
          disabled={bulkLoading || !bulkCommitments.trim()}
          className="admin-button primary"
        >
          {bulkLoading ? 'Registering...' : 'Register All'}
        </button>
      </div>

      {/* Poll Status Toggle */}
      <div className="admin-section">
        <h4>Poll Status</h4>
        <div className="toggle-container">
          <span className="toggle-label">
            Poll is currently: <strong>{isPollActive ? 'Active' : 'Inactive'}</strong>
          </span>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={isPollActive}
              onChange={handleTogglePollStatus}
              disabled={toggleLoading}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
        {toggleLoading && (
          <p className="loading-text">Updating poll status...</p>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
