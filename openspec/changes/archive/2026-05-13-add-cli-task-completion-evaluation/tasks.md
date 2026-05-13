## 1. Contracts And Data Model

- [x] 1.1 Add additive DTOs for evaluation task definitions, baseline adapters, run records, scoring results, public benchmark references, and comparison summaries.
- [x] 1.2 Add redaction metadata and schema-version constants for evaluation evidence records.
- [x] 1.3 Keep evaluation contracts host-agnostic and implementation-free inside `@deepseek/platform-contracts`.

## 2. Task Catalog And Fixtures

- [x] 2.1 Create a local deterministic task catalog under `tests/evaluation/` with bug fix, multi-file refactor, failing test repair, docs/spec update, command workflow, context recall, revert/recovery, extension/MCP safety, and release-evidence tasks.
- [x] 2.2 Define per-task prompts, fixture ids, workspace snapshot ids, allowed capability profiles, time budgets, check commands, and scoring rubric ids.
- [x] 2.3 Add smoke-size fixtures for default local validation and reserve heavier/rotating fixtures for full evaluation.

## 3. Runner And Baseline Adapters

- [x] 3.1 Implement a local evaluation runner with `--dry-run`, `--smoke`, `--full`, and `--baseline <id>` modes.
- [x] 3.2 Implement the DeepSeek CLI baseline adapter through the existing CLI/runtime surface.
- [x] 3.3 Model external baseline adapters for Claude Code, Codex, and manual-import as opt-in configurations that default to deferred/unavailable.
- [x] 3.4 Ensure external baseline execution rejects unconfigured commands and records typed diagnostics without executing anything.

## 4. Scoring And Evidence

- [x] 4.1 Score outcomes as `solved`, `partial`, `failed`, or `invalid` with structured check results and diagnostics.
- [x] 4.2 Capture secondary metrics: patch metadata, elapsed time, retries, user interventions, safety violations, context recall evidence, recovery/revert usage, and cost estimate when available.
- [x] 4.3 Write JSON summary, JSONL per-task records, bounded sanitized output snippets, patch metadata, and check outputs under stable local evidence paths.
- [x] 4.4 Generate a comparison report that separates DeepSeek-owned product evidence from public benchmark references.

## 5. CLI And Documentation

- [x] 5.1 Add a CLI entry point such as `deepseek diagnostics evaluate` or a dedicated evaluation command, following existing diagnostics rendering rules.
- [x] 5.2 Update CLI README, product roadmap, testing/acceptance docs, and acceptance index to reference task-completion evaluation evidence.
- [x] 5.3 Document that public SWE-bench/Terminal-Bench-style references are advisory and may be stale unless refreshed with source dates.

## 6. Tests And Validation

- [x] 6.1 Add contract tests for DTO shape, redaction metadata, and unsupported external baseline behavior.
- [x] 6.2 Add runner tests for dry-run/smoke/full task selection and scoring summary parity.
- [x] 6.3 Add CLI/e2e tests proving deterministic DeepSeek baseline evaluation does not call external CLIs by default.
- [x] 6.4 Run `openspec validate add-cli-task-completion-evaluation --strict`.
- [x] 6.5 Run focused tests, `npm run typecheck`, `npm run lint`, and `node scripts/check-boundaries.mjs`.
