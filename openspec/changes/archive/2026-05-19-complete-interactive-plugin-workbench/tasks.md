## 1. Execution Plane

- [x] 1.1 Add host-owned plugin workbench execution record types and helpers.
- [x] 1.2 Execute built-in plugin owner routes through the execution plane with bounded input normalization.
- [x] 1.3 Preserve deferred routes as execution records with fallback guidance and diagnostics.
- [x] 1.4 Prove execution never reads plugin-private handler/callback/execute metadata.

## 2. Palette And TUI Integration

- [x] 2.1 Add palette-facing plugin route execution helpers while keeping generic palette actions dry-run.
- [x] 2.2 Add TUI state support for recent plugin execution records and bounded retention.
- [x] 2.3 Attach plugin execution result lists to TUI composition and active targets.
- [x] 2.4 Project recent plugin executions into activity feed and plugin shelf summaries.

## 3. Repo Navigator Product Path

- [x] 3.1 Make repo files execution produce active workbench result lists and inspectable file targets.
- [x] 3.2 Make repo grep execution produce active workbench result lists and reference handoff metadata.
- [x] 3.3 Keep repo recall and project-index deferred but visible with fallback commands.

## 4. Tests And Verification

- [x] 4.1 Add contract tests for plugin execution records, implemented dispatch, deferred dispatch, and private handler isolation.
- [x] 4.2 Add TUI workbench tests for recent execution projection, result-list attachment, activity feed, and plugin shelf state.
- [x] 4.3 Add palette tests for explicit plugin execution and dry-run preservation.
- [x] 4.4 Run OpenSpec strict validation, typecheck, focused tests, lint, boundary checks, and full regression tests.
