# Semester 3 Implementation Roadmap

## Anonymous Voting with Zero-Knowledge Proofs

**Project:** Master's Thesis - Blockchain Voting System  
**Timeline:** 7 Weeks  
**Created:** January 2026

---

## Overview

This document contains the detailed task breakdown for implementing ZKP-based anonymous voting. Each task is structured like a Jira ticket with clear scope, acceptance criteria, and dependencies.

### Epic Summary

| Epic | Tasks | Estimated Effort |
|------|-------|------------------|
| **EPIC-1:** Smart Contract Infrastructure | 6 tasks | ~2 weeks |
| **EPIC-2:** Frontend ZK Integration | 7 tasks | ~2 weeks |
| **EPIC-3:** Testing & Quality Assurance | 5 tasks | ~1.5 weeks |
| **EPIC-4:** Documentation & Deployment | 4 tasks | ~1 week |
| **EPIC-5:** Stretch Goals (Optional) | 3 tasks | ~0.5 weeks |

---

## EPIC-1: Smart Contract Infrastructure

### TASK-101: Install Semaphore Dependencies (Hardhat)

**Priority:** 🔴 Critical  
**Effort:** 2 hours  
**Dependencies:** None

**Description:**  
Install the Semaphore protocol packages in the Hardhat project to enable ZK proof verification on-chain.

**Acceptance Criteria:**
- [ ] `@semaphore-protocol/contracts` installed in `packages/hardhat`
- [ ] `@semaphore-protocol/group` installed for testing utilities
- [ ] `package.json` updated with correct versions
- [ ] No dependency conflicts with existing packages
- [ ] `npm install` runs without errors

**Commands:**
```bash
cd packages/hardhat
npm install @semaphore-protocol/contracts @semaphore-protocol/group
```

**Commit Message:**  
`chore(hardhat): install semaphore protocol dependencies`

---

### TASK-102: Create AnonymousVoting.sol Contract

**Priority:** 🔴 Critical  
**Effort:** 8 hours  
**Dependencies:** TASK-101

**Description:**  
Implement the main voting contract that integrates with Semaphore for anonymous vote casting. This replaces the functionality of `PollFactory.sol` with privacy-preserving features.

**Acceptance Criteria:**
- [ ] Contract imports `ISemaphore` interface
- [ ] `Poll` struct includes: groupId, question, options, votes, isActive, timestamps
- [ ] `createPoll()` function creates Semaphore group per poll
- [ ] `registerVoter()` function adds identity commitment to group
- [ ] `vote()` function accepts and validates ZK proof
- [ ] `getResults()` view function returns vote counts
- [ ] Events emitted: `PollCreated`, `VoterRegistered`, `VoteCast`
- [ ] Admin-only modifiers for sensitive functions
- [ ] No `msg.sender` tracking for votes
- [ ] Compiles without errors

**File:** `packages/hardhat/contracts/AnonymousVoting.sol`

**Commit Message:**  
`feat(contracts): implement AnonymousVoting with Semaphore integration`

---

### TASK-103: Create ISemaphore Interface Copy

**Priority:** 🟡 High  
**Effort:** 1 hour  
**Dependencies:** TASK-101

**Description:**  
Create a local interface file for Semaphore to ensure compatibility and provide clear documentation of the expected interface.

**Acceptance Criteria:**
- [ ] Interface file created at `contracts/interfaces/ISemaphore.sol`
- [ ] Contains `SemaphoreProof` struct definition
- [ ] Contains `createGroup()`, `addMember()`, `validateProof()` function signatures
- [ ] Properly documented with NatSpec comments
- [ ] Matches Semaphore v4 interface

**Commit Message:**  
`feat(contracts): add ISemaphore interface for type safety`

---

### TASK-104: Write Deployment Script for AnonymousVoting

**Priority:** 🟡 High  
**Effort:** 4 hours  
**Dependencies:** TASK-102

