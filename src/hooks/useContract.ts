import { useMemo } from 'react';
import { Contract, rpc as SorobanRpc } from '@stellar/stellar-sdk';
import type { NetworkConfig } from '../types';

export interface UseContractOptions {
  contractId: string;
  networkConfig: NetworkConfig;
}

export interface UseContractResult {
  /** Raw @stellar/stellar-sdk Contract instance for the given id. */
  contract: Contract;
  /** RPC server instance, shared so callers don't each spin up their own. */
  server: SorobanRpc.Server;
}

/**
 * Binds a contract address to an RPC connection for a given network.
 * This is intentionally the thin layer — useSorobanCall builds on top
 * of it to handle the actual invoke/sign/submit lifecycle, so this
 * hook stays cheap to call from anywhere a contract reference is needed
 * (e.g. read-only lookups, not just calls that need signing).
 */
export function useContract({
  contractId,
  networkConfig,
}: UseContractOptions): UseContractResult {
  const contract = useMemo(() => new Contract(contractId), [contractId]);

  const server = useMemo(
    () =>
      new SorobanRpc.Server(networkConfig.rpcUrl, {
        allowHttp: networkConfig.rpcUrl.startsWith('http://'),
      }),
    [networkConfig.rpcUrl]
  );

  return { contract, server };
}
