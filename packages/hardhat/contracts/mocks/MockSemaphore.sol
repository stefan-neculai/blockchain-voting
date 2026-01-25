// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/ISemaphore.sol";

/**
 * @title MockSemaphore
 * @notice A mock implementation of the Semaphore protocol for testing.
 * @dev This contract simulates Semaphore behavior without real ZK verification.
 *      It allows testing the AnonymousVoting contract flow end-to-end.
 * 
 * WARNING: This is for TESTING ONLY. Never use in production!
 */
contract MockSemaphore is ISemaphore {
    // =========================================================================
    // State Variables
    // =========================================================================

    /// @dev Tracks which nullifiers have been used per group
    mapping(uint256 => mapping(uint256 => bool)) public usedNullifiers;

    /// @dev Group admin addresses
    mapping(uint256 => address) public groupAdmins;

    /// @dev Group existence check
    mapping(uint256 => bool) public groupExists;

    /// @dev Member commitments per group
    mapping(uint256 => uint256[]) public groupMembers;

    /// @dev Quick lookup for membership
    mapping(uint256 => mapping(uint256 => bool)) public isMember;

    /// @dev Simulated Merkle roots (simplified - just a counter)
    mapping(uint256 => uint256) public merkleRoots;

    /// @dev Configuration: should proofs fail?
    bool public shouldProofsFail;

    /// @dev Configuration: should membership checks fail?
    bool public shouldMembershipFail;

    // =========================================================================
    // Test Configuration Functions
    // =========================================================================

    /**
     * @notice Configure whether proofs should fail (for testing error cases)
     */
    function setShouldProofsFail(bool _shouldFail) external {
        shouldProofsFail = _shouldFail;
    }

    /**
     * @notice Configure whether membership checks should fail
     */
    function setShouldMembershipFail(bool _shouldFail) external {
        shouldMembershipFail = _shouldFail;
    }

    // =========================================================================
    // ISemaphore Implementation
    // =========================================================================

    function createGroup(uint256 groupId, address admin) external override {
        require(!groupExists[groupId], "MockSemaphore: group already exists");
        groupExists[groupId] = true;
        groupAdmins[groupId] = admin;
        merkleRoots[groupId] = 1; // Initial non-zero root
        emit GroupCreated(groupId);
    }

    function createGroup(uint256 groupId) external override {
        require(!groupExists[groupId], "MockSemaphore: group already exists");
        groupExists[groupId] = true;
        groupAdmins[groupId] = msg.sender;
        merkleRoots[groupId] = 1;
        emit GroupCreated(groupId);
    }

    function addMember(uint256 groupId, uint256 identityCommitment) external override {
        require(groupExists[groupId], "MockSemaphore: group does not exist");
        require(!isMember[groupId][identityCommitment], "MockSemaphore: already a member");
        
        groupMembers[groupId].push(identityCommitment);
        isMember[groupId][identityCommitment] = true;
        
        // Update mock Merkle root (simplified)
        merkleRoots[groupId] = uint256(keccak256(abi.encodePacked(
            merkleRoots[groupId],
            identityCommitment
        )));

        emit MemberAdded(
            groupId,
            groupMembers[groupId].length - 1,
            identityCommitment,
            merkleRoots[groupId]
        );
    }

    function addMembers(uint256 groupId, uint256[] calldata identityCommitments) external override {
        require(groupExists[groupId], "MockSemaphore: group does not exist");
        
        for (uint256 i = 0; i < identityCommitments.length; i++) {
            uint256 commitment = identityCommitments[i];
            require(!isMember[groupId][commitment], "MockSemaphore: already a member");
            
            groupMembers[groupId].push(commitment);
            isMember[groupId][commitment] = true;
            
            merkleRoots[groupId] = uint256(keccak256(abi.encodePacked(
                merkleRoots[groupId],
                commitment
            )));

            emit MemberAdded(
                groupId,
                groupMembers[groupId].length - 1,
                commitment,
                merkleRoots[groupId]
            );
        }
    }

    function removeMember(
        uint256 groupId,
        uint256 identityCommitment,
        uint256[] calldata /* merkleProofSiblings */
    ) external override {
        require(groupExists[groupId], "MockSemaphore: group does not exist");
        require(isMember[groupId][identityCommitment], "MockSemaphore: not a member");
        
        isMember[groupId][identityCommitment] = false;
        
        // Update mock root
        merkleRoots[groupId] = uint256(keccak256(abi.encodePacked(
            merkleRoots[groupId],
            "removed",
            identityCommitment
        )));

        // Find index (inefficient, but this is a mock)
        uint256 index = 0;
        for (uint256 i = 0; i < groupMembers[groupId].length; i++) {
            if (groupMembers[groupId][i] == identityCommitment) {
                index = i;
                break;
            }
        }

        emit MemberRemoved(groupId, index, identityCommitment, merkleRoots[groupId]);
    }

    function updateMember(
        uint256 groupId,
        uint256 oldIdentityCommitment,
        uint256 newIdentityCommitment,
        uint256[] calldata /* merkleProofSiblings */
    ) external override {
        require(groupExists[groupId], "MockSemaphore: group does not exist");
        require(isMember[groupId][oldIdentityCommitment], "MockSemaphore: not a member");
        
        isMember[groupId][oldIdentityCommitment] = false;
        isMember[groupId][newIdentityCommitment] = true;
        
        // Update in array
        for (uint256 i = 0; i < groupMembers[groupId].length; i++) {
            if (groupMembers[groupId][i] == oldIdentityCommitment) {
                groupMembers[groupId][i] = newIdentityCommitment;
                
                merkleRoots[groupId] = uint256(keccak256(abi.encodePacked(
                    merkleRoots[groupId],
                    newIdentityCommitment
                )));

                emit MemberUpdated(
                    groupId,
                    i,
                    oldIdentityCommitment,
                    newIdentityCommitment,
                    merkleRoots[groupId]
                );
                break;
            }
        }
    }

    function validateProof(uint256 groupId, SemaphoreProof calldata proof) external override {
        require(groupExists[groupId], "MockSemaphore: group does not exist");
        require(!shouldProofsFail, "MockSemaphore: proof validation disabled");
        require(!usedNullifiers[groupId][proof.nullifier], "MockSemaphore: nullifier already used");
        
        // In a real implementation, we'd verify the ZK proof here
        // For testing, we just check the nullifier hasn't been used
        
        usedNullifiers[groupId][proof.nullifier] = true;

        emit ProofValidated(
            groupId,
            proof.merkleTreeDepth,
            proof.merkleTreeRoot,
            proof.nullifier,
            proof.message,
            proof.scope,
            proof.points
        );
    }

    function verifyProof(uint256 groupId, SemaphoreProof calldata /* proof */) external view override returns (bool) {
        require(groupExists[groupId], "MockSemaphore: group does not exist");
        if (shouldProofsFail) return false;
        return true;
    }

    function getMerkleTreeRoot(uint256 groupId) external view override returns (uint256) {
        require(groupExists[groupId], "MockSemaphore: group does not exist");
        return merkleRoots[groupId];
    }

    function getMerkleTreeDepth(uint256 groupId) external view override returns (uint256) {
        require(groupExists[groupId], "MockSemaphore: group does not exist");
        // Standard Semaphore depth
        return 20;
    }

    function getMerkleTreeSize(uint256 groupId) external view override returns (uint256) {
        require(groupExists[groupId], "MockSemaphore: group does not exist");
        return groupMembers[groupId].length;
    }

    function getGroupAdmin(uint256 groupId) external view override returns (address) {
        require(groupExists[groupId], "MockSemaphore: group does not exist");
        return groupAdmins[groupId];
    }

    // =========================================================================
    // Additional Test Helpers
    // =========================================================================

    /**
     * @notice Check if a nullifier has been used for a group
     */
    function isNullifierUsed(uint256 groupId, uint256 nullifier) external view returns (bool) {
        return usedNullifiers[groupId][nullifier];
    }

    /**
     * @notice Get all members of a group
     */
    function getGroupMembers(uint256 groupId) external view returns (uint256[] memory) {
        return groupMembers[groupId];
    }

    /**
     * @notice Reset a nullifier (for testing retries)
     */
    function resetNullifier(uint256 groupId, uint256 nullifier) external {
        usedNullifiers[groupId][nullifier] = false;
    }
}
