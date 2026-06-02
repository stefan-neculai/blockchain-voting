import React, { useState, useEffect } from 'react';
import { useAnonymousVoting, VotingState } from '../hooks/useAnonymousVoting';
import { useIdentity } from '../hooks/useIdentity';
import { useWeb3 } from '../contexts/Web3Context';
import { hasVotedInPoll, recordVote, getVoteInfo } from '../utils/voteTracker';
import { Lock, CheckCircle, XCircle, AlertTriangle, Vote, Check, Send } from 'lucide-react';
import './VotingInterface.css';

const VotingInterface = ({ poll, onVoteSuccess }) => {
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
  const { account } = useWeb3();
  
  const [selectedOption, setSelectedOption] = useState(null);
  const [registrationStatus, setRegistrationStatus] = useState(null);
  const [checkingRegistration, setCheckingRegistration] = useState(false);
  const [alreadyVoted, setAlreadyVoted] = useState(false);
  const [voteInfo, setVoteInfo] = useState(null);

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

  // Check if user has already voted in this poll (local tracking)
  useEffect(() => {
    if (account && poll?.id !== undefined) {
      const voted = hasVotedInPoll(account, poll.id);
      setAlreadyVoted(voted);
      if (voted) {
        setVoteInfo(getVoteInfo(account, poll.id));
      }
    }
  }, [account, poll?.id]);

  // Record vote when successful
  useEffect(() => {
    if (votingState === VotingState.SUCCESS && account && poll?.id !== undefined) {
      recordVote(account, poll.id, transactionHash);
      setAlreadyVoted(true);
    }
  }, [votingState, account, poll?.id, transactionHash]);

  // Call onVoteSuccess when voting succeeds
  useEffect(() => {
    if (votingState === VotingState.SUCCESS && onVoteSuccess) {
      // Delay slightly to allow transaction to be indexed
      const timer = setTimeout(() => {
        onVoteSuccess();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [votingState, onVoteSuccess]);

  const handleOptionSelect = (optionIndex) => {
    setSelectedOption(optionIndex);
  };

  const handleSubmitVote = async () => {
    if (selectedOption === null) return;
    await castVote(poll.id, selectedOption);
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
          message: <><Lock size={16} style={{marginRight: '6px'}} /> Generating zero-knowledge proof... This may take a few seconds.</>, 
          type: "loading" 
        };
      case VotingState.SUBMITTING_VOTE:
        return { message: <><Send size={16} style={{marginRight: '6px'}} /> Submitting your anonymous vote...</>, type: "loading" };
      case VotingState.SUCCESS:
        return { 
          message: <><CheckCircle size={16} style={{marginRight: '6px'}} /> {successMessage}{proofGenerationTime ? ` (Proof generated in ${proofGenerationTime}s)` : ''}</>, 
          type: "success" 
        };
      case VotingState.ERROR:
        return { message: <><XCircle size={16} style={{marginRight: '6px'}} /> {error}</>, type: "error" };
      default:
        return null;
    }
  };

  const status = getStatusDisplay();

  // Can't vote without identity
  if (!hasIdentity) {
    return (
      <div className="voting-interface voting-disabled">
        <h4><Lock size={18} style={{marginRight: '8px', verticalAlign: 'middle'}} />Anonymous Voting</h4>
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
        <h4><Lock size={18} style={{marginRight: '8px', verticalAlign: 'middle'}} />Anonymous Voting</h4>
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
        <h4><Lock size={18} style={{marginRight: '8px', verticalAlign: 'middle'}} />Anonymous Voting</h4>
        <div className="voting-notice voting-notice-warning">
          <p><AlertTriangle size={16} style={{marginRight: '6px', verticalAlign: 'middle'}} />You are not registered to vote in this poll.</p>
          <p className="notice-hint">Contact the poll administrator with your identity commitment to get registered.</p>
        </div>
      </div>
    );
  }

  // Already voted (local tracking)
  if (alreadyVoted && votingState !== VotingState.SUCCESS) {
    return (
      <div className="voting-interface">
        <h4><Lock size={18} style={{marginRight: '8px', verticalAlign: 'middle'}} />Anonymous Voting</h4>
        <div className="voting-notice voting-notice-success">
          <p><CheckCircle size={16} style={{marginRight: '6px', verticalAlign: 'middle'}} />You have already voted in this poll</p>
          <p className="notice-hint">
            Your vote was recorded anonymously on {voteInfo?.timestamp ? new Date(voteInfo.timestamp).toLocaleString() : 'the blockchain'}.
          </p>
          <p className="privacy-reminder">
            <Lock size={14} style={{marginRight: '4px', verticalAlign: 'middle'}} /><strong>Privacy note:</strong> We don't store which option you chose — that information is known only to you!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="voting-interface">
      <h4><Lock size={18} style={{marginRight: '8px', verticalAlign: 'middle'}} />Cast Your Anonymous Vote</h4>
      
      {registrationStatus && (
        <div className="registration-badge">
          <span className="badge badge-success"><Check size={14} style={{marginRight: '4px', verticalAlign: 'middle'}} />Registered to vote</span>
        </div>
      )}
      
      <div className="vote-options">
        {options.map((option, index) => (
          <button
            key={option.id || index}
            className={`vote-option ${selectedOption === index ? 'selected' : ''}`}
            onClick={() => handleOptionSelect(index)}
            disabled={isLoading || votingState === VotingState.SUCCESS}
          >
            <span className="option-name">{option.name || option}</span>
            {selectedOption === index && isLoading && (
              <span className="loading-spinner small"></span>
            )}
          </button>
        ))}
      </div>
      
      {/* Submit Vote Button */}
      <div className="vote-submit-area">
        <button
          className="vote-submit-btn"
          onClick={handleSubmitVote}
          disabled={selectedOption === null || isLoading || votingState === VotingState.SUCCESS}
        >
          {isLoading ? (
            <>
              <span className="loading-spinner small"></span>
              Processing...
            </>
          ) : (
            <><Vote size={18} style={{marginRight: '6px', verticalAlign: 'middle'}} />Cast My Vote</>
          )}
        </button>
        {selectedOption === null && !isLoading && votingState !== VotingState.SUCCESS && (
          <p className="select-hint">Select an option above to vote</p>
        )}
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
          <Lock size={14} style={{marginRight: '4px', verticalAlign: 'middle'}} /><strong>Your vote is anonymous.</strong> The zero-knowledge proof ensures 
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