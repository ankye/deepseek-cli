## 1. Framework Core

- [x] 1.1 Replace the basic chat TUI helper with framework-backed state, registry, dispatcher, and renderer APIs.
- [x] 1.2 Add deterministic TUI contribution registration for core/user/plugin commands, actions, keymaps, palette entries, result lists, and render hints.
- [x] 1.3 Add conflict diagnostics, accepted contribution summaries, plugin readiness metadata, and degraded-mode diagnostics.

## 2. Chat Integration

- [x] 2.1 Wire `deepseek chat` startup, prompt redraw, post-turn state, and local command state updates through the TUI framework.
- [x] 2.2 Route vi-inspired key/action dispatch through the same typed palette/action semantics used by slash controls.
- [x] 2.3 Preserve prompt-free, TUI-free behavior for JSON, JSONL, scripted input, CI, and redirected IO.

## 3. Documentation And Help

- [x] 3.1 Update interactive help and CLI docs to describe the production TUI framework, vi-inspired profile, viewport profile, and declarative plugin contribution policy.
- [x] 3.2 Keep release-facing wording honest: line viewport is implemented now, raw/full-screen rendering is a future renderer over the same framework.

## 4. Verification

- [x] 4.1 Add tests for TUI state snapshots, viewport rendering, prompt gating, key dispatch, and plugin contribution conflicts.
- [x] 4.2 Run OpenSpec validation and relevant CLI typecheck, lint, test, build, and boundary checks.
