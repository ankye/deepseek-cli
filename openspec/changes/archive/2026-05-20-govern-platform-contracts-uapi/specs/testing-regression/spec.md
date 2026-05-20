## ADDED Requirements

### Requirement: UAPI Compatibility Evidence / UAPI 兼容性证据

The regression suite SHALL include compatibility evidence for persisted or replayed platform contracts.

回归套件必须为 persisted 或 replayed platform contracts 提供兼容性证据。

#### Scenario: Replay contract remains readable / Replay Contract 保持可读

- **WHEN** persisted runtime events, envelopes, ids, or errors change
- **THEN** contract and golden tests prove old records are migrated or rejected with a stable diagnostic
- **中文** 当 persisted runtime events、envelopes、ids 或 errors 变化时，contract 与 golden tests 必须证明旧记录会被迁移，或以稳定 diagnostic 拒绝。
