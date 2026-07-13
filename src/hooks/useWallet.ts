import { useCallback, useState } from 'react';
import { walletAdapters, type WalletAdapter } from '../wallets';
import type { WalletAccount, WalletConnectionState } from '../types';

export interface UseWalletResult {
  account: WalletAccount | null;
  status: WalletConnectionState;
  error: Error | null;
  /** Connect using a specific adapter id: 'freighter' | 'albedo' | 'xbull'. */
  connect: (walletId: string) => Promise<void>;
  disconnect: () => void;
  /** The adapter currently in use, if connected. */
  adapter: WalletAdapter | null;
}

/**
 * Wallet connection hook covering Freighter, Albedo, and xBull behind
 * one interface. This is the entry point most dApps built with
 * sorokit-core will reach for first — everything else (useContract,
 * useSorobanCall) assumes a connected account from this hook.
 */
export function useWallet(): UseWalletResult {
  const [account, setAccount] = useState<WalletAccount | null>(null);
  const [status, setStatus] = useState<WalletConnectionState>('disconnected');
  const [error, setError] = useState<Error | null>(null);
  const [adapter, setAdapter] = useState<WalletAdapter | null>(null);

  const connect = useCallback(async (walletId: string) => {
    const selected = walletAdapters[walletId];
    if (!selected) {
      setError(new Error(`Unknown wallet id: ${walletId}`));
      setStatus('error');
      return;
    }

    setStatus('connecting');
    setError(null);

    try {
      const connectedAccount = await selected.connect();
      setAccount(connectedAccount);
      setAdapter(selected);
      setStatus('connected');
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setStatus('error');
    }
  }, []);

  const disconnect = useCallback(() => {
    adapter?.disconnect?.();
    setAccount(null);
    setAdapter(null);
    setStatus('disconnected');
    setError(null);
  }, [adapter]);

  return { account, status, error, connect, disconnect, adapter };
}
