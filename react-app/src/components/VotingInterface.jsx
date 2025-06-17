import React from 'react';
import { useUnsafeVoting } from '../hooks/useUnsafeVoting'; // Import the new hook
import './VotingInterface.css';

// Let's assume there are 5 candidates for every poll for this example
const MOCK_CANDIDATES = [
  { id: 0, name: 'Candidate A' },
  { id: 1, name: 'Candidate B' },
  { id: 2, name: 'Candidate C' },
];

const VotingInterface = ({ poll }) => {
  const { castVote, isLoading, error, successMessage } = useUnsafeVoting();

  const handleVoteClick = (candidateId) => {
    castVote(poll.id, candidateId);
  };

  // Dynamically generate candidate buttons based on numCandidates from the poll object
  const candidates = Array.from({ length: poll.numCandidates }, (_, i) => ({
    id: i,
    name: `Candidate ${String.fromCharCode(65 + i)}` // A, B, C...
  }));

  return (
 <div className="voting-interface">
      <h4>Cast Your Vote:</h4>
      <div className="vote-buttons">
        {candidates.map(candidate => (
          <button
            key={candidate.id}
            onClick={() => handleVoteClick(candidate.id)}
            disabled={isLoading}
          >
            Vote for {candidate.name}
          </button>
        ))}
      </div>
      
      {/* Feedback section */}
      <div className="feedback-container">
        {isLoading && <p className="feedback-loading">Submitting your vote...</p>}
        {error && <p className="feedback-error">{error}</p>}
        {successMessage && <p className="feedback-success">{successMessage}</p>}
      </div>
    </div>
  );
};

export default VotingInterface;