import { expect } from "chai";
import { ethers } from "hardhat";
import { MultiCandidateVoting, MockVerifier } from "../typechain-types";

describe("MultiCandidateVoting", function () {
  let votingContract: MultiCandidateVoting;
  let mockVerifier: MockVerifier;
  let owner: any, addr1: any, addr2: any;

  // This runs once before all tests
  before(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy the MockVerifier
    const MockVerifierFactory = await ethers.getContractFactory("MockVerifier");
    mockVerifier = await MockVerifierFactory.deploy();
    const mockVerifierAddress = await mockVerifier.getAddress();

    // Deploy the MultiCandidateVoting contract
    const VotingFactory = await ethers.getContractFactory("MultiCandidateVoting");
    votingContract = await VotingFactory.deploy(mockVerifierAddress);
  });

  it("Should allow the owner to create a new poll", async function () {
    const title = "Test Poll 1";
    const numCandidates = 5;
    const merkleRoot = ethers.encodeBytes32String("test_root_1");

    // Call the createPoll function
    await expect(votingContract.createPoll(title, numCandidates, merkleRoot))
      .to.emit(votingContract, "PollCreated")
      .withArgs(1, title, numCandidates);

    // Check that the poll was created correctly
    const poll = await votingContract.polls(1);
    expect(poll.id).to.equal(1);
    expect(poll.title).to.equal(title);
    expect(poll.numCandidates).to.equal(numCandidates);
    expect(poll.merkleRoot).to.equal(merkleRoot);
  });

  it("Should allow a valid vote to be cast", async function () {
    const pollId = 1;
    const candidateId = 3;
    const nullifierHash = ethers.id("unique_vote_1"); // A unique identifier for this vote
    const merkleRoot = ethers.encodeBytes32String("test_root_1");

    // Prepare mock proof data (it doesn't matter what these are for the mock)
    const proof_a: [string, string] = ["0", "0"];
    const proof_b: [[string, string], [string, string]] = [["0", "0"],["0", "0"]];
    const proof_c: [string, string] = ["0", "0"];
    const publicInputs: [string, string, string, string] = [
        ethers.hexlify(merkleRoot),
        nullifierHash,
        String(candidateId),
        String(pollId)
    ];

    // Cast the vote (using addr1's signer to simulate a different user)
    await expect(votingContract.connect(addr1).castVote(pollId, proof_a, proof_b, proof_c, publicInputs))
      .to.emit(votingContract, "VoteCast")
      .withArgs(pollId, candidateId);

    // Check that the vote count was updated
    const voteCount = await votingContract.getVoteCount(pollId, candidateId);
    expect(voteCount).to.equal(1);
  });

  it("Should prevent double-voting with the same nullifier", async function () {
    const pollId = 1;
    const candidateId = 4; // A different candidate
    const nullifierHash = ethers.id("unique_vote_1"); // THE SAME nullifier as the previous test
    const merkleRoot = ethers.encodeBytes32String("test_root_1");

    // Prepare mock proof data
    const proof_a: [string, string] = ["0", "0"];
    const proof_b: [[string, string], [string, string]] = [["0", "0"],["0", "0"]];
    const proof_c: [string, string] = ["0", "0"];
    const publicInputs: [string, string, string, string] = [
        ethers.hexlify(merkleRoot),
        nullifierHash,
        String(candidateId),
        String(pollId)
    ];

    // Expect this transaction to be reverted with our custom error
    await expect(
        votingContract.connect(addr2).castVote(pollId, proof_a, proof_b, proof_c, publicInputs)
    ).to.be.revertedWithCustomError(votingContract, "AlreadyVoted");
  });

  it("Should reject votes for invalid candidates", async function () {
    const pollId = 1;
    const candidateId = 10; // Invalid, since numCandidates is 5
    const nullifierHash = ethers.id("unique_vote_2");
    const merkleRoot = ethers.encodeBytes32String("test_root_1");

    const publicInputs: [string, string, string, string] = [
        ethers.hexlify(merkleRoot),
        nullifierHash,
        String(candidateId),
        String(pollId)
    ];

    await expect(
        votingContract.castVote(1, ["0","0"], [["0","0"],["0","0"]], ["0","0"], publicInputs)
    ).to.be.revertedWithCustomError(votingContract, "InvalidCandidateId");
  });
});