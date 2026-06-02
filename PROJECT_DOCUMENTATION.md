# Anonymous Blockchain Voting System with Zero-Knowledge Proofs

## Master's Thesis Project Documentation

---

## 1. Executive Summary

This project implements a **decentralized anonymous voting system** that combines blockchain technology with zero-knowledge proofs (ZK-SNARKs) to enable secure, transparent, and private voting. Built on Ethereum, the system uses the **Semaphore Protocol v4** for cryptographic voter anonymity, allowing registered voters to prove their eligibility and cast votes without revealing their identity.

### Key Achievements
- ✅ Fully functional multi-poll voting dApp
- ✅ Zero-knowledge proof integration using Semaphore Protocol
- ✅ Per-account cryptographic identity management
- ✅ On-chain double-vote prevention via nullifiers
- ✅ Poll creation with time-based expiration
- ✅ Real-time vote counting and results display
- ✅ Modern React frontend with dark theme UI
- ✅ MetaMask wallet integration with auto-reconnect

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Identity   │  │   Voting    │  │     Poll Management     │ │
│  │  Management  │  │  Interface  │  │   (Create/View/Admin)   │ │
│  └──────┬──────┘  └──────┬──────┘  └───────────┬─────────────┘ │
│         │                │                      │               │
│  ┌──────┴────────────────┴──────────────────────┴─────────────┐│
│  │                    Web3Context (ethers.js v6)               ││
│  └─────────────────────────────┬───────────────────────────────┘│
└────────────────────────────────┼────────────────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   MetaMask / Ethereum   │
                    └────────────┬────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────────┐
│                    BLOCKCHAIN (Ethereum)                         │
│  ┌─────────────────────┐    ┌─────────────────────────────────┐ │
│  │  AnonymousVoting    │    │      Semaphore Verifier         │ │
│  │  Smart Contract     │◄───│   (ZK-SNARK Verification)       │ │
│  │                     │    │                                  │ │
│  │  - Poll Creation    │    │  - Proof Validation             │ │
│  │  - Voter Registry   │    │  - Merkle Tree Verification     │ │
│  │  - Vote Casting     │    │  - Nullifier Checking           │ │
│  │  - Results Storage  │    │                                  │ │
│  └─────────────────────┘    └─────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Component Overview

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 18, ethers.js v6 | User interface and wallet interaction |
| Identity | Semaphore Protocol v4 | Cryptographic identity generation |
| Proofs | @semaphore-protocol/proof | ZK proof generation (client-side) |
| Smart Contracts | Solidity 0.8.20, Hardhat | On-chain voting logic and verification |
| Verification | Semaphore Verifier | ZK-SNARK proof validation |
| Network | Ethereum (Localhost/Testnet) | Decentralized execution |

---

## 3. Technology Stack

### 3.1 Frontend Technologies
- **React 18** - UI framework with functional components and hooks
- **React Router v7** - Client-side routing and navigation
- **ethers.js v6** - Ethereum blockchain interaction
- **@semaphore-protocol/identity** - Cryptographic identity creation
- **@semaphore-protocol/proof** - Zero-knowledge proof generation
- **@semaphore-protocol/group** - Merkle tree group management
- **CSS3** - Custom dark theme styling

### 3.2 Backend/Blockchain Technologies
- **Solidity 0.8.20** - Smart contract language
- **Hardhat** - Development environment and testing framework
- **OpenZeppelin** - Secure contract patterns
- **Semaphore Contracts** - On-chain ZK verification

### 3.3 Development Tools
- **Node.js** - Runtime environment
- **npm/yarn** - Package management
- **MetaMask** - Wallet provider
- **VS Code** - Development IDE

---

## 4. Core Features

### 4.1 Identity Management

The system uses **Semaphore Protocol v4** for deterministic identity generation:

```javascript
// Identity is created by signing a message with MetaMask
const message = `Sign this message to create your anonymous voting identity.
Wallet: ${account}
Purpose: Semaphore Identity Generation`;

const signature = await signer.signMessage(message);
const identity = new Identity(signature);
```

