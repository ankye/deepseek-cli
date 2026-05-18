## 1. Contracts And Product Baseline

- [x] 1.1 Define professional vi TUI DTOs for raw input events, key sequence state, full-screen renderer lifecycle, panel scroll state, command bar state, and plugin contribution explanations.
- [x] 1.2 Add CLI flags/config shape for TUI profile selection: `auto`, `line`, `full-screen`, and `off`, with deterministic terminal-profile fallback.
- [x] 1.3 Update product docs to label current line workbench honestly and define the professional vi/full-screen target.

## 2. Raw-Key Input Pipeline

- [x] 2.1 Implement a raw input adapter that emits typed key events for printable keys, control keys, Escape, Enter, Tab, resize, paste boundaries where supported, and Ctrl+C.
- [x] 2.2 Add a key-sequence parser for counts, multi-key sequences, leader mappings, Escape timeout, and command/search entry.
- [x] 2.3 Wire raw key events into the same action resolver used by slash commands; ensure no local key text is submitted to the model.
- [x] 2.4 Preserve line/scripted/JSON/JSONL behavior and explicit degradation when raw input is unavailable.

## 3. Professional Vi Grammar

- [x] 3.1 Add `vi-professional` keymap profile with result-list, transcript, reasoning, inspector, activity, plugin shelf, approval, and command-bar scopes.
- [x] 3.2 Support `j/k`, `h/l` where meaningful, `gg/G`, counts, `Ctrl+d/u`, `/`, `:`, `Enter`, `Esc`, `q`, `?`, and leader-prefixed plugin actions.
- [x] 3.3 Add action preview/help that shows the resolved action before side-effecting plugin or runtime descriptors execute.
- [x] 3.4 Add user override records with deterministic precedence over plugin and core bindings, plus inspectable conflict diagnostics.

## 4. Full-Screen Renderer

- [x] 4.1 Implement a full-screen renderer profile over the existing workbench projection with alternate-screen lifecycle, cursor handling, repaint bounds, and teardown on exit/error/SIGINT.
- [x] 4.2 Add persistent statusline, command bar, scrollable transcript, scrollable result-list, reasoning rail, inspector, activity feed, and plugin shelf regions.
- [x] 4.3 Handle terminal resize deterministically and preserve line fallback for unsafe, narrow, redirected, CI, or unknown terminals.
- [x] 4.4 Ensure full-screen rendering never appears in JSON, JSONL, scripted output, support bundles, or model-visible prompt text.

## 5. Plugin Extension UX

- [x] 5.1 Extend plugin contribution manifests with namespace, display label, mode scopes, keymap scopes, permissions, side effects, conflict group, preview text, help text, and governance metadata.
- [x] 5.2 Add `deepseek plugin contributions` or equivalent diagnostics surface to inspect active, hidden, degraded, conflicted, and rejected contributions.
- [x] 5.3 Add TUI plugin inspector panels for contribution detail, conflict explanation, permission preview, and user override suggestions.
- [x] 5.4 Convert executable plugin actions into governed descriptors routed through command/action/runtime contracts; reject direct process, filesystem, model, MCP, or hook execution from TUI registration/rendering.
- [x] 5.5 Add first-party plugin examples for leader-key actions and conflict-free namespacing.

## 6. Verification And Acceptance

- [x] 6.1 Add contract tests for raw input events, key sequence parsing, vi-professional grammar, user overrides, and plugin conflict explanations.
- [ ] 6.2 Add renderer golden tests for full-screen lifecycle, repaint, resize, teardown, no-color, narrow width, Windows, macOS/Linux, CI, redirected output, and structured-output cleanliness.
- [ ] 6.3 Add integration/e2e pseudo-terminal tests for real-time `j/k`, `gg/G`, `/`, `:`, `Esc`, `Enter`, leader plugin actions, approval flows, and cancellation.
- [ ] 6.4 Add plugin extension matrix tests covering active, hidden, degraded, conflicted, rejected, read-only, side-effecting, and permission-gated actions.
- [ ] 6.5 Refresh acceptance evidence and mode/package scorecards only from real passing evidence; do not count fake/replay as live product readiness.
- [ ] 6.6 Run `openspec validate upgrade-professional-vi-tui-plugin-experience --strict`, `npm run typecheck`, `npm run lint`, focused TUI tests, `npm test`, `node scripts/check-boundaries.mjs`, `npm run build:cli`, and relevant live/non-live acceptance gates.
