## 1. Workbench Contracts And Projection

- [x] 1.1 Add CLI-host workbench DTOs for layout, regions, focus state, command bar, reasoning rail, inspector, activity feed, plugin shelf, and keyboard hints.
- [x] 1.2 Build a deterministic projector from existing `ChatSessionState`, `CliCompositionSnapshot`, terminal profile, plugin contributions, and visible reasoning projection.
- [x] 1.3 Add bounded workbench frame rendering for interactive text terminals and compact stacked fallback for narrow terminals.

## 2. Interaction Model

- [x] 2.1 Add local panel focus dispatch for Tab, Shift+Tab, Escape, r, i, a, p, and command-bar entry keys.
- [x] 2.2 Add command bar suggestion projection for controls, palette, context, references, history, reasoning views, and plugin actions.
- [x] 2.3 Connect active reasoning rail step and active result-list target to inspector targets without triggering model calls.

## 3. Product Surfaces

- [x] 3.1 Add reasoning rail summaries with status, certainty, evidence counts, active record, and overflow handling.
- [x] 3.2 Add activity feed records for turns, diagnostics, reasoning projection, focus changes, command-bar state, and plugin readiness.
- [x] 3.3 Add plugin shelf summaries for first-party plugin contribution counts, top plugin ids, readiness, conflicts, and diagnostics.
- [x] 3.4 Update startup/status/help/README text to describe the workbench interaction instead of raw framework internals.

## 4. Tests And Verification

- [x] 4.1 Add contract tests for layout, focus navigation, command bar ranking, reasoning rail, inspector evidence, activity feed, plugin shelf, and narrow terminal fallback.
- [x] 4.2 Add CLI tests proving scripted, non-TTY, JSON, and JSONL output remain prompt/frame free.
- [x] 4.3 Run `openspec validate elevate-chat-tui-workbench-interaction --strict`, `npm run typecheck`, `npm run lint`, focused TUI tests, and `node scripts/check-boundaries.mjs`.
