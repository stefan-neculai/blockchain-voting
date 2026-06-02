/**
 * @fileoverview Unit tests for useAnonymousVoting hook
 * @description Tests ZK proof generation and vote submission flow
 */

/* global BigInt */

import { renderHook, act } from '@testing-library/react';
import { useAnonymousVoting, VotingState } from '../useAnonymousVoting';

// Mock Web3Context
const mockProvider = {
  getSigner: jest.fn().mockResolvedValue({
    getAddress: jest.fn().mockResolvedValue('0x1234567890123456789012345678901234567890'),
  }),
};

const mockGetAnonymousVotingContract = jest.fn();

jest.mock('../../contexts/Web3Context', () => ({
  useWeb3: () => ({
    provider: mockProvider,
    account: '0x1234567890123456789012345678901234567890',
    isConnected: true,
    getAnonymousVotingContract: mockGetAnonymousVotingContract,
  }),
}));

// Mock useIdentity hook
jest.mock('../useIdentity', () => ({
  useIdentity: () => ({
    identity: {
      export: jest.fn().mockReturnValue('mock-secret'),
      commitment: BigInt('0x1234567890abcdef'),
      trapdoor: BigInt('0xtrapdoor'),
      nullifier: BigInt('0xnullifier'),
    },
    hasIdentity: true,
    commitment: BigInt('0x1234567890abcdef'),
    getCommitmentHex: jest.fn().mockReturnValue('0x1234567890abcdef'),
  }),
}));

// Mock Semaphore proof generation
jest.mock('@semaphore-protocol/proof', () => ({
  generateProof: jest.fn().mockResolvedValue({
    merkleTreeDepth: 20,
    merkleTreeRoot: BigInt('0xroot'),
    nullifier: BigInt('0xnullifier'),
    message: BigInt(1),
    scope: BigInt('0xpollId'),
    points: [BigInt(1), BigInt(2), BigInt(3), BigInt(4), BigInt(5), BigInt(6), BigInt(7), BigInt(8)],
  }),
}));

// Mock semaphore utilities
jest.mock('../../utils/semaphore', () => ({
  fetchGroupMembers: jest.fn().mockResolvedValue([
    BigInt('0x1234567890abcdef'),
    BigInt('0xanothercommitment'),
  ]),
  buildGroup: jest.fn().mockReturnValue({
    root: BigInt('0xroot'),
    depth: 20,
    members: [BigInt('0x1234567890abcdef')],
  }),
  formatProofForContract: jest.fn().mockReturnValue({
    merkleTreeDepth: 20,
    merkleTreeRoot: '0xroot',
    nullifier: '0xnullifier',
    message: '1',
    scope: '0xpollId',
    points: ['1', '2', '3', '4', '5', '6', '7', '8'],
  }),
  isCommitmentRegistered: jest.fn().mockResolvedValue(true),
  validateProofLocally: jest.fn().mockResolvedValue(true),
}));

