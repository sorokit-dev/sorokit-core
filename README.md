# sorokit-core

[![CI](https://github.com/sorokit-dev/sorokit-core/actions/workflows/ci.yml/badge.svg)](https://github.com/sorokit-dev/sorokit-core/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

The foundational TypeScript engine and lightweight React hooks library for building reactive dApps on Stellar Soroban.

`sorokit-core` wraps the low-level pieces of connecting a React frontend to a Soroban contract — wallet connection, transaction signing, invoke/submit/poll — behind a small set of ergonomic hooks, so you don't have to hand-roll this per project.

> **Status: early development (0.x).** The API may change between minor versions. Freighter is fully supported today; Albedo and xBull are in progress (see [Wallets](#wallets)).

## Install

```bash
npm install @sorokit/core
```

Requires React 18 or newer.

## Usage

```tsx
import { useWallet, useContract, useSorobanCall } from '@sorokit/core';

function MyDapp() {
  const { account, adapter, status, connect } = useWallet();

  const { contract, server } = useContract({
    contractId: 'CABCD...',
    networkConfig: {
      network: 'TESTNET',
      networkPassphrase: 'Test SDF Network ; September 2015',
      rpcUrl: 'https://soroban-testnet.stellar.org',
    },
  });

  const { call, status: callStatus, data } = useSorobanCall({
    contract,
    server,
    networkPassphrase: 'Test SDF Network ; September 2015',
    walletAdapter: adapter, // null until a wallet is connected
    sourcePublicKey: account?.publicKey ?? '',
  });

  if (status !== 'connected') {
    return <button onClick={() => connect('freighter')}>Connect Freighter</button>;
  }

  return (
    <button onClick={() => call('increment')}>
      Call increment() — {callStatus}
    </button>
  );
}
```

`useSorobanCall` waits up to 60 seconds for a submitted transaction to be confirmed (poll every second). Override with `timeoutMs` and `pollIntervalMs` if you need different values. If the wait times out, the call ends in the `error` status and the message includes the transaction hash.

## Wallets

| Wallet | Status |
|---|---|
| Freighter | ✅ Implemented |
| Albedo | 🚧 Scaffolded, integration tracked |
| xBull | 🚧 Scaffolded, integration tracked |

## Package layout

```
src/
  hooks/        useWallet, useContract, useSorobanCall
  wallets/      Per-wallet adapters behind a common WalletAdapter interface
  types.ts      Shared types used across hooks and wallets
```

## Development

```bash
npm install
npm run typecheck  # TypeScript, no emit
npm test           # Vitest
npm run build      # bundles ESM + CJS + types with tsup
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full workflow.

## Related packages

- [`@sorokit/ui`](https://github.com/sorokit-dev/sorokit-ui) — Tailwind-styled components (connect button, transaction toasts) built on top of these hooks.
- [`sorokit-docs`](https://github.com/sorokit-dev/sorokit-docs) — Documentation site (in progress).

## Contributing

Contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) first. Issues that are part of the Stellar Wave Program carry the `Stellar Wave` label and a complexity rating; apply to them through the Drips Wave app and wait to be assigned before starting.

Please report security issues privately, as described in [SECURITY.md](SECURITY.md).

## Independence

`sorokit-core` is maintained by the [sorokit-dev](https://github.com/sorokit-dev) organization. It is an independent project and is not affiliated with the separate `Sorokit` GitHub organization.

## License

[MIT](LICENSE)
