import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as freighterApi from '@stellar/freighter-api';
import { freighterAdapter } from '../freighter';
import { albedoAdapter } from '../albedo';
import { xbullAdapter } from '../xbull';
import { walletAdapters } from '../index';
import { WalletNotAvailableError } from '../types';

vi.mock('@stellar/freighter-api', () => ({
  isConnected: vi.fn(),
  requestAccess: vi.fn(),
  signTransaction: vi.fn(),
}));

describe('walletAdapters registry', () => {
  it('exposes freighter, albedo and xbull keyed by their ids', () => {
    expect(Object.keys(walletAdapters).sort()).toEqual([
      'albedo',
      'freighter',
      'xbull',
    ]);
    for (const [key, adapter] of Object.entries(walletAdapters)) {
      expect(adapter.id).toBe(key);
    }
  });
});

describe('freighterAdapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('is available when the extension reports it is present', async () => {
    vi.mocked(freighterApi.isConnected).mockResolvedValue({
      isConnected: true,
    } as never);
    await expect(freighterAdapter.isAvailable()).resolves.toBe(true);
  });

  it('is unavailable when the extension reports it is absent', async () => {
    vi.mocked(freighterApi.isConnected).mockResolvedValue({
      isConnected: false,
    } as never);
    await expect(freighterAdapter.isAvailable()).resolves.toBe(false);
  });

  it('is unavailable when the availability check throws', async () => {
    vi.mocked(freighterApi.isConnected).mockRejectedValue(new Error('boom'));
    await expect(freighterAdapter.isAvailable()).resolves.toBe(false);
  });

  it('refuses to connect when Freighter is not available', async () => {
    vi.mocked(freighterApi.isConnected).mockResolvedValue({
      isConnected: false,
    } as never);
    await expect(freighterAdapter.connect()).rejects.toBeInstanceOf(
      WalletNotAvailableError
    );
    expect(freighterApi.requestAccess).not.toHaveBeenCalled();
  });

  it('returns the public key once access is granted', async () => {
    vi.mocked(freighterApi.isConnected).mockResolvedValue({
      isConnected: true,
    } as never);
    vi.mocked(freighterApi.requestAccess).mockResolvedValue({
      address: 'GABC123',
    } as never);
    await expect(freighterAdapter.connect()).resolves.toEqual({
      publicKey: 'GABC123',
    });
  });

  it('throws when the user denies access', async () => {
    vi.mocked(freighterApi.isConnected).mockResolvedValue({
      isConnected: true,
    } as never);
    vi.mocked(freighterApi.requestAccess).mockResolvedValue({
      address: '',
      error: 'User declined access',
    } as never);
    await expect(freighterAdapter.connect()).rejects.toThrow(
      'User declined access'
    );
  });

  it('signs a transaction and forwards the network and address', async () => {
    vi.mocked(freighterApi.signTransaction).mockResolvedValue({
      signedTxXdr: 'signed-xdr',
      signerAddress: 'GABC123',
    } as never);

    await expect(
      freighterAdapter.signTransaction('unsigned-xdr', {
        networkPassphrase: 'Test SDF Network ; September 2015',
        address: 'GABC123',
      })
    ).resolves.toBe('signed-xdr');

    expect(freighterApi.signTransaction).toHaveBeenCalledWith('unsigned-xdr', {
      networkPassphrase: 'Test SDF Network ; September 2015',
      address: 'GABC123',
    });
  });

  it('throws when signing fails', async () => {
    vi.mocked(freighterApi.signTransaction).mockResolvedValue({
      signedTxXdr: '',
      signerAddress: '',
      error: 'User rejected signing',
    } as never);

    await expect(
      freighterAdapter.signTransaction('unsigned-xdr', {
        networkPassphrase: 'Test SDF Network ; September 2015',
      })
    ).rejects.toThrow('User rejected signing');
  });
});

describe('scaffolded adapters', () => {
  afterEach(() => {
    delete (window as unknown as Record<string, unknown>).xBullSDK;
  });

  it('albedo is always available but not yet implemented', async () => {
    await expect(albedoAdapter.isAvailable()).resolves.toBe(true);
    await expect(albedoAdapter.connect()).rejects.toThrow(/not yet implemented/);
    await expect(albedoAdapter.signTransaction('xdr', { networkPassphrase: 'x' })).rejects.toThrow(
      /not yet implemented/
    );
  });

  it('xbull is unavailable when the SDK is not injected', async () => {
    await expect(xbullAdapter.isAvailable()).resolves.toBe(false);
    await expect(xbullAdapter.connect()).rejects.toBeInstanceOf(
      WalletNotAvailableError
    );
  });

  it('xbull is not yet implemented when the SDK is present', async () => {
    (window as unknown as Record<string, unknown>).xBullSDK = {};
    await expect(xbullAdapter.isAvailable()).resolves.toBe(true);
    await expect(xbullAdapter.connect()).rejects.toThrow(/not yet implemented/);
  });
});
