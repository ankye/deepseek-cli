## 1. Projection Implementation

- [x] 1.1 Extend runtime reference projection to recognize PageIndex-shaped `turn` references and create bounded `summary` context nodes.
- [x] 1.2 Update agent-loop context-message rendering to include supported host summary reference nodes alongside file reference nodes.

## 2. Regression Coverage

- [x] 2.1 Add runtime tests for PageIndex-shaped turn reference projection and unsupported turn-reference evidence.
- [x] 2.2 Add CLI host tests for recall -> refs add current -> prompt projection without prompt mutation or full transcript leakage.

## 3. Validation

- [x] 3.1 Run focused runtime and CLI tests.
- [x] 3.2 Run typecheck, lint, boundary checks, OpenSpec validation, specs validation, and forbidden tracked reference path checks.
