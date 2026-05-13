## 1. OpenSpec

- [x] 1.1 Create bilingual proposal, design, and spec deltas for multi-baseline comparison.
- [x] 1.2 Validate `run-isolated-codex-webpage-evaluation` with strict OpenSpec validation.

## 2. Contracts And CLI Options

- [x] 2.1 Extend evaluation contracts with baseline aggregate metrics and gap findings.
- [x] 2.2 Parse comparison flags for repeatable baselines, task execution, and Codex/Claude command overrides.
- [x] 2.3 Keep external baseline execution opt-in and dry-run safe by default.

## 3. Evaluation Execution

- [x] 3.1 Implement isolated workspace execution for `eval.webpage.generation`.
- [x] 3.2 Add DeepSeek, Codex, and Claude baseline adapters with safe defaults and bounded output previews.
- [x] 3.3 Run the webpage checker against isolated generated artifacts and map results to solved, failed, or invalid outcomes.
- [x] 3.4 Collect first-run success, check pass rate, correction signals, command failures, file counts, byte totals, and structure scores.
- [x] 3.5 Derive per-baseline aggregates and gap findings from task-run records.

## 4. Tests And Verification

- [x] 4.1 Add focused contract tests for parsing, multi-baseline dry-run, external opt-in, and isolated execution records.
- [x] 4.2 Run focused tests for CLI evaluation and webpage checker.
- [x] 4.3 Run typecheck, lint, boundary checks, and strict OpenSpec validation.
