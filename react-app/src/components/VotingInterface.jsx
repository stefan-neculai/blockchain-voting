import React, { useState, useEffect } from 'react';
import { useAnonymousVoting, VotingState } from '../hooks/useAnonymousVoting';
import { useIdentity } from '../hooks/useIdentity';
import './VotingInterface.css';

const VotingInterface = ({ poll }) => {
  const { 
    castVote, 
    isLoading, 
    error, 
    successMessage, 
    votingState,
    proofGenerationTime,
    transactionHash,
    isRegistered,
    resetState 
  } = useAnonymousVoting();
  
  const { hasIdentity } = useIdentity();
  
  const [selectedOption, setSelectedOption] = useState(null);
  const [registrationStatus, setRegistrationStatus] = useState(null);
  const [checkingRegistration, setCheckingRegistration] = useState(false);

  // Check registration status when identity changes
  useEffect(() => {
    const checkRegistration = async () => {
      if (hasIdentity && poll?.id !== undefined) {
        setCheckingRegistration(true);
        try {
          const registered = await isRegistered(poll.id);
          setRegistrationStatus(registered);
        } catch (err) {
          console.error("Error checking registration:", err);
          setRegistrationStatus(false);
        } finally {
          setCheckingRegistration(false);
        }
      } else {
        setRegistrationStatus(null);
      }
    };
    
    checkRegistration();
  }, [hasIdentity, poll?.id, isRegistered]);

  const handleVoteClick = async (optionIndex) => {
    setSelectedOption(optionIndex);
    await castVote(poll.id, optionIndex);
  };

  // Dynamically generate options based on poll data
  const options = poll.options || Array.from({ length: poll.numCandidates || 2 }, (_, i) => ({
    id: i,
    name: `Option ${String.fromCharCode(65 + i)}`
  }));

  // Get status message based on voting state
  const getStatusDisplay = () => {
    switch (votingState) {
      case VotingState.CHECKING_REGISTRATION:
        return { message: "Checking registration status...", type: "loading" };
      case VotingState.FETCHING_GROUP:
        return { message: "Fetching voter registry...", type: "loading" };
      case VotingState.GENERATING_PROOF:
        return { 
          message: "🔐 Generating zero-knowledge proof... This may take a few seconds.", 
          type: "loading" 
        };
      case VotingState.SUBMITTING_VOTE:
        return { message: "📤 Submitting your anonymous vote...", type: "loading" };
      case VotingState.SUCCESS:
        return { 
          message: `✅ ${successMessage}${proofGenerationTime ? ` (Proof generated in ${proofGenerationTime}s)` : ''}`, 
          type: "success" 
        };
      case VotingState.ERROR:
        return { message: `❌ ${error}`, type: "error" };
      default:
        return null;
    }
  };

  const status = getStatusDisplay();

  // Can't vote without identity
  if (!hasIdentity) {
    return (
      <div className="voting-interface voting-disabled">
        <h4>🔐 Anonymous Voting</h4>
        <div className="voting-notice">
          <p>Create your anonymous identity above to participate in this poll.</p>
        </div>
      </div>
    );
  }

  // Checking registration
  if (checkingRegistration) {
    return (
      <div className="voting-interface">
        <h4>🔐 Anonymous Voting</h4>
        <div className="voting-loading">
          <span className="loading-spinner"></span>
          Checking your registration status...
        </div>
      </div>
    );
  }

  // Not registered
  if (registrationStatus === false) {
    return (
      <div className="voting-interface voting-disabled">
        <h4>🔐 Anonymous Voting</h4>
        <div className="voting-notice voting-notice-warning">
          <p>⚠️ You are not registered to vote in this poll.</p>
          <p className="notice-hint">Contact the poll administrator with your identity commitment to get registered.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="voting-interface">
      <h4>🔐 Cast Your Anonymous Vote</h4>
      
      {registrationStatus && (
        <div className="registration-badge">
          <span className="badge badge-success">✓ Registered to vote</span>
        </div>
      )}
      
      <div className="vote-options">
        {options.map((option, index) => (
          <button
            key={option.id || index}
            className={`vote-option ${selectedOption === index ? 'selected' : ''}`}
            onClick={() => handleVoteClick(index)}
            disabled={isLoading || votingState === VotingState.SUCCESS}
          >
            <span className="option-name">{option.name || option}</span>
            {selectedOption === index && isLoading && (
              <span className="loading-spinner small"></span>
            )}
          </button>
        ))}
      </div>
      
      {/* Status feedback */}
      {status && (
        <div className={`voting-feedback feedback-${status.type}`}>
          {status.type === 'loading' && <span className="loading-spinner"></span>}
          <p>{status.message}</p>
        </div>
      )}
      
      {/* Transaction link */}
      {transactionHash && (
        <div className="transaction-link">
          <a 
            href={`https://sepolia.etherscan.io/tx/${transactionHash}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            View transaction on Etherscan →
          </a>
        </div>
      )}
      
      {/* Privacy notice */}
      <div className="privacy-notice">
        <p>
          <strong>🔒 Your vote is anonymous.</strong> The zero-knowledge proof ensures 
          your vote cannot be traced back to your wallet address.
        </p>
      </div>
      
      {/* Reset button after voting */}
      {votingState === VotingState.SUCCESS && (
        <button className="btn btn-secondary" onClick={resetState}>
          Vote Again in Another Poll
        </button>
      )}
    </div>
  );
};

export default VotingInterface;