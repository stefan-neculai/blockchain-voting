import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

/**
 * Voter Registration Script
 * 
 * This script registers voters (identity commitments) to a poll's Semaphore group.
 * 
 * Usage:
 *   npx hardhat run scripts/registerVoters.ts --network <network>
 * 
 * Environment Variables:
 *   POLL_ID - The poll ID to register voters for
 *   VOTING_CONTRACT_ADDRESS - Address of AnonymousVoting contract
 *   COMMITMENTS_FILE - Path to JSON file with identity commitments (optional)
 */

interface RegistrationResult {
  pollId: number;
  success: string[];
  failed: { commitment: string; error: string }[];
  txHash?: string;
}

async function main() {
  console.log("========================================");
  console.log("  Voter Registration Script");
  console.log("========================================\n");

  // Get configuration
  const pollId = parseInt(process.env.POLL_ID || "0");
  let votingAddress = process.env.VOTING_CONTRACT_ADDRESS;
  const commitmentsFile = process.env.COMMITMENTS_FILE;

  // Try to load from latest deployment if no address specified
  if (!votingAddress) {
    const latestDeploymentPath = path.join(
      __dirname,
      "..",
      "deployments",
      `${network.name}-latest.json`
    );
    
    if (fs.existsSync(latestDeploymentPath)) {
      const deployment = JSON.parse(fs.readFileSync(latestDeploymentPath, "utf8"));
      votingAddress = deployment.contracts.anonymousVoting;
      console.log(`Loaded contract address from latest deployment: ${votingAddress}`);
    } else {
      throw new Error(
        "No VOTING_CONTRACT_ADDRESS provided and no deployment file found.\n" +
        "Either set VOTING_CONTRACT_ADDRESS env var or run deployment first."
      );
    }
  }

  // Get signer
  const [admin] = await ethers.getSigners();
  console.log(`Network: ${network.name}`);
  console.log(`Admin: ${admin.address}`);
  console.log(`Contract: ${votingAddress}`);
  console.log(`Poll ID: ${pollId}\n`);

  // Connect to contract
  const AnonymousVoting = await ethers.getContractFactory("AnonymousVoting");
  const voting = AnonymousVoting.attach(votingAddress);

  // Verify admin access
  const contractAdmin = await voting.admin();
  if (contractAdmin.toLowerCase() !== admin.address.toLowerCase()) {
    throw new Error(
      `Signer ${admin.address} is not the admin. Contract admin is ${contractAdmin}`
    );
  }

  // Get commitments
  let commitments: string[];

  if (commitmentsFile && fs.existsSync(commitmentsFile)) {
    // Load from file
    const fileContent = JSON.parse(fs.readFileSync(commitmentsFile, "utf8"));
    commitments = fileContent.commitments || fileContent;
    console.log(`Loaded ${commitments.length} commitments from ${commitmentsFile}`);
  } else {
    // Demo mode: generate sample commitments
    console.log("No commitments file specified. Generating 5 sample commitments for demo...\n");
    commitments = [];
    for (let i = 0; i < 5; i++) {
      // These are dummy commitments for testing
      // In production, users would generate their own commitments
      const randomBytes = ethers.randomBytes(32);
      const commitment = ethers.toBigInt(randomBytes).toString();
      commitments.push(commitment);
    }
    console.log("Sample commitments generated:");
    commitments.forEach((c, i) => console.log(`  ${i + 1}. ${c.slice(0, 20)}...`));
    console.log("");
  }

  // Check poll exists and is active
  try {
    const poll = await voting.getPoll(pollId);
    console.log(`Poll "${poll[0]}" (ID: ${pollId})`);
    console.log(`  Active: ${poll[3]}`);
    console.log(`  End Time: ${new Date(Number(poll[4]) * 1000).toISOString()}`);
    console.log(`  Current Registered Voters: ${await voting.getRegisteredVoterCount(pollId)}\n`);
  } catch (e) {
    throw new Error(`Poll ${pollId} does not exist or contract error: ${e}`);
  }

  // Register voters
  const result: RegistrationResult = {
    pollId,
    success: [],
    failed: [],
  };

  if (commitments.length === 1) {
    // Single registration
    console.log("Registering single voter...");
    try {
      const tx = await voting.registerVoter(pollId, commitments[0]);
      await tx.wait();
      result.success.push(commitments[0]);
      result.txHash = tx.hash;
      console.log(`✅ Registered! Tx: ${tx.hash}`);
    } catch (e: any) {
      result.failed.push({ commitment: commitments[0], error: e.message });
      console.log(`❌ Failed: ${e.message}`);
    }
  } else {
    // Batch registration
    console.log(`Registering ${commitments.length} voters in batch...`);
    try {
      const tx = await voting.registerVoters(pollId, commitments);
      await tx.wait();
      result.success = commitments;
      result.txHash = tx.hash;
      console.log(`✅ All ${commitments.length} voters registered!`);
      console.log(`   Tx: ${tx.hash}`);
      console.log(`   Gas Used: ${(await tx.wait())?.gasUsed.toString()}`);
    } catch (e: any) {
      // If batch fails, try one by one to identify which ones fail
      console.log(`❌ Batch registration failed: ${e.message}`);
      console.log("Trying individual registrations to identify failures...\n");
      
      for (const commitment of commitments) {
        try {
          const tx = await voting.registerVoter(pollId, commitment);
          await tx.wait();
          result.success.push(commitment);
          console.log(`  ✅ ${commitment.slice(0, 16)}...`);
        } catch (innerError: any) {
          result.failed.push({ commitment, error: innerError.message });
          console.log(`  ❌ ${commitment.slice(0, 16)}... - ${innerError.message}`);
        }
      }
    }
  }

  // Summary
  console.log("\n========================================");
  console.log("  Registration Summary");
  console.log("========================================");
  console.log(`  Successful: ${result.success.length}`);
  console.log(`  Failed: ${result.failed.length}`);
  console.log(`  Total Registered: ${await voting.getRegisteredVoterCount(pollId)}`);

  // Save results
  const resultsDir = path.join(__dirname, "..", "registration-logs");
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
  const resultsPath = path.join(
    resultsDir,
    `poll-${pollId}-${Date.now()}.json`
  );
  fs.writeFileSync(resultsPath, JSON.stringify(result, null, 2));
  console.log(`\n📁 Results saved to: ${resultsPath}`);

  return result;
}

