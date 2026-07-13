import {
  isConnected,
  requestAccess,
  signTransaction as freighterSignTransaction,
} from '@stellar/freighter-api';
import type { WalletAccount } from '../types';
import { WalletAdapter, WalletNotAvailableError } from './types';

/**
 * Adapter for the Freighter browser extension.
 *
 * Freighter's own API already returns { address } / { error } shaped
 * responses rather than throwing for "not connected" style failures,
 * so we normalize those into thrown errors here to keep the
 * WalletAdapter contract consistent across wallets.
 */
export const freighterAdapter: WalletAdapter = {
  id: 'freighter',
  name: 'Freighter',

  async isAvailable() {
    try {
      const result = await isConnected();
      // isConnected() reports extension presence, not auth state.
      return Boolean(result?.isConnected ?? result);
    } catch {
      return false;
    }
  },

  async connect(): Promise<WalletAccount> {
    const available = await this.isAvailable();
    if (!available) {
      throw new WalletNotAvailableError('Freighter');
    }

    const result = await requestAccess();
    if ('error' in result && result.error) {
      throw new Error(result.error);
    }

    return { publicKey: result.address };
  },

  async signTransaction(
    xdr: string,
    opts: { networkPassphrase: string; address?: string }
  ): Promise<string> {
    const result = await freighterSignTransaction(xdr, {
      networkPassphrase: opts.networkPassphrase,
      address: opts.address,
    });

    if ('error' in result && result.error) {
      throw new Error(result.error);
    }

    return result.signedTxXdr;
  },
};
