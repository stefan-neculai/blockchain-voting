import React, { useState, useEffect, useCallback } from 'react';
import './ResultsDisplay.css';
import { useUnsafeVoting } from '../hooks/useUnsafeVoting';

// The component now receives the full poll object
const ResultsDisplay = ({ poll }) => { 
  const { getPollResults } = useUnsafeVoting();
  const [results, setResults] = useState(null);
  const [totalVotes, setTotalVotes] = useState(0);

  const fetchResults = useCallback(async () => {
    // We now get numCandidates directly from the poll object
    const fetchedResults = await getPollResults(poll.id, poll.numCandidates);
    if (fetchedResults) {
      // ... (rest of the logic is the same)
    }
  }, [getPollResults, poll.id, poll.numCandidates]); // Add dependencies

  // Fetch results when the component mounts and pollId changes
  useEffect(() => {
    fetchResults();
    // Optional: Set up polling to refresh results periodically
    const interval = setInterval(fetchResults, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval); // Cleanup on unmount
  }, [fetchResults]);

  if (!results) {
    return <div className="results-display">Loading results...</div>;
  }

  return (
    <div className="results-display">
      <h4>Live Results (Total Votes: {totalVotes})</h4>
      <div className="results-list">
        {Object.entries(results).map(([candidateId, count]) => {
          const percentage = totalVotes > 0 ? (count / totalVotes) * 100 : 0;
          return (
            <div key={candidateId} className="result-item">
              <span className="candidate-name">Candidate {String.fromCharCode(65 + parseInt(candidateId))}</span>
              <div className="result-bar-container">
                <div className="result-bar" style={{ width: `${percentage}%` }}></div>
              </div>
              <span className="vote-count">{count} votes</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ResultsDisplay;
