import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSorobanCall, type UseSorobanCallOptions } from '../useSorobanCall';

vi.mock('@stellar/stellar-sdk', () => {
  class TransactionBuilder {
    static fromXDR = vi.fn(() => ({ kind: 'signed-tx' }));
    addOperation() {
      return this;
    }
    setTimeout() {
      return this;
    }
    build() {
      return { toXDR: () => 'built-xdr' };
    }
  }
  return { BASE_FEE: '100', TransactionBuilder };
});

function setup(overrides: Record<string, unknown> = {}) {
  const server = {
    getAccount: vi.fn().mockResolvedValue({}),
    prepareTransaction: vi
      .fn()
      .mockResolvedValue({ toXDR: () => 'prepared-xdr' }),
    sendTransaction: vi
      .fn()
      .mockResolvedValue({ status: 'PENDING', hash: 'abc123' }),
    getTransaction: vi
      .fn()
      .mockResolvedValue({ status: 'SUCCESS', returnValue: 42 }),
  };
  const contract = { call: vi.fn().mockReturnValue({ op: true }) };
  const walletAdapter = {
    id: 'freighter',
    name: 'Freighter',
    isAvailable: vi.fn(),
    connect: vi.fn(),
    signTransaction: vi.fn().mockResolvedValue('signed-xdr'),
  };
  const options = {
    contract,
    server,
    networkPassphrase: 'Test SDF Network ; September 2015',
    walletAdapter,
    sourcePublicKey: 'GABC',
    pollIntervalMs: 1,
    timeoutMs: 50,
    ...overrides,
  } as unknown as UseSorobanCallOptions;

  return { server, contract, walletAdapter, options };
}

describe('useSorobanCall', () => {
  it('starts idle', () => {
    const { options } = setup();
    const { result } = renderHook(() => useSorobanCall(options));
    expect(result.current.status).toBe('idle');
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.transactionHash).toBeNull();
  });

  it('builds, signs, submits and resolves with the return value', async () => {
    const { options, server, contract, walletAdapter } = setup();
    server.getTransaction
      .mockResolvedValueOnce({ status: 'NOT_FOUND' })
      .mockResolvedValueOnce({ status: 'SUCCESS', returnValue: 42 });

    const { result } = renderHook(() => useSorobanCall<number>(options));

    await act(async () => {
      await result.current.call('increment');
    });

    expect(contract.call).toHaveBeenCalledWith('increment');
    expect(walletAdapter.signTransaction).toHaveBeenCalledWith('prepared-xdr', {
      networkPassphrase: 'Test SDF Network ; September 2015',
      address: 'GABC',
    });
    expect(server.getTransaction).toHaveBeenCalledTimes(2);
    expect(result.current.status).toBe('success');
    expect(result.current.data).toBe(42);
    expect(result.current.transactionHash).toBe('abc123');
    expect(result.current.error).toBeNull();
  });

  it('stops polling and reports an error when confirmation times out', async () => {
    const { options, server } = setup({ timeoutMs: 20 });
    server.getTransaction.mockResolvedValue({ status: 'NOT_FOUND' });

    const { result } = renderHook(() => useSorobanCall(options));

    await act(async () => {
      await result.current.call('increment');
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error?.message).toMatch(/Timed out/);
    expect(result.current.error?.message).toContain('abc123');
  });

  it('reports an error when the network rejects the submission', async () => {
    const { options, server } = setup();
    server.sendTransaction.mockResolvedValue({ status: 'ERROR', hash: 'abc123' });

    const { result } = renderHook(() => useSorobanCall(options));

    await act(async () => {
      await result.current.call('increment');
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error?.message).toMatch(/submission failed.*ERROR/);
    expect(server.getTransaction).not.toHaveBeenCalled();
  });

  it('reports an error when the transaction fails on-chain', async () => {
    const { options, server } = setup();
    server.getTransaction.mockResolvedValue({ status: 'FAILED' });

    const { result } = renderHook(() => useSorobanCall(options));

    await act(async () => {
      await result.current.call('increment');
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error?.message).toMatch(/FAILED/);
  });

  it('surfaces a wallet rejection and does not submit', async () => {
    const { options, server, walletAdapter } = setup();
    walletAdapter.signTransaction.mockRejectedValue(new Error('User declined'));

    const { result } = renderHook(() => useSorobanCall(options));

    await act(async () => {
      await result.current.call('increment');
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error?.message).toBe('User declined');
    expect(server.sendTransaction).not.toHaveBeenCalled();
  });

  it('fails with a clear error when no wallet is connected', async () => {
    const { options, server } = setup({ walletAdapter: null });

    const { result } = renderHook(() => useSorobanCall(options));

    await act(async () => {
      await result.current.call('increment');
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error?.message).toMatch(/No wallet connected/);
    expect(server.getAccount).not.toHaveBeenCalled();
  });

  it('fails with a clear error when there is no source public key', async () => {
    const { options, server } = setup({ sourcePublicKey: '' });

    const { result } = renderHook(() => useSorobanCall(options));

    await act(async () => {
      await result.current.call('increment');
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error?.message).toMatch(/Missing source account/);
    expect(server.getAccount).not.toHaveBeenCalled();
  });

  it('returns to idle on reset', async () => {
    const { options, server } = setup();
    server.getTransaction.mockResolvedValue({ status: 'FAILED' });

    const { result } = renderHook(() => useSorobanCall(options));

    await act(async () => {
      await result.current.call('increment');
    });
    expect(result.current.status).toBe('error');

    act(() => {
      result.current.reset();
    });

    expect(result.current.status).toBe('idle');
    expect(result.current.error).toBeNull();
    expect(result.current.transactionHash).toBeNull();
  });

  it('keeps `call` stable across renders but uses the latest options', async () => {
    const { options, server } = setup();

    const { result, rerender } = renderHook(
      ({ opts }) => useSorobanCall(opts),
      { initialProps: { opts: options } }
    );
    const firstCall = result.current.call;

    rerender({ opts: { ...options, sourcePublicKey: 'GNEW' } });
    expect(result.current.call).toBe(firstCall);

    await act(async () => {
      await result.current.call('increment');
    });

    expect(server.getAccount).toHaveBeenCalledWith('GNEW');
  });
});