**Description:**  
Create a Hardhat deployment script that deploys the AnonymousVoting contract along with Semaphore dependencies to testnet.

**Acceptance Criteria:**
- [ ] Script deploys Semaphore contract (or uses existing deployment)
- [ ] Script deploys AnonymousVoting with correct Semaphore address
- [ ] Deployment addresses logged to console
- [ ] Addresses saved to a deployment file (JSON)
- [ ] Script works for both local and Sepolia networks
- [ ] Environment variables used for sensitive data

**File:** `packages/hardhat/scripts/deployAnonymousVoting.ts`

**Commit Message:**  
`feat(scripts): add deployment script for anonymous voting system`

---

### TASK-105: Write Voter Registration Script

**Priority:** 🟢 Medium  
**Effort:** 3 hours  
**Dependencies:** TASK-104

**Description:**  
Create a utility script to register voters (add identity commitments) to a poll's Semaphore group. This will be used by admins to whitelist eligible voters.

**Acceptance Criteria:**
- [ ] Script accepts poll ID and list of commitments as input
- [ ] Calls `registerVoter()` for each commitment
- [ ] Handles batch registration efficiently
- [ ] Logs transaction hashes for verification
- [ ] Error handling for failed registrations
- [ ] Can read commitments from a JSON file

**File:** `packages/hardhat/scripts/registerVoters.ts`

**Commit Message:**  
`feat(scripts): add voter registration utility script`

---

### TASK-106: Update Hardhat Config for Semaphore

**Priority:** 🟢 Medium  
**Effort:** 1 hour  
**Dependencies:** TASK-101

**Description:**  
Update `hardhat.config.ts` to include any necessary compiler settings and network configurations for Semaphore compatibility.

**Acceptance Criteria:**
- [ ] Solidity compiler version compatible with Semaphore (0.8.20+)
- [ ] Optimizer enabled with appropriate runs
- [ ] Sepolia network properly configured
- [ ] Etherscan verification settings added
- [ ] Gas reporter configured (optional)

**Commit Message:**  
`chore(hardhat): update config for semaphore compatibility`

---

## EPIC-2: Frontend ZK Integration

### TASK-201: Install Semaphore Dependencies (React)

**Priority:** 🔴 Critical  
**Effort:** 2 hours  
**Dependencies:** None

**Description:**  
Install the Semaphore client-side packages in the React app for identity generation and proof creation.

**Acceptance Criteria:**
- [ ] `@semaphore-protocol/identity` installed
- [ ] `@semaphore-protocol/proof` installed
- [ ] `@semaphore-protocol/group` installed
- [ ] WASM dependencies load correctly in browser
- [ ] No build errors with Create React App
- [ ] Bundle size impact documented

**Commands:**
```bash
cd react-app
npm install @semaphore-protocol/identity @semaphore-protocol/proof @semaphore-protocol/group
```

**Commit Message:**  
`chore(frontend): install semaphore protocol client libraries`

---

### TASK-202: Create Identity Management Hook

**Priority:** 🔴 Critical  
**Effort:** 6 hours  
**Dependencies:** TASK-201

**Description:**  
Create a React hook `useIdentity.js` that handles Semaphore identity generation, storage, and recovery.

**Acceptance Criteria:**
- [ ] `createIdentity()` - generates identity from wallet signature
- [ ] `getIdentity()` - retrieves stored identity
- [ ] `clearIdentity()` - removes stored identity
- [ ] `hasIdentity` - boolean state for UI
- [ ] Identity persisted to localStorage (encrypted preferred)
- [ ] Commitment exportable for registration
- [ ] Works with MetaMask signing
- [ ] Error handling for rejected signatures

**File:** `react-app/src/hooks/useIdentity.js`

**Commit Message:**  
`feat(frontend): implement identity management hook`

---

### TASK-203: Create Anonymous Voting Hook

**Priority:** 🔴 Critical  
**Effort:** 8 hours  
**Dependencies:** TASK-202

