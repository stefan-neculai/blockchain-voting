// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// This is a mock verifier contract for testing purposes.
// It allows us to test the main Voting contract's logic
// without needing a real ZK proof.
contract MockVerifier {
    // It always returns 'true' to simulate a successful proof verification.
    function verifyProof(
        uint256[2] memory,
        uint256[2][2] memory,
        uint256[2] memory,
        uint256[4] memory
    ) external pure returns (bool) {
        return true;
    }
}