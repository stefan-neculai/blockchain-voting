import React from 'react';
import VotingInterface from './VotingInterface';
import ResultsDisplay from './ResultsDisplay';
import './PollCard.css';

const PollCard = ({ poll }) => {
  return (
    <div className="poll-card">
      <div className="poll-content">
        <h2>{poll.title}</h2>
        {/* We can now use the description from our poll object if we set one */}
        <p>{poll.description}</p>
      </div>
      <div className="poll-actions-container">
        {/* Pass the full poll object down to its children */}
        <VotingInterface poll={poll} />
        <ResultsDisplay poll={poll} />
      </div>
    </div>
  );
};

export default PollCard;