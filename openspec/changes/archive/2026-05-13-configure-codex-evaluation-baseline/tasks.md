## 1. Parser And Contracts

- [x] 1.1 Add evaluation input parsing for `--allow-external-baseline`, `--baseline-command`, and repeatable `--baseline-arg`.
- [x] 1.2 Add additive DTO fields for external baseline command fingerprint, probe exit code, and bounded probe output.

## 2. External Baseline Probe

- [x] 2.1 Implement explicit opt-in external baseline probe through `PlatformRuntime.runProcess()` with argv arrays.
- [x] 2.2 Keep Codex deferred unless both allow flag and command are present.
- [x] 2.3 Record failed probes as unavailable diagnostics without throwing.
- [x] 2.4 Keep task runs planned only; do not send prompts or mutate workspace.

## 3. Docs And Tests

- [x] 3.1 Update CLI README and testing docs with Codex probe examples and safety limits.
- [x] 3.2 Add CLI tests for unconfigured, configured success, and configured failure behavior.
- [x] 3.3 Add e2e or contract tests proving external commands are not invoked without explicit allow.
- [x] 3.4 Run `openspec validate configure-codex-evaluation-baseline --strict`.
- [x] 3.5 Run focused tests, `npm run typecheck`, `npm run lint`, and `node scripts/check-boundaries.mjs`.