**Description:**  
Create `useAnonymousVoting.js` hook that replaces `useUnsafeVoting.js` with ZK proof generation and submission.

**Acceptance Criteria:**
- [ ] `castVote(pollId, optionIndex)` - main voting function
- [ ] Fetches group members from contract events
- [ ] Reconstructs Merkle tree locally
- [ ] Generates ZK proof using Semaphore
- [ ] Submits vote transaction with proof
- [ ] Loading states for proof generation vs transaction
- [ ] Error handling for invalid proofs
- [ ] Success/failure feedback
- [ ] `isRegistered(pollId)` - checks if user is in group

**File:** `react-app/src/hooks/useAnonymousVoting.js`

**Commit Message:**  
`feat(frontend): implement anonymous voting hook with ZK proofs`

---

### TASK-204: Create Semaphore Utility Functions

**Priority:** 🟡 High  
**Effort:** 4 hours  
**Dependencies:** TASK-201

**Description:**  
Create utility module for common Semaphore operations like fetching group members and formatting proofs.

**Acceptance Criteria:**
- [ ] `fetchGroupMembers(pollId)` - gets commitments from events
- [ ] `buildGroup(members)` - constructs Merkle tree
- [ ] `formatProofForContract(proof)` - prepares proof for Solidity
- [ ] Caching for group members to reduce RPC calls
- [ ] TypeScript types (if using TS) or JSDoc comments

**File:** `react-app/src/utils/semaphore.js`

**Commit Message:**  
`feat(frontend): add semaphore utility functions`

---

### TASK-205: Create Identity Manager Component

**Priority:** 🟡 High  
**Effort:** 5 hours  
**Dependencies:** TASK-202

**Description:**  
Build a UI component for users to create, view, and manage their anonymous identity.

**Acceptance Criteria:**
- [ ] "Create Identity" button triggers signature request
- [ ] Shows identity status (created/not created)
- [ ] Displays commitment (for registration)
- [ ] "Copy Commitment" button
- [ ] "Clear Identity" with confirmation
- [ ] Visual feedback during identity creation
- [ ] Responsive design matching existing styles

**File:** `react-app/src/components/IdentityManager.jsx`

**Commit Message:**  
`feat(frontend): add identity manager UI component`

---

### TASK-206: Update VotingInterface for ZK Voting

**Priority:** 🟡 High  
**Effort:** 4 hours  
**Dependencies:** TASK-203, TASK-205

**Description:**  
Modify the existing `VotingInterface.jsx` to use the new anonymous voting hook and show appropriate UI states.

**Acceptance Criteria:**
- [ ] Uses `useAnonymousVoting` instead of `useUnsafeVoting`
- [ ] Shows "Generating Proof..." during proof creation
- [ ] Shows "Submitting Vote..." during transaction
- [ ] Displays proof generation time (UX feedback)
- [ ] Disables voting if not registered for poll
- [ ] Shows registration status
- [ ] Existing styling preserved

**File:** `react-app/src/components/VotingInterface.jsx`

**Commit Message:**  
`refactor(frontend): update VotingInterface for anonymous voting`

---

### TASK-207: Update Contract ABI and Address Config

**Priority:** 🟢 Medium  
**Effort:** 2 hours  
**Dependencies:** TASK-102, TASK-104

**Description:**  
Update the frontend to use the new AnonymousVoting contract ABI and deployed address.

**Acceptance Criteria:**
- [ ] Copy ABI from Hardhat artifacts to `src/abis/`
- [ ] Update `Web3Context.jsx` with new contract address
- [ ] Environment variable for contract address
- [ ] Remove or deprecate old PollFactory references
- [ ] Verify contract interaction works

**Commit Message:**  
`chore(frontend): update contract ABI and address configuration`

---

## EPIC-3: Testing & Quality Assurance

### TASK-301: Write Unit Tests for AnonymousVoting.sol

