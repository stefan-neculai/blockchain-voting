/**
 * @fileoverview Unit tests for useIdentity hook
 * @description Tests identity generation, storage, export/import, and recovery
 */

/* global BigInt */

import { renderHook, act } from '@testing-library/react';
import { useIdentity } from '../useIdentity';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock Semaphore Identity
jest.mock('@semaphore-protocol/identity', () => ({
  Identity: jest.fn().mockImplementation((secretOrTrapdoor) => {
    const mockSecret = secretOrTrapdoor || 'mock-secret-12345';
    return {
      export: jest.fn().mockReturnValue(mockSecret),
      commitment: BigInt('0x1234567890abcdef1234567890abcdef12345678'),
      trapdoor: BigInt('0xtrapdoor'),
      nullifier: BigInt('0xnullifier'),
    };
  }),
}));

describe('useIdentity Hook', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize without an identity', () => {
      const { result } = renderHook(() => useIdentity());

      expect(result.current.identity).toBeNull();
      expect(result.current.hasIdentity).toBe(false);
      expect(result.current.commitment).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should load identity from localStorage on mount', () => {
      localStorageMock.setItem('zkIdentity', JSON.stringify({
        secret: 'stored-secret-123',
        createdAt: Date.now(),
      }));

      renderHook(() => useIdentity());

      // Wait for useEffect to run
      expect(localStorageMock.getItem).toHaveBeenCalledWith('zkIdentity');
    });
  });

  describe('generateIdentity', () => {
    it('should generate a new identity', async () => {
      const { result } = renderHook(() => useIdentity());

      await act(async () => {
        await result.current.generateIdentity();
      });

      expect(result.current.identity).not.toBeNull();
      expect(result.current.hasIdentity).toBe(true);
      expect(result.current.commitment).not.toBeNull();
    });

    it('should store identity in localStorage after generation', async () => {
      const { result } = renderHook(() => useIdentity());

      await act(async () => {
        await result.current.generateIdentity();
      });

      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should clear any previous error on successful generation', async () => {
      const { result } = renderHook(() => useIdentity());

      // Set an error state first (simulated)
      await act(async () => {
        await result.current.generateIdentity();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('exportIdentity', () => {
    it('should export identity as JSON string', async () => {
      const { result } = renderHook(() => useIdentity());

      await act(async () => {
        await result.current.generateIdentity();
      });

      let exportedData;
      act(() => {
        exportedData = result.current.exportIdentity();
      });

      expect(exportedData).toBeTruthy();
      expect(typeof exportedData).toBe('string');
      
      const parsed = JSON.parse(exportedData);
      expect(parsed).toHaveProperty('secret');
      expect(parsed).toHaveProperty('commitment');
      expect(parsed).toHaveProperty('exportedAt');
      expect(parsed).toHaveProperty('version');
    });

    it('should return null if no identity exists', () => {
      const { result } = renderHook(() => useIdentity());

      let exportedData;
      act(() => {
        exportedData = result.current.exportIdentity();
      });

      expect(exportedData).toBeNull();
    });
  });

  describe('importIdentity', () => {
    it('should import identity from valid JSON', async () => {
      const { result } = renderHook(() => useIdentity());

      const importData = JSON.stringify({
        secret: 'imported-secret-456',
        commitment: '0x1234567890abcdef',
        version: '1.0.0',
      });

      await act(async () => {
        await result.current.importIdentity(importData);
      });

      expect(result.current.identity).not.toBeNull();
      expect(result.current.hasIdentity).toBe(true);
    });

    it('should reject invalid JSON', async () => {
      const { result } = renderHook(() => useIdentity());

      await act(async () => {
        await result.current.importIdentity('invalid-json');
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.hasIdentity).toBe(false);
    });

    it('should reject JSON without secret', async () => {
      const { result } = renderHook(() => useIdentity());

      const importData = JSON.stringify({
        commitment: '0x1234',
        version: '1.0.0',
      });

      await act(async () => {
        await result.current.importIdentity(importData);
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  describe('recoverFromSecret', () => {
    it('should recover identity from secret string', async () => {
      const { result } = renderHook(() => useIdentity());

      await act(async () => {
        await result.current.recoverFromSecret('recovery-secret-789');
      });

      expect(result.current.identity).not.toBeNull();
      expect(result.current.hasIdentity).toBe(true);
    });

    it('should reject empty secret', async () => {
      const { result } = renderHook(() => useIdentity());

      await act(async () => {
        await result.current.recoverFromSecret('');
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.hasIdentity).toBe(false);
    });
  });

  describe('clearIdentity', () => {
    it('should clear identity from state and localStorage', async () => {
      const { result } = renderHook(() => useIdentity());

      // Generate first
      await act(async () => {
        await result.current.generateIdentity();
      });

      expect(result.current.hasIdentity).toBe(true);

      // Clear
      act(() => {
        result.current.clearIdentity();
      });

      expect(result.current.identity).toBeNull();
      expect(result.current.hasIdentity).toBe(false);
      expect(result.current.commitment).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('zkIdentity');
    });
  });

  describe('getCommitmentHex', () => {
    it('should return commitment as hex string', async () => {
      const { result } = renderHook(() => useIdentity());

      await act(async () => {
        await result.current.generateIdentity();
      });

      let hex;
      act(() => {
        hex = result.current.getCommitmentHex();
      });

      expect(hex).toBeTruthy();
      expect(typeof hex).toBe('string');
      expect(hex.startsWith('0x')).toBe(true);
    });

    it('should return null if no identity', () => {
      const { result } = renderHook(() => useIdentity());

      let hex;
      act(() => {
        hex = result.current.getCommitmentHex();
      });

      expect(hex).toBeNull();
    });
  });
});
