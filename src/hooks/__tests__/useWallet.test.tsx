import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useWallet } from '../useWallet';

vi.mock('../../wallets', () => ({
  walletAdapters: {
    freighter: {
      id: 'freighter',
      name: 'Freighter',
      isAvailable: vi.fn().mockResolvedValue(true),
      connect: vi.fn(),
      signTransaction: vi.fn(),
      disconnect: vi.fn(),
    },
  },
}));

import { walletAdapters } from '../../wallets';

describe('useWallet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts disconnected', () => {
    const { result } = renderHook(() => useWallet());
    expect(result.current.status).toBe('disconnected');
    expect(result.current.account).toBeNull();
  });

  it('transitions to connected on successful connect', async () => {
    vi.mocked(walletAdapters.freighter.connect).mockResolvedValue({
      publicKey: 'GABC123',
    });

    const { result } = renderHook(() => useWallet());

    await act(async () => {
      await result.current.connect('freighter');
    });

    await waitFor(() => {
      expect(result.current.status).toBe('connected');
    });
    expect(result.current.account?.publicKey).toBe('GABC123');
  });

  it('transitions to error state when connect rejects', async () => {
    vi.mocked(walletAdapters.freighter.connect).mockRejectedValue(
      new Error('User rejected access')
    );

    const { result } = renderHook(() => useWallet());

    await act(async () => {
      await result.current.connect('freighter');
    });

    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });
    expect(result.current.error?.message).toBe('User rejected access');
  });

  it('errors out for an unknown wallet id without throwing', async () => {
    const { result } = renderHook(() => useWallet());

    await act(async () => {
      await result.current.connect('not-a-real-wallet');
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error?.message).toMatch(/Unknown wallet id/);
  });

  it('resets state on disconnect', async () => {
    vi.mocked(walletAdapters.freighter.connect).mockResolvedValue({
      publicKey: 'GABC123',
    });

    const { result } = renderHook(() => useWallet());

    await act(async () => {
      await result.current.connect('freighter');
    });
    act(() => {
      result.current.disconnect();
    });

    expect(result.current.status).toBe('disconnected');
    expect(result.current.account).toBeNull();
  });
});
