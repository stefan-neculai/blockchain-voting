import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWeb3 } from '../contexts/Web3Context';
import VotingInterface from '../components/VotingInterface';
import AdminPanel from '../components/AdminPanel';
import { getDisplayName } from '../utils/nicknames';
import { ArrowLeft, Circle, Clock, BarChart3, List, Calendar } from 'lucide-react';
import './SinglePollPage.css';

const SinglePollPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [poll, setPoll] = useState(null);
  const [pollCreator, setPollCreator] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const lastPollDataRef = useRef(null);

  const { isConnected, getAnonymousVotingContract, account } = useWeb3();

  const fetchPollData = useCallback(async (isInitialLoad = false) => {
    if (isInitialLoad) {
      setIsLoading(true);
    }
    setError('');
    try {
      const contract = await getAnonymousVotingContract();
      if (!contract) {
        throw new Error('Could not connect to the contract.');
      }
      
      const pollId = parseInt(id);
      const pollData = await contract.getPoll(pollId);
      
      // Fetch poll creator
      try {
        const creator = await contract.pollCreators(pollId);
        setPollCreator(creator);
      } catch (creatorErr) {
        console.warn('Could not fetch poll creator:', creatorErr);
        setPollCreator(null);
      }
      
      // Convert BigInt votes to numbers - contract returns 'votes' not 'voteCounts'
      const votes = pollData.votes.map(v => Number(v));
      
      const newPollData = {
        id: pollId,
        question: pollData.question,
        options: [...pollData.options],
        votes: votes,
        isActive: pollData.isActive,
        endTime: Number(pollData.endTime),
        totalVotes: Number(pollData.totalVotes)
      };
      
      // Only update state if data changed (prevents scroll reset)
      const newDataString = JSON.stringify(newPollData);
      if (newDataString !== lastPollDataRef.current) {
        lastPollDataRef.current = newDataString;
        setPoll(newPollData);
      }
    } catch (err) {
      console.error('Error fetching poll:', err);
      setError(err.message || 'Poll not found or contract error.');
    } finally {
      if (isInitialLoad) {
        setIsLoading(false);
      }
    }
  }, [id, getAnonymousVotingContract]);

  useEffect(() => {
    fetchPollData(true); // Initial load
  }, [fetchPollData]);

  // Refresh poll data periodically to show updated vote counts
  useEffect(() => {
    if (!poll) return;
    const interval = setInterval(() => fetchPollData(false), 10000); // Silent refresh every 10 seconds
    return () => clearInterval(interval);
  }, [poll, fetchPollData]);

  const totalVotes = poll ? poll.votes.reduce((sum, count) => sum + count, 0) : 0;

  if (isLoading) return <div className="feedback-container">Loading Poll...</div>;
  if (error && !poll) return <div className="feedback-container error">{error}</div>;
  if (!poll) return <div className="feedback-container">Poll not found.</div>;

  // Check if poll has ended
  const hasEnded = poll.endTime && Date.now() / 1000 > poll.endTime;
  
  // Check if current user is the poll creator
  const isCreator = account && pollCreator && 
    account.toLowerCase() === pollCreator.toLowerCase();

  // Helper function to format time remaining
  const getTimeRemaining = () => {
    if (!poll.endTime || hasEnded) return null;
    
    const now = Date.now() / 1000;
    const remaining = poll.endTime - now;
    
    if (remaining <= 0) return 'Ended';
    
    const days = Math.floor(remaining / 86400);
    const hours = Math.floor((remaining % 86400) / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
  };

  const timeRemaining = getTimeRemaining();

  return (
    <div className="single-poll-container">
      <button className="back-button" onClick={() => navigate('/')}>
        <ArrowLeft size={18} /> Back to All Polls
      </button>

      <h2>{poll.question}</h2>
      
      {/* Large Status Banner */}
      <div className={`poll-status-banner ${poll.isActive && !hasEnded ? 'active' : 'ended'}`}>
        <div className="status-main">
          <span className="status-icon"><Circle size={16} fill={poll.isActive && !hasEnded ? '#22c55e' : '#ef4444'} /></span>
          <span className="status-text">{poll.isActive && !hasEnded ? 'ACTIVE' : 'ENDED'}</span>
        </div>
        {timeRemaining && (
          <div className="time-remaining">
            <span className="time-icon"><Clock size={16} /></span>
            <span className="time-text">{timeRemaining}</span>
          </div>
        )}
      </div>
      
      {/* Poll Stats */}
      <div className="poll-stats">
        <div className="stat-card">
          <span className="stat-icon"><BarChart3 size={24} /></span>
          <span className="stat-value">{totalVotes}</span>
          <span className="stat-label">Total Votes</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon"><List size={24} /></span>
          <span className="stat-value">{poll.options.length}</span>
          <span className="stat-label">Options</span>
        </div>
        {poll.endTime > 0 && (
          <div className="stat-card">
            <span className="stat-icon"><Calendar size={24} /></span>
            <span className="stat-value">{new Date(poll.endTime * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            <span className="stat-label">{hasEnded ? 'Ended' : 'Ends'} {new Date(poll.endTime * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        )}
      </div>
      
      {/* Poll Creator Info */}
      {pollCreator && (
        <div className="poll-creator-info">
          <span className="creator-label">Created by: </span>
          <span className="creator-address" title={pollCreator}>
            {getDisplayName(pollCreator, true)}
          </span>
          {isCreator && <span className="creator-badge">(You)</span>}
        </div>
      )}
      
      {/* Admin Panel - Only visible to poll creator */}
      <AdminPanel pollId={poll.id} pollCreator={pollCreator} />
      
      {/* Results Display */}
      <div className="results-section">
        <h3><BarChart3 size={20} style={{marginRight: '8px', verticalAlign: 'middle'}} />Current Results</h3>
        <div className="options-container">
          {poll.options.map((option, index) => {
            const voteCount = poll.votes[index];
            const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;

            return (
              <div key={index} className="option-wrapper">
                <div className="option-label">
                  <span className="option-text">{option}</span>
                  <span className="option-votes">{voteCount} votes ({percentage.toFixed(1)}%)</span>
                </div>
                <div className="progress-bar-background">
                  <div 
                    className="progress-bar-foreground" 
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Voting Section - Uses the ZK-proof enabled VotingInterface */}
      {poll.isActive && !hasEnded && isConnected && (
        <div className="voting-section">
          <VotingInterface poll={poll} onVoteSuccess={fetchPollData} />
        </div>
      )}

      {!isConnected && poll.isActive && !hasEnded && (
        <div className="connect-prompt">
          <p>Connect your wallet to cast your anonymous vote.</p>
        </div>
      )}

      {error && <p className="feedback-container error">{error}</p>}
    </div>
  );
};

export default SinglePollPage;