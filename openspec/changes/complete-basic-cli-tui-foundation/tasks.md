## 1. Basic Chat TUI Shell

- [x] 1.1 Add a terminal-profile-gated basic chat TUI renderer for startup status and prompt redraws.
- [x] 1.2 Wire `deepseek chat` text TTY mode to render prompt/status before input and after local commands or completed turns.
- [x] 1.3 Preserve prompt-free output for JSON, JSONL, scripted input, CI, and redirected IO.

## 2. Vi-Inspired Foundation Boundaries

- [x] 2.1 Surface the active vi-inspired composition profile in basic chat status/help without enabling plugin-contributed controls.
- [x] 2.2 Document that plugin commands/actions/keymaps/render hints remain declarative follow-up work over the same composition model.

## 3. Verification

- [x] 3.1 Add or update tests for interactive TTY prompt/status rendering and scripted/structured prompt absence.
- [x] 3.2 Run OpenSpec validation and relevant CLI test/lint/boundary checks.
