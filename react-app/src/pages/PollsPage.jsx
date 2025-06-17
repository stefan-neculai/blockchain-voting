import React, { useState, useEffect } from 'react';
import PollCard from '../components/PollCard';
import { useUnsafeVoting } from '../hooks/useUnsafeVoting'; // Import the hook
import './PollsPage.css';

const PollsPage = () => {
  // State to hold the polls fetched from the blockchain
  const [polls, setPolls] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get the fetch function from our custom hook
  const { fetchAllPolls } = useUnsafeVoting();

  // Use useEffect to fetch the data when the component mounts
  useEffect(() => {
    const loadPolls = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const fetchedPolls = await fetchAllPolls();
        setPolls(fetchedPolls);
      } catch (err) {
        setError("Failed to load polls from the blockchain.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadPolls();
  }, [fetchAllPolls]); // Dependency array ensures this runs once

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