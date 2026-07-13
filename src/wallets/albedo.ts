import type { WalletAccount } from '../types';
import { WalletAdapter } from './types';

/**
 * Adapter for Albedo (albedo.link) — a web-based signer, so
 * "isAvailable" is effectively always true (no extension to detect).
 *
 * NOTE: this is a scaffold. Albedo's actual `albedo-js` client
 * (window.albedo.publicKey() / window.albedo.tx()) needs to be wired
 * in and verified against the current SDK version before shipping —
 * tracked as a follow-up issue, not left silently wrong.
 */
export const albedoAdapter: WalletAdapter = {
  id: 'albedo',
  name: 'Albedo',

  async isAvailable() {
    return true;
  },

  async connect(): Promise<WalletAccount> {
    throw new Error(
      'Albedo adapter not yet implemented — see tracked issue for albedo-js integration.'
    );
  },

  async signTransaction(): Promise<string> {
    throw new Error(
      'Albedo adapter not yet implemented — see tracked issue for albedo-js integration.'
    );
  },
};
