import { expect } from "chai";
import { ethers } from "hardhat";
import { AnonymousVoting, MockSemaphore } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("AnonymousVoting", function () {
  let mockSemaphore: MockSemaphore;
  let voting: AnonymousVoting;
  let admin: SignerWithAddress;
  let voter1: SignerWithAddress;
  let voter2: SignerWithAddress;
  let nonAdmin: SignerWithAddress;

  // Sample identity commitments (in production, these come from Semaphore Identity)
  const commitment1 = "12345678901234567890123456789012345678901234567890";
  const commitment2 = "98765432109876543210987654321098765432109876543210";
  const commitment3 = "11111111111111111111111111111111111111111111111111";

  beforeEach(async function () {
    [admin, voter1, voter2, nonAdmin] = await ethers.getSigners();

    // Deploy MockSemaphore
    const MockSemaphoreFactory = await ethers.getContractFactory("MockSemaphore");
    mockSemaphore = await MockSemaphoreFactory.deploy();
    await mockSemaphore.waitForDeployment();

    // Deploy AnonymousVoting
    const AnonymousVotingFactory = await ethers.getContractFactory("AnonymousVoting");
    voting = await AnonymousVotingFactory.deploy(await mockSemaphore.getAddress());
    await voting.waitForDeployment();
  });

  describe("Deployment", function () {
    it("should set the correct admin", async function () {
      expect(await voting.admin()).to.equal(admin.address);
    });

    it("should set the correct Semaphore address", async function () {
      expect(await voting.semaphore()).to.equal(await mockSemaphore.getAddress());
    });

    it("should start with zero polls", async function () {
      expect(await voting.pollCount()).to.equal(0);
    });

    it("should revert if deployed with zero address", async function () {
      const AnonymousVotingFactory = await ethers.getContractFactory("AnonymousVoting");
      await expect(
        AnonymousVotingFactory.deploy(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(voting, "ZeroAddress");
    });
  });

  describe("Poll Creation", function () {
    it("should create a poll with correct parameters", async function () {
      const question = "Who should win?";
      const options = ["Alice", "Bob", "Charlie"];
      const duration = 86400; // 1 day

      await expect(voting.createPoll(question, options, duration))
        .to.emit(voting, "PollCreated")
        .withArgs(0, question, 3, (await ethers.provider.getBlock("latest"))!.timestamp + duration + 1);

      const poll = await voting.getPoll(0);
      expect(poll[0]).to.equal(question); // question
      expect(poll[1]).to.deep.equal(options); // options
      expect(poll[2]).to.deep.equal([0n, 0n, 0n]); // votes
      expect(poll[3]).to.equal(true); // isActive
    });

    it("should increment poll counter", async function () {
      await voting.createPoll("Q1", ["A", "B"], 3600);
      expect(await voting.pollCount()).to.equal(1);

      await voting.createPoll("Q2", ["X", "Y"], 3600);
      expect(await voting.pollCount()).to.equal(2);
    });

    it("should revert if not admin", async function () {
      await expect(
        voting.connect(nonAdmin).createPoll("Q", ["A", "B"], 3600)
      ).to.be.revertedWithCustomError(voting, "NotAdmin");
    });

    it("should revert with no options", async function () {
      await expect(
        voting.createPoll("Q", [], 3600)
      ).to.be.revertedWithCustomError(voting, "NoOptionsProvided");
    });

    it("should revert with only one option", async function () {
      await expect(
        voting.createPoll("Q", ["Only One"], 3600)
      ).to.be.revertedWithCustomError(voting, "TooFewOptions");
    });

    it("should revert with zero duration", async function () {
      await expect(
        voting.createPoll("Q", ["A", "B"], 0)
      ).to.be.revertedWithCustomError(voting, "InvalidDuration");
    });
  });

  describe("Voter Registration", function () {
    beforeEach(async function () {
      await voting.createPoll("Test Poll", ["Yes", "No"], 86400);
    });

    it("should register a single voter", async function () {
      await expect(voting.registerVoter(0, commitment1))
        .to.emit(voting, "VoterRegistered")
        .withArgs(0, commitment1);

      expect(await voting.getRegisteredVoterCount(0)).to.equal(1);
    });

    it("should register multiple voters in batch", async function () {
      const commitments = [commitment1, commitment2, commitment3];
      
      await expect(voting.registerVoters(0, commitments))
        .to.emit(voting, "VotersRegistered")
        .withArgs(0, 3);

      expect(await voting.getRegisteredVoterCount(0)).to.equal(3);
    });

    it("should revert if not admin", async function () {
      await expect(
        voting.connect(nonAdmin).registerVoter(0, commitment1)
      ).to.be.revertedWithCustomError(voting, "NotAdmin");
    });

    it("should revert for non-existent poll", async function () {
      await expect(
        voting.registerVoter(999, commitment1)
      ).to.be.revertedWithCustomError(voting, "PollDoesNotExist");
    });

    it("should revert if poll is not active", async function () {
      await voting.setPollActive(0, false);
      await expect(
        voting.registerVoter(0, commitment1)
      ).to.be.revertedWithCustomError(voting, "PollNotActive");
    });
  });

  describe("Voting", function () {
    beforeEach(async function () {
      await voting.createPoll("Best Language?", ["JavaScript", "Python", "Rust"], 86400);
      await voting.registerVoter(0, commitment1);
      await voting.registerVoter(0, commitment2);
    });

    it("should cast a valid vote", async function () {
      const proof = createMockProof(0, 1); // Vote for option 1 (Python)

      await expect(voting.connect(voter1).vote(0, 1, proof))
        .to.emit(voting, "VoteCast")
        .withArgs(0, 1);

      expect(await voting.getVoteCount(0, 1)).to.equal(1);
    });

    it("should update total votes", async function () {
      const proof1 = createMockProof(0, 0);
      await voting.connect(voter1).vote(0, 0, proof1);

      const poll = await voting.getPoll(0);
      expect(poll[5]).to.equal(1); // totalVotes
    });

    it("should prevent double voting (same nullifier)", async function () {
      const nullifier = ethers.id("unique-nullifier-1");
      const proof1 = createMockProofWithNullifier(0, 0, nullifier);
      const proof2 = createMockProofWithNullifier(0, 1, nullifier);

      await voting.connect(voter1).vote(0, 0, proof1);
      
      // Second vote with same nullifier should fail
      await expect(
        voting.connect(voter2).vote(0, 1, proof2)
      ).to.be.revertedWith("MockSemaphore: nullifier already used");
    });

    it("should revert if signal doesn't match option", async function () {
      const proof = createMockProof(0, 1); // Proof says option 1
      
      await expect(
        voting.connect(voter1).vote(0, 2, proof) // But we claim option 2
      ).to.be.revertedWithCustomError(voting, "SignalMismatch");
    });

    it("should revert for invalid option index", async function () {
      const proof = createMockProof(0, 99);
      
      await expect(
        voting.connect(voter1).vote(0, 99, proof)
      ).to.be.revertedWithCustomError(voting, "InvalidOption");
    });

    it("should revert if poll is not active", async function () {
      await voting.setPollActive(0, false);
      const proof = createMockProof(0, 0);
      
      await expect(
        voting.connect(voter1).vote(0, 0, proof)
      ).to.be.revertedWithCustomError(voting, "PollNotActive");
    });

    it("should revert if poll has ended", async function () {
      // Create a poll with short duration but enough time to register
      await voting.createPoll("Quick Poll", ["A", "B"], 60); // 60 seconds
      await voting.registerVoter(1, commitment1);
      
      // Wait for poll to end
      await ethers.provider.send("evm_increaseTime", [61]);
      await ethers.provider.send("evm_mine", []);

      const proof = createMockProof(1, 0);
      
      await expect(
        voting.connect(voter1).vote(1, 0, proof)
      ).to.be.revertedWithCustomError(voting, "PollEnded");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await voting.createPoll("Test Poll", ["Option A", "Option B"], 86400);
    });

    it("should return correct remaining time", async function () {
      const remaining = await voting.getRemainingTime(0);
      expect(remaining).to.be.closeTo(86400n, 5n);
    });

    it("should return zero remaining time after poll ends", async function () {
      await ethers.provider.send("evm_increaseTime", [86401]);
      await ethers.provider.send("evm_mine", []);

      expect(await voting.getRemainingTime(0)).to.equal(0);
    });

    it("should correctly report if poll has ended", async function () {
      expect(await voting.hasPollEnded(0)).to.equal(false);

      await ethers.provider.send("evm_increaseTime", [86401]);
      await ethers.provider.send("evm_mine", []);

      expect(await voting.hasPollEnded(0)).to.equal(true);
    });

    it("should return Merkle root from Semaphore", async function () {
      await voting.registerVoter(0, commitment1);
      const root = await voting.getMerkleRoot(0);
      expect(root).to.not.equal(0);
    });
  });

  describe("Admin Functions", function () {
    it("should transfer admin", async function () {
      await expect(voting.transferAdmin(nonAdmin.address))
        .to.emit(voting, "AdminTransferred")
        .withArgs(admin.address, nonAdmin.address);

      expect(await voting.admin()).to.equal(nonAdmin.address);
    });

    it("should revert transfer to zero address", async function () {
      await expect(
        voting.transferAdmin(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(voting, "ZeroAddress");
    });

    it("should allow new admin to create polls", async function () {
      await voting.transferAdmin(nonAdmin.address);
      
      await expect(
        voting.connect(nonAdmin).createPoll("New Poll", ["A", "B"], 3600)
      ).to.emit(voting, "PollCreated");
    });
  });

  // Helper function to create mock proof
  function createMockProof(pollId: number, optionIndex: number) {
    return {
      merkleTreeDepth: 20,
      merkleTreeRoot: 12345,
      nullifier: ethers.toBigInt(ethers.id(`nullifier-${Date.now()}-${Math.random()}`)),
      message: optionIndex,
      scope: pollId,
      points: [0, 0, 0, 0, 0, 0, 0, 0] as [number, number, number, number, number, number, number, number]
    };
  }

  function createMockProofWithNullifier(pollId: number, optionIndex: number, nullifier: string) {
    return {
      merkleTreeDepth: 20,
      merkleTreeRoot: 12345,
      nullifier: ethers.toBigInt(nullifier),
      message: optionIndex,
      scope: pollId,
      points: [0, 0, 0, 0, 0, 0, 0, 0] as [number, number, number, number, number, number, number, number]
    };
  }
});
