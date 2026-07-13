import type { WalletAccount } from '../types';

/**
 * Common interface every supported wallet (Freighter, Albedo, xBull)
 * implements. useWallet talks only to this interface so the rest of
 * the SDK — and consuming apps — never branch on wallet identity.
 */
export interface WalletAdapter {
  /** Unique id used for selection + persistence, e.g. 'freighter'. */
  id: string;
  /** Human-readable name for UI display. */
  name: string;
  /** Whether the wallet's extension/API is present in this browser. */
  isAvailable(): Promise<boolean>;
  /** Request the user grant this dApp access, returning their account. */
  connect(): Promise<WalletAccount>;
  /** Sign a transaction XDR, returning the signed XDR string. */
  signTransaction(
    xdr: string,
    opts: { networkPassphrase: string; address?: string }
  ): Promise<string>;
  /** Optional: clear any local connection state. Not all wallets need this. */
  disconnect?(): Promise<void>;
}

export class WalletNotAvailableError extends Error {
  constructor(walletName: string) {
    super(`${walletName} is not installed or not available in this browser.`);
    this.name = 'WalletNotAvailableError';
  }
}
