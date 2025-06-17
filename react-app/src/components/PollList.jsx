import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './PollList.css'; // We will create this file

const PollList = () => {
  const [polls, setPolls] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPolls = async () => {
      try {
        // This URL must match the port your backend server is running on
        const response = await fetch('http://localhost:3001/polls');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        console.log("Fetched polls:", data); // Debugging line to check fetched data
        setPolls(data);
      } catch (err) {
        console.error("Fetch error:", err);
        setError('Failed to fetch polls. Is the backend server running?');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPolls();
  }, []); // The empty array ensures this effect runs only once on mount

  const renderContent = () => {
    if (isLoading) {
      return <div className="feedback-message">Loading polls...</div>;
    }

    if (error) {
      return <div className="feedback-message error">{error}</div>;
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