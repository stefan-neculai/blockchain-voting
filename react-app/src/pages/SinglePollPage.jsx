import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWeb3 } from '../contexts/Web3Context';
import './SinglePollPage.css'; // We'll create this next

const SinglePollPage = () => {
  const { id } = useParams(); // Gets the ':id' from the URL
  const navigate = useNavigate();

  const [poll, setPoll] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedOption, setSelectedOption] = useState(null);
  const [isVoting, setIsVoting] = useState(false);

  const { isConnected, getContract } = useWeb3();

  const fetchPollData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`http://localhost:3001/polls/${id}`);
      if (!response.ok) {
        throw new Error('Poll not found or server error.');
      }
      const data = await response.json();
      setPoll(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPollData();
  }, [fetchPollData]);

  const handleVote = async () => {
    if (selectedOption === null) {
      setError('Please select an option before voting.');
      return;
    }
    if (!isConnected) {
      setError('Please connect your wallet to vote.');
      return;
    }

    setIsVoting(true);
    setError('');
    try {
      const contract = await getContract();
      const tx = await contract.vote(id, selectedOption);
      await tx.wait(); // Wait for the transaction to be mined
      
      alert('Vote cast successfully! The poll data will now refresh.');
      await fetchPollData(); // Re-fetch data to show the new vote count
      setSelectedOption(null); // Reset selection
    } catch (err) {
      console.error("Voting failed:", err);
      setError(err.reason || 'An error occurred while casting your vote.');
    } finally {
      setIsVoting(false);
    }
  };

  const totalVotes = poll ? poll.votes.reduce((sum, count) => sum + count, 0) : 0;

  if (isLoading) return <div className="feedback-container">Loading Poll...</div>;
  if (error && !poll) return <div className="feedback-container error">{error}</div>;
  if (!poll) return <div className="feedback-container">Poll not found.</div>;

  return (
    <div className="single-poll-container">
      <h2>{poll.question}</h2>
      <p className="total-votes">Total Votes: {totalVotes}</p>
      
      <div className="options-container">
        {poll.options.map((option, index) => {
          const voteCount = poll.votes[index];
          const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;

          return (
            <div key={index} className="option-wrapper">
              <label className="option-label">
                <input
                  type="radio"
                  name="poll-option"
                  checked={selectedOption === index}
                  onChange={() => setSelectedOption(index)}
                  disabled={isVoting}
                />
                <span className="option-text">{option}</span>
                <span className="option-votes">{voteCount} votes</span>
              </label>
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

      {isConnected && (
        <div className="vote-action-area">
          <button onClick={handleVote} disabled={isVoting || selectedOption === null}>
            {isVoting ? 'Casting Vote...' : 'Submit Vote'}
          </button>
        </div>
      )}
      
      {error && <p className="feedback-container error">{error}</p>}
      
      <button className="back-button" onClick={() => navigate('/')}>
        ← Back to All Polls
      </button>
    </div>
  );
};

export default SinglePollPage;