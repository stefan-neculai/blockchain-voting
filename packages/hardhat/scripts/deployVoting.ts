import { ethers } from "hardhat";
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Deploying MockVerifier contract...");
  const MockVerifier = await ethers.getContractFactory("MockVerifier");
  const mockVerifier = await MockVerifier.deploy();
  await mockVerifier.waitForDeployment();
  const mockVerifierAddress = await mockVerifier.getAddress();
  console.log(`MockVerifier deployed to: ${mockVerifierAddress}`);

  console.log("\nDeploying MultiCandidateVoting contract...");
  const MultiCandidateVoting = await ethers.getContractFactory("MultiCandidateVoting");
  // Pass the address of the verifier to the voting contract's constructor
  const votingContract = await MultiCandidateVoting.deploy(mockVerifierAddress);
  await votingContract.waitForDeployment();
  const votingContractAddress = await votingContract.getAddress();
  console.log(`MultiCandidateVoting deployed to: ${votingContractAddress}`);

  console.log("Deploying pollFactory...");
  const PollFactory = await ethers.getContractFactory("PollFactory");
  const pollFactory = await PollFactory.deploy();
  await pollFactory.waitForDeployment();
  const pollFactoryAddress = await pollFactory.getAddress();
  console.log(`PollFactory deployed to: ${pollFactoryAddress}`);
  console.log("\nDeployment complete!");

    // --- NEW: SCRIPT TO UPDATE FRONTEND AND BACKEND ---
  console.log("\nUpdating configuration files...");
  
  // Define paths to the .env files
  const backendEnvPath = path.resolve(__dirname, "../../../server/.env");
  const frontendEnvPath = path.resolve(__dirname, "../../../react-app/.env");

  // Create the content for the .env files
  const backendEnvContent = `CONTRACT_ADDRESS=${pollFactoryAddress}\n`;
  const frontendEnvContent = `REACT_APP_CONTRACT_ADDRESS=${pollFactoryAddress}\n`;

  // Write the files
  fs.writeFileSync(backendEnvPath, backendEnvContent);
  console.log(`Updated backend .env at: ${backendEnvPath}`);

  fs.writeFileSync(frontendEnvPath, frontendEnvContent);
  console.log(`Updated frontend .env at: ${frontendEnvPath}`);

  console.log("\nConfiguration update complete!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
