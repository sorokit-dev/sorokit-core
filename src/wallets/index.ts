import { freighterAdapter } from './freighter';
import { albedoAdapter } from './albedo';
import { xbullAdapter } from './xbull';
import type { WalletAdapter } from './types';

export type { WalletAdapter } from './types';
export { WalletNotAvailableError } from './types';
export { freighterAdapter } from './freighter';
export { albedoAdapter } from './albedo';
export { xbullAdapter } from './xbull';

/** All wallet adapters shipped by sorokit-core, keyed by adapter id. */
export const walletAdapters: Record<string, WalletAdapter> = {
  freighter: freighterAdapter,
  albedo: albedoAdapter,
  xbull: xbullAdapter,
};