**Priority:** 🔴 Critical  
**Effort:** 8 hours  
**Dependencies:** TASK-102

**Description:**  
Comprehensive test suite for the AnonymousVoting smart contract using Hardhat and Chai.

**Acceptance Criteria:**
- [ ] Test poll creation (success and failure cases)
- [ ] Test voter registration (admin only, valid commitment)
- [ ] Test voting with valid proof (mock or real)
- [ ] Test double-voting prevention (same nullifier rejected)
- [ ] Test voting for non-existent poll
- [ ] Test voting after poll ends
- [ ] Test invalid proof rejection
- [ ] Test getResults() accuracy
- [ ] 90%+ code coverage
- [ ] Gas usage documented in test output

**File:** `packages/hardhat/test/AnonymousVoting.test.ts`

**Commit Message:**  
`test(contracts): add comprehensive tests for AnonymousVoting`

---

### TASK-302: Create Mock Semaphore for Testing

**Priority:** 🟡 High  
**Effort:** 3 hours  
**Dependencies:** TASK-102

**Description:**  
Create a mock Semaphore contract for unit testing that allows bypassing real ZK verification in tests.

**Acceptance Criteria:**
- [ ] Mock contract mimics ISemaphore interface
- [ ] `validateProof()` configurable to pass/fail
- [ ] Group membership can be set directly
- [ ] Nullifier tracking works correctly
- [ ] Can simulate various failure modes

**File:** `packages/hardhat/contracts/mocks/MockSemaphore.sol`

**Commit Message:**  
`test(contracts): add mock Semaphore for unit testing`

---

### TASK-303: Frontend Hook Unit Tests

**Priority:** 🟡 High  
**Effort:** 6 hours  
**Dependencies:** TASK-202, TASK-203

**Description:**  
Write unit tests for the frontend hooks using Jest and React Testing Library.

**Acceptance Criteria:**
- [ ] Test `useIdentity` hook lifecycle
- [ ] Test identity creation from signature
- [ ] Test identity persistence and recovery
- [ ] Test `useAnonymousVoting` hook states
- [ ] Mock Semaphore proof generation
- [ ] Test error handling scenarios
- [ ] 80%+ coverage for hooks

**File:** `react-app/src/hooks/__tests__/`

**Commit Message:**  
`test(frontend): add unit tests for identity and voting hooks`

---

### TASK-304: Integration Test on Sepolia

**Priority:** 🟡 High  
**Effort:** 6 hours  
**Dependencies:** TASK-104, TASK-206

**Description:**  
Perform end-to-end integration testing on Sepolia testnet with real ZK proofs.

**Acceptance Criteria:**
- [ ] Deploy contracts to Sepolia
- [ ] Create a test poll
- [ ] Register 3+ test voters
- [ ] Each voter casts a vote successfully
- [ ] Verify double-voting is prevented
- [ ] Verify vote counts are correct
- [ ] Document gas costs for each operation
- [ ] Record proof generation times
- [ ] Create demo video/screenshots

**Deliverable:** Test report document

**Commit Message:**  
`test: complete integration testing on Sepolia testnet`

---

### TASK-305: Security Review Checklist

**Priority:** 🟢 Medium  
**Effort:** 4 hours  
**Dependencies:** TASK-301

**Description:**  
Perform a self-audit of the smart contracts using a security checklist.

**Acceptance Criteria:**
- [ ] Check for reentrancy vulnerabilities
- [ ] Verify access control on all functions
- [ ] Check for integer overflow (Solidity 0.8+ safe)
- [ ] Verify event emissions are correct
- [ ] Check for front-running vulnerabilities
- [ ] Verify nullifier cannot be predicted
- [ ] Document any known limitations
- [ ] Create security considerations section for thesis

**Deliverable:** Security audit document

**Commit Message:**  
`docs: add security review and audit checklist`

---

## EPIC-4: Documentation & Deployment

### TASK-401: Update Main README

