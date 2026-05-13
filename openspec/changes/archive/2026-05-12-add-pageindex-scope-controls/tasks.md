## 1. Specification And Planning

- [x] 1.1 Validate the OpenSpec proposal, design, and delta specs for PageIndex recall scope controls.

## 2. CLI Implementation

- [x] 2.1 Add a typed recall scope parser for `/palette recall`, defaulting to `session`.
- [x] 2.2 Route explicit `session` scope through existing PageIndex recall while preserving scope provenance.
- [x] 2.3 Return typed deferred local records for `workspace` and `global` scopes and typed local failures for invalid or missing scope values.

## 3. Regression Coverage

- [x] 3.1 Add CLI tests for `/palette recall --scope session <query>` provenance.
- [x] 3.2 Add CLI tests for deferred `workspace` and `global` recall scopes.
- [x] 3.3 Add CLI tests for invalid and missing recall scope values.

## 4. Validation

- [x] 4.1 Run focused CLI tests.
- [x] 4.2 Run OpenSpec change validation, specs validation, typecheck, lint, and boundary checks.
