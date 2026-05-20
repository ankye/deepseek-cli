## ADDED Requirements

### Requirement: Test-First Lint Gate Regression / 测试先行 Lint 门禁回归

The regression suite SHALL include deterministic tests for the repository test-first lint gate and its allowed pass/fail cases.

回归套件必须包含仓库 test-first lint gate 及其允许通过/失败场景的确定性测试。

#### Scenario: Regression catches missing coverage / 回归捕获缺失覆盖

- **WHEN** a fixture repository changes a non-test implementation file under `src/**` without changing tests
- **THEN** the regression test asserts the test-first gate fails with a stable rule id or diagnostic marker
- **中文** 当 fixture repository 修改 `src/**` 下非测试实现文件但没有修改测试时，回归测试必须断言 test-first gate 以稳定 rule id 或 diagnostic marker 失败。

#### Scenario: Regression accepts changed tests / 回归接受测试变更

- **WHEN** a fixture repository changes implementation code and focused test files in the same change set
- **THEN** the regression test asserts the test-first gate passes
- **中文** 当 fixture repository 在同一变更集中修改实现代码与聚焦测试文件时，回归测试必须断言 test-first gate 通过。

#### Scenario: Regression accepts documented exception / 回归接受已记录例外

- **WHEN** a fixture repository changes implementation code without tests but has an active OpenSpec artifact containing `Test-first exception` and `Substitute verification`
- **THEN** the regression test asserts the test-first gate passes through the explicit exception path
- **中文** 当 fixture repository 修改实现代码但没有测试，同时 active OpenSpec artifact 包含 `Test-first exception` 与 `Substitute verification` 时，回归测试必须断言 test-first gate 通过明确例外路径。