**Priority:** 🟢 Medium  
**Effort:** 3 hours  
**Dependencies:** TASK-304

**Description:**  
Update the project README to reflect the new ZK voting functionality.

**Acceptance Criteria:**
- [ ] Updated project description
- [ ] New architecture overview
- [ ] Updated installation instructions
- [ ] New usage guide for anonymous voting
- [ ] Updated environment variable documentation
- [ ] Link to architecture documentation
- [ ] Demo screenshots/GIFs

**File:** `README.md`

**Commit Message:**  
`docs: update README for ZK voting implementation`

---

### TASK-402: Create User Guide

**Priority:** 🟢 Medium  
**Effort:** 4 hours  
**Dependencies:** TASK-206

**Description:**  
Write a user-facing guide explaining how to use the anonymous voting system.

**Acceptance Criteria:**
- [ ] Step-by-step: Creating an identity
- [ ] Step-by-step: Getting registered for a poll
- [ ] Step-by-step: Casting an anonymous vote
- [ ] FAQ section
- [ ] Troubleshooting common issues
- [ ] Screenshots for each step
- [ ] Explanation of what "anonymous" means

**File:** `docs/USER_GUIDE.md`

**Commit Message:**  
`docs: add user guide for anonymous voting`

---

### TASK-403: Production Deployment Checklist

**Priority:** 🟢 Medium  
**Effort:** 4 hours  
**Dependencies:** TASK-304

**Description:**  
Create a checklist and guide for deploying to Ethereum mainnet.

**Acceptance Criteria:**
- [ ] Pre-deployment checklist (audits, testing)
- [ ] Mainnet deployment script
- [ ] Gas cost estimates at various gas prices
- [ ] Contract verification on Etherscan
- [ ] Frontend environment configuration
- [ ] Monitoring and alerting setup
- [ ] Upgrade path documentation

**File:** `docs/DEPLOYMENT_GUIDE.md`

**Commit Message:**  
`docs: add production deployment guide`

---

### TASK-404: Write Thesis Chapter Draft

**Priority:** 🟢 Medium  
**Effort:** 8 hours  
**Dependencies:** All above

**Description:**  
Draft the technical implementation chapter for the Master's thesis.

**Acceptance Criteria:**
- [ ] Introduction to chosen approach
- [ ] Detailed architecture explanation
- [ ] Code snippets with explanations
- [ ] Comparison with previous implementation
- [ ] Performance analysis (gas, time)
- [ ] Security analysis
- [ ] Limitations and future work
- [ ] Follows academic writing standards

**Deliverable:** Thesis chapter draft (separate document)

**Commit Message:**  
`docs: draft thesis implementation chapter`

---

## EPIC-5: Stretch Goals (Optional)

### TASK-501: Implement Relayer for Gas-Free Voting

**Priority:** ⚪ Low  
**Effort:** 8 hours  
**Dependencies:** TASK-203

**Description:**  
Create a backend relayer service that submits votes on behalf of users, so voters don't need ETH to vote.

**Acceptance Criteria:**
- [ ] Express.js server receives vote requests
- [ ] Validates proof before submitting
- [ ] Pays gas for vote transaction
- [ ] Rate limiting to prevent abuse
- [ ] Frontend option to use relayer
- [ ] Relayer wallet funding documentation

