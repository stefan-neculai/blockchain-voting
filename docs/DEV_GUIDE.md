# 🛠️ Developer Guide: Anonymous Blockchain Voting System

> Complete guide to set up, run, and test the ZK voting application locally.

---

## 📋 Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Quick Start (TL;DR)](#2-quick-start-tldr)
3. [Installation](#3-installation)
4. [Running the Local Blockchain](#4-running-the-local-blockchain)
5. [Deploying Smart Contracts](#5-deploying-smart-contracts)
6. [Running the Frontend](#6-running-the-frontend)
7. [MetaMask Configuration](#7-metamask-configuration)
8. [Testing the Full Flow](#8-testing-the-full-flow)
9. [Running Tests](#9-running-tests)
10. [Common Issues & Troubleshooting](#10-common-issues--troubleshooting)
11. [Development Tips](#11-development-tips)

---

## 1. Prerequisites

### Required Software

| Software | Version | Download |
|----------|---------|----------|
| **Node.js** | >= 18.x | [nodejs.org](https://nodejs.org/) |
| **npm** | >= 9.x | Comes with Node.js |
| **Git** | Latest | [git-scm.com](https://git-scm.com/) |
| **MetaMask** | Latest | [metamask.io](https://metamask.io/) |

### Verify Installation

```powershell
node --version   # Should be v18.x or higher
npm --version    # Should be v9.x or higher
git --version    # Any recent version
```

---

## 2. Quick Start (TL;DR)

For experienced developers, here's the fastest path:

```powershell
# Terminal 1: Start local blockchain
cd packages/hardhat
npx hardhat node

# Terminal 2: Deploy contracts
cd packages/hardhat
npx hardhat run scripts/deployAnonymousVoting.ts --network localhost
# Copy the contract addresses to react-app/.env

# Terminal 3: Start frontend
cd react-app
npm start
```

Then configure MetaMask for localhost (Chain ID: 31337).

---

## 3. Installation

### Step 1: Clone the Repository

```powershell
git clone https://github.com/stefan-neculai/blockchain-voting.git
cd blockchain-voting
```

### Step 2: Install Root Dependencies

```powershell
npm install
```

### Step 3: Install Hardhat Dependencies

```powershell
cd packages/hardhat
npm install
```

### Step 4: Install React App Dependencies

```powershell
cd ../../react-app
npm install
```

### Step 5: Create Environment Files

**For Hardhat** (`packages/hardhat/.env`):
```dotenv
# Optional: Only needed for testnet/mainnet deployment
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
PRIVATE_KEY=0xYOUR_PRIVATE_KEY
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_KEY
```

**For React App** (`react-app/.env`):
```dotenv
# These will be updated after deployment
REACT_APP_ANONYMOUS_VOTING_ADDRESS=0x...
REACT_APP_SEMAPHORE_ADDRESS=0x...
REACT_APP_CHAIN_ID=31337
```

---

## 4. Running the Local Blockchain

The local Hardhat network simulates an Ethereum blockchain on your machine.

### Start the Node

Open a **new terminal** (keep it running):

```powershell
cd packages/hardhat
npx hardhat node
```

You'll see output like:
```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/

Accounts
========
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

Account #1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 (10000 ETH)
Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d

... (more accounts)
```

**⚠️ Keep this terminal open!** The blockchain runs only while this is active.

### Test Accounts

These accounts are pre-funded with 10,000 ETH each:

| Account | Role | Private Key |
|---------|------|-------------|
| Account #0 | Admin | `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` |
| Account #1 | Voter 1 | `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d` |
| Account #2 | Voter 2 | `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a` |

---

## 5. Deploying Smart Contracts

Open a **second terminal**:

```powershell
cd packages/hardhat
npx hardhat run scripts/deployAnonymousVoting.ts --network localhost
```

Expected output:
```
========================================
  Anonymous Voting Deployment Script
========================================

Network: localhost
Chain ID: 31337
Deployer: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

Deploying MockSemaphore for testing...
✅ MockSemaphore deployed at: 0x5FbDB2315678afecb367f032d93F642f64180aa3

Deploying AnonymousVoting contract...
✅ AnonymousVoting deployed at: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
```

### Update the .env File

Copy the addresses to `react-app/.env`:

```dotenv
REACT_APP_ANONYMOUS_VOTING_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
REACT_APP_SEMAPHORE_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
REACT_APP_CHAIN_ID=31337
```

---

## 6. Running the Frontend

Open a **third terminal**:

```powershell
cd react-app
npm start
```

The app will open at `http://localhost:3000`

---

## 7. MetaMask Configuration

### Step 1: Add Localhost Network

1. Open MetaMask → Click network dropdown → **Add Network** → **Add a network manually**
2. Enter these details:

| Field | Value |
|-------|-------|
| Network Name | `Hardhat Local` |
| RPC URL | `http://127.0.0.1:8545` |
| Chain ID | `31337` |
| Currency Symbol | `ETH` |

3. Click **Save**

### Step 2: Import Test Account

1. MetaMask → Click account icon → **Import Account**
2. Select "Private Key" and paste:
   ```
   0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   ```
3. Click **Import**

You should now see ~10,000 ETH in the account.

### ⚠️ Important: Reset MetaMask After Restarting Hardhat

If you restart the Hardhat node, MetaMask caches old state. To fix:

1. MetaMask → Settings → Advanced → **Clear activity tab data**
2. Or: Settings → Advanced → **Reset Account**

---

## 8. Testing the Full Flow

### The Anonymous Voting Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    COMPLETE TESTING FLOW                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   STEP 1: Connect Wallet (as Admin - Account #0)                │
│   └── Click "Connect Wallet" in the app header                  │
│                                                                 │
│   STEP 2: Create a Poll                                         │
│   └── Go to /create, fill in question + options + duration     │
│                                                                 │
│   STEP 3: Create Your Identity                                  │
│   └── Click "Create Identity" in IdentityManager               │
│   └── Sign the MetaMask message                                 │
│   └── Copy your Identity Commitment!                            │
│                                                                 │
│   STEP 4: Register Yourself as a Voter (via script)             │
│   └── See "Registering Voters" section below                    │
│                                                                 │
│   STEP 5: Vote!                                                 │
│   └── Go to the poll page                                       │
│   └── Click on an option to cast your anonymous vote            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Registering Voters

Since this is anonymous voting, voters must be registered by the admin BEFORE they can vote.

**Option A: Register sample voters (for quick testing)**

```powershell
cd packages/hardhat
$env:POLL_ID = "0"
npx hardhat run scripts/registerVoters.ts --network localhost
```

This generates 5 random test commitments.

**Option B: Register a specific commitment**

Create a file `commitments.json`:
```json
["12345678901234567890123456789012345678901234567890123456789012345678"]
```

Then run:
```powershell
$env:POLL_ID = "0"
$env:COMMITMENTS_FILE = "commitments.json"
npx hardhat run scripts/registerVoters.ts --network localhost
```

---

## 9. Running Tests

### Smart Contract Tests

```powershell
cd packages/hardhat
npx hardhat test
```

Run specific test file:
```powershell
npx hardhat test test/AnonymousVoting.test.ts
```

### Frontend Tests

```powershell
cd react-app
npm test
```

Run with coverage:
```powershell
npm test -- --coverage
```

---

## 10. Common Issues & Troubleshooting

### Issue: "Nonce too high" or Transaction Fails

**Cause:** MetaMask has cached state from a previous Hardhat session.

**Solution:**
1. MetaMask → Settings → Advanced → **Clear activity tab data**
2. Or restart MetaMask

---

### Issue: "Contract not deployed" / "Call exception"

**Cause:** Contract addresses in `.env` don't match deployed contracts.

**Solution:**
1. Check the Hardhat terminal for the actual deployed addresses
2. Update `react-app/.env` with correct addresses
3. Restart the React app (`npm start`)

---

### Issue: Balance shows 0 ETH

**Cause:** MetaMask is connected to wrong network.

**Solution:**
1. Check MetaMask is on "Hardhat Local" (Chain ID 31337)
2. Make sure the Hardhat node is running

---

### Issue: "You are not registered to vote"

**Cause:** Your identity commitment hasn't been added to the poll's voter registry.

**Solution:**
1. Copy your commitment from the IdentityManager
2. Run the registerVoters script with your commitment
3. Wait for the transaction to confirm
4. Refresh the page

---

### Issue: Proof Generation Fails

**Cause:** Usually a mismatch between identity and registered commitment.

**Solution:**
1. Make sure you're using the same identity that was registered
2. Identity is stored in localStorage - clearing it creates a new identity
3. Re-register the new commitment if you cleared storage

---

### Issue: "Cannot read properties of undefined"

**Cause:** Component trying to access data before it's loaded.

**Solution:**
1. Check browser console for specific error
2. Make sure wallet is connected
3. Make sure contracts are deployed and .env is updated

---

## 11. Development Tips

### Hot Reloading

- **Frontend:** React auto-reloads on file save
- **Contracts:** Must redeploy after changes:
  ```powershell
  npx hardhat run scripts/deployAnonymousVoting.ts --network localhost
  ```

### Console Logging in Solidity

```solidity
import "hardhat/console.sol";

function vote(...) {
    console.log("Voting for option:", optionIndex);
    // ...
}
```

Logs appear in the Hardhat node terminal.

### Useful Hardhat Commands

```powershell
# Compile contracts
npx hardhat compile

# Clean build artifacts
npx hardhat clean

# Run local node with logging
npx hardhat node --verbose

# Get account balances
npx hardhat accounts --network localhost
```

### Browser DevTools

- **React DevTools**: Inspect component state
- **Console**: Check for errors and logs
- **Network tab**: Monitor RPC calls to blockchain

### Recommended VS Code Extensions

- **Solidity** (Juan Blanco) - Syntax highlighting
- **Hardhat Solidity** - Better Hardhat integration
- **ESLint** - JavaScript linting
- **Prettier** - Code formatting

---

## 📁 Project Structure Reference

```
blockchain-voting/
├── packages/
│   └── hardhat/
│       ├── contracts/
│       │   ├── AnonymousVoting.sol      # Main voting contract
│       │   ├── MockSemaphore.sol        # Test mock
│       │   └── interfaces/
│       │       └── ISemaphore.sol       # Semaphore interface
│       ├── scripts/
│       │   ├── deployAnonymousVoting.ts # Deployment script
│       │   └── registerVoters.ts        # Voter registration
│       ├── test/
│       │   └── AnonymousVoting.test.ts  # Contract tests
│       └── hardhat.config.ts            # Hardhat configuration
│
├── react-app/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── IdentityManager.jsx      # Identity UI
│   │   │   ├── VotingInterface.jsx      # Voting UI
│   │   │   ├── CreatePoll.jsx           # Poll creation
│   │   │   └── PollList.jsx             # Poll listing
│   │   ├── hooks/
│   │   │   ├── useAnonymousVoting.js    # ZK voting hook
│   │   │   └── useIdentity.js           # Identity hook
│   │   ├── contexts/
│   │   │   └── Web3Context.jsx          # Web3 provider
│   │   ├── utils/
│   │   │   └── semaphore.js             # ZK utilities
│   │   └── abis/
│   │       └── AnonymousVoting.json     # Contract ABI
│   └── .env                             # Environment variables
│
├── docs/
│   ├── ARCHITECTURE_ZKP.md              # Technical architecture
│   ├── USER_GUIDE.md                    # End-user guide
│   └── DEV_GUIDE.md                     # This file!
│
└── README.md                            # Project overview
```

---

## 🆘 Getting Help

- **Documentation:** Check `docs/` folder
- **Issues:** Open a GitHub issue
- **Semaphore Docs:** [semaphore.pse.dev/docs](https://semaphore.pse.dev/docs)
- **Hardhat Docs:** [hardhat.org/docs](https://hardhat.org/docs)

---

*Happy Building! 🚀*
