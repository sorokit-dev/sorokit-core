# sorokit-core

The foundational TypeScript engine and lightweight React hooks library for building seamless, reactive dApps on Stellar Soroban. 🚀

`sorokit-core` wraps the low-level pieces of connecting a React frontend to a Soroban contract — wallet connection, transaction signing, invoke/submit/poll — behind a small set of ergonomic hooks, so you don't have to hand-roll this per project.

## Install

```bash
npm install @sorokit/core
```

## Usage

```tsx
import { useWallet, useContract, useSorobanCall } from '@sorokit/core';

function MyDapp() {
  const { account, status, connect } = useWallet();

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
    walletAdapter: /* the adapter returned by useWallet */,
    sourcePublicKey: account?.publicKey ?? '',
  });

  if (status !== 'connected') {
    return <button onClick={() => connect('freighter')}>Connect Freighter</button>;
  }

  return <button onClick={() => call('increment')}>Call increment()</button>;
}
```

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
npm run build      # bundles with tsup
npm run typecheck
npm run test
```

## Related packages

- [`@sorokit/ui`](https://github.com/sorokit-dev/sorokit-ui) — Tailwind-styled components (connect button, tx status toast) built on top of these hooks.
- [`sorokit-docs`](https://github.com/sorokit-dev/sorokit-docs) — Full docs and live sandboxes.

## Contributing

Issues tagged for the Stellar Wave Program are labeled accordingly — see open issues for scoped, complexity-rated tasks if you'd like to contribute.

## License

MIT
