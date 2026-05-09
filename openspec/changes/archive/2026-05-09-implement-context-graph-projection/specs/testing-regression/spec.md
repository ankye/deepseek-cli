## ADDED Requirements

### Requirement: Context Projection Regression Suite / Context Projection 回归套件

The testing framework SHALL include deterministic unit, contract, integration, golden, compatibility, matrix, and e2e coverage for ContextGraph projection.

testing framework 必须为 ContextGraph projection 提供 deterministic unit、contract、integration、golden、compatibility、matrix 和 e2e 覆盖。

#### Scenario: Contract tests cover projection DTOs / 合同测试覆盖 Projection DTO

- **WHEN** projection contract tests run
- **THEN** they verify schema versions, serializability, fake substitutability, redaction metadata, budget metadata, and no implementation imports in `platform-contracts`
- **中文** 当 projection contract tests 运行时，必须验证 schema versions、serializability、fake substitutability、redaction metadata、budget metadata，以及 `platform-contracts` 不导入实现包。

#### Scenario: Integration tests cover runtime projection / 集成测试覆盖 Runtime Projection

- **WHEN** runtime integration tests dispatch a model turn
- **THEN** they prove projection runs before provider request construction and model gateway receives only projected context
- **中文** 当 runtime integration tests 派发 model turn 时，必须证明 projection 在 provider request construction 前运行，且 model gateway 只收到 projected context。

### Requirement: Projection Golden Replay / Projection Golden Replay

Golden replay SHALL capture selected nodes, excluded nodes, budget decisions, cache metadata, redaction summaries, and projection terminal state.

golden replay 必须捕获 selected nodes、excluded nodes、budget decisions、cache metadata、redaction summaries 和 projection terminal state。

#### Scenario: Replay detects projection drift / Replay 检测 Projection 漂移

- **WHEN** projection ranking, filtering, redaction, cache, or budget behavior changes
- **THEN** golden replay detects the semantic drift unless the fixture is explicitly updated
- **中文** 当 projection ranking、filtering、redaction、cache 或 budget 行为变化时，golden replay 必须检测 semantic drift，除非 fixture 被显式更新。

### Requirement: Projection Compatibility Fixtures / Projection 兼容性 Fixtures

The testing framework SHALL include compatibility fixtures for projection request, result, event, and cache metadata schemas.

testing framework 必须包含 projection request、result、event 和 cache metadata schemas 的 compatibility fixtures。

#### Scenario: Unsupported projection schema fails closed / 不支持的 Projection Schema 安全失败

- **WHEN** persisted or replayed projection evidence uses an unsupported schema version
- **THEN** compatibility tests prove the system returns a typed compatibility failure instead of silently accepting incompatible state
- **中文** 当 persisted 或 replayed projection evidence 使用 unsupported schema version 时，compatibility tests 必须证明系统返回 typed compatibility failure，而不是静默接受 incompatible state。

### Requirement: Projection Matrix Fixtures / Projection 矩阵 Fixtures

Projection regression SHALL cover empty context, large session, stale cache, secret fixture, hard budget exceeded, memory unavailable, and degraded host scope.

projection regression 必须覆盖 empty context、large session、stale cache、secret fixture、hard budget exceeded、memory unavailable 和 degraded host scope。

#### Scenario: Secret fixture does not leak / Secret Fixture 不泄漏

- **WHEN** projection tests include secret-like context nodes
- **THEN** stdout, JSON, traces, snapshots, cache artifacts, golden fixtures, and assertion messages contain only redacted evidence
- **中文** 当 projection tests 包含 secret-like context nodes 时，stdout、JSON、traces、snapshots、cache artifacts、golden fixtures 和 assertion messages 只能包含 redacted evidence。
