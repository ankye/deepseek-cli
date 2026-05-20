## ADDED Requirements

### Requirement: Mechanical Test-First Governance Gate / 机械测试先行治理门禁

Platform governance SHALL enforce the test-first rule with a mechanical default lint gate for non-documentation implementation changes.

平台治理必须通过默认 lint 机械门禁强制执行测试先行规则，覆盖非文档实现变更。

#### Scenario: Implementation-only change fails lint / 只有实现变更时 Lint 失败

- **WHEN** the current change set modifies non-test implementation files under `src/**` without any focused test change
- **THEN** `npm run lint` reports a stable test-first governance failure and exits non-zero
- **中文** 当当前变更集修改 `src/**` 下的非测试实现文件，但没有任何聚焦测试变更时，`npm run lint` 必须报告稳定的 test-first governance failure，并以非零状态退出。

#### Scenario: Implementation with focused coverage passes gate / 实现伴随聚焦覆盖通过门禁

- **WHEN** the current change set modifies implementation files and also modifies unit, contract, regression, golden, matrix, integration, e2e, versioning, or package-local tests
- **THEN** the test-first governance gate passes and leaves the remaining lint rules to decide the final result
- **中文** 当当前变更集修改实现文件，同时修改 unit、contract、regression、golden、matrix、integration、e2e、versioning 或包内测试时，test-first 治理门禁必须通过，并由后续 lint 规则决定最终结果。

#### Scenario: Explicit OpenSpec verification exception passes gate / 明确 OpenSpec 验证例外通过门禁

- **WHEN** implementation work cannot be tested before code changes and an active OpenSpec artifact records `Test-first exception` and `Substitute verification`
- **THEN** the test-first governance gate accepts the exception and includes the OpenSpec path in its diagnostic output when requested
- **中文** 当实现工作确实无法在写代码前测试，且 active OpenSpec artifact 记录 `Test-first exception` 与 `Substitute verification` 时，test-first 治理门禁必须接受该例外，并在请求诊断输出时包含对应 OpenSpec 路径。
