## 1. Specification And Planning

- [x] 1.1 Validate the OpenSpec proposal, design, and delta specs for chat PageIndex snapshot resume.

## 2. CLI Implementation

- [x] 2.1 Add `deepseek chat --session <id>` parsing and usage output.
- [x] 2.2 Add PageIndex snapshot payload creation and defensive hydration helpers.
- [x] 2.3 Resume PageIndex pages when chat starts with `--session`, fail closed on explicit missing sessions, and snapshot pages after terminal prompt turns.
- [x] 2.4 Wire the default CLI runtime to the persistent session store when no injected runtime is provided.

## 3. Regression Coverage

- [x] 3.1 Add CLI tests for chat PageIndex snapshot persistence and recall after explicit session resume.
- [x] 3.2 Add CLI tests for explicit missing `chat --session` typed failure.

## 4. Validation

- [x] 4.1 Run focused CLI tests.
- [x] 4.2 Run typecheck, lint, boundary checks, OpenSpec change validation, specs validation, and forbidden tracked path checks.
