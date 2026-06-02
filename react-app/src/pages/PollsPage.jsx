import React, { useState, useEffect, useCallback } from 'react';
import PollCard from '../components/PollCard';
import { useWeb3 } from '../contexts/Web3Context';
import './PollsPage.css';

const PollsPage = () => {
  // State to hold the polls fetched from the blockchain
  const [polls, setPolls] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get the contract function from Web3Context
  const { getAnonymousVotingContract, isConnected, provider } = useWeb3();

  const fetchPolls = useCallback(async () => {
    if (!isConnected || !provider) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    
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
        options: [...poll.options],
        votes: poll.votes.map(v => Number(v)),
        isActive: poll.isActive,
        endTime: Number(poll.endTime),
        totalVotes: Number(poll.totalVotes)
      }));
      
      setPolls(pollsData);
    } catch (err) {
      setError("Failed to load polls from the blockchain.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [getAnonymousVotingContract, isConnected, provider]);

  // Use useEffect to fetch the data when the component mounts
  useEffect(() => {
    fetchPolls();
  }, [fetchPolls]);

  // --- Render logic based on state ---

  if (isLoading) {
    return (
      <div className="polls-container">
        <h1>Active Polls</h1>
        <p>Loading polls from the blockchain...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="polls-container">
        <h1>Error</h1>
        <p className="error-text">{error}</p>
      </div>
    );
  }

  return (
    <div className="polls-container">
      <h1>Active Polls</h1>
      <div className="polls-list">
        {polls.length > 0 ? (
          polls.map(poll => (
            // Pass the entire poll object to PollCard
            <PollCard key={poll.id} poll={poll} />
          ))
        ) : (
          <p>No polls have been created yet.</p>
        )}
      </div>
    </div>
  );
};

export default PollsPage;