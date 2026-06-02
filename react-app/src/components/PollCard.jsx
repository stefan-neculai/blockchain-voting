import React from 'react';
import VotingInterface from './VotingInterface';
import ResultsDisplay from './ResultsDisplay';
import { Circle } from 'lucide-react';
import './PollCard.css';

const PollCard = ({ poll }) => {
  return (
    <div className="poll-card">
      <div className="poll-content">
        <h2>{poll.question}</h2>
        <p className="poll-meta">
          {poll.options?.length || 0} options • 
          <Circle size={10} fill={poll.isActive ? '#22c55e' : '#ef4444'} className="status-dot" />
          {poll.isActive ? ' Active' : ' Ended'}
        </p>
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