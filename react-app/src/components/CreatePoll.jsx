import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWeb3 } from '../contexts/Web3Context';
import './CreatePoll.css'; // We'll create this file next

const CreatePoll = () => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']); // Start with two empty options
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { getContract, isConnected } = useWeb3();
  const navigate = useNavigate();

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleAddOption = () => {
    setOptions([...options, '']);
  };

  const handleRemoveOption = (index) => {
    // Prevent removing below 2 options
    if (options.length <= 2) return;
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

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

    setIsLoading(true);
    try {
      const contract = await getContract();
      console.log("contract: ", contract);
      console.log("question: ", question);
      console.log("options: ", filledOptions);
      const tx = await contract.createPoll(question, filledOptions);
      
      console.log('Transaction sent...', tx.hash);
      await tx.wait(); // Wait for the transaction to be mined
      
      console.log('Transaction confirmed!');
      navigate('/'); // Redirect to the poll list page on success
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

        {error && <p className="error-message">{error}</p>}

        <button type="submit" className="submit-poll-btn" disabled={isLoading}>
          {isLoading ? 'Creating Poll...' : 'Create Poll'}
        </button>
      </form>
    </div>
  );
};

export default CreatePoll;