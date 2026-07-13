import { useCallback, useState } from 'react';
import {
  BASE_FEE,
  TransactionBuilder,
  type xdr as StellarXdr,
} from '@stellar/stellar-sdk';
import type { UseContractResult } from './useContract';
import type { WalletAdapter } from '../wallets/types';
import type { SorobanCallResult, SorobanCallStatus } from '../types';

export interface UseSorobanCallOptions {
  contract: UseContractResult['contract'];
  server: UseContractResult['server'];
  networkPassphrase: string;
  walletAdapter: WalletAdapter;
  sourcePublicKey: string;
}

export interface UseSorobanCallReturn<T> extends SorobanCallResult<T> {
  /** Invoke a contract method by name with the given XDR-encoded args. */
  call: (method: string, args?: StellarXdr.ScVal[]) => Promise<void>;
  reset: () => void;
}

const idleResult = {
  data: null,
  error: null,
  transactionHash: null,
};

/**
 * Drives a single Soroban contract invocation through its full
 * lifecycle — build, sign (via the connected wallet), submit, and poll
 * for a result — while exposing a status enum so UI (e.g. sorokit-ui's
 * tx toast component) can render consistent state without each app
 * re-implementing this polling loop.
 */
export function useSorobanCall<T = unknown>(
  options: UseSorobanCallOptions
): UseSorobanCallReturn<T> {
  const [status, setStatus] = useState<SorobanCallStatus>('idle');
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStatus('idle');
    setData(null);
    setError(null);
    setTransactionHash(null);
  }, []);

  const call = useCallback(
    async (method: string, args: StellarXdr.ScVal[] = []) => {
      const { contract, server, networkPassphrase, walletAdapter, sourcePublicKey } =
        options;

      setError(null);
      setData(null);

      try {
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
        setTransactionHash(sendResult.hash);

        // Poll until the transaction leaves the PENDING state.
        let response = await server.getTransaction(sendResult.hash);
        while (response.status === 'NOT_FOUND') {
          await new Promise((resolve) => setTimeout(resolve, 1000));
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
    [options]
  );

  return { status, data, error, transactionHash, call, reset };
}