describe('useAnonymousVoting Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize in IDLE state', () => {
      const { result } = renderHook(() => useAnonymousVoting());

      expect(result.current.votingState).toBe(VotingState.IDLE);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should provide vote function', () => {
      const { result } = renderHook(() => useAnonymousVoting());

      expect(typeof result.current.vote).toBe('function');
    });

    it('should provide checkRegistration function', () => {
      const { result } = renderHook(() => useAnonymousVoting());

      expect(typeof result.current.checkRegistration).toBe('function');
    });
  });

  describe('checkRegistration', () => {
    it('should check if identity commitment is registered', async () => {
      const mockContract = {
        isVoterRegistered: jest.fn().mockResolvedValue(true),
      };
      mockGetAnonymousVotingContract.mockResolvedValue(mockContract);

      const { result } = renderHook(() => useAnonymousVoting());

      let isRegistered;
      await act(async () => {
        isRegistered = await result.current.checkRegistration('0xpollId');
      });

      expect(isRegistered).toBe(true);
    });

    it('should return false for unregistered commitment', async () => {
      const mockContract = {
        isVoterRegistered: jest.fn().mockResolvedValue(false),
      };
      mockGetAnonymousVotingContract.mockResolvedValue(mockContract);

      const { result } = renderHook(() => useAnonymousVoting());

      let isRegistered;
      await act(async () => {
        isRegistered = await result.current.checkRegistration('0xpollId');
      });

      expect(isRegistered).toBe(false);
    });
  });

  describe('getPollDetails', () => {
    it('should fetch poll details from contract', async () => {
      const mockPollData = {
        question: 'Test Question?',
        candidates: ['Option A', 'Option B'],
        endTime: BigInt(Date.now() + 3600000),
        isActive: true,
        totalVotes: BigInt(5),
      };
      
      const mockContract = {
        getPollDetails: jest.fn().mockResolvedValue(mockPollData),
      };
      mockGetAnonymousVotingContract.mockResolvedValue(mockContract);

      const { result } = renderHook(() => useAnonymousVoting());

      let pollDetails;
      await act(async () => {
        pollDetails = await result.current.getPollDetails('0xpollId');
      });

      expect(pollDetails.question).toBe('Test Question?');
      expect(pollDetails.candidates).toHaveLength(2);
    });
  });

  describe('vote', () => {
    it('should transition through correct states during voting', async () => {
      const mockTx = {
        wait: jest.fn().mockResolvedValue({ status: 1 }),
        hash: '0xtxhash',
      };
      const mockContract = {
        vote: jest.fn().mockResolvedValue(mockTx),
        isVoterRegistered: jest.fn().mockResolvedValue(true),
        hasVoted: jest.fn().mockResolvedValue(false),
      };
      mockGetAnonymousVotingContract.mockResolvedValue(mockContract);

      const { result } = renderHook(() => useAnonymousVoting());

      await act(async () => {
        await result.current.vote('0xpollId', 0);
      });

      expect(result.current.votingState).toBe(VotingState.SUCCESS);
    });

    it('should handle voting errors gracefully', async () => {
      const mockContract = {
        vote: jest.fn().mockRejectedValue(new Error('Transaction reverted')),
        isVoterRegistered: jest.fn().mockResolvedValue(true),
        hasVoted: jest.fn().mockResolvedValue(false),
      };
      mockGetAnonymousVotingContract.mockResolvedValue(mockContract);

      const { result } = renderHook(() => useAnonymousVoting());

      await act(async () => {
        await result.current.vote('0xpollId', 0);
      });

      expect(result.current.votingState).toBe(VotingState.ERROR);
      expect(result.current.error).toBeTruthy();
    });

    it('should prevent voting if already voted', async () => {
      const mockContract = {
        hasVoted: jest.fn().mockResolvedValue(true),
        isVoterRegistered: jest.fn().mockResolvedValue(true),
      };
      mockGetAnonymousVotingContract.mockResolvedValue(mockContract);

      const { result } = renderHook(() => useAnonymousVoting());

      await act(async () => {
        await result.current.vote('0xpollId', 0);
      });

      expect(result.current.error).toContain('already voted');
    });

    it('should prevent voting if not registered', async () => {
      const mockContract = {
        isVoterRegistered: jest.fn().mockResolvedValue(false),
        hasVoted: jest.fn().mockResolvedValue(false),
      };
      mockGetAnonymousVotingContract.mockResolvedValue(mockContract);

      // Override the mock for this test
      const { isCommitmentRegistered } = require('../../utils/semaphore');
      isCommitmentRegistered.mockResolvedValueOnce(false);

      const { result } = renderHook(() => useAnonymousVoting());

      await act(async () => {
        await result.current.vote('0xpollId', 0);
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  describe('resetState', () => {
    it('should reset to IDLE state', async () => {
      const mockContract = {
        vote: jest.fn().mockRejectedValue(new Error('Test error')),
        isVoterRegistered: jest.fn().mockResolvedValue(true),
        hasVoted: jest.fn().mockResolvedValue(false),
      };
      mockGetAnonymousVotingContract.mockResolvedValue(mockContract);

      const { result } = renderHook(() => useAnonymousVoting());

      // Get into error state
      await act(async () => {
        await result.current.vote('0xpollId', 0);
      });

      expect(result.current.votingState).toBe(VotingState.ERROR);

      // Reset
      act(() => {
        result.current.resetState();
      });

      expect(result.current.votingState).toBe(VotingState.IDLE);
      expect(result.current.error).toBeNull();
    });
  });

  describe('VotingState enum', () => {
    it('should have all required states', () => {
      expect(VotingState.IDLE).toBe('idle');
      expect(VotingState.CHECKING_REGISTRATION).toBe('checking_registration');
      expect(VotingState.FETCHING_GROUP).toBe('fetching_group');
      expect(VotingState.GENERATING_PROOF).toBe('generating_proof');
      expect(VotingState.SUBMITTING_VOTE).toBe('submitting_vote');
      expect(VotingState.SUCCESS).toBe('success');
      expect(VotingState.ERROR).toBe('error');
    });
  });
});