**Key Properties:**
- **Deterministic**: Same wallet always generates the same identity
- **Per-Account Storage**: Each wallet address has its own identity
- **Exportable**: Users can backup their identity string
- **Recoverable**: Identity can be restored from backup

**Identity Components:**
- `privateKey`: Never leaves the browser
- `commitment`: Public identifier registered with polls
- `nullifier`: Used to prevent double-voting

### 4.2 Poll Creation

Poll creators can:
- Set poll question/title
- Define multiple voting options
- Set expiration date/time using datetime picker
- Register voters by their commitment (not wallet address)

```javascript
// Smart contract poll creation
function createPoll(
    string memory _question,
    string[] memory _options,
    uint256 _endTime  // Unix timestamp
) external {
    uint256 pollId = pollCount;
    polls[pollId] = Poll({
        question: _question,
        options: _options,
        endTime: _endTime,
        isActive: true,
        totalVotes: 0
    });
    pollCreators[pollId] = msg.sender;
    pollCount++;
    emit PollCreated(pollId, msg.sender);
}
```

### 4.3 Voter Registration

The registration process separates voter identity from wallet address:

1. User generates commitment from their Semaphore identity
2. User shares commitment with poll creator (off-chain)
3. Poll creator registers commitment on-chain
4. No link exists between wallet and commitment on-chain

```javascript
// Smart contract registration
function registerVoter(uint256 _pollId, uint256 _commitment) external {
    require(msg.sender == pollCreators[_pollId], "Only creator");
    // Commitment is added to Merkle tree - no wallet address stored
    _addMember(_pollId, _commitment);
    emit VoterRegistered(_pollId, _commitment);
}
```

### 4.4 Anonymous Voting

The voting process uses ZK-SNARKs to prove eligibility without revealing identity:

**Step 1: Build Voter Group**
```javascript
// Fetch all registered voters (commitments) from events
const filter = contract.filters.VoterRegistered(pollId);
const events = await contract.queryFilter(filter);
const members = events.map(e => BigInt(e.args.identityCommitment));

// Build Merkle tree
const group = new Group();
members.forEach(m => group.addMember(m));
```

**Step 2: Generate ZK Proof**
```javascript
const proof = await generateProof(identity, group, {
    message: candidateId,  // The vote choice
    scope: pollId          // Unique scope for this poll
});
```

**Step 3: Submit Vote**
```javascript
// Contract verifies proof and records vote
function castVote(
    uint256 _pollId,
    ISemaphore.SemaphoreProof calldata _proof
) external {
    // Verify ZK proof
    require(semaphore.verifyProof(_pollId, _proof), "Invalid proof");
    
    // Check nullifier hasn't been used
    require(!nullifierUsed[_proof.nullifier], "Already voted");
    
    // Record vote
    nullifierUsed[_proof.nullifier] = true;
    votes[_pollId][_proof.message]++;
    totalVotes[_pollId]++;
    
    emit VoteCast(_pollId, _proof.message);
}
```

### 4.5 Double-Vote Prevention

The system uses **cryptographic nullifiers** to prevent double-voting:

- Each identity generates a unique nullifier per poll (using poll ID as scope)
- Nullifier is deterministic: same identity + same poll = same nullifier
- Contract stores used nullifiers and rejects duplicates
- Identity remains anonymous - nullifier cannot be traced back

```javascript
// Nullifier generation (simplified)
nullifier = hash(identity.nullifier, scope)

// On-chain check
mapping(uint256 => bool) public nullifierUsed;

if (nullifierUsed[proof.nullifier]) revert AlreadyVoted();
nullifierUsed[proof.nullifier] = true;
```

---

## 5. Privacy Analysis

### 5.1 What ZK Proofs Protect

| Property | Protection Level | Explanation |
|----------|-----------------|-------------|
| Vote Eligibility | ✅ Hidden | Proves membership without revealing which commitment |
| Vote-Identity Link | ✅ Hidden | Cannot determine which registered voter cast which vote |
| Double-Vote Prevention | ✅ Protected | Nullifiers prevent re-voting without revealing identity |
| Vote Ordering | ✅ Hidden | Cannot correlate vote order with registration order |

