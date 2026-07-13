// Hooks
export { useWallet } from './hooks/useWallet';
export type { UseWalletResult } from './hooks/useWallet';

export { useContract } from './hooks/useContract';
export type { UseContractOptions, UseContractResult } from './hooks/useContract';

export { useSorobanCall } from './hooks/useSorobanCall';
export type {
  UseSorobanCallOptions,
  UseSorobanCallReturn,
} from './hooks/useSorobanCall';

// Wallet adapters
export {
  walletAdapters,
  freighterAdapter,
  albedoAdapter,
  xbullAdapter,
  WalletNotAvailableError,
} from './wallets';
export type { WalletAdapter } from './wallets';

// Shared types
export type {
  SorobanNetwork,
  NetworkConfig,
  WalletConnectionState,
  WalletAccount,
  SorobanCallStatus,
  SorobanCallResult,
} from './types';
