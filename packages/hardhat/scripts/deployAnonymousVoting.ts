import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * Deployment script for AnonymousVoting system
 * 
 * This script deploys:
 * 1. MockSemaphore (for testing) OR connects to existing Semaphore (for production)
 * 2. AnonymousVoting contract
 * 
 * Usage:
 *   npx hardhat run scripts/deployAnonymousVoting.ts --network <network>
 */

interface DeploymentInfo {
  network: string;
  chainId: number;
  deployer: string;
  timestamp: string;
  contracts: {
    semaphore: string;
    anonymousVoting: string;
  };
  isTestnet: boolean;
}

// Known Semaphore deployments (update as needed)
const SEMAPHORE_ADDRESSES: { [chainId: number]: string } = {
  // Mainnet
  1: "0x0000000000000000000000000000000000000000", // TODO: Add mainnet address
  // Sepolia
  11155111: "0x0000000000000000000000000000000000000000", // TODO: Add Sepolia address
  // For local/hardhat, we deploy MockSemaphore
};

async function main() {
  console.log("========================================");
  console.log("  Anonymous Voting Deployment Script");
  console.log("========================================\n");

  // Get network info
  const [deployer] = await ethers.getSigners();
  const chainId = (await ethers.provider.getNetwork()).chainId;
  
  console.log(`Network: ${network.name}`);
  console.log(`Chain ID: ${chainId}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`);

  let semaphoreAddress: string;

  // Determine if we need to deploy MockSemaphore
  const isLocalNetwork = network.name === "hardhat" || network.name === "localhost";
  const knownSemaphore = SEMAPHORE_ADDRESSES[Number(chainId)];

  if (isLocalNetwork || !knownSemaphore || knownSemaphore === "0x0000000000000000000000000000000000000000") {
    // Deploy MockSemaphore for testing
    console.log("Deploying MockSemaphore for testing...");
    const MockSemaphore = await ethers.getContractFactory("MockSemaphore");
    const mockSemaphore = await MockSemaphore.deploy();
    await mockSemaphore.waitForDeployment();
    semaphoreAddress = await mockSemaphore.getAddress();
    console.log(`✅ MockSemaphore deployed at: ${semaphoreAddress}\n`);
  } else {
    // Use existing Semaphore deployment
    semaphoreAddress = knownSemaphore;
    console.log(`Using existing Semaphore at: ${semaphoreAddress}\n`);
  }

  // Deploy AnonymousVoting
  console.log("Deploying AnonymousVoting contract...");
  const AnonymousVoting = await ethers.getContractFactory("AnonymousVoting");
  const anonymousVoting = await AnonymousVoting.deploy(semaphoreAddress);
  await anonymousVoting.waitForDeployment();
  const anonymousVotingAddress = await anonymousVoting.getAddress();
  console.log(`✅ AnonymousVoting deployed at: ${anonymousVotingAddress}\n`);

  // Verify deployment
  console.log("Verifying deployment...");
  const admin = await anonymousVoting.admin();
  const semaphoreFromContract = await anonymousVoting.semaphore();
  console.log(`  Admin: ${admin}`);
  console.log(`  Semaphore: ${semaphoreFromContract}`);
  console.log(`  Poll Count: ${await anonymousVoting.pollCount()}\n`);

  // Save deployment info
  const deploymentInfo: DeploymentInfo = {
    network: network.name,
    chainId: Number(chainId),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      semaphore: semaphoreAddress,
      anonymousVoting: anonymousVotingAddress,
    },
    isTestnet: isLocalNetwork || chainId === BigInt(11155111),
  };

  // Create deployments directory if it doesn't exist
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  // Save to file
  const filename = `${network.name}-${Date.now()}.json`;
  const filepath = path.join(deploymentsDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`📁 Deployment info saved to: ${filepath}`);

  // Also save as latest for easy access
  const latestPath = path.join(deploymentsDir, `${network.name}-latest.json`);
  fs.writeFileSync(latestPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`📁 Latest deployment: ${latestPath}`);

  console.log("\n========================================");
  console.log("  Deployment Complete!");
  console.log("========================================");
  console.log("\nNext steps:");
  console.log("1. Update your frontend .env with:");
  console.log(`   REACT_APP_VOTING_ADDRESS=${anonymousVotingAddress}`);
  console.log(`   REACT_APP_SEMAPHORE_ADDRESS=${semaphoreAddress}`);
  console.log("\n2. If on a public testnet, verify on Etherscan:");
  console.log(`   npx hardhat verify --network ${network.name} ${anonymousVotingAddress} ${semaphoreAddress}`);

  return deploymentInfo;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
