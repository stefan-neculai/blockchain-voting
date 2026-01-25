// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ISemaphore
 * @dev Interface for the Semaphore protocol contract.
 * Semaphore enables anonymous group membership proofs and signaling.
 * 
 * This interface is based on Semaphore v4.
 * See: https://semaphore.appliedzkp.org/
 */
interface ISemaphore {
    /// @dev Struct to hold a ZK proof and its public signals
    struct SemaphoreProof {
        uint256 merkleTreeDepth;
        uint256 merkleTreeRoot;
        uint256 nullifier;
        uint256 message;
        uint256 scope;
        uint256[8] points;
    }

    /// @dev Emitted when a new group is created
    event GroupCreated(uint256 indexed groupId);

    /// @dev Emitted when a member is added to a group
    event MemberAdded(uint256 indexed groupId, uint256 index, uint256 identityCommitment, uint256 merkleTreeRoot);

    /// @dev Emitted when a member is removed from a group
    event MemberRemoved(uint256 indexed groupId, uint256 index, uint256 identityCommitment, uint256 merkleTreeRoot);

    /// @dev Emitted when a member is updated in a group
    event MemberUpdated(
        uint256 indexed groupId,
        uint256 index,
        uint256 identityCommitment,
        uint256 newIdentityCommitment,
        uint256 merkleTreeRoot
    );

    /// @dev Emitted when a proof is validated
    event ProofValidated(
        uint256 indexed groupId,
        uint256 indexed merkleTreeDepth,
        uint256 indexed merkleTreeRoot,
        uint256 nullifier,
        uint256 message,
        uint256 scope,
        uint256[8] points
    );

    /**
     * @notice Creates a new Semaphore group with a specific group admin.
     * @param groupId The ID of the group to create.
     * @param admin The address that will manage the group.
     */
    function createGroup(uint256 groupId, address admin) external;

    /**
     * @notice Creates a new Semaphore group where the caller is the admin.
     * @param groupId The ID of the group to create.
     */
    function createGroup(uint256 groupId) external;

    /**
     * @notice Adds a new member (identity commitment) to a group.
     * @param groupId The ID of the group.
     * @param identityCommitment The identity commitment of the new member.
     */
    function addMember(uint256 groupId, uint256 identityCommitment) external;

    /**
     * @notice Adds multiple members to a group in a single transaction.
     * @param groupId The ID of the group.
     * @param identityCommitments Array of identity commitments to add.
     */
    function addMembers(uint256 groupId, uint256[] calldata identityCommitments) external;

    /**
     * @notice Removes a member from a group.
     * @param groupId The ID of the group.
     * @param identityCommitment The identity commitment to remove.
     * @param merkleProofSiblings The Merkle proof siblings.
     */
    function removeMember(
        uint256 groupId,
        uint256 identityCommitment,
        uint256[] calldata merkleProofSiblings
    ) external;

    /**
     * @notice Updates a member's identity commitment.
     * @param groupId The ID of the group.
     * @param oldIdentityCommitment The old identity commitment.
     * @param newIdentityCommitment The new identity commitment.
     * @param merkleProofSiblings The Merkle proof siblings.
     */
    function updateMember(
        uint256 groupId,
        uint256 oldIdentityCommitment,
        uint256 newIdentityCommitment,
        uint256[] calldata merkleProofSiblings
    ) external;

    /**
     * @notice Validates a ZK proof and prevents double-signaling.
     * @dev This function will revert if:
     *      - The proof is invalid
     *      - The nullifier has already been used (double-signaling)
     *      - The Merkle root is not valid for the group
     * @param groupId The ID of the group.
     * @param proof The Semaphore proof struct containing all proof data.
     */
    function validateProof(uint256 groupId, SemaphoreProof calldata proof) external;

    /**
     * @notice Validates a ZK proof without storing the nullifier.
     * @dev Use this for read-only verification. Does NOT prevent double-signaling.
     * @param groupId The ID of the group.
     * @param proof The Semaphore proof struct.
     * @return True if the proof is valid.
     */
    function verifyProof(uint256 groupId, SemaphoreProof calldata proof) external view returns (bool);

    /**
     * @notice Returns the current Merkle tree root for a group.
     * @param groupId The ID of the group.
     * @return The Merkle tree root.
     */
    function getMerkleTreeRoot(uint256 groupId) external view returns (uint256);

    /**
     * @notice Returns the current Merkle tree depth for a group.
     * @param groupId The ID of the group.
     * @return The Merkle tree depth.
     */
    function getMerkleTreeDepth(uint256 groupId) external view returns (uint256);

    /**
     * @notice Returns the number of members in a group.
     * @param groupId The ID of the group.
     * @return The number of members.
     */
    function getMerkleTreeSize(uint256 groupId) external view returns (uint256);

    /**
     * @notice Returns the admin address for a group.
     * @param groupId The ID of the group.
     * @return The admin address.
     */
    function getGroupAdmin(uint256 groupId) external view returns (address);
}
