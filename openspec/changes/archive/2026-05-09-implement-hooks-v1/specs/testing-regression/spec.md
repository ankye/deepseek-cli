## ADDED Requirements

### Requirement: Hook System Regression Coverage / Hook System 回归覆盖

The regression framework SHALL include deterministic unit, contract, integration, golden, compatibility, matrix, and lint coverage for hooks v1 without requiring live plugins, external marketplaces, network access, host-specific APIs, or nondeterministic timers.

regression framework 必须为 hooks v1 提供 deterministic unit、contract、integration、golden、compatibility、matrix 和 lint 覆盖，且不要求 live plugins、external marketplaces、network access、host-specific APIs 或 nondeterministic timers。

#### Scenario: Golden replay includes hook invocation / golden replay 包含 hook invocation

- **WHEN** a golden trace includes hook validation, order projection, invocation, output records, and failure policy evidence
- **THEN** replay asserts stable schema versions, ordered hook ids, terminal status, output kinds, diagnostics, redaction metadata, and replay fingerprints
- **中文** 当 golden trace 包含 hook validation、order projection、invocation、output records 和 failure policy evidence 时，replay 必须断言 stable schema versions、ordered hook ids、terminal status、output kinds、diagnostics、redaction metadata 和 replay fingerprints。

#### Scenario: Matrix covers ordering and failure modes / matrix 覆盖 ordering 与 failure modes

- **WHEN** matrix tests run
- **THEN** they cover trusted built-in hooks, untrusted workspace hooks, disabled hooks, malformed manifests, stable ordering, continue, block, disable, rollback-requested, timeout, and observe-only output modes
- **中文** 当 matrix tests 运行时，必须覆盖 trusted built-in hooks、untrusted workspace hooks、disabled hooks、malformed manifests、stable ordering、continue、block、disable、rollback-requested、timeout 和 observe-only output modes。

#### Scenario: Compatibility requires hook schemas / compatibility 要求 hook schemas

- **WHEN** compatibility tests inspect hook manifests, summaries, invocation requests, invocation results, output records, or diagnostics
- **THEN** missing or unsupported schema versions fail closed with deterministic diagnostics
- **中文** 当 compatibility tests 检查 hook manifests、summaries、invocation requests、invocation results、output records 或 diagnostics 时，missing 或 unsupported schema versions 必须以 deterministic diagnostics 安全失败。

#### Scenario: Lint rejects legacy hook APIs / lint 拒绝旧 hook APIs

- **WHEN** hook contracts or implementations reintroduce generic `register` or `run` APIs
- **THEN** architecture lint fails with a stable hook-system rule id
- **中文** 当 hook contracts 或 implementations 重新引入泛化 `register` 或 `run` APIs 时，architecture lint 必须以稳定的 hook-system rule id 失败。