### 5.2 Current Limitations

> ⚠️ **Important Privacy Caveat**

The current implementation has a significant limitation:

**Transaction Sender is Visible**

When a user submits a vote, their wallet address is visible as the transaction sender:
- The wallet address pays gas fees
- The transaction is signed by the wallet
- Block explorers show who submitted the transaction

**What This Means:**
- An observer can see that `0xABC...` submitted a vote transaction
- The vote choice (candidate ID) is in the transaction calldata
- This creates a potential link between wallet and vote

**Why ZK Proofs Still Matter:**
- The proof verifies the voter is in the allowed group
- The commitment inside the group cannot be linked to the wallet
- If voters registered via a third party (not their own wallet), the link is broken

### 5.3 Path to True Anonymity

To achieve full transaction-level privacy, the system would need:

1. **Relayer Network**: A third-party submits transactions on behalf of voters
2. **Gas Abstraction**: Voters don't pay gas directly
3. **Commitment-Only Registration**: Voters never interact with the contract from their wallet

```
Current Flow:
Voter Wallet ──▶ Vote Transaction ──▶ Blockchain (wallet visible)

Anonymous Flow:
Voter ──▶ Signed Proof ──▶ Relayer ──▶ Transaction ──▶ Blockchain (relayer visible)
```

---

## 6. Smart Contract Architecture

### 6.1 Contract Overview

**AnonymousVoting.sol** - Main voting contract

```solidity
contract AnonymousVoting {
    // Semaphore integration
    ISemaphore public semaphore;
    
    // Poll storage
    struct Poll {
        string question;
        string[] options;
        uint256[] votes;
        uint256 endTime;
        bool isActive;
        uint256 totalVotes;
    }
    
    mapping(uint256 => Poll) public polls;
    mapping(uint256 => address) public pollCreators;
    mapping(uint256 => bool) public nullifierUsed;
    uint256 public pollCount;
    
    // Events
    event PollCreated(uint256 indexed pollId, address creator);
    event VoterRegistered(uint256 indexed pollId, uint256 commitment);
    event VoteCast(uint256 indexed pollId, uint256 candidateId);
}
```

### 6.2 Key Functions

| Function | Access | Purpose |
|----------|--------|---------|
| `createPoll()` | Anyone | Create new voting poll |
| `registerVoter()` | Poll Creator | Register single voter commitment |
| `registerVoters()` | Poll Creator | Batch register voters |
| `castVote()` | Registered Voters | Submit vote with ZK proof |
| `getPoll()` | Anyone | Read poll data and results |
| `endPoll()` | Poll Creator | Manually end poll |

### 6.3 Gas Considerations

| Operation | Approximate Gas |
|-----------|-----------------|
| Create Poll (5 options) | ~200,000 |
| Register Voter | ~100,000 |
| Cast Vote (with ZK verification) | ~350,000 |
| Batch Register (10 voters) | ~600,000 |

---

## 7. Frontend Components

### 7.1 Page Components

| Component | Route | Purpose |
|-----------|-------|---------|
| `HowItWorksPage` | `/how-it-works` | Educational landing page |
| `PollsPage` | `/` | List all polls, create new |
| `SinglePollPage` | `/poll/:id` | View poll, vote, see results |
| `ProfilePage` | `/profile` | Manage identity, view created polls |

### 7.2 Functional Components

| Component | Purpose |
|-----------|---------|
| `Header` | Navigation, wallet connection |
| `VotingInterface` | Option selection, proof generation, vote submission |
| `ResultsDisplay` | Vote counts with visual progress bars |
| `CreatePoll` | Poll creation form with datetime picker |
| `AdminPanel` | Voter registration for poll creators |
| `IdentityManager` | Identity creation, backup, restoration |
| `PollCard` | Poll preview card with status |
| `PollList` | Grid display of all polls |

### 7.3 Custom Hooks

**useIdentity.js**
```javascript
export function useIdentity() {
  return {
    identity,        // Semaphore Identity object
    commitment,      // Public commitment string
    hasIdentity,     // Boolean
    isLoading,
    createIdentity,  // Generate new identity
    clearIdentity,   // Delete identity
    exportIdentity   // Get backup string
  };
}
```

