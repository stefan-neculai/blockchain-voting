import React, { useState } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { Crown, ChevronDown, Check, X } from 'lucide-react';
import './AdminPanel.css';

/**
 * AdminPanel - Allows poll creators to manage their polls
 * Only visible to the address that created the poll
 * Collapsible to save space
 */
const AdminPanel = ({ pollId, pollCreator }) => {
  const { account, getAnonymousVotingContract } = useWeb3();
  
  // Form state
  const [singleCommitment, setSingleCommitment] = useState('');
  const [bulkCommitments, setBulkCommitments] = useState('');
  const [isActive, setIsActive] = useState(true);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isExpanded, setIsExpanded] = useState(false); // Collapsed by default

  // Check if current user is the poll creator
  const isCreator = account && pollCreator && 
    account.toLowerCase() === pollCreator.toLowerCase();

  // Don't render if not the creator
  if (!isCreator) {
    return null;
  }

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleRegisterSingle = async () => {
    if (!singleCommitment.trim()) {
      showMessage('error', 'Please enter a commitment');
      return;
    }

    setLoading(true);
    try {
      const contract = await getAnonymousVotingContract(true);
      const tx = await contract.registerVoter(pollId, singleCommitment.trim());
      await tx.wait();
      showMessage('success', 'Voter registered successfully!');
      setSingleCommitment('');
    } catch (error) {
      console.error('Registration error:', error);
      showMessage('error', error.reason || error.message || 'Failed to register voter');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterBulk = async () => {
    const commitments = bulkCommitments
      .split('\n')
      .map(c => c.trim())
      .filter(c => c.length > 0);

    if (commitments.length === 0) {
      showMessage('error', 'Please enter at least one commitment');
      return;
    }

    setLoading(true);
    try {
      const contract = await getAnonymousVotingContract(true);
      const tx = await contract.registerVoters(pollId, commitments);
      await tx.wait();
      showMessage('success', `${commitments.length} voters registered successfully!`);
      setBulkCommitments('');
    } catch (error) {
      console.error('Bulk registration error:', error);
      showMessage('error', error.reason || error.message || 'Failed to register voters');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async () => {
    setLoading(true);
    try {
      const contract = await getAnonymousVotingContract(true);
      const newStatus = !isActive;
      const tx = await contract.setPollActive(pollId, newStatus);
      await tx.wait();
      setIsActive(newStatus);
      showMessage('success', `Poll ${newStatus ? 'activated' : 'deactivated'} successfully!`);
    } catch (error) {
      console.error('Toggle error:', error);
      showMessage('error', error.reason || error.message || 'Failed to update poll status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`admin-panel ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div 
        className="admin-header" 
        onClick={() => setIsExpanded(!isExpanded)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setIsExpanded(!isExpanded)}
      >
        <div className="admin-header-left">
          <span className="admin-badge"><Crown size={16} /> Poll Admin</span>
          <h3>Admin Controls</h3>
        </div>
        <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>
          <ChevronDown size={20} />
        </span>
      </div>

      {isExpanded && (
        <div className="admin-content">
          {message.text && (
            <div className={`admin-message ${message.type}`}>
              {message.type === 'success' ? <Check size={16} /> : <X size={16} />} {message.text}
            </div>
          )}

          {/* Single Voter Registration */}
          <div className="admin-section">
            <h4>Register Single Voter</h4>
            <p className="admin-hint">Enter an identity commitment to allow a voter to participate</p>
            <div className="input-group">
              <input
                type="text"
                value={singleCommitment}
                onChange={(e) => setSingleCommitment(e.target.value)}
                placeholder="Identity commitment (e.g., 12345678901234567890...)"
                disabled={loading}
              />
              <button 
                onClick={handleRegisterSingle} 
                disabled={loading || !singleCommitment.trim()}
                className="btn-primary"
              >
                {loading ? 'Registering...' : 'Register Voter'}
              </button>
            </div>
          </div>

          {/* Bulk Voter Registration */}
          <div className="admin-section">
            <h4>Bulk Register Voters</h4>
            <p className="admin-hint">Enter one commitment per line for batch registration</p>
            <textarea
              value={bulkCommitments}
              onChange={(e) => setBulkCommitments(e.target.value)}
              placeholder="Paste commitments here, one per line...&#10;12345678901234567890...&#10;98765432109876543210..."
              rows={5}
              disabled={loading}
            />
            <button 
              onClick={handleRegisterBulk} 
              disabled={loading || !bulkCommitments.trim()}
              className="btn-primary"
            >
              {loading ? 'Registering...' : 'Register All'}
            </button>
          </div>

          {/* Poll Status Toggle */}
          <div className="admin-section">
            <h4>Poll Status</h4>
            <div className="toggle-group">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={handleToggleActive}
                  disabled={loading}
                />
                <span className="toggle-slider"></span>
              </label>
              <span className={`status-text ${isActive ? 'active' : 'inactive'}`}>
                {isActive ? 'Poll is Active' : 'Poll is Paused'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
