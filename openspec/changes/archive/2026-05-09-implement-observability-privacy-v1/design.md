## Context

The runtime already emits observability events through an injected `ObservabilitySink`, and tests already use an in-memory sink. However, the sink stores ungoverned event fields and does not expose a diagnostic bundle or privacy decision model. R2 needs this boundary before higher-risk features increase persisted data volume.

runtime 已通过注入的 `ObservabilitySink` 发出 observability events，测试也使用 in-memory sink。但 sink 当前存储未治理的 event fields，也没有 diagnostic bundle 或 privacy decision model。R2 需要在更高风险功能扩大持久化数据量前建立这个边界。

## Goals / Non-Goals

**Goals:**

- Add versioned contracts for canonical observability records, privacy settings, export policies, and diagnostic bundles.
- Normalize all emitted events before storage with data/privacy class, redaction metadata, trace metadata, persistence policy, and compatibility metadata.
- Default to local-only deterministic diagnostics while denying external telemetry/export unless explicitly allowed.
- Generate bounded diagnostic bundles that prove redaction and privacy decisions.
- Cover the behavior with unit, contract, integration, golden, matrix, and compatibility tests.

**目标：**

- 增加 canonical observability records、privacy settings、export policies 和 diagnostic bundles 的版本化契约。
- 所有 emitted events 在存储前归一化，包含 data/privacy class、redaction metadata、trace metadata、persistence policy 和 compatibility metadata。
- 默认使用 local-only deterministic diagnostics，除非显式允许，否则拒绝 external telemetry/export。
- 生成有界 diagnostic bundles，证明 redaction 与 privacy decisions。
- 用 unit、contract、integration、golden、matrix 和 compatibility tests 覆盖行为。

**Non-Goals:**

- External telemetry transport.
- Cloud support upload.
- Product UI for privacy settings.
- Persistent on-disk observability store.
- Full analytics taxonomy.

**非目标：**

- external telemetry transport。
- cloud support upload。
- privacy settings 产品 UI。
- 持久化磁盘 observability store。
- 完整 analytics taxonomy。

## Decisions

1. **The canonical record is additive over existing events.**

   `ObservabilityEvent` remains accepted by `emit()`. The sink converts it into an `ObservabilityRecord` with schema version, stable record id, privacy metadata, persistence policy, and redacted fields. `drain()` still returns records because records are structurally compatible with the event interface.

   **中文：** canonical record 是 existing events 的 additive 扩展。`ObservabilityEvent` 仍可传给 `emit()`。sink 会把它转换为带 schema version、stable record id、privacy metadata、persistence policy 和 redacted fields 的 `ObservabilityRecord`。`drain()` 仍返回 records，因为 records 与 event interface 结构兼容。

2. **Privacy is enforced at the sink boundary.**

   Runtime services do not decide export or persistence directly. They emit events, while the observability sink classifies and redacts the payload, applies the configured `PrivacySettings`, and records the decision.

   **中文：** privacy 在 sink boundary 强制执行。runtime services 不直接决定 export 或 persistence。它们只 emit events，由 observability sink 对 payload 分类脱敏，应用配置的 `PrivacySettings`，并记录 decision。

3. **V1 supports local diagnostics, not external telemetry.**

   The default settings keep local diagnostic records enabled and external telemetry disabled. Diagnostic bundles can be generated locally. External export requests are denied unless `allowExternalExport` and a matching `ExportPolicy` allow them.

   **中文：** v1 支持 local diagnostics，不支持 external telemetry。默认设置启用 local diagnostic records 并关闭 external telemetry。diagnostic bundles 可在本地生成。除非 `allowExternalExport` 和匹配 `ExportPolicy` 允许，否则 external export request 会被拒绝。

4. **Diagnostic bundles are evidence, not logs.**

   Bundles are bounded, redacted, schema-versioned artifacts containing selected canonical records, redaction summaries, privacy decision metadata, and generation metadata. They must never include raw secrets.

   **中文：** diagnostic bundles 是 evidence，不是普通 logs。bundle 是有界、脱敏、带 schema version 的 artifact，包含 selected canonical records、redaction summaries、privacy decision metadata 和 generation metadata。它们绝不能包含 raw secrets。

## Risks / Trade-offs

- [Risk] Secret detection is heuristic in v1. -> Mitigation: cover known API key, bearer token, env-secret, password, and private-key fixtures; fail tests if raw fixtures appear in bundles.
- [风险] v1 secret detection 是启发式。-> 缓解：覆盖已知 API key、bearer token、env-secret、password 和 private-key fixtures；如果 raw fixtures 出现在 bundle 中则测试失败。

- [Risk] Existing callers may assume drained events are plain events. -> Mitigation: records retain the original event shape and add fields only.
- [风险] 现有调用方可能假设 drain 出来的是 plain events。-> 缓解：records 保留原 event shape，只增加字段。

- [Risk] External telemetry policy could be confused with local diagnostics. -> Mitigation: model them separately as `localDiagnosticsEnabled`, `telemetryEnabled`, and `allowExternalExport`.
- [风险] external telemetry policy 可能与 local diagnostics 混淆。-> 缓解：用 `localDiagnosticsEnabled`、`telemetryEnabled` 和 `allowExternalExport` 分别建模。

## Migration Plan

This is additive. Existing runtime callers continue using `ObservabilitySink.emit()` and `drain()`. Deterministic dependencies keep using `InMemoryObservabilitySink`, now with privacy-aware defaults.

这是 additive 变更。现有 runtime callers 继续使用 `ObservabilitySink.emit()` 与 `drain()`。deterministic dependencies 继续使用 `InMemoryObservabilitySink`，但其默认行为升级为 privacy-aware。

Rollback strategy: construct the sink with `localDiagnosticsEnabled: false` in tests that need an empty sink, or replace it with a minimal fake implementing the same contract.

回滚策略：需要空 sink 的测试可用 `localDiagnosticsEnabled: false` 构造 sink，或替换为实现同一契约的最小 fake。
