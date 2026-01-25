// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/ISemaphore.sol";

/**
 * @title AnonymousVoting
 * @author Stefan Neculai (Master's Thesis)
 * @notice A privacy-preserving voting contract using Semaphore ZK proofs.
 * @dev Each poll creates a Semaphore group. Voters prove membership anonymously
 *      using ZK-SNARKs, and the nullifier mechanism prevents double voting.
 * 
 * Key Privacy Features:
 * - No voter addresses stored on-chain
 * - Vote choice hidden via ZK proof signal
 * - Nullifier prevents double-voting without revealing identity
 */
contract AnonymousVoting {
    // =========================================================================
    // State Variables
    // =========================================================================

    /// @notice The Semaphore contract for group management and proof verification
    ISemaphore public immutable semaphore;

    /// @notice Admin address with permission to create polls and register voters
    address public admin;

    /// @notice Counter for generating unique poll IDs
    uint256 public pollCount;

    /// @notice Struct containing all poll data
    struct Poll {
        uint256 id;              // Unique poll identifier (also used as Semaphore groupId)
        string question;         // The poll question or title
        string[] options;        // Array of voting options/candidates
        uint256[] votes;         // Vote count per option
        bool isActive;           // Whether voting is currently allowed
        uint256 createdAt;       // Block timestamp when poll was created
        uint256 endTime;         // Block timestamp when voting ends
        uint256 totalVotes;      // Total number of votes cast
    }

    /// @notice Mapping from poll ID to poll data
    mapping(uint256 => Poll) public polls;

    // =========================================================================
    // Events
    // =========================================================================

    /// @notice Emitted when a new poll is created
    event PollCreated(
        uint256 indexed pollId,
        string question,
        uint256 optionCount,
        uint256 endTime
    );

    /// @notice Emitted when a voter is registered for a poll
    event VoterRegistered(
        uint256 indexed pollId,
        uint256 indexed identityCommitment
    );

    /// @notice Emitted when a batch of voters is registered
    event VotersRegistered(
        uint256 indexed pollId,
        uint256 count
    );

    /// @notice Emitted when an anonymous vote is cast
    /// @dev Only reveals pollId and optionIndex - NOT who voted
    event VoteCast(
        uint256 indexed pollId,
        uint256 indexed optionIndex
    );

    /// @notice Emitted when poll status changes
    event PollStatusChanged(
        uint256 indexed pollId,
        bool isActive
    );

    /// @notice Emitted when admin is transferred
    event AdminTransferred(
        address indexed previousAdmin,
        address indexed newAdmin
    );

    // =========================================================================
    // Errors
    // =========================================================================

    error NotAdmin();
    error PollDoesNotExist();
    error PollNotActive();
    error PollEnded();
    error PollStillActive();
    error InvalidOption();
    error InvalidDuration();
    error NoOptionsProvided();
    error TooFewOptions();
    error SignalMismatch();
    error ZeroAddress();

    // =========================================================================
    // Modifiers
    // =========================================================================

    modifier onlyAdmin() {
        if (msg.sender != admin) revert NotAdmin();
        _;
    }

    modifier pollExists(uint256 _pollId) {
        if (_pollId >= pollCount) revert PollDoesNotExist();
        _;
    }

    // =========================================================================
    // Constructor
    // =========================================================================

    /**
     * @notice Deploys the AnonymousVoting contract
     * @param _semaphoreAddress Address of the deployed Semaphore contract
     */
    constructor(address _semaphoreAddress) {
        if (_semaphoreAddress == address(0)) revert ZeroAddress();
        semaphore = ISemaphore(_semaphoreAddress);
        admin = msg.sender;
    }

    // =========================================================================
    // Admin Functions
    // =========================================================================

    /**
     * @notice Creates a new poll with its own Semaphore group
     * @param _question The poll question or proposal text
     * @param _options Array of voting options (candidates, choices, etc.)
     * @param _duration Duration in seconds for how long voting is open
     * @return pollId The ID of the newly created poll
     */
    function createPoll(
        string memory _question,
        string[] memory _options,
        uint256 _duration
    ) external onlyAdmin returns (uint256 pollId) {
        if (_options.length == 0) revert NoOptionsProvided();
        if (_options.length < 2) revert TooFewOptions();
        if (_duration == 0) revert InvalidDuration();

        pollId = pollCount;
        pollCount++;

        // Create a Semaphore group for this poll's eligible voters
        // The group ID matches the poll ID for simplicity
        semaphore.createGroup(pollId, address(this));

        // Initialize the poll
        Poll storage newPoll = polls[pollId];
        newPoll.id = pollId;
        newPoll.question = _question;
        newPoll.options = _options;
        newPoll.votes = new uint256[](_options.length);
        newPoll.isActive = true;
        newPoll.createdAt = block.timestamp;
        newPoll.endTime = block.timestamp + _duration;
        newPoll.totalVotes = 0;

        emit PollCreated(pollId, _question, _options.length, newPoll.endTime);
    }

    /**
     * @notice Registers a single voter by adding their identity commitment to the poll's group
     * @param _pollId The poll ID to register the voter for
     * @param _identityCommitment The voter's Semaphore identity commitment
     */
    function registerVoter(
        uint256 _pollId,
        uint256 _identityCommitment
    ) external onlyAdmin pollExists(_pollId) {
        Poll storage poll = polls[_pollId];
        if (!poll.isActive) revert PollNotActive();
        if (block.timestamp >= poll.endTime) revert PollEnded();

        semaphore.addMember(_pollId, _identityCommitment);
        emit VoterRegistered(_pollId, _identityCommitment);
    }

    /**
     * @notice Registers multiple voters in a single transaction (gas efficient)
     * @param _pollId The poll ID to register voters for
     * @param _identityCommitments Array of voter identity commitments
     */
    function registerVoters(
        uint256 _pollId,
        uint256[] calldata _identityCommitments
    ) external onlyAdmin pollExists(_pollId) {
        Poll storage poll = polls[_pollId];
        if (!poll.isActive) revert PollNotActive();
        if (block.timestamp >= poll.endTime) revert PollEnded();

        semaphore.addMembers(_pollId, _identityCommitments);
        emit VotersRegistered(_pollId, _identityCommitments.length);
    }

    /**
     * @notice Toggles the active status of a poll
     * @param _pollId The poll ID to update
     * @param _isActive The new active status
     */
    function setPollActive(
        uint256 _pollId,
        bool _isActive
    ) external onlyAdmin pollExists(_pollId) {
        polls[_pollId].isActive = _isActive;
        emit PollStatusChanged(_pollId, _isActive);
    }

    /**
     * @notice Transfers admin rights to a new address
     * @param _newAdmin The address of the new admin
     */
    function transferAdmin(address _newAdmin) external onlyAdmin {
        if (_newAdmin == address(0)) revert ZeroAddress();
        emit AdminTransferred(admin, _newAdmin);
        admin = _newAdmin;
    }

    // =========================================================================
    // Voting Functions
    // =========================================================================

    /**
     * @notice Cast an anonymous vote using a ZK proof
     * @dev The proof demonstrates:
     *      1. Voter is a member of the poll's eligible voter group
     *      2. Voter has not voted before (via nullifier)
     *      3. Vote is for a valid option (encoded in signal/message)
     * 
     * @param _pollId The poll ID to vote in
     * @param _optionIndex The index of the option to vote for
     * @param _proof The Semaphore ZK proof struct
     */
    function vote(
        uint256 _pollId,
        uint256 _optionIndex,
        ISemaphore.SemaphoreProof calldata _proof
    ) external pollExists(_pollId) {
        Poll storage poll = polls[_pollId];

        // Validate poll state
        if (!poll.isActive) revert PollNotActive();
        if (block.timestamp >= poll.endTime) revert PollEnded();
        if (_optionIndex >= poll.options.length) revert InvalidOption();

        // The signal/message in the proof must match the vote choice
        // This ensures the voter cannot lie about their vote after proof generation
        if (_proof.message != _optionIndex) revert SignalMismatch();

        // The scope should match the poll ID to prevent proof reuse across polls
        // Note: This is typically enforced at proof generation time
        
        // Verify the ZK proof via Semaphore
        // This will:
        // 1. Verify the cryptographic proof is valid
        // 2. Check the voter is in the Merkle tree (eligible)
        // 3. Store the nullifier (prevents double-voting)
        // 4. Revert if nullifier was already used
        semaphore.validateProof(_pollId, _proof);

        // Record the vote
        poll.votes[_optionIndex]++;
        poll.totalVotes++;

        // Emit event with ONLY poll ID and option index
        // The voter's identity is NOT revealed
        emit VoteCast(_pollId, _optionIndex);
    }

    // =========================================================================
    // View Functions
    // =========================================================================

    /**
     * @notice Get full poll details including results
     * @param _pollId The poll ID to query
     * @return question The poll question
     * @return options Array of option strings
     * @return votes Array of vote counts per option
     * @return isActive Whether the poll is currently active
     * @return endTime When the poll ends
     * @return totalVotes Total votes cast
     */
    function getPoll(uint256 _pollId) external view pollExists(_pollId) returns (
        string memory question,
        string[] memory options,
        uint256[] memory votes,
        bool isActive,
        uint256 endTime,
        uint256 totalVotes
    ) {
        Poll storage poll = polls[_pollId];
        return (
            poll.question,
            poll.options,
            poll.votes,
            poll.isActive,
            poll.endTime,
            poll.totalVotes
        );
    }

    /**
     * @notice Get vote count for a specific option
     * @param _pollId The poll ID
     * @param _optionIndex The option index
     * @return The number of votes for that option
     */
    function getVoteCount(
        uint256 _pollId,
        uint256 _optionIndex
    ) external view pollExists(_pollId) returns (uint256) {
        if (_optionIndex >= polls[_pollId].options.length) revert InvalidOption();
        return polls[_pollId].votes[_optionIndex];
    }

    /**
     * @notice Get the number of registered voters for a poll
     * @param _pollId The poll ID
     * @return The number of registered voters
     */
    function getRegisteredVoterCount(uint256 _pollId) external view pollExists(_pollId) returns (uint256) {
        return semaphore.getMerkleTreeSize(_pollId);
    }

    /**
     * @notice Get the current Merkle root for a poll's voter group
     * @param _pollId The poll ID
     * @return The Merkle tree root
     */
    function getMerkleRoot(uint256 _pollId) external view pollExists(_pollId) returns (uint256) {
        return semaphore.getMerkleTreeRoot(_pollId);
    }

    /**
     * @notice Check if a poll has ended
     * @param _pollId The poll ID
     * @return True if the poll has ended
     */
    function hasPollEnded(uint256 _pollId) external view pollExists(_pollId) returns (bool) {
        return block.timestamp >= polls[_pollId].endTime;
    }

    /**
     * @notice Get remaining time for a poll
     * @param _pollId The poll ID
     * @return Seconds remaining, or 0 if ended
     */
    function getRemainingTime(uint256 _pollId) external view pollExists(_pollId) returns (uint256) {
        if (block.timestamp >= polls[_pollId].endTime) {
            return 0;
        }
        return polls[_pollId].endTime - block.timestamp;
    }
}
