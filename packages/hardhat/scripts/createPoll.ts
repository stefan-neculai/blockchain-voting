import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners(); // 👈 necessary signer

  const contractAddress = "0xe7f1725e7734ce2f8367e1bb143e90bb3f0512";
  const votingContract = await ethers.getContractAt(
    "MultiCandidateVoting",
    contractAddress,
    deployer // 👈 pass signer here!
  );

  console.log("Creating a new poll...");
  const title = "Official Test Poll #1";
  const numCandidates = 3;
  const merkleRoot = ethers.encodeBytes32String("test_root_1");

  const tx = await votingContract.createPoll(title, numCandidates, merkleRoot);
  await tx.wait();

  console.log("Poll created successfully!");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
