import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BASE_FEE,
  TransactionBuilder,
  type xdr as StellarXdr,
} from '@stellar/stellar-sdk';
import type { UseContractResult } from './useContract';
import type { WalletAdapter } from '../wallets/types';
import type { SorobanCallResult, SorobanCallStatus } from '../types';

const DEFAULT_POLL_INTERVAL_MS = 1000;
const DEFAULT_TIMEOUT_MS = 60_000;

export interface UseSorobanCallOptions {
  contract: UseContractResult['contract'];
  server: UseContractResult['server'];
  networkPassphrase: string;
  /**
   * The adapter returned by `useWallet()`. It is `null` until a wallet is
   * connected; calling `call()` in that state sets an error status rather
   * than throwing.
   */
  walletAdapter: WalletAdapter | null;
  sourcePublicKey: string;
  /** How often to poll for the transaction result, in ms. Defaults to 1000. */
  pollIntervalMs?: number;
  /**
   * How long to wait for the transaction to be confirmed before giving up,
   * in ms. Defaults to 60000. The transaction may still land on-chain after
   * a timeout; the error message includes the hash so it can be looked up.
   */
  timeoutMs?: number;
}

export interface UseSorobanCallReturn<T> extends SorobanCallResult<T> {
  /** Invoke a contract method by name with the given XDR-encoded args. */
  call: (method: string, args?: StellarXdr.ScVal[]) => Promise<void>;
  reset: () => void;
}

/**
 * Drives a single Soroban contract invocation through its full
 * lifecycle — build, sign (via the connected wallet), submit, and poll
 * for a result — while exposing a status enum so UI (e.g. sorokit-ui's
 * tx toast component) can render consistent state without each app
 * re-implementing this polling loop.
 *
 * `call` keeps a stable identity across renders and always uses the
 * latest options, so it is safe to pass to memoized children or effects.
 */
export function useSorobanCall<T = unknown>(
  options: UseSorobanCallOptions
): UseSorobanCallReturn<T> {
  const [status, setStatus] = useState<SorobanCallStatus>('idle');
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);

  // Always read the latest options without making `call` change identity
  // every time the caller passes a fresh options object. The ref is updated
  // in an effect rather than during render, which is unsafe under concurrent
  // rendering and is flagged by the react-hooks lint rules.
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  });

  const reset = useCallback(() => {
    setStatus('idle');
    setData(null);
    setError(null);
    setTransactionHash(null);
  }, []);

  const call = useCallback(
    async (method: string, args: StellarXdr.ScVal[] = []) => {
      const {
        contract,
        server,
        networkPassphrase,
        walletAdapter,
        sourcePublicKey,
        pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
        timeoutMs = DEFAULT_TIMEOUT_MS,
      } = optionsRef.current;

      setError(null);
      setData(null);
      setTransactionHash(null);

      try {
        if (!walletAdapter) {
          throw new Error(
            'No wallet connected. Connect a wallet before calling a contract.'
          );
        }
        if (!sourcePublicKey) {
          throw new Error(
            'Missing source account. Connect a wallet to get a public key.'
          );
        }

        setStatus('building');
        const sourceAccount = await server.getAccount(sourcePublicKey);

        const builtTx = new TransactionBuilder(sourceAccount, {
          fee: BASE_FEE,
          networkPassphrase,
        })
          .addOperation(contract.call(method, ...args))
          .setTimeout(30)
          .build();

        const preparedTx = await server.prepareTransaction(builtTx);

        setStatus('signing');
        const signedXdr = await walletAdapter.signTransaction(
          preparedTx.toXDR(),
          { networkPassphrase, address: sourcePublicKey }
        );

        setStatus('submitting');
        const signedTx = TransactionBuilder.fromXDR(signedXdr, networkPassphrase);
        const sendResult = await server.sendTransaction(signedTx);

        if (sendResult.status === 'ERROR' || sendResult.status === 'TRY_AGAIN_LATER') {
          throw new Error(
            `Transaction submission failed with status: ${sendResult.status}`
          );
        }
        setTransactionHash(sendResult.hash);

        // Poll until the transaction is no longer NOT_FOUND, or give up.
        const deadline = Date.now() + timeoutMs;
        let response = await server.getTransaction(sendResult.hash);
        while (response.status === 'NOT_FOUND') {
          if (Date.now() >= deadline) {
            throw new Error(
              `Timed out after ${timeoutMs}ms waiting for transaction ${sendResult.hash} to be confirmed.`
            );
          }
          await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
          response = await server.getTransaction(sendResult.hash);
        }

        if (response.status !== 'SUCCESS') {
          throw new Error(`Transaction failed with status: ${response.status}`);
        }

        setData((response.returnValue as unknown as T) ?? null);
        setStatus('success');
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setStatus('error');
      }
    },
    []
  );

  return { status, data, error, transactionHash, call, reset };
}
