# Anonymous Blockchain Voting System Architecture

## Zero-Knowledge Proof Integration for Privacy-Preserving Elections

**Author:** Stefan Neculai  
**Project:** Master's Thesis - Computer Science  
**Version:** Semester 3 (ZKP Integration)  
**Last Updated:** January 2026

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Solution Overview](#3-solution-overview)
4. [System Architecture](#4-system-architecture)
5. [Cryptographic Primitives](#5-cryptographic-primitives)
6. [Smart Contract Design](#6-smart-contract-design)
7. [Frontend Integration](#7-frontend-integration)
8. [Data Flow Diagrams](#8-data-flow-diagrams)
9. [Security Analysis](#9-security-analysis)
10. [Implementation Roadmap](#10-implementation-roadmap)
11. [References](#11-references)

---

## 1. Executive Summary

This document describes the architectural evolution of a blockchain-based voting system from a transparent (privacy-leaking) implementation to a privacy-preserving system using **Zero-Knowledge Proofs (ZKPs)**. The integration leverages the **Semaphore protocol** to enable anonymous voting while maintaining verifiable election integrity.

### Key Improvements

| Aspect | Before (Semester 2) | After (Semester 3) |
|--------|---------------------|-------------------|
| Vote Privacy | ❌ Public (address → vote visible) | ✅ Anonymous (ZK-hidden) |
| Double-Vote Prevention | Address-based mapping | Cryptographic nullifiers |
| Voter Eligibility | Implicit (anyone can vote) | Merkle tree membership proof |
| On-chain Data | Voter addresses stored | Only nullifier hashes stored |

---

## 2. Problem Statement

### 2.1 The Privacy Leak in Traditional DApps

In the previous implementation (`PollFactory.sol`), the voting mechanism relied on Ethereum's native addressing system:

```solidity
// PRIVACY LEAK: Direct address tracking
mapping(uint => mapping(address => bool)) public hasVoted;

function vote(uint _pollId, uint _optionIndex) public {
    require(!hasVoted[_pollId][msg.sender], "Already voted");
    hasVoted[_pollId][msg.sender] = true;  // ← Identity permanently linked
    polls[_pollId].votes[_optionIndex]++;
}
```

**Consequences:**
1. **On-chain Transparency**: Anyone can query `hasVoted[pollId][address]` to check if a specific person voted
2. **Transaction Traceability**: Block explorers display: `0xABC... called vote(pollId=1, option=2)`
3. **Vote Correlation**: Statistical analysis can link voting patterns to identities
4. **Coercion Vulnerability**: Voters can be forced to prove how they voted

### 2.2 Requirements for Anonymous Voting

A secure electronic voting system must satisfy:

1. **Eligibility**: Only authorized voters can participate
2. **Uniqueness**: Each voter can vote exactly once
3. **Privacy**: No one can determine how a specific voter voted
4. **Verifiability**: Anyone can verify that votes were counted correctly
5. **Coercion Resistance**: Voters cannot prove to others how they voted

---

## 3. Solution Overview

### 3.1 Zero-Knowledge Proofs

A Zero-Knowledge Proof allows a prover to convince a verifier that a statement is true without revealing any information beyond the validity of the statement itself.

**In our context:**
- **Statement**: "I am an eligible voter AND I haven't voted yet AND I'm voting for candidate X"
- **Revealed**: The vote is valid
- **Hidden**: Who cast the vote

### 3.2 Why Semaphore?

[Semaphore](https://semaphore.appliedzkp.org/) is a zero-knowledge protocol that enables:

- **Anonymous group membership proofs**: Prove you belong to a group without revealing which member you are
- **Anonymous signaling**: Broadcast a message (vote) as a group member
- **Double-signaling prevention**: Cryptographic nullifiers prevent voting twice

**Advantages for this project:**
- Production-ready smart contracts and circuits
- Well-audited cryptographic implementation
- Active maintenance by PSE (Privacy & Scaling Explorations)
- Used by Worldcoin, zkSync governance, and other production systems

---

## 4. System Architecture

### 4.1 High-Level Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ANONYMOUS VOTING SYSTEM                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐       │
│  │   React DApp    │     │  Node.js Server │     │   Blockchain    │       │
│  │   (Frontend)    │◄───►│   (Optional)    │◄───►│   (Ethereum)    │       │
│  └────────┬────────┘     └─────────────────┘     └────────┬────────┘       │
│           │                                               │                 │
│           │  ┌─────────────────────────────────────────┐  │                 │
│           │  │         Off-Chain Components            │  │                 │
│           │  ├─────────────────────────────────────────┤  │                 │
│           ├──┤  • Identity Generation (browser)        │  │                 │
│           │  │  • Merkle Tree Management               │  │                 │
│           │  │  • ZK Proof Generation (WASM/snarkjs)   │  │                 │
│           │  └─────────────────────────────────────────┘  │                 │
│           │                                               │                 │
│           │  ┌─────────────────────────────────────────┐  │                 │
│           │  │          On-Chain Components            │──┘                 │
│           │  ├─────────────────────────────────────────┤                    │
│           └──┤  • Semaphore.sol (group management)     │                    │
│              │  • AnonymousVoting.sol (poll logic)     │                    │
│              │  • Groth16Verifier.sol (proof verify)   │                    │
│              └─────────────────────────────────────────┘                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Blockchain | Ethereum (Sepolia/Mainnet) | Immutable vote storage |
| Smart Contracts | Solidity 0.8.x | Poll and vote management |
| ZK Protocol | Semaphore v4 | Anonymous membership proofs |
| ZK Backend | Groth16 (snarkjs) | Proof generation/verification |
| Frontend | React 18 | User interface |
| Wallet | MetaMask | Transaction signing |
| State Management | React Context | Web3 connection state |

---

## 5. Cryptographic Primitives

### 5.1 Identity Structure

Each voter generates a **Semaphore Identity** consisting of:

```
Identity = {
    trapdoor:   random 256-bit secret
    nullifier:  random 256-bit secret  
    commitment: Poseidon(nullifier, trapdoor)
}
```

- **Trapdoor**: Secret used in proof generation
- **Nullifier**: Secret used to derive unique nullifier hashes
- **Commitment**: Public identifier added to the voter registry (Merkle tree)

### 5.2 Merkle Tree for Voter Registry

Eligible voters are organized in a Merkle tree:

```
                    Root Hash
                   /          \
              H(A,B)          H(C,D)
             /      \        /      \
        Commit_A  Commit_B  Commit_C  Commit_D
           │         │         │         │
        Voter 1   Voter 2   Voter 3   Voter 4
```

**Properties:**
- Adding a voter: O(log n) hash operations
- Membership proof: O(log n) sibling hashes (Merkle path)
- Tree depth of 20 supports ~1 million voters

### 5.3 Nullifier Hash Generation

To prevent double-voting while maintaining anonymity:

```
nullifierHash = Poseidon(identity.nullifier, externalNullifier)
```

Where `externalNullifier` = `pollId` (unique per election)

**Key insight**: The same voter generates different nullifier hashes for different polls, but the same nullifier hash if they try to vote twice in the same poll.

### 5.4 The ZK Circuit (Simplified)

The Semaphore circuit proves:

```
PUBLIC INPUTS:
  - merkleRoot (the voter registry root)
  - nullifierHash (for double-vote prevention)
  - signal (the vote choice)
  - externalNullifier (poll ID)

PRIVATE INPUTS:
  - identity.trapdoor
  - identity.nullifier
  - merklePath (siblings from leaf to root)
  - pathIndices (left/right indicators)

CONSTRAINTS:
  1. commitment = Poseidon(nullifier, trapdoor)
  2. commitment IS IN the Merkle tree with root merkleRoot
  3. nullifierHash = Poseidon(nullifier, externalNullifier)
  4. signal is properly formatted
```

---

## 6. Smart Contract Design

### 6.1 Contract Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Smart Contract Layer                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────┐     ┌─────────────────────┐           │
│  │  AnonymousVoting.sol │────►│   ISemaphore.sol    │           │
│  │  (Main Contract)     │     │   (Interface)       │           │
│  └──────────┬──────────┘     └──────────┬──────────┘           │
│             │                           │                       │
│             │              ┌────────────┴────────────┐          │
│             │              │                         │          │
│             │    ┌─────────▼─────────┐  ┌───────────▼────────┐ │
│             │    │   Semaphore.sol   │  │ SemaphoreVerifier  │ │
│             │    │ (Group Management)│  │   (Groth16)        │ │
│             │    └───────────────────┘  └────────────────────┘ │
│             │                                                   │
│  ┌──────────▼──────────┐                                       │
│  │   Poll Storage       │                                       │
│  │   - polls mapping    │                                       │
│  │   - vote counts      │                                       │
│  │   - NO addresses!    │                                       │
│  └─────────────────────┘                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 AnonymousVoting.sol - Key Functions

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@semaphore-protocol/contracts/interfaces/ISemaphore.sol";

contract AnonymousVoting {
    ISemaphore public semaphore;
    
    struct Poll {
        uint256 groupId;
        string question;
        string[] options;
        uint256[] votes;
        bool isActive;
        uint256 createdAt;
        uint256 endTime;
    }
    
    mapping(uint256 => Poll) public polls;
    uint256 public pollCount;
    address public admin;
    
    event PollCreated(uint256 indexed pollId, string question, uint256 optionCount);
    event VoterRegistered(uint256 indexed pollId, uint256 indexed commitment);
    event VoteCast(uint256 indexed pollId, uint256 indexed optionIndex);
    
    constructor(address _semaphoreAddress) {
        semaphore = ISemaphore(_semaphoreAddress);
        admin = msg.sender;
    }
    
    /// @notice Create a new poll with its own voter group
    function createPoll(
        string memory _question,
        string[] memory _options,
        uint256 _duration
    ) external onlyAdmin returns (uint256) {
        uint256 pollId = pollCount++;
        
        // Create Semaphore group for this poll's eligible voters
        semaphore.createGroup(pollId, address(this));
        
        Poll storage poll = polls[pollId];
        poll.groupId = pollId;
        poll.question = _question;
        poll.options = _options;
        poll.votes = new uint256[](_options.length);
        poll.isActive = true;
        poll.createdAt = block.timestamp;
        poll.endTime = block.timestamp + _duration;
        
        emit PollCreated(pollId, _question, _options.length);
        return pollId;
    }
    
    /// @notice Register an eligible voter (add their commitment to the group)
    function registerVoter(
        uint256 _pollId,
        uint256 _identityCommitment
    ) external onlyAdmin {
        require(polls[_pollId].isActive, "Poll not active");
        semaphore.addMember(_pollId, _identityCommitment);
        emit VoterRegistered(_pollId, _identityCommitment);
    }
    
    /// @notice Cast an anonymous vote with ZK proof
    function vote(
        uint256 _pollId,
        uint256 _optionIndex,
        ISemaphore.SemaphoreProof calldata _proof
    ) external {
        Poll storage poll = polls[_pollId];
        
        require(poll.isActive, "Poll not active");
        require(block.timestamp < poll.endTime, "Poll ended");
        require(_optionIndex < poll.options.length, "Invalid option");
        
        // The signal encodes the vote choice
        require(_proof.signal == _optionIndex, "Signal mismatch");
        
        // Verify the ZK proof (checks membership + nullifier uniqueness)
        semaphore.validateProof(_pollId, _proof);
        
        // Record the vote
        poll.votes[_optionIndex]++;
        
        emit VoteCast(_pollId, _optionIndex);
    }
    
    /// @notice Get poll results
    function getResults(uint256 _pollId) external view returns (
        string memory question,
        string[] memory options,
        uint256[] memory votes
    ) {
        Poll storage poll = polls[_pollId];
        return (poll.question, poll.options, poll.votes);
    }
}
```

### 6.3 Storage Comparison

| Data | Before (PollFactory) | After (AnonymousVoting) |
|------|---------------------|------------------------|
| Voter addresses | ✅ Stored in `hasVoted` mapping | ❌ Never stored |
| Vote choices per address | ✅ Derivable from tx history | ❌ Unlinkable |
| Nullifier hashes | ❌ Not used | ✅ Stored (in Semaphore) |
| Merkle roots | ❌ Not used | ✅ Stored per group |
| Vote counts | ✅ Stored | ✅ Stored |

---

## 7. Frontend Integration

### 7.1 Identity Management

```javascript
import { Identity } from "@semaphore-protocol/identity";

// Generate identity from wallet signature (recoverable)
async function createIdentity(signer) {
    const message = "Sign to create your anonymous voting identity for Poll #" + pollId;
    const signature = await signer.signMessage(message);
    return new Identity(signature);
}

// The commitment is what gets registered on-chain
const commitment = identity.commitment;
```

### 7.2 Proof Generation Flow

```javascript
import { generateProof } from "@semaphore-protocol/proof";
import { Group } from "@semaphore-protocol/group";

async function castAnonymousVote(identity, pollId, optionIndex, groupMembers) {
    // Reconstruct the Merkle tree locally
    const group = new Group();
    groupMembers.forEach(commitment => group.addMember(commitment));
    
    // Generate ZK proof (runs in browser via WASM)
    const proof = await generateProof(
        identity,           // Private: user's secrets
        group,              // The voter registry
        optionIndex,        // Signal: the vote choice
        pollId              // External nullifier: poll-specific
    );
    
    // Send to blockchain
    return await contract.vote(pollId, optionIndex, {
        merkleTreeDepth: proof.merkleTreeDepth,
        merkleTreeRoot: proof.merkleTreeRoot,
        nullifier: proof.nullifier,
        signal: proof.signal,
        proof: proof.proof
    });
}
```

### 7.3 User Flow Diagram

```
┌────────────────────────────────────────────────────────────────────────────┐
│                           USER VOTING FLOW                                 │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌─────────────┐                                                           │
│  │   STEP 1    │  Connect Wallet                                           │
│  │   Connect   │  ────────────────►  MetaMask prompt                       │
│  └──────┬──────┘                                                           │
│         │                                                                  │
│         ▼                                                                  │
│  ┌─────────────┐                                                           │
│  │   STEP 2    │  Sign message to generate identity                        │
│  │  Identity   │  ────────────────►  Identity created locally              │
│  │  Creation   │                     (trapdoor, nullifier, commitment)     │
│  └──────┬──────┘                                                           │
│         │                                                                  │
│         ▼                                                                  │
│  ┌─────────────┐                                                           │
│  │   STEP 3    │  Admin adds commitment to voter registry                  │
│  │Registration │  ────────────────►  Merkle tree updated on-chain          │
│  │ (Off-chain) │                     (one-time per poll)                   │
│  └──────┬──────┘                                                           │
│         │                                                                  │
│         ▼                                                                  │
│  ┌─────────────┐                                                           │
│  │   STEP 4    │  User selects candidate                                   │
│  │   Select    │  ────────────────►  UI stores choice locally              │
│  │  Candidate  │                                                           │
│  └──────┬──────┘                                                           │
│         │                                                                  │
│         ▼                                                                  │
│  ┌─────────────┐                                                           │
│  │   STEP 5    │  Generate ZK proof in browser (~2-5 seconds)              │
│  │   Proof     │  ────────────────►  Proof proves:                         │
│  │ Generation  │                     • Voter is in registry                │
│  │  (Browser)  │                     • Voter hasn't voted                  │
│  └──────┬──────┘                     • Vote is for candidate X             │
│         │                                                                  │
│         ▼                                                                  │
│  ┌─────────────┐                                                           │
│  │   STEP 6    │  Send vote transaction                                    │
│  │   Submit    │  ────────────────►  Contract verifies proof               │
│  │    Vote     │                     Records nullifier + vote count        │
│  └──────┬──────┘                     Emits VoteCast event                  │
│         │                                                                  │
│         ▼                                                                  │
│  ┌─────────────┐                                                           │
│  │   DONE!     │  Vote recorded anonymously                                │
│  │  ✓ ✓ ✓      │  No link between address and vote choice                 │
│  └─────────────┘                                                           │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Data Flow Diagrams

### 8.1 Registration Phase

```
┌──────────────┐          ┌──────────────┐          ┌──────────────┐
│    Voter     │          │    Admin     │          │  Blockchain  │
│   Browser    │          │   Backend    │          │   Contract   │
└──────┬───────┘          └──────┬───────┘          └──────┬───────┘
       │                         │                         │
       │  1. Generate Identity   │                         │
       │  ───────────────────►   │                         │
       │  (returns commitment)   │                         │
       │                         │                         │
       │  2. Submit commitment   │                         │
       │  ───────────────────►   │                         │
       │                         │                         │
       │                         │  3. registerVoter(      │
       │                         │     pollId, commitment) │
       │                         │  ───────────────────►   │
       │                         │                         │
       │                         │  4. Merkle tree updated │
       │                         │  ◄───────────────────   │
       │                         │                         │
       │  5. Confirmation        │                         │
       │  ◄───────────────────   │                         │
       │                         │                         │
```

### 8.2 Voting Phase

```
┌──────────────┐          ┌──────────────┐          ┌──────────────┐
│    Voter     │          │   Relayer    │          │  Blockchain  │
│   Browser    │          │  (Optional)  │          │   Contract   │
└──────┬───────┘          └──────┬───────┘          └──────┬───────┘
       │                         │                         │
       │  1. Fetch group members │                         │
       │  ─────────────────────────────────────────────►   │
       │                         │                         │
       │  2. Reconstruct Merkle  │                         │
       │     tree locally        │                         │
       │                         │                         │
       │  3. Generate ZK proof   │                         │
       │     (in browser)        │                         │
       │                         │                         │
       │  4. Submit vote tx      │                         │
       │  ─────────────────────────────────────────────►   │
       │       OR                │                         │
       │  4a. Send to relayer    │                         │
       │  ───────────────────►   │  4b. Submit on behalf   │
       │                         │  ───────────────────►   │
       │                         │                         │
       │                         │  5. Verify proof        │
       │                         │  6. Check nullifier     │
       │                         │  7. Record vote         │
       │                         │  8. Emit VoteCast       │
       │                         │                         │
       │  9. Confirmation        │                         │
       │  ◄────────────────────────────────────────────   │
       │                         │                         │
```

---

## 9. Security Analysis

### 9.1 Threat Model

| Threat | Mitigation |
|--------|------------|
| **Double voting** | Nullifier hash stored on-chain; same voter → same nullifier → rejected |
| **Ineligible voter** | Merkle membership proof required; commitment must be in tree |
| **Vote manipulation** | ZK circuit enforces signal = vote choice; cannot lie about vote |
| **Identity theft** | Private keys (trapdoor, nullifier) never leave user's device |
| **Front-running** | Nullifier is deterministic; attacker cannot "steal" a vote |
| **Coercion** | Cannot prove vote choice (proof is zero-knowledge) |

### 9.2 Trust Assumptions

| Component | Trust Assumption |
|-----------|------------------|
| Ethereum Network | Consensus is honest (>51% honest validators) |
| Semaphore Circuit | Trusted setup ceremony was performed correctly |
| Poseidon Hash | Cryptographically secure (no known attacks) |
| Groth16 Prover | Implementation is correct (snarkjs audited) |
| Browser Environment | User's device is not compromised |

### 9.3 Privacy Guarantees

✅ **What is hidden:**
- Which specific voter cast which vote
- Whether a specific address voted (only commitment is registered)
- Any link between voter identity and vote choice

❌ **What is NOT hidden:**
- Total number of votes per candidate
- That someone submitted a vote transaction (tx is public)
- The set of eligible voters (commitments are public)

### 9.4 Gas Cost Analysis

| Operation | Estimated Gas | USD @ 20 gwei, $3k ETH |
|-----------|---------------|------------------------|
| Create Poll | ~200,000 | ~$12 |
| Register Voter | ~100,000 | ~$6 |
| Cast Vote (with proof) | ~350,000 | ~$21 |
| **Previous unsafe vote** | ~50,000 | ~$3 |

**Note:** Gas costs for ZK verification are higher but provide privacy guarantees.

---

## 10. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)

- [ ] Install Semaphore dependencies
  ```bash
  npm install @semaphore-protocol/contracts @semaphore-protocol/identity @semaphore-protocol/proof @semaphore-protocol/group
  ```
- [ ] Deploy Semaphore contracts to Sepolia testnet
- [ ] Write and test `AnonymousVoting.sol`
- [ ] Create deployment scripts

### Phase 2: Frontend (Weeks 3-4)

- [ ] Create `useAnonymousVoting.js` hook
- [ ] Implement identity generation UI
- [ ] Build voter registration flow
- [ ] Integrate proof generation (WASM)

### Phase 3: Testing (Weeks 5-6)

- [ ] Unit tests for all contract functions
- [ ] Integration tests (frontend ↔ contract)
- [ ] End-to-end test on Sepolia
- [ ] Gas optimization analysis

### Phase 4: Documentation (Week 7)

- [ ] API documentation
- [ ] User guide
- [ ] Security considerations
- [ ] Thesis chapter draft

---

## 11. References

1. **Semaphore Protocol**  
   https://semaphore.appliedzkp.org/

2. **Groth16 zkSNARK**  
   Groth, J. (2016). "On the Size of Pairing-based Non-interactive Arguments"

3. **Poseidon Hash Function**  
   Grassi, L. et al. (2019). "Poseidon: A New Hash Function for Zero-Knowledge Proof Systems"

4. **snarkjs Library**  
   https://github.com/iden3/snarkjs

5. **Ethereum Yellow Paper**  
   https://ethereum.github.io/yellowpaper/paper.pdf

---

## Appendix A: File Structure After Integration

```
blockchain-voting/
├── packages/
│   └── hardhat/
│       ├── contracts/
│       │   ├── AnonymousVoting.sol      # NEW: Main voting contract
│       │   ├── PollFactory.sol          # DEPRECATED: Unsafe version
│       │   └── interfaces/
│       │       └── ISemaphore.sol       # NEW: Semaphore interface
│       ├── scripts/
│       │   ├── deploy.ts                # Updated deployment
│       │   └── registerVoters.ts        # NEW: Voter registration
│       └── test/
│           └── AnonymousVoting.test.ts  # NEW: Test suite
│
├── react-app/
│   └── src/
│       ├── hooks/
│       │   ├── useUnsafeVoting.js       # DEPRECATED
│       │   └── useAnonymousVoting.js    # NEW: ZK voting hook
│       ├── components/
│       │   ├── IdentityManager.jsx      # NEW: Identity UI
│       │   └── VotingInterface.jsx      # Updated for ZK
│       └── utils/
│           └── semaphore.js             # NEW: Proof helpers
│
└── docs/
    └── ARCHITECTURE_ZKP.md              # This document
```

---

## Appendix B: Environment Variables

```env
# .env file for React app
REACT_APP_SEMAPHORE_ADDRESS=0x...      # Deployed Semaphore contract
REACT_APP_VOTING_ADDRESS=0x...         # Deployed AnonymousVoting contract
REACT_APP_CHAIN_ID=11155111            # Sepolia testnet

# .env file for Hardhat
SEPOLIA_RPC_URL=https://...
PRIVATE_KEY=0x...
ETHERSCAN_API_KEY=...
```

---

*This document is part of the Master's Thesis project on Blockchain-Based Anonymous Voting Systems.*
