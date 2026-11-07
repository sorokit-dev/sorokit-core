# Contributing to sorokit-core

Thanks for helping build a better developer experience for Soroban dApps. This guide covers everything you need to open a good pull request.

## Ways to contribute

- Fix bugs and improve error handling in the hooks and wallet adapters
- Finish the Albedo and xBull wallet adapters (see the wallet table in the README)
- Add tests, examples, and documentation
- Review open pull requests

Look for issues labeled `good first issue` or `help wanted`. Issues that are part of the **Stellar Wave Program** carry the `Stellar Wave` label and a complexity rating.

## Stellar Wave issues

If you want to work on a `Stellar Wave` issue, **apply through the [Drips Wave app](https://www.drips.network/wave)** and wait to be assigned. Please do not start work, or open a pull request, on a Wave issue that is assigned to someone else. Reference the issue in your pull request description with `Closes #<number>`.

Read the [Drips Wave terms](https://docs.drips.network/wave/terms-and-rules) before applying. In particular, low-effort submissions and untested or not-understood AI-generated code are not acceptable here or in the program.

## Development setup

Requirements: Node.js 20 or newer and npm.

```bash
git clone https://github.com/sorokit-dev/sorokit-core.git
cd sorokit-core
npm install
```

Useful commands:

```bash
npm run lint        # ESLint flat config
npm run typecheck   # TypeScript, no emit
npm test            # Vitest (jsdom)
npm run build       # tsup, outputs ESM + CJS + types to dist/
```

All four must pass before you open a pull request. CI runs the same commands on Node 20 and 22.

## Making a change

1. Fork the repository and create a branch from `main` (`fix/short-description` or `feat/short-description`).
2. Keep the change focused. One logical change per pull request.
3. Add or update tests. Hooks are tested with Vitest and Testing Library; mock `@stellar/stellar-sdk` and wallet packages rather than hitting the network.
4. Update the README or doc comments if behavior or public API changes.
5. Open a pull request and fill in the template. Explain what you tested.

## Commit messages

Use short, imperative messages, optionally with a prefix: `fix: stop polling after timeout`, `feat: add albedo adapter`, `docs: clarify useWallet example`.

## Public API changes

Anything exported from `src/index.ts` is public API. Prefer additive, backward-compatible changes, and call out breaking changes clearly in the pull request.

## Code of conduct

By participating you agree to follow our [Code of Conduct](CODE_OF_CONDUCT.md). Security issues should be reported privately, see [SECURITY.md](SECURITY.md).

## License

By contributing, you agree that your contributions are licensed under the MIT License.
