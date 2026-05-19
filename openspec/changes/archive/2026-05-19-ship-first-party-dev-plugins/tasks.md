## 1. Shared Plugin Pack

- [x] 1.1 Create a host-agnostic first-party plugin pack package under `src/packages/*` with public exports and workspace metadata.
- [x] 1.2 Define manifests for `@deepseek/plugin-dev-checks`, `@deepseek/plugin-repo-navigator`, `@deepseek/plugin-git-review`, and `@deepseek/plugin-context-compactor`.
- [x] 1.3 Add stable integrity, compatibility, permissions, side effects, provenance, and contribution metadata for every manifest.
- [x] 1.4 Add deterministic helpers to list, validate, snapshot, and project the built-in plugin pack without executing plugin owners.

## 2. Projection and Contribution Wiring

- [x] 2.1 Normalize first-party plugin commands, palette entries, result-list providers, keymaps, renderer hints, and context metadata into command composition records.
- [x] 2.2 Feed first-party contribution records into CLI help, palette projection, TUI contribution summaries, and extension management JSON/JSONL output.
- [x] 2.3 Add diagnostics for disabled, incompatible, conflicting, or degraded first-party contributions.
- [x] 2.4 Ensure projection paths are inert and do not call command handlers, git, npm, model, MCP, hooks, process APIs, or filesystem mutation APIs.

## 3. Governed Command Adapters

- [x] 3.1 Implement predeclared dev-check command descriptors for OpenSpec validation, typecheck, lint, tests, boundary checks, and CLI build.
- [x] 3.2 Implement repo navigation commands and result lists over existing file search, grep, PageIndex recall, and project index boundaries.
- [x] 3.3 Implement git review status/diff/review projections as read-only governed commands with destructive git operations rejected.
- [x] 3.4 Add structured command results with text, JSON, JSONL, diagnostics, redaction metadata, suggested actions, and typed reference targets.

## 4. Context Compactor

- [x] 4.1 Implement `/context status`, `/context grep`, `/context describe`, `/context summarize`, `/context expand`, `/context budget`, and `/context pin` command routing.
- [x] 4.2 Route context compactor operations through `LosslessContextManager` and preserve reversible summary coverage metadata.
- [x] 4.3 Add bounded result-list items for lossless nodes, summary nodes, expanded nodes, budget findings, and pinned context targets.
- [x] 4.4 Ensure all context compactor text, JSON, JSONL, palette, and TUI output remains redacted and never dumps raw transcript text in status views.
- [x] 4.5 Keep context pinning scoped to session/palette references and avoid automatic permanent-memory writes.

## 5. CLI and TUI Integration

- [x] 5.1 Add chat slash aliases and help projection for first-party plugin commands, especially `/context`.
- [x] 5.2 Show bounded first-party plugin readiness, counts, and diagnostics in TUI startup/status without cluttering the prompt.
- [x] 5.3 Add scriptable CLI entrypoints or existing command-system routes for plugin pack listing, diagnostics, and supported first-party command invocation.
- [x] 5.4 Update README and CLI package README with first-party plugin scope, non-goals, and safe usage examples.

## 6. Verification and Acceptance

- [x] 6.1 Add contract tests for manifest validation, deterministic ordering, permission metadata, inert projection, and contribution conflicts.
- [x] 6.2 Add CLI/chat tests for first-party help, palette entries, TUI summaries, JSON/JSONL output, and typed error handling.
- [x] 6.3 Add context compactor tests for status, grep, describe, summarize, expand, budget, pin/reference, restart recovery, reversibility, and redaction.
- [x] 6.4 Add dev-check tests that reject unsupported arguments and free-form shell fragments without process execution.
- [x] 6.5 Add git review tests proving read-only behavior and rejection of commit, checkout, reset, clean, merge, rebase, push, and branch deletion operations.
- [x] 6.6 Update release readiness diagnostics and acceptance evidence to include the first-party plugin pack.
- [x] 6.7 Run `openspec validate ship-first-party-dev-plugins --strict`, `npm run typecheck`, `npm run lint`, `npm test`, `node scripts/check-boundaries.mjs`, and `npm run build:cli`.