**Benefits:**
- Better UX (voters don't need ETH)
- Additional privacy (voter address not on-chain)

**Commit Message:**  
`feat(server): implement gas-free voting relayer`

---

### TASK-502: Add Vote Encryption (End-to-End)

**Priority:** ⚪ Low  
**Effort:** 10 hours  
**Dependencies:** TASK-203

**Description:**  
Encrypt vote signals so they're only revealed after voting ends (tally-time decryption).

**Acceptance Criteria:**
- [ ] Votes encrypted with election public key
- [ ] Decryption key revealed after poll ends
- [ ] Tallying performed with decrypted votes
- [ ] Prevents early result influence

**Note:** This is a significant addition, consider for future work.

**Commit Message:**  
`feat: implement encrypted vote signals`

---

### TASK-503: Multi-Chain Deployment Guide

**Priority:** ⚪ Low  
**Effort:** 4 hours  
**Dependencies:** TASK-403

**Description:**  
Document deployment to L2 chains (Arbitrum, Optimism, Base) for lower gas costs.

**Acceptance Criteria:**
- [ ] Research Semaphore deployment on L2s
- [ ] Gas cost comparison table
- [ ] Chain-specific configuration
- [ ] Bridge considerations

**Commit Message:**  
`docs: add multi-chain deployment guide`

---

## Task Status Legend

| Status | Meaning |
|--------|---------|
| 📋 TODO | Not started |
| 🔄 IN PROGRESS | Currently working |
| 👀 IN REVIEW | Awaiting review |
| ✅ DONE | Completed |
| ⏸️ BLOCKED | Waiting on dependency |

---

## Sprint Planning Suggestion

### Sprint 1 (Week 1-2): Foundation
| Task | Priority | Status |
|------|----------|--------|
| TASK-101 | 🔴 Critical | 📋 TODO |
| TASK-102 | 🔴 Critical | 📋 TODO |
| TASK-103 | 🟡 High | 📋 TODO |
| TASK-104 | 🟡 High | 📋 TODO |
| TASK-106 | 🟢 Medium | 📋 TODO |
| TASK-201 | 🔴 Critical | 📋 TODO |

### Sprint 2 (Week 3-4): Frontend Integration
| Task | Priority | Status |
|------|----------|--------|
| TASK-105 | 🟢 Medium | 📋 TODO |
| TASK-202 | 🔴 Critical | 📋 TODO |
| TASK-203 | 🔴 Critical | 📋 TODO |
| TASK-204 | 🟡 High | 📋 TODO |
| TASK-205 | 🟡 High | 📋 TODO |
| TASK-206 | 🟡 High | 📋 TODO |
| TASK-207 | 🟢 Medium | 📋 TODO |

### Sprint 3 (Week 5-6): Testing
| Task | Priority | Status |
|------|----------|--------|
| TASK-301 | 🔴 Critical | 📋 TODO |
| TASK-302 | 🟡 High | 📋 TODO |
| TASK-303 | 🟡 High | 📋 TODO |
| TASK-304 | 🟡 High | 📋 TODO |
| TASK-305 | 🟢 Medium | 📋 TODO |

### Sprint 4 (Week 7): Documentation
| Task | Priority | Status |
|------|----------|--------|
| TASK-401 | 🟢 Medium | 📋 TODO |
| TASK-402 | 🟢 Medium | 📋 TODO |
| TASK-403 | 🟢 Medium | 📋 TODO |
| TASK-404 | 🟢 Medium | 📋 TODO |

---

## Git Branch Strategy

```
main
  │
  └── feature/semester3-zkp
        │
        ├── feature/TASK-101-semaphore-deps
        ├── feature/TASK-102-anonymous-voting-contract
        ├── feature/TASK-201-frontend-deps
        ├── feature/TASK-202-identity-hook
        ├── feature/TASK-203-voting-hook
        └── ... (one branch per task)
```

**Merge Strategy:**
1. Create feature branch from `feature/semester3-zkp`
2. Complete task, commit with message format
3. Create PR to `feature/semester3-zkp`
4. After all tasks done, merge `feature/semester3-zkp` to `main`

---

## Definition of Done

A task is considered "Done" when:

- [ ] Code is written and compiles/builds without errors
- [ ] All acceptance criteria are met
- [ ] Unit tests pass (where applicable)
- [ ] Code is reviewed (self-review minimum)
- [ ] Changes are committed with proper message format
- [ ] No console errors or warnings
- [ ] Documentation updated if needed

---

*Last Updated: January 2026*
