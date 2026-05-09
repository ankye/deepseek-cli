## ADDED Requirements

### Requirement: Checkpoint Undo Regression Coverage / Checkpoint Undo 回归覆盖

The regression framework SHALL include deterministic unit, contract, integration, golden, and matrix coverage for checkpoint creation, restore, undo, stale rejection, and secret-safe evidence.

regression framework 必须为 checkpoint creation、restore、undo、stale rejection 和 secret-safe evidence 提供确定性的 unit、contract、integration、golden 和 matrix 覆盖。

#### Scenario: Golden replay covers undo / golden replay 覆盖 undo

- **WHEN** a replay fixture applies a file mutation and then undoes it
- **THEN** replay asserts stable checkpoint ids, restore status, hashes, diagnostics, and redaction fields without raw file content
- **中文** 当 replay fixture 应用 file mutation 后再 undo 时，replay 必须断言稳定的 checkpoint ids、restore status、hashes、diagnostics 和 redaction fields，且不包含 raw file content。

#### Scenario: Matrix covers stale restore rejection / matrix 覆盖 stale restore 拒绝

- **WHEN** fake platform modes modify the file after checkpoint creation
- **THEN** restore is rejected consistently and does not overwrite the newer content
- **中文** 当 fake platform modes 在 checkpoint 创建后修改文件时，restore 必须一致地拒绝，且不得覆盖较新的内容。
