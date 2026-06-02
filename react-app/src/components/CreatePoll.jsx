import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWeb3 } from '../contexts/Web3Context';
import { useIdentity } from '../hooks/useIdentity';
import { setNickname, getNickname } from '../utils/nicknames';
import { AlertTriangle, Check } from 'lucide-react';
import './CreatePoll.css';

const CreatePoll = () => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']); // Start with two empty options
  // Default end time: 1 hour from now
  const getDefaultEndTime = () => {
    const date = new Date();
    date.setHours(date.getHours() + 1);
    return date.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:MM
  };
  const [endDateTime, setEndDateTime] = useState(getDefaultEndTime());
  const [creatorNickname, setCreatorNickname] = useState('');
  const [autoRegister, setAutoRegister] = useState(true); // Auto-register creator as voter
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  
  const { getAnonymousVotingContract, isConnected, account } = useWeb3();
  const { commitment, hasIdentity } = useIdentity();
  const navigate = useNavigate();

  // Load existing nickname on mount
  React.useEffect(() => {
    if (account) {
      const existing = getNickname(account);
      if (existing) setCreatorNickname(existing);
    }
  }, [account]);

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleAddOption = () => {
    setOptions([...options, '']);
  };

  const handleRemoveOption = (index) => {
    if (options.length <= 2) return;
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setStatus('');

    // --- Validation ---
    if (!question.trim()) {
      setError('Question cannot be empty.');
      return;
    }
    const filledOptions = options.map(opt => opt.trim()).filter(opt => opt !== '');
    if (filledOptions.length < 2) {
      setError('You must provide at least two non-empty options.');
      return;
    }

    // Check if user wants to auto-register but has no identity
    if (autoRegister && !hasIdentity) {
      setError('Please create your identity first (in the Identity Manager) to auto-register as a voter.');
      return;
    }

    setIsLoading(true);
    try {
      const contract = await getAnonymousVotingContract();
      
      // Save nickname if provided
      if (creatorNickname.trim()) {
        setNickname(account, creatorNickname.trim());
      }

      // Calculate duration from end datetime
      const endTime = new Date(endDateTime).getTime();
      const now = Date.now();
      const duration = Math.floor((endTime - now) / 1000);
      
      if (duration <= 0) {
        setError('End time must be in the future.');
        setIsLoading(false);
        return;
      }

      // Step 1: Create the poll
      setStatus('Creating poll...');
      const tx = await contract.createPoll(question, filledOptions, duration);
      console.log('Transaction sent...', tx.hash);
      const receipt = await tx.wait();
      console.log('Poll created!');

      // Get the poll ID from the event
      const pollCreatedEvent = receipt.logs.find(log => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed?.name === 'PollCreated';
        } catch {
          return false;
        }
      });

      let pollId = null;
      if (pollCreatedEvent) {
        const parsed = contract.interface.parseLog(pollCreatedEvent);
        pollId = parsed.args.pollId;
        console.log('Created poll ID:', pollId.toString());
      }

      // Step 2: Auto-register creator as voter if enabled
      if (autoRegister && hasIdentity && commitment && pollId !== null) {
        setStatus('Registering you as a voter...');
        try {
          const registerTx = await contract.registerVoter(pollId, commitment);
          await registerTx.wait();
          console.log('Creator auto-registered as voter!');
        } catch (regErr) {
          console.error('Auto-registration failed:', regErr);
          // Don't fail the whole operation, just warn
          setStatus('Poll created! (Auto-registration failed - you can register manually)');
          setTimeout(() => navigate('/'), 2000);
          return;
        }
      }

      setStatus('Success! Redirecting...');
      setTimeout(() => navigate('/'), 1000);
    } catch (err) {
      console.error('Poll creation failed:', err);
      setError(err.reason || 'An error occurred during transaction.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="create-poll-container">
        <div className="connect-prompt">
          <h2>Please connect your wallet to create a poll.</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="create-poll-container">
      <h2>Create a New Poll</h2>
      <form onSubmit={handleSubmit}>
        {/* Creator Nickname */}
        <div className="form-group">
          <label htmlFor="nickname">Your Display Name (optional)</label>
          <input
            type="text"
            id="nickname"
            value={creatorNickname}
            onChange={(e) => setCreatorNickname(e.target.value)}
            placeholder="e.g., Alice, Professor Smith, Admin..."
            maxLength={30}
          />
          <p className="form-hint">This name will be shown as the poll creator</p>
        </div>

        <div className="form-group">
          <label htmlFor="question">Poll Question</label>
          <input
            type="text"
            id="question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g., What's the best framework?"
            required
          />
        </div>

        <div className="form-group">
          <label>Options</label>
          <div className="options-list">
            {options.map((option, index) => (
              <div key={index} className="option-item">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                  required
                />
                <button
                  type="button"
                  className="remove-option-btn"
                  onClick={() => handleRemoveOption(index)}
                  disabled={options.length <= 2}
                >
                  × {/* A simple 'X' icon */}
                </button>
              </div>
            ))}
          </div>
          <button type="button" className="add-option-btn" onClick={handleAddOption}>
            + Add Option
          </button>
        </div>

        <div className="form-group datetime-group">
          <label htmlFor="endDateTime">Poll End Date & Time</label>
          <div className="datetime-picker-wrapper">
            <input
              type="datetime-local"
              id="endDateTime"
              value={endDateTime}
              onChange={(e) => setEndDateTime(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className="datetime-input"
              required
            />
          </div>
          <p className="form-hint">
            Poll will automatically end at this time. Currently set to end {endDateTime ? new Date(endDateTime).toLocaleString() : 'not set'}.
          </p>
        </div>

        {/* Auto-register as voter */}
        <div className="form-group checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={autoRegister}
              onChange={(e) => setAutoRegister(e.target.checked)}
            />
            <span>Automatically register me as a voter</span>
          </label>
          {autoRegister && !hasIdentity && (
            <p className="form-warning"><AlertTriangle size={14} /> You need to create your identity first to auto-register</p>
          )}
          {autoRegister && hasIdentity && (
            <p className="form-success"><Check size={14} /> You'll be registered to vote in your own poll</p>
          )}
        </div>

        {error && <p className="error-message">{error}</p>}
        {status && <p className="status-message">{status}</p>}

        <button type="submit" className="submit-poll-btn" disabled={isLoading}>
          {isLoading ? status || 'Creating Poll...' : 'Create Poll'}
        </button>
      </form>
    </div>
  );
};

export default CreatePoll;