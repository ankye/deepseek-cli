## ADDED Requirements

### Requirement: Reference Pit Regression Harness / 参考坑位回归 Harness

The testing-regression package SHALL expose deterministic helpers for loading, filtering, and asserting reference pit fixture coverage.

`testing-regression` package 必须暴露确定性 helpers，用于加载、筛选和断言 reference pit fixture coverage。

#### Scenario: Harness filters by owner and risk / Harness 按 owner 与风险筛选

- **WHEN** tests request reference pit fixtures by owner package or risk class
- **THEN** the harness returns stable catalog entries with deterministic ordering and no host-specific side effects
- **中文** 当测试按 owner package 或 risk class 请求 reference pit fixtures 时，harness 必须返回排序稳定的 catalog entries，且无 host-specific side effects。

#### Scenario: Harness detects missing coverage ids / Harness 检测缺失覆盖 ID

- **WHEN** a coverage assertion omits a covered or partial fixture id
- **THEN** the harness fails with a deterministic diagnostic naming the missing fixture ids
- **中文** 当 coverage assertion 遗漏 covered 或 partial fixture id 时，harness 必须以确定性 diagnostic 失败，并列出缺失 fixture ids。

### Requirement: Reference Pit Evidence Remains Redacted / 参考坑位证据保持脱敏

Reference pit fixture evidence SHALL avoid raw secrets, raw credentials, copied reference source, and machine-local private paths.

reference pit fixture evidence 必须避免 raw secrets、raw credentials、复制的参考源码和机器本地私有路径。

#### Scenario: Fixture catalog is safe to serialize / Fixture Catalog 可安全序列化

- **WHEN** the reference pit fixture catalog is serialized for diagnostics or tests
- **THEN** it contains only redacted or synthetic values and does not include raw credential material
- **中文** 当 reference pit fixture catalog 为 diagnostics 或 tests 序列化时，它只能包含脱敏或合成值，不得包含 raw credential material。
