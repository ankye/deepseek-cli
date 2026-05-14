## 1. Evaluation Contracts

- [x] 1.1 Add OpenSpec requirements for live DeepSeek webpage execution staying opt-in and checker-gated.
- [x] 1.2 Validate `run-live-deepseek-webpage-generation` with strict OpenSpec validation.

## 2. CLI Evaluation Wiring

- [x] 2.1 Thread top-level `--live` into `collectCliEvaluation` options.
- [x] 2.2 Add task-scoped DeepSeek live command args: `--live`, write-capable tool projection, jsonl output, timeout.
- [x] 2.3 Update webpage task prompt so it strongly requires writing local files under `generated-webpage`.

## 3. Verification

- [x] 3.1 Add deterministic tests proving live evaluation command propagation without network calls.
- [x] 3.2 Run focused CLI evaluation tests and webpage checker tests.
- [x] 3.3 Run the real `diagnostics evaluate --live --full --execute-task eval.webpage.generation` flow and verify the checker passes.
- [x] 3.4 Run typecheck/lint/relevant tests after integration.
