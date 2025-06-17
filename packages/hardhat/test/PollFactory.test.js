const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PollFactory", function () {
  let pollFactory;
  let owner;
  let addr1;
  let addr2;

  // This block runs before each test, deploying a fresh contract every time.
  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("PollFactory");
    pollFactory = await Factory.deploy();
  });

  describe("Deployment", function () {
    it("Should deploy with a poll count of 0", async function () {
      expect(await pollFactory.pollCount()).to.equal(0);
    });
  });

  describe("Poll Creation", function () {
    it("Should allow a user to create a new poll", async function () {
      const question = "What is the best EVM chain?";
      const options = ["Ethereum", "Polygon", "Arbitrum"];
      
      // Call the createPoll function
      await pollFactory.createPoll(question, options);

      // Check if the poll count increased
      expect(await pollFactory.pollCount()).to.equal(1);

      // Retrieve and check the details of the created poll (ID 0)
      const [pQuestion, pOptions, pVotes] = await pollFactory.getPoll(0);
      expect(pQuestion).to.equal(question);
      expect(pOptions).to.deep.equal(options);
      expect(pVotes).to.deep.equal([0, 0, 0]);
    });

    it("Should revert if creating a poll with less than two options", async function () {
      await expect(
        pollFactory.createPoll("Invalid Poll", ["One Option"])
      ).to.be.revertedWith("At least two options required.");
    });
  });

  describe("Voting", function () {
    beforeEach(async function() {
      // Create a poll to vote on before each voting test
      await pollFactory.createPoll("Favorite Color?", ["Red", "Blue"]);
    });

    it("Should allow a user to vote", async function () {
      // addr1 votes for "Blue" (option index 1) on poll 0
      await pollFactory.connect(addr1).vote(0, 1);

      const [, , votes] = await pollFactory.getPoll(0);
      expect(votes).to.deep.equal([0, 1]);
    });

    it("Should prevent a user from voting twice", async function () {
      await pollFactory.connect(addr1).vote(0, 1);
      
      // Try to vote again from the same address
      await expect(
        pollFactory.connect(addr1).vote(0, 0)
      ).to.be.revertedWith("Already voted in this poll.");
    });

    it("Should allow multiple users to vote", async function () {
      await pollFactory.connect(addr1).vote(0, 1); // addr1 votes Blue
      await pollFactory.connect(addr2).vote(0, 1); // addr2 votes Blue
      await pollFactory.connect(owner).vote(0, 0); // owner votes Red

      const [, , votes] = await pollFactory.getPoll(0);
      expect(votes).to.deep.equal([1, 2]);
    });
  });
});
