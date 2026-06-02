import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Vote, Lock, Puzzle, RefreshCw, Shield, AlertTriangle, 
  Settings, Check, EyeOff, Ban, CheckCircle 
} from 'lucide-react';
import './HowItWorksPage.css';

const HowItWorksPage = () => {
  return (
    <div className="how-it-works-page">
      <div className="hero-section">
        <h1><Vote className="icon-inline" /> Anonymous Blockchain Voting</h1>
        <p className="hero-subtitle">
          Secure, transparent, and truly private voting powered by Zero-Knowledge Proofs
        </p>
      </div>

      <div className="content-section">
        <section className="info-card">
          <h2><Lock size={24} className="icon-inline" /> What is ZK-Vote?</h2>
          <p>
            ZK-Vote is a decentralized voting platform that combines the transparency of blockchain 
            with the privacy of zero-knowledge proofs. This means your vote is counted and verifiable, 
            but <strong>no one can trace how you voted</strong> — not even the poll creator.
          </p>
        </section>

        <section className="info-card">
          <h2><Puzzle size={24} className="icon-inline" /> How Zero-Knowledge Proofs Work</h2>
          <p>
            Zero-knowledge proofs allow you to prove something is true without revealing the underlying data. 
            In our case:
          </p>
          <ul className="feature-list">
            <li>
              <span className="check"><Check size={16} /></span>
              You prove you're a registered voter <strong>without revealing your identity</strong>
            </li>
            <li>
              <span className="check"><Check size={16} /></span>
              You prove you haven't voted before <strong>without linking to your wallet</strong>
            </li>
            <li>
              <span className="check"><Check size={16} /></span>
              Your vote is recorded on-chain <strong>completely anonymously</strong>
            </li>
          </ul>
        </section>

        <section className="info-card">
          <h2><RefreshCw size={24} className="icon-inline" /> The Voting Process</h2>
          <div className="steps-container">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Create Identity</h3>
                <p>Generate a cryptographic identity (Semaphore). This creates a private key stored only in your browser and a public "commitment" that can be shared.</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>Get Registered</h3>
                <p>Share your commitment with the poll creator. They add it to the voter registry without knowing your wallet address.</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Cast Your Vote</h3>
                <p>When voting, your browser generates a ZK proof that you're registered without revealing which commitment is yours.</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">4</div>
              <div className="step-content">
                <h3>Verified & Anonymous</h3>
                <p>The smart contract verifies your proof and records your vote. No one can link the vote to your identity.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="info-card">
          <h2><Shield size={24} className="icon-inline" /> Privacy Guarantees</h2>
          <div className="guarantee-grid">
            <div className="guarantee">
              <h4><Lock size={18} className="icon-inline" /> Vote Privacy</h4>
              <p>Your vote choice is recorded but cannot be linked to your wallet or identity</p>
            </div>
            <div className="guarantee">
              <h4><EyeOff size={18} className="icon-inline" /> Unlinkable</h4>
              <p>Even the poll creator cannot determine which registered voter cast which vote</p>
            </div>
            <div className="guarantee">
              <h4><Ban size={18} className="icon-inline" /> No Double Voting</h4>
              <p>Cryptographic nullifiers prevent voting twice. The blockchain rejects duplicate votes automatically.</p>
            </div>
            <div className="guarantee">
              <h4><CheckCircle size={18} className="icon-inline" /> Verifiable</h4>
              <p>Anyone can verify total vote counts on the public blockchain</p>
            </div>
          </div>
        </section>

        <section className="info-card">
          <h2><AlertTriangle size={24} className="icon-inline" /> Important Notes</h2>
          <div className="warning-box">
            <p><strong>Your identity is stored in your browser.</strong> If you clear browser data or switch devices, you'll need to create a new identity and get re-registered.</p>
          </div>
          <div className="info-box">
            <p><strong>Creator activity is public.</strong> If you create polls, your wallet address is visible as the creator. However, if you vote in polls (even your own), that remains anonymous.</p>
          </div>
        </section>

        <section className="info-card tech-card">
          <h2><Settings size={24} className="icon-inline" /> Technology Stack</h2>
          <div className="tech-grid">
            <div className="tech-item">
              <span className="tech-name">Semaphore</span>
              <span className="tech-desc">Zero-knowledge group membership</span>
            </div>
            <div className="tech-item">
              <span className="tech-name">Ethereum</span>
              <span className="tech-desc">Smart contract platform</span>
            </div>
            <div className="tech-item">
              <span className="tech-name">Solidity</span>
              <span className="tech-desc">Smart contract language</span>
            </div>
            <div className="tech-item">
              <span className="tech-name">React</span>
              <span className="tech-desc">Frontend framework</span>
            </div>
            <div className="tech-item">
              <span className="tech-name">ethers.js</span>
              <span className="tech-desc">Blockchain interaction</span>
            </div>
            <div className="tech-item">
              <span className="tech-name">Hardhat</span>
              <span className="tech-desc">Development environment</span>
            </div>
          </div>
        </section>

        <section className="cta-section">
          <h2>Ready to Vote Anonymously?</h2>
          <p>Connect your wallet and create your anonymous identity to get started.</p>
          <div className="cta-buttons">
            <NavLink to="/" className="cta-button primary">View Polls</NavLink>
            <NavLink to="/profile" className="cta-button secondary">Create Identity</NavLink>
          </div>
        </section>
      </div>
    </div>
  );
};

export default HowItWorksPage;