**useAnonymousVoting.js**
```javascript
export function useAnonymousVoting() {
  return {
    castVote,            // Submit vote with proof
    isRegistered,        // Check if registered for poll
    votingState,         // Current state (idle/generating/submitting)
    proofGenerationTime, // Time to generate proof
    transactionHash,     // Successful tx hash
    error,
    successMessage
  };
}
```

### 7.4 Utility Modules

**semaphore.js**
- `fetchGroupMembers()` - Get registered voters from events
- `buildGroup()` - Create Merkle tree from commitments
- `formatProofForContract()` - Format proof for smart contract
- `isCommitmentRegistered()` - Check if user is registered

**voteTracker.js**
- `hasVotedInPoll()` - Check if user voted (local UX only)
- `recordVote()` - Store vote timestamp locally
- `getVoteInfo()` - Get vote metadata

**nicknames.js**
- `getNickname()` - Get display name for address
- `setNickname()` - Save display name

---

## 8. User Flows

### 8.1 First-Time Voter Flow

```
1. Connect MetaMask Wallet
   └─▶ Click "Connect Wallet" in header

2. Create Identity
   └─▶ Go to Profile page
   └─▶ Click "Create Identity"
   └─▶ Sign message in MetaMask
   └─▶ Identity generated and stored

3. Get Registered
   └─▶ Copy commitment from Profile
   └─▶ Share with poll creator (off-chain)
   └─▶ Creator registers commitment

4. Cast Vote
   └─▶ Go to poll page
   └─▶ Select voting option
   └─▶ Click "Cast Vote"
   └─▶ Wait for proof generation (~2-5 seconds)
   └─▶ Confirm transaction in MetaMask
   └─▶ Vote recorded anonymously
```

### 8.2 Poll Creator Flow

```
1. Create Poll
   └─▶ Click "Create Poll"
   └─▶ Enter question and options
   └─▶ Set end date/time
   └─▶ Submit transaction

2. Register Voters
   └─▶ Open poll page (as creator)
   └─▶ Go to Admin Panel
   └─▶ Paste voter commitments (one per line)
   └─▶ Submit registration transaction

3. Monitor Results
   └─▶ View real-time vote counts
   └─▶ Results update every 10 seconds
```

---

## 9. Security Considerations

### 9.1 Threat Model

| Threat | Mitigation |
|--------|------------|
| Double voting | Cryptographic nullifiers |
| Vote tampering | Blockchain immutability |
| Fake votes | ZK proof of group membership |
| Identity theft | Private key never transmitted |
| Replay attacks | Poll-specific scope in proofs |
| Front-running | Not mitigated (inherent to public blockchains) |

### 9.2 Trust Assumptions

1. **Smart Contract Code**: Must be correct and audited
2. **Semaphore Protocol**: Cryptographic soundness assumed
3. **Trusted Setup**: Semaphore's powers-of-tau ceremony
4. **Poll Creator Honesty**: Creator controls voter registration
5. **Browser Security**: Identity stored in localStorage

### 9.3 Known Limitations

- No on-chain verification of voter eligibility criteria
- Poll creator has unilateral voter registration power
- Identity loss if browser data cleared
- Transaction sender publicly visible (see Section 5)

---

## 10. File Structure

