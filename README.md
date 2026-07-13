# Sorokit Core (`@sorokit/core`)

The robust TypeScript engine and state-management core powering the Sorokit SDK ecosystem. 

Connecting a modern frontend to high-performance Soroban WASM smart contracts shouldn't require writing complex, low-level integration layers from scratch. **Sorobun Core** bridges this gap, giving JavaScript and TypeScript developers a suite of clean, developer-friendly React hooks and wallet-connection abstractions.

### Key Capabilities
* **Low-Level Wallet Abstraction:** Unified interface supporting Freighter, Albedo, and xBull wallets with automatic network detection and connection state management.
* **Ergonomic Smart Contract Hooks:** `useContract` and `useSorobanCall` hooks that provide typed responses mapped directly from your contract’s WASM interface, removing manual hex encoding/decoding.
* **Transaction Lifecycle Tracking:** Global state management that natively monitors transaction submissions from `pending` through to `success` or `error` states.

*Build reactive, fast dApps on Stellar without the boilerplate.*
