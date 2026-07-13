/**
 * Networks supported by the SDK. Mirrors the passphrases used by
 * @stellar/stellar-sdk so contract calls and wallet signing agree
 * on which network they're targeting.
 */
export type SorobanNetwork = 'TESTNET' | 'PUBLIC' | 'FUTURENET';

export interface NetworkConfig {
  network: SorobanNetwork;
  networkPassphrase: string;
  rpcUrl: string;
}

/** Connection status for a wallet adapter. */
export type WalletConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error';

export interface WalletAccount {
  publicKey: string;
  network?: SorobanNetwork;
}

/**
 * Lifecycle states for an in-flight Soroban transaction, surfaced by
 * useSorobanCall so UI layers (e.g. sorokit-ui's tx toast) can render
 * consistent status without re-implementing this state machine per app.
 */
export type SorobanCallStatus =
  | 'idle'
  | 'building'
  | 'signing'
  | 'submitting'
  | 'success'
  | 'error';

export interface SorobanCallResult<T = unknown> {
  status: SorobanCallStatus;
  data: T | null;
  error: Error | null;
  transactionHash: string | null;
}
