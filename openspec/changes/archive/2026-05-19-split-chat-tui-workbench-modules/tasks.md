## 1. OpenSpec And Baseline

- [x] 1.1 Validate the change artifacts and confirm the architecture-scale guardrail delta.
- [x] 1.2 Measure current TUI central file sizes and identify extractable responsibilities.

## 2. Chat TUI Execution Split

- [x] 2.1 Extract plugin execution attachment and execution helpers from `chat-tui.ts`.
- [x] 2.2 Preserve `chat-tui.ts` public re-exports and internal bounded execution behavior.

## 3. Workbench Plugin Projection Split

- [x] 3.1 Extract plugin execution activity projection from `chat-tui-workbench.ts`.
- [x] 3.2 Extract plugin shelf item projection from `chat-tui-workbench.ts`.

## 4. Guardrail Retirement And Verification

- [x] 4.1 Remove TUI files from `plannedOversizedFiles` once line counts are below threshold.
- [x] 4.2 Run OpenSpec validation, typecheck, focused tests, lint, boundary checks, and diff checks.
