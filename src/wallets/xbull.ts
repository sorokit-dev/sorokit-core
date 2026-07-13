import type { WalletAccount } from '../types';
import { WalletAdapter, WalletNotAvailableError } from './types';

/**
 * Adapter for the xBull browser extension.
 *
 * NOTE: this is a scaffold. xBull exposes itself via `@creit.tech/xbull-wallet-connect`
 * or window.xBullSDK depending on integration path — needs to be wired
 * in and verified before shipping, tracked as a follow-up issue.
 */
export const xbullAdapter: WalletAdapter = {
  id: 'xbull',
  name: 'xBull',

  async isAvailable() {
    return typeof window !== 'undefined' && 'xBullSDK' in window;
  },

  async connect(): Promise<WalletAccount> {
    const available = await this.isAvailable();
    if (!available) {
      throw new WalletNotAvailableError('xBull');
    }
    throw new Error(
      'xBull adapter not yet implemented — see tracked issue for xBullSDK integration.'
    );
  },

  async signTransaction(): Promise<string> {
    throw new Error(
      'xBull adapter not yet implemented — see tracked issue for xBullSDK integration.'
    );
  },
};
