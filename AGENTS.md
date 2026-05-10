# Agent Working Guide

This repository is the future-ready DeepSeek CLI platform framework. Treat it as a contract-first TypeScript monorepo, not as a single CLI script.

## Repository Rules

- Do not commit or publish `参考/`, `.codex/`, `node_modules/`, generated caches, or local secrets.
- Keep `src/apps/cli` and `src/apps/vscode-extension` as separate host adapters.
- Keep shared platform logic under `src/packages/*`.
- Do not import one app from another app.
- Do not bypass `@deepseek/platform-contracts` for cross-package APIs.
- Keep `platform-contracts` implementation-free and host-agnostic. It must not import Node filesystem/process APIs, VSCode APIs, model SDKs, or implementation packages.
- Prefer package imports such as `@deepseek/runtime` over cross-package relative imports.

## OpenSpec Workflow

- Active first framework change: `bootstrap-future-ready-cli-framework`.
- OpenSpec artifacts must remain bilingual where they describe planning, behavior, or implementation guidance.
- OpenSpec change artifacts must describe this project in its own terms. Do not copy external reference implementation details into OpenSpec.
- Validate OpenSpec changes with:

```bash
openspec validate bootstrap-future-ready-cli-framework --strict
```

## Architecture Boundaries

- `src/apps/cli`: thin CLI host adapter and npm publish target.
- `src/apps/vscode-extension`: thin VSCode host adapter skeleton.
- `src/packages/platform-contracts`: canonical contracts, DTOs, ids, envelopes, errors, and service interfaces.
- `src/packages/communication-protocol`: host/runtime protocol, codec, transport, and routing pipeline.
- `src/packages/runtime-message-bus`: internal runtime service bus and replayable records.
- `src/packages/runtime`: headless runtime kernel with injected dependencies.
- `src/packages/testing-regression`: deterministic fakes, replay harness, golden trace support, and matrix helpers.

## Verification

Run the relevant checks before committing framework changes:

```bash
npm run typecheck
npm run lint
npm test
node scripts/check-boundaries.mjs
```

`npm run lint` includes the extensible architecture lint framework in `scripts/lint-framework/`. It has TypeScript AST rules and JSON manifest rules for cross-package relative imports, app-to-app imports, implementation imports inside `platform-contracts`, host/process APIs inside contracts, runtime dependencies on testing fakes, workspace package names, public exports, publish metadata, dependency direction, and workspace dependency versions.

When adding architecture rules, put shared policy in `scripts/lint-framework/conventions.mjs`, add focused rule modules under `scripts/lint-framework/rules/`, and report through the lint context so every violation keeps the same `file:line:column [rule/id] message` format.

For release or acceptance work, also run:

```bash
npm run build:cli
npm run smoke:headless
npm run test:contracts
npm run test:integration
npm run test:golden
npm run test:versioning
npm run test:matrix
npm run test:e2e
```

Acceptance evidence lives under `tests/acceptance/`.

## npm Publishing

- Published CLI package name: `deepseek-agent-cli`.
- CLI package path: `src/apps/cli`.
- Build before publishing:

```bash
npm run build:cli
npm publish --workspace deepseek-agent-cli --access public
```

- Verify dry-run output before publishing:

```bash
npm publish --dry-run --workspace deepseek-agent-cli --access public
```

The npm tarball should contain only `README.md`, `dist/index.js`, and package metadata for the CLI package.

## Git Hygiene

- Check ignored and tracked reference material before pushing:

```bash
git status --short --ignored
git ls-files | Select-String -Pattern "^参考/|^参考\\"
```

- If the reference directory appears in tracked files, stop and remove it from the index before committing.
