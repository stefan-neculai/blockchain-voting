# 🚀 Deployment Guide: Anonymous Blockchain Voting

> Complete guide for deploying the voting system to testnet and mainnet

---

## Table of Contents

1. [Overview](#1-overview)
2. [Prerequisites](#2-prerequisites)
3. [Local Development Deployment](#3-local-development-deployment)
4. [Sepolia Testnet Deployment](#4-sepolia-testnet-deployment)
5. [Mainnet Deployment](#5-mainnet-deployment)
6. [Frontend Deployment](#6-frontend-deployment)
7. [Post-Deployment Verification](#7-post-deployment-verification)
8. [Upgrading Contracts](#8-upgrading-contracts)
9. [Monitoring & Maintenance](#9-monitoring--maintenance)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Overview

### Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEPLOYMENT ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────────┐     ┌─────────────────┐                   │
│   │   Frontend      │────►│  Vercel/Netlify │                   │
│   │   (React)       │     │  (Static Host)  │                   │
│   └─────────────────┘     └─────────────────┘                   │
│            │                       │                             │
│            │ RPC                   │ CDN                         │
│            ▼                       ▼                             │
│   ┌─────────────────────────────────────────┐                   │
│   │        Ethereum Network                  │                   │
│   │  ┌─────────────────────────────────┐    │                   │
│   │  │     Semaphore Contract          │    │                   │
│   │  │     (PSE Deployment)            │    │                   │
│   │  └─────────────────────────────────┘    │                   │
│   │              ▲                          │                   │
│   │              │                          │                   │
│   │  ┌─────────────────────────────────┐    │                   │
│   │  │   AnonymousVoting Contract      │    │                   │
│   │  │   (Your Deployment)             │    │                   │
│   │  └─────────────────────────────────┘    │                   │
│   └─────────────────────────────────────────┘                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Contract Addresses (Semaphore v4)

| Network | Semaphore Address | Explorer |
|---------|-------------------|----------|
| Sepolia | `0x1e0d7FF1610e480fC93BdEC510811ea2Ba6d7c2f` | [Etherscan](https://sepolia.etherscan.io/address/0x1e0d7FF1610e480fC93BdEC510811ea2Ba6d7c2f) |
| Mainnet | `0x...` | TBD |

---

## 2. Prerequisites

### Required Tools

```bash
# Check Node.js (>= 18.x required)
node --version

# Check npm
npm --version

# Install Hardhat globally (optional)
npm install -g hardhat
```

### Required Accounts

1. **Ethereum Wallet**
   - Private key with ETH for gas
   - Use a dedicated deployment wallet
   - NEVER use personal wallet private key

2. **RPC Provider**
   - [Infura](https://infura.io/) - Recommended
   - [Alchemy](https://alchemy.com/)
   - [QuickNode](https://quicknode.com/)

3. **Block Explorer API** (for verification)
   - [Etherscan API Key](https://etherscan.io/apis)

### Environment Setup

Create `.env` file in `packages/hardhat/`:

```bash
# Deployer private key (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# RPC URLs
INFURA_API_KEY=your_infura_key
ALCHEMY_API_KEY=your_alchemy_key

# Block explorer verification
ETHERSCAN_API_KEY=your_etherscan_key

# Optional: Custom RPC
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/${INFURA_API_KEY}
MAINNET_RPC_URL=https://mainnet.infura.io/v3/${INFURA_API_KEY}
```

---

## 3. Local Development Deployment

### Step 1: Start Local Node

```bash
cd packages/hardhat

# Start Hardhat node with persistent state
npx hardhat node

# Output:
# Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/
# Accounts: (20 accounts with 10000 ETH each)
```

### Step 2: Deploy Mock Semaphore

For local testing, we use a mock Semaphore:

```bash
# In a new terminal
cd packages/hardhat

npx hardhat run scripts/deployAnonymousVoting.ts --network localhost
```

### Step 3: Configure Frontend

```bash
cd react-app

# Create .env.local
echo "REACT_APP_ANONYMOUS_VOTING_ADDRESS=0x..." > .env.local
echo "REACT_APP_CHAIN_ID=31337" >> .env.local
```

### Step 4: Start Frontend

```bash
npm start
```

---

## 4. Sepolia Testnet Deployment

### Step 1: Get Sepolia ETH

1. Go to [sepoliafaucet.com](https://sepoliafaucet.com/)
2. Enter your wallet address
3. Wait for transaction confirmation
4. Verify balance: `0.5 ETH` minimum recommended

### Step 2: Verify Hardhat Config

```typescript
// hardhat.config.ts
const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },
  networks: {
    sepolia: {
      url: `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`,
      accounts: [process.env.PRIVATE_KEY!],
      chainId: 11155111,
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};
```

### Step 3: Deploy Contract

```bash
cd packages/hardhat

# Compile first
npx hardhat compile

# Deploy to Sepolia
npx hardhat run scripts/deployAnonymousVoting.ts --network sepolia
```

**Expected Output:**
```
Deploying AnonymousVoting...
Using Semaphore at: 0x1e0d7FF1610e480fC93BdEC510811ea2Ba6d7c2f
AnonymousVoting deployed to: 0xYourContractAddress
Transaction hash: 0x...
Waiting for confirmations...
Deployment confirmed!
```

### Step 4: Verify on Etherscan

```bash
npx hardhat verify --network sepolia \
  0xYourContractAddress \
  "0x1e0d7FF1610e480fC93BdEC510811ea2Ba6d7c2f"
```

**Manual Verification (if automatic fails):**

1. Go to [Sepolia Etherscan](https://sepolia.etherscan.io/)
2. Navigate to your contract address
3. Click "Verify & Publish"
4. Select:
   - Compiler Type: Solidity (Single file)
   - Compiler Version: v0.8.20
   - License: MIT
5. Paste flattened source code:
   ```bash
   npx hardhat flatten contracts/AnonymousVoting.sol > Flattened.sol
   ```

### Step 5: Configure Frontend

```bash
cd react-app

# Update .env
cat > .env << EOF
REACT_APP_ANONYMOUS_VOTING_ADDRESS=0xYourContractAddress
REACT_APP_CONTRACT_ADDRESS=0xLegacyPollFactory  # If using legacy
REACT_APP_CHAIN_ID=11155111
EOF
```

---

## 5. Mainnet Deployment

⚠️ **WARNING: Production Deployment Checklist**

Before deploying to mainnet, ensure:

- [ ] Smart contract has been professionally audited
- [ ] All tests pass with 100% coverage on critical paths
- [ ] Security review completed and findings addressed
- [ ] Emergency pause mechanism implemented
- [ ] Gas costs estimated and acceptable
- [ ] Deployment wallet secured (hardware wallet recommended)
- [ ] Team has reviewed deployment plan
- [ ] Rollback plan documented

### Step 1: Estimate Costs

```bash
# Estimate deployment gas
npx hardhat run scripts/estimateGas.ts --network mainnet

# Typical costs (at 30 gwei):
# - Contract deployment: ~2,500,000 gas (~0.075 ETH)
# - Poll creation: ~200,000 gas (~0.006 ETH)
# - Voter registration: ~100,000 gas (~0.003 ETH)
# - Vote submission: ~350,000 gas (~0.0105 ETH)
```

### Step 2: Deploy with Safety Checks

```typescript
// scripts/deployMainnet.ts
import { ethers } from "hardhat";

async function main() {
  // Safety checks
  const network = await ethers.provider.getNetwork();
  if (network.chainId !== 1n) {
    throw new Error("Not on mainnet!");
  }

  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);
  
  console.log("Deployer:", deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH");
  
  if (balance < ethers.parseEther("0.1")) {
    throw new Error("Insufficient balance for deployment");
  }

  // Confirm deployment
  console.log("\n⚠️  MAINNET DEPLOYMENT ⚠️");
  console.log("This action cannot be undone.");
  console.log("Press Ctrl+C within 10 seconds to cancel...");
  await new Promise(r => setTimeout(r, 10000));

  // Deploy
  const SEMAPHORE_MAINNET = "0x..."; // Official Semaphore mainnet address
  
  const AnonymousVoting = await ethers.getContractFactory("AnonymousVoting");
  const voting = await AnonymousVoting.deploy(SEMAPHORE_MAINNET);
  await voting.waitForDeployment();

  console.log("AnonymousVoting deployed to:", await voting.getAddress());
}

main().catch(console.error);
```

### Step 3: Run Deployment

```bash
# Double-check network
npx hardhat run scripts/deployMainnet.ts --network mainnet
```

### Step 4: Post-Deployment

1. **Verify Contract**
   ```bash
   npx hardhat verify --network mainnet 0xAddress 0xSemaphoreAddress
   ```

2. **Transfer Ownership** (if using multisig)
   ```bash
   npx hardhat run scripts/transferOwnership.ts --network mainnet
   ```

3. **Document Deployment**
   - Record contract address
   - Record deployment transaction
   - Update all documentation
   - Announce to users

---

## 6. Frontend Deployment

### Option A: Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd react-app
vercel

# Production deployment
vercel --prod
```

**Environment Variables in Vercel:**
- `REACT_APP_ANONYMOUS_VOTING_ADDRESS`
- `REACT_APP_CHAIN_ID`

### Option B: Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build
cd react-app
npm run build

# Deploy
netlify deploy --prod --dir=build
```

### Option C: IPFS (Decentralized)

```bash
# Install IPFS CLI
npm install -g ipfs-deploy

# Build
cd react-app
npm run build

# Deploy to IPFS
ipd -p pinata build/

# Output: https://gateway.pinata.cloud/ipfs/Qm...
```

### DNS Configuration

For custom domain:

```
# A Record
voting.yourdomain.com -> Vercel/Netlify IP

# Or CNAME
voting.yourdomain.com -> your-app.vercel.app
```

---

## 7. Post-Deployment Verification

### Contract Verification Checklist

```bash
# 1. Check deployment
npx hardhat verify-deployment --network sepolia

# 2. Test read functions
npx hardhat console --network sepolia
> const voting = await ethers.getContractAt("AnonymousVoting", "0x...")
> await voting.owner()
> await voting.semaphore()

# 3. Test write functions (create a test poll)
> await voting.createPoll("Test?", ["Yes", "No"], Math.floor(Date.now()/1000) + 3600)
```

### Frontend Verification

1. **Connect Wallet** ✅
2. **View Polls** ✅
3. **Generate Identity** ✅
4. **Register for Poll** ✅
5. **Cast Vote** ✅
6. **View Results** ✅

### Monitoring Setup

```bash
# Set up monitoring with Tenderly
npm install -g @tenderly/cli
tenderly login
tenderly push
```

---

## 8. Upgrading Contracts

### Current Limitation

The current `AnonymousVoting` contract is **not upgradeable**. To update:

1. Deploy new contract
2. Migrate data (if needed)
3. Update frontend to use new address
4. Announce migration to users

### Future: Proxy Pattern

For production, consider using OpenZeppelin's upgradeable contracts:

```solidity
// AnonymousVotingV2.sol
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract AnonymousVotingV2 is Initializable, OwnableUpgradeable {
    function initialize(address _semaphore) public initializer {
        __Ownable_init();
        semaphore = ISemaphore(_semaphore);
    }
}
```

---

## 9. Monitoring & Maintenance

### Event Monitoring

```javascript
// monitor.js
const { ethers } = require("ethers");

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const contract = new ethers.Contract(ADDRESS, ABI, provider);

contract.on("PollCreated", (pollId, question, endTime) => {
  console.log(`New poll: ${question}`);
  // Send notification
});

contract.on("VoteCast", (pollId, candidateIndex, nullifier) => {
  console.log(`Vote cast in poll ${pollId}`);
  // Update analytics
});
```

### Health Checks

```bash
# Create health check script
cat > scripts/healthCheck.ts << 'EOF'
import { ethers } from "hardhat";

async function main() {
  const voting = await ethers.getContractAt("AnonymousVoting", process.env.CONTRACT_ADDRESS!);
  
  // Check contract is responsive
  const owner = await voting.owner();
  console.log("✅ Contract responsive, owner:", owner);
  
  // Check Semaphore connection
  const semaphore = await voting.semaphore();
  console.log("✅ Semaphore address:", semaphore);
  
  // Check recent activity
  const filter = voting.filters.VoteCast();
  const events = await voting.queryFilter(filter, -1000);
  console.log(`✅ Recent votes: ${events.length}`);
}

main().catch(console.error);
EOF
```

### Backup Procedures

1. **Export Contract State**
   ```bash
   npx hardhat run scripts/exportState.ts --network mainnet
   ```

2. **Store Deployment Artifacts**
   ```bash
   cp -r artifacts/ backups/artifacts-$(date +%Y%m%d)/
   cp -r deployments/ backups/deployments-$(date +%Y%m%d)/
   ```

---

## 10. Troubleshooting

### Deployment Failures

| Error | Cause | Solution |
|-------|-------|----------|
| `insufficient funds` | Not enough ETH | Fund deployer wallet |
| `nonce too low` | Pending transaction | Wait or speed up pending tx |
| `execution reverted` | Constructor failed | Check constructor arguments |
| `contract too large` | Bytecode > 24KB | Enable optimizer, use viaIR |

### Verification Failures

| Error | Solution |
|-------|----------|
| `bytecode mismatch` | Use exact same compiler settings |
| `constructor args mismatch` | Encode arguments correctly |
| `source not found` | Flatten and submit single file |

### Frontend Connection Issues

| Error | Solution |
|-------|----------|
| `wrong network` | Add network switch prompt |
| `contract not found` | Check address in .env |
| `ABI mismatch` | Rebuild and copy new ABI |

---

## Quick Reference

### Deployment Commands

```bash
# Local
npx hardhat node
npx hardhat run scripts/deployAnonymousVoting.ts --network localhost

# Sepolia
npx hardhat run scripts/deployAnonymousVoting.ts --network sepolia
npx hardhat verify --network sepolia CONTRACT_ADDRESS ARGS

# Mainnet
npx hardhat run scripts/deployMainnet.ts --network mainnet
npx hardhat verify --network mainnet CONTRACT_ADDRESS ARGS
```

### Key Addresses

| Item | Sepolia | Mainnet |
|------|---------|---------|
| Semaphore | `0x1e0d7FF1610e480fC93BdEC510811ea2Ba6d7c2f` | TBD |
| AnonymousVoting | _Your deployment_ | _Your deployment_ |

---

<p align="center">
<strong>Deploy with confidence. Vote anonymously. 🚀</strong>
</p>
