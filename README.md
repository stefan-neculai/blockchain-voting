# 🗳️ Anonymous Blockchain Voting System

> A decentralized voting system with **Zero-Knowledge Proof (ZKP)** privacy using the **Semaphore Protocol v4** on Ethereum.

[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-363636?logo=solidity)](https://docs.soliditylang.org/)
[![Hardhat](https://img.shields.io/badge/Hardhat-2.x-yellow?logo=ethereum)](https://hardhat.org/)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react)](https://reactjs.org/)
[![Semaphore](https://img.shields.io/badge/Semaphore-v4-purple)](https://semaphore.pse.dev/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## 📋 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Smart Contracts](#-smart-contracts)
- [Frontend](#-frontend)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Documentation](#-documentation)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### 🔐 Privacy-Preserving Voting
- **Zero-Knowledge Proofs**: Vote without revealing your identity
- **Semaphore Protocol v4**: Industry-standard ZK identity system
- **Nullifier-Based Double-Vote Prevention**: Cryptographically prevents voting twice

### 🗳️ Voting System
- **Multi-Candidate Polls**: Create polls with any number of options
- **Time-Bound Voting**: Configurable start and end times
- **Real-Time Results**: View results as they come in (after voting)
- **Transparent Counting**: All votes verifiable on-chain

### 🌐 Web3 Integration
- **MetaMask Support**: Connect with popular wallet
- **Sepolia Testnet**: Deploy and test for free
- **React Frontend**: Modern, responsive UI

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                            │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │
│  │  Identity   │  │   Voting    │  │    Poll     │  │  Results   │  │
│  │  Manager    │  │  Interface  │  │   Creator   │  │  Display   │  │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └─────┬──────┘  │
│         │                │                │                │         │
│  ┌──────┴────────────────┴────────────────┴────────────────┴──────┐  │
│  │                    useAnonymousVoting Hook                     │  │
│  │              (ZK Proof Generation + Vote Submission)           │  │
│  └────────────────────────────────┬───────────────────────────────┘  │
└───────────────────────────────────┼─────────────────────────────────┘
                                    │ ethers.js
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      ETHEREUM BLOCKCHAIN                            │
├─────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────┐      ┌────────────────────────────────┐ │
│  │   AnonymousVoting.sol  │◄────►│     Semaphore Verifier         │ │
│  │  • createPoll()        │      │   • verifyProof()              │ │
│  │  • registerVoter()     │      │   • Group Management           │ │
│  │  • vote(proof)         │      └────────────────────────────────┘ │
│  │  • getResults()        │                                         │
│  └────────────────────────┘                                         │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Smart Contracts** | Solidity 0.8.20, OpenZeppelin |
| **ZK Proofs** | Semaphore Protocol v4, Groth16 |
| **Development** | Hardhat, TypeScript |
| **Frontend** | React 18, ethers.js v6 |
| **Testing** | Mocha, Chai, Jest |
| **Network** | Sepolia Testnet |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18.x
- **npm** or **yarn**
- **MetaMask** browser extension
- **Sepolia ETH** (get from [faucet](https://sepoliafaucet.com/))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/stefan-neculai/blockchain-voting.git
   cd blockchain-voting
   ```

2. **Install dependencies**
   ```bash
   # Root dependencies
   npm install

   # Hardhat dependencies
   cd packages/hardhat
   npm install

   # React app dependencies
   cd ../react-app
   npm install
   ```

3. **Configure environment**
   ```bash
   # In packages/hardhat
   cp .env.example .env
   # Edit .env with your PRIVATE_KEY and INFURA_API_KEY

   # In react-app
   cp .env.example .env
   # Edit .env with contract addresses after deployment
   ```

4. **Compile contracts**
   ```bash
   cd packages/hardhat
   npx hardhat compile
   ```

5. **Run tests**
   ```bash
   npx hardhat test
   ```

6. **Start local development**
   ```bash
   # Terminal 1: Start local blockchain
   npx hardhat node

   # Terminal 2: Deploy contracts
   npx hardhat run scripts/deployAnonymousVoting.ts --network localhost

   # Terminal 3: Start React app
   cd ../react-app
   npm start
   ```

---

## 📁 Project Structure

```
blockchain-voting/
├── docs/                          # Documentation
│   ├── ARCHITECTURE_ZKP.md        # Technical architecture
│   ├── ROADMAP_SEMESTER3.md       # Development roadmap
│   ├── SECURITY_REVIEW.md         # Security analysis
│   ├── USER_GUIDE.md              # End-user guide
│   └── DEPLOYMENT_GUIDE.md        # Production deployment
│
├── packages/
│   └── hardhat/                   # Smart contract development
│       ├── contracts/
│       │   ├── AnonymousVoting.sol       # Main ZK voting contract
│       │   ├── interfaces/
│       │   │   └── ISemaphore.sol        # Semaphore interface
│       │   └── mocks/
│       │       └── MockSemaphore.sol     # Testing mock
│       ├── scripts/
│       │   ├── deployAnonymousVoting.ts  # Deployment script
│       │   └── registerVoters.ts         # Voter registration
│       └── test/
│           └── AnonymousVoting.test.ts   # Contract tests
│
├── react-app/                     # Frontend application
│   ├── src/
│   │   ├── components/
│   │   │   ├── IdentityManager.jsx       # ZK identity UI
│   │   │   ├── VotingInterface.jsx       # Voting UI
│   │   │   └── ...
│   │   ├── hooks/
│   │   │   ├── useIdentity.js            # Identity hook
│   │   │   └── useAnonymousVoting.js     # Voting hook
│   │   ├── utils/
│   │   │   └── semaphore.js              # ZK utilities
│   │   └── contexts/
│   │       └── Web3Context.jsx           # Web3 provider
│   └── public/
│
└── server/                        # Backend (optional)
```

---

## 📜 Smart Contracts

### AnonymousVoting.sol

The main voting contract that integrates with Semaphore for ZK proofs.

#### Key Functions

| Function | Description |
|----------|-------------|
| `createPoll(question, candidates, endTime)` | Create a new poll |
| `registerVoter(pollId, commitment)` | Register voter identity commitment |
| `vote(pollId, candidateIndex, proof)` | Submit anonymous vote with ZK proof |
| `getPollDetails(pollId)` | Get poll information |
| `getResults(pollId)` | Get voting results |

#### Events

```solidity
event PollCreated(bytes32 indexed pollId, string question, uint256 endTime);
event VoterRegistered(bytes32 indexed pollId, uint256 commitment);
event VoteCast(bytes32 indexed pollId, uint256 candidateIndex, uint256 nullifier);
```

---

## 🖥️ Frontend

### Hooks

| Hook | Purpose |
|------|---------|
| `useIdentity` | Manage ZK identity (generate, store, export, import) |
| `useAnonymousVoting` | Handle proof generation and vote submission |
| `useWeb3` | Wallet connection and contract interaction |

### Components

| Component | Purpose |
|-----------|---------|
| `IdentityManager` | UI for identity management |
| `VotingInterface` | Voting UI with ZK integration |
| `PollCard` | Display poll information |
| `ResultsDisplay` | Show voting results |

---

## 🧪 Testing

### Smart Contract Tests

```bash
cd packages/hardhat

# Run all tests
npx hardhat test

# Run with coverage
npx hardhat coverage

# Run specific test file
npx hardhat test test/AnonymousVoting.test.ts
```

**Test Coverage:**
- ✅ Poll creation and management
- ✅ Voter registration
- ✅ Double-vote prevention (nullifiers)
- ✅ Invalid proof rejection
- ✅ Time-based poll expiration
- ✅ Access control

### Frontend Tests

```bash
cd react-app

# Run Jest tests
npm test

# Run with coverage
npm test -- --coverage
```

---

## 🌐 Deployment

### Sepolia Testnet

```bash
cd packages/hardhat

# Deploy AnonymousVoting contract
npx hardhat run scripts/deployAnonymousVoting.ts --network sepolia
```

### Mainnet (Production)

⚠️ **Warning**: Ensure thorough security audit before mainnet deployment.

See [DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) for detailed instructions.

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [ARCHITECTURE_ZKP.md](docs/ARCHITECTURE_ZKP.md) | Technical architecture and design decisions |
| [ROADMAP_SEMESTER3.md](docs/ROADMAP_SEMESTER3.md) | Development roadmap and task tracking |
| [SECURITY_REVIEW.md](docs/SECURITY_REVIEW.md) | Security analysis and recommendations |
| [USER_GUIDE.md](docs/USER_GUIDE.md) | End-user guide for voting |
| [DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) | Production deployment guide |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Semaphore Protocol](https://semaphore.pse.dev/) - ZK identity framework
- [OpenZeppelin](https://openzeppelin.com/) - Secure smart contract library
- [Hardhat](https://hardhat.org/) - Ethereum development environment
- [PSE (Privacy & Scaling Explorations)](https://pse.dev/) - Research and development

---

## 📞 Contact

**Stefan Neculai** - Master's Thesis Project, Semester 3

- GitHub: [@stefan-neculai](https://github.com/stefan-neculai)
- Email: n.stefancatalin@gmail.com

---

<p align="center">
  Made with ❤️ for anonymous and secure voting
</p>