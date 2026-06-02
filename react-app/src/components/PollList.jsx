import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWeb3 } from '../contexts/Web3Context';
import './PollList.css'; // We will create this file

const PollList = () => {
  const [polls, setPolls] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { getAnonymousVotingContract, isConnected, provider } = useWeb3();

  useEffect(() => {
    const fetchPolls = async () => {
      if (!isConnected || !provider) {
        setIsLoading(false);
        return;
      }

      try {
        const contract = await getAnonymousVotingContract(false); // Read-only
        const pollCount = await contract.pollCount();
        
        const pollPromises = [];
        for (let i = 0; i < pollCount; i++) {
          pollPromises.push(contract.getPoll(i));
        }
        
        const pollResults = await Promise.all(pollPromises);
        const pollsData = pollResults.map((poll, index) => ({
          id: index,
          question: poll.question,
          options: poll.options,
          isActive: poll.isActive,
          endTime: Number(poll.endTime),
          totalVotes: Number(poll.totalVotes)
        }));
        
        console.log("Fetched polls:", pollsData);
        setPolls(pollsData);
      } catch (err) {
        console.error("Fetch error:", err);
        setError('Failed to fetch polls from blockchain.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPolls();
  }, [isConnected, provider, getAnonymousVotingContract]);

  const renderContent = () => {
    if (isLoading) {
      return <div className="feedback-message">Loading polls...</div>;
    }

    if (error) {
      return <div className="feedback-message error">{error}</div>;
    }

    if (!isConnected) {
      return (
        <div className="feedback-message">
          Connect your wallet to view polls.
        </div>
      );
    }

    if (polls.length === 0) {
      return (
        <div className="feedback-message">
          No polls found. Why not{' '}
          <Link to="/create">create the first one?</Link>
        </div>
      );
    }

    return (
      <div className="polls-container">
        {polls.map((poll) => (
          <Link to={`/poll/${poll.id}`} key={poll.id} className="poll-item-link">
            <span className="poll-id">#{poll.id}</span>
            <p className="poll-question">{poll.question}</p>
          </Link>
        ))}
      </div>
    );
  };

  return (
    <div className="poll-list-container">
      <h2>Available Polls</h2>
      {renderContent()}
    </div>
  );
};

export default PollList;