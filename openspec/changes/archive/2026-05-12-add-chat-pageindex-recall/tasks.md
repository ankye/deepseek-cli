## 1. PageIndex Recall Design And Host Wiring

- [x] 1.1 Add a focused PageIndex helper for recording completed chat turns as bounded pages and searching pages deterministically.
- [x] 1.2 Update chat session state to record PageIndex pages after terminal prompt turns.
- [x] 1.3 Add `/palette recall <query>` routing that creates a recall result list and renders local records without runtime/model submission.

## 2. Regression Coverage

- [x] 2.1 Add CLI host tests for PageIndex recording, `/palette recall <query>`, result-list navigation, turn targets, no-model slash behavior, and bounded structured output.
- [x] 2.2 Add CLI host tests for missing recall query typed local failure.

## 3. Validation

- [x] 3.1 Run focused CLI tests for the changed behavior.
- [x] 3.2 Run typecheck, lint, boundary checks, OpenSpec validation, and forbidden tracked reference path checks.