```
blockchain-voting/
├── packages/
│   └── hardhat/
│       ├── contracts/
│       │   ├── AnonymousVoting.sol    # Main voting contract
│       │   ├── PollFactory.sol        # Legacy (non-ZK) contract
│       │   ├── MultiCandidateVoting.sol
│       │   └── MockVerifier.sol       # Testing
│       ├── scripts/
│       │   ├── deployVoting.ts
│       │   └── createPoll.ts
│       ├── test/
│       │   ├── Voting.test.ts
│       │   └── PollFactory.test.js
│       └── hardhat.config.ts
│
├── react-app/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx
│   │   │   ├── VotingInterface.jsx
│   │   │   ├── ResultsDisplay.jsx
│   │   │   ├── CreatePoll.jsx
│   │   │   ├── AdminPanel.jsx
│   │   │   ├── IdentityManager.jsx
│   │   │   ├── PollCard.jsx
│   │   │   └── PollList.jsx
│   │   │
│   │   ├── pages/
│   │   │   ├── HowItWorksPage.jsx
│   │   │   ├── PollsPage.jsx
│   │   │   ├── SinglePollPage.jsx
│   │   │   └── ProfilePage.jsx
│   │   │
│   │   ├── contexts/
│   │   │   └── Web3Context.jsx
│   │   │
│   │   ├── hooks/
│   │   │   ├── useIdentity.js
│   │   │   ├── useAnonymousVoting.js
│   │   │   └── useUnsafeVoting.js (legacy)
│   │   │
│   │   ├── utils/
│   │   │   ├── semaphore.js
│   │   │   ├── voteTracker.js
│   │   │   └── nicknames.js
│   │   │
│   │   ├── abis/
│   │   │   ├── AnonymousVoting.json
│   │   │   └── PollFactory.json
│   │   │
│   │   ├── App.js
│   │   └── index.js
│   │
│   └── public/
│       └── index.html
│
├── server/
│   ├── index.js              # Express server (optional relay)
│   └── package.json
│
├── package.json              # Monorepo root
└── README.md
```

---

## 11. Deployment

### 11.1 Local Development

```bash
# Terminal 1: Start local blockchain
cd packages/hardhat
npx hardhat node

# Terminal 2: Deploy contracts
npx hardhat run scripts/deployVoting.ts --network localhost

# Terminal 3: Start frontend
cd react-app
npm start
```

### 11.2 Environment Variables

```env
# react-app/.env
REACT_APP_ANONYMOUS_VOTING_ADDRESS=0x...
REACT_APP_CONTRACT_ADDRESS=0x...  # Legacy PollFactory
```

---

## 12. Testing

### 12.1 Smart Contract Tests

```bash
cd packages/hardhat
npx hardhat test
```

Tests cover:
- Poll creation
- Voter registration
- Vote casting with valid proofs
- Rejection of invalid proofs
- Double-vote prevention
- Access control

### 12.2 Frontend Testing

```bash
cd react-app
npm test
```

---

## 13. Future Improvements

### 13.1 Privacy Enhancements
- [ ] Relayer network for transaction anonymity
- [ ] Gas abstraction (meta-transactions)
- [ ] Encrypted commitment registry

### 13.2 Features
- [ ] Weighted voting
- [ ] Multi-choice voting
- [ ] Quadratic voting
- [ ] Delegate voting
- [ ] Vote receipts

### 13.3 UX Improvements
- [ ] Mobile-responsive design
- [ ] Push notifications for poll end
- [ ] QR code for commitment sharing
- [ ] Batch identity registration

### 13.4 Infrastructure
- [ ] IPFS for poll metadata
- [ ] Subgraph for efficient queries
- [ ] Multi-chain deployment

---

## 14. Glossary

| Term | Definition |
|------|------------|
| **Commitment** | Public identifier derived from identity, added to Merkle tree |
| **Identity** | Semaphore cryptographic identity containing private/public keys |
| **Merkle Tree** | Data structure for efficient membership verification |
| **Nullifier** | Unique per-identity-per-poll hash preventing double votes |
| **Scope** | Poll-specific value ensuring proofs are poll-bound |
| **ZK-SNARK** | Zero-Knowledge Succinct Non-Interactive Argument of Knowledge |
| **Semaphore** | Privacy protocol for anonymous signaling in groups |
| **Proof** | Cryptographic proof of group membership without revealing identity |

---

## 15. References

- [Semaphore Protocol Documentation](https://semaphore.pse.dev/)
- [Semaphore GitHub](https://github.com/semaphore-protocol/semaphore)
- [ethers.js v6 Documentation](https://docs.ethers.org/v6/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [ZK-SNARKs Explained](https://z.cash/technology/zksnarks/)

---

## 16. License

MIT License - See LICENSE file for details.

---

*Documentation generated for Master's Thesis on Anonymous Blockchain Voting*
*Last updated: January 2026*