// Script to create a sample poll for testing
async function createSamplePoll() {
  console.log("========================================");
  console.log("  Create Sample Poll");
  console.log("========================================\n");

  let votingAddress = process.env.VOTING_CONTRACT_ADDRESS;

  if (!votingAddress) {
    const latestDeploymentPath = path.join(
      __dirname,
      "..",
      "deployments",
      `${network.name}-latest.json`
    );
    
    if (fs.existsSync(latestDeploymentPath)) {
      const deployment = JSON.parse(fs.readFileSync(latestDeploymentPath, "utf8"));
      votingAddress = deployment.contracts.anonymousVoting;
    } else {
      throw new Error("No deployment found");
    }
  }

  const [admin] = await ethers.getSigners();
  const AnonymousVoting = await ethers.getContractFactory("AnonymousVoting");
  const voting = AnonymousVoting.attach(votingAddress);

  console.log("Creating sample poll...");
  const tx = await voting.createPoll(
    "Who should be the class representative?",
    ["Alice", "Bob", "Charlie"],
    86400 * 7 // 7 days
  );
  const receipt = await tx.wait();
  
  // Get poll ID from event
  const event = receipt?.logs.find((log: any) => {
    try {
      return voting.interface.parseLog(log)?.name === "PollCreated";
    } catch {
      return false;
    }
  });
  
  const parsedEvent = event ? voting.interface.parseLog(event) : null;
  const pollId = parsedEvent?.args?.[0];

  console.log(`✅ Poll created with ID: ${pollId}`);
  console.log(`   Tx: ${tx.hash}`);

  return pollId;
}

// Check if we should create a sample poll first
const CREATE_SAMPLE = process.env.CREATE_SAMPLE_POLL === "true";

if (CREATE_SAMPLE) {
  createSamplePoll()
    .then(() => main())
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
} else {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
