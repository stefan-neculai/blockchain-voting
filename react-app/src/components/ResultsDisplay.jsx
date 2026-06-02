import React, { useState, useEffect, useCallback, useRef } from 'react';
import './ResultsDisplay.css';
import { useWeb3 } from '../contexts/Web3Context';

// The component receives the full poll object
const ResultsDisplay = ({ poll }) => { 
  const { getAnonymousVotingContract } = useWeb3();
  const [results, setResults] = useState(null);
  const [totalVotes, setTotalVotes] = useState(0);
  const lastResultsRef = useRef(null);

  const fetchResults = useCallback(async () => {
    if (!poll?.id === undefined) return;
    
    try {
      const contract = await getAnonymousVotingContract();
      if (!contract) return;
      
      const pollData = await contract.getPoll(poll.id);
      const votes = pollData.votes.map(v => Number(v));
      const total = votes.reduce((sum, v) => sum + v, 0);
      
      // Convert to object format for display
      const resultsObj = {};
      votes.forEach((count, index) => {
        resultsObj[index] = count;
      });
      
      // Only update state if data actually changed (prevents scroll reset)
      const newResultsString = JSON.stringify(resultsObj);
      if (newResultsString !== lastResultsRef.current) {
        lastResultsRef.current = newResultsString;
        setResults(resultsObj);
        setTotalVotes(total);
      }
    } catch (err) {
      console.error("Error fetching results:", err);
    }
  }, [getAnonymousVotingContract, poll?.id]);

  // Fetch results when the component mounts and poll changes
  useEffect(() => {
    fetchResults();
    // Set up polling to refresh results periodically
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
        {Object.entries(results).map(([optionIndex, count]) => {
          const percentage = totalVotes > 0 ? (count / totalVotes) * 100 : 0;
          const optionName = poll.options?.[optionIndex] || `Option ${String.fromCharCode(65 + parseInt(optionIndex))}`;
          return (
            <div key={optionIndex} className="result-item">
              <span className="candidate-name">{optionName}</span>
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
