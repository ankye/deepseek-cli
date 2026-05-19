## 1. OpenSpec

- [x] 1.1 Validate proposal, design, and delta specs.

## 2. Raw Input Bridge

- [x] 2.1 Extend raw chat local input dispatch to return structured handled/insert/submit outcomes.
- [x] 2.2 Make `/` open the command bar only when the raw prompt buffer is empty.
- [x] 2.3 Bridge complete accepted slash suggestions to submitted prompts.
- [x] 2.4 Bridge placeholder accepted slash suggestions to editable draft prefixes.
- [x] 2.5 Keep plugin and non-slash descriptors local without prompt submission.

## 3. Tests

- [x] 3.1 Add raw input bridge tests for `/help` immediate submission.
- [x] 3.2 Add raw input bridge tests for `/file` draft completion after suggestion acceptance.
- [x] 3.3 Add raw input bridge tests that preserve `/` as text in non-empty prompts.

## 4. Verification

- [x] 4.1 Run OpenSpec strict validation, typecheck, focused tests, lint, boundary checks, and regression tests as appropriate.
