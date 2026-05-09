## 1. Contracts / 契约

- [x] 1.1 Add secret classification, redaction decision, sandbox capability, sandbox decision, and audit DTOs to `platform-contracts`.
- [x] 1.2 Extend execution envelope and capability manifest metadata for secret exposure, resource scope, sandbox requirements, and audit evidence.
- [x] 1.3 Add contract tests for DTO serializability, schema versions, redaction metadata, and implementation-free contracts.

## 2. Secret Classification And Redaction / Secret 分类与脱敏

- [x] 2.1 Implement deterministic secret classifier for API keys, bearer tokens, private key blocks, env-style credentials, credential refs, and explicit secret redaction classes.
- [x] 2.2 Implement redaction helpers for runtime events, protocol events, session events, cache entries, golden traces, and CLI/VSCode output summaries.
- [x] 2.3 Ensure context projection consumes the shared secret decision shape and cannot expose policy-denied content.

## 3. Sandbox Policy / Sandbox Policy

- [x] 3.1 Extend policy decisions to evaluate filesystem, process, shell, network, environment, native, timeout, and platform degradation dimensions.
- [x] 3.2 Implement deterministic sandbox profile selection for allow, ask, deny, rewrite, and require-sandbox decisions.
- [x] 3.3 Ensure runtime rejects invalid or incomplete sandbox metadata before scheduler execution.
- [x] 3.4 Ensure core coding tools declare required sandbox/resource metadata in manifests and envelopes.

## 4. Platform Matrix / 平台矩阵

- [x] 4.1 Extend fake platform descriptors with shell, process, filesystem, network, native, secure-storage, read-only, WSL, and remote/no-shell capability states.
- [x] 4.2 Ensure policy receives platform metadata before filesystem write and process/shell execution.
- [x] 4.3 Add deterministic degraded-platform decisions for missing shell, read-only filesystem, missing secure storage, missing network, and missing native capability.

## 5. Architecture Lint / 架构 Lint

- [x] 5.1 Extend lint to reject direct secret/env/filesystem/process/native/sandbox primitive access outside approved owners and tests.
- [x] 5.2 Add negative lint fixtures for host adapters, providers, plugins, and feature packages attempting bypasses.

## 6. Regression Coverage / 回归覆盖

- [x] 6.1 Add unit tests for secret classifier, redaction helpers, resource scope analyzer, and sandbox profile selection.
- [x] 6.2 Add contract tests for policy/envelope/platform/sandbox DTOs.
- [x] 6.3 Add integration tests for read/write/search/shell decisions through kernel, policy, scheduler, sandbox, bus, and session events.
- [x] 6.4 Add golden replay tests for allow, deny, rewrite, require-sandbox, and degraded-platform audit evidence.
- [x] 6.5 Add matrix tests for fake Windows, macOS, Linux, WSL, remote/no-shell, read-only filesystem, missing secure storage, missing network, and missing native capability.
- [x] 6.6 Add e2e smoke proving raw secret fixtures never appear in text, stream-json, traces, cache artifacts, snapshots, or assertion messages.

## 7. Verification And Archive / 校验与归档

- [x] 7.1 Run `openspec validate harden-secret-and-sandbox-policy --type change --strict`.
- [x] 7.2 Run `npm run typecheck`, `npm run lint`, `npm test`, and `node scripts/check-boundaries.mjs`.
- [x] 7.3 Run relevant contract, integration, golden, compatibility, matrix, e2e, and `npm run build:cli` checks.
- [x] 7.4 Record acceptance evidence, sync specs, validate all specs, and archive the change.
