## Why

R2 Context And Safety requires deterministic diagnostics, privacy controls, and redacted support evidence before live provider, IDE/server, plugin, or multi-agent work expands the amount of persisted runtime data. The current observability sink only stores raw event fields, so it cannot prove privacy opt-out, export denial, or no-raw-secret diagnostic bundles.

R2 Context And Safety 需要在 live provider、IDE/server、plugin 或 multi-agent 扩大持久化 runtime data 之前，先建立确定性的 diagnostics、privacy controls 和脱敏 support evidence。当前 observability sink 只存储原始 event fields，无法证明 privacy opt-out、export denial 或无 raw secret 的 diagnostic bundle。

## Roadmap Metadata / 路线图元数据

```text
Roadmap node / 路线图节点: R2 Context And Safety
Launch gate / 发布门禁: alpha
Owner packages / 责任包: platform-contracts, observability, runtime-message-bus, testing-regression
Dependencies / 依赖: runtime message bus, secret/sandbox hardening, local readiness, code intelligence v1
Required tests / 必需测试: unit, contract, integration, golden, matrix, compatibility
Acceptance evidence / 验收证据: redacted diagnostic bundle, privacy opt-out denial, local deterministic trace replay, no raw secret fixtures
Risk class / 风险等级: high
Data/privacy class / 数据与隐私等级: sensitive
Host surfaces / Host 表面: cli | vscode | server | sdk
Protocol impact / 协议影响: additive
Feature flag / 功能开关: required
Migration/rollback / 迁移与回滚: not-needed for v1 in-memory records
```

## What Changes

- Define versioned observability DTOs for canonical records, privacy settings, export policy, diagnostic bundles, and redaction summaries.
- Upgrade the in-memory observability sink to normalize events into canonical records before storage.
- Enforce local deterministic defaults: external telemetry is disabled by default, local diagnostics remain available, and export attempts require explicit policy allowance.
- Add diagnostic bundle generation with record limits, redaction, privacy decision metadata, and no raw secret persistence.
- Add regression helpers and tests proving contract serializability, integration with runtime events, golden replay, compatibility schemas, matrix privacy modes, and secret redaction.
- No breaking changes. Existing `ObservabilitySink.emit()` and `drain()` stay available and become stricter through additive metadata.

- 定义版本化 observability DTO，覆盖 canonical records、privacy settings、export policy、diagnostic bundles 和 redaction summaries。
- 升级 in-memory observability sink，在存储前把 events 归一化为 canonical records。
- 强制本地确定性默认值：external telemetry 默认关闭，local diagnostics 保持可用，export attempts 必须有显式 policy allowance。
- 增加 diagnostic bundle generation，包含 record limits、redaction、privacy decision metadata 和无 raw secret persistence。
- 增加 regression helpers 与测试，证明 contract serializability、runtime event integration、golden replay、compatibility schemas、matrix privacy modes 和 secret redaction。
- 不引入破坏性变更。现有 `ObservabilitySink.emit()` 与 `drain()` 保持可用，并通过 additive metadata 变得更严格。

## Capabilities

### New Capabilities

- `observability-privacy`: Canonical observability records, privacy settings, export policy, diagnostic bundle generation, local deterministic defaults, and redaction guarantees.

### Modified Capabilities

- `runtime-message-bus`: Runtime/bus diagnostics must carry data/privacy class, redaction metadata, local persistence policy, and opt-out/export behavior before storage or host projection.
- `testing-regression`: Regression suites must include observability/privacy fixtures for redacted diagnostics, privacy opt-out, diagnostic bundle export denial, compatibility, and golden replay.

## Impact

- Contracts: `platform-contracts` expands `observability.ts` with versioned DTOs and service contracts.
- Implementation: `observability` adds deterministic privacy-aware sink behavior and diagnostic bundle creation.
- Tests: package, contract, integration, golden, compatibility, and matrix coverage for privacy controls and diagnostic bundles.
- Docs/OpenSpec: product roadmap and reference docs mark observability/privacy v1 as implemented R2 safety infrastructure after archive.

- 契约：`platform-contracts` 扩展 `observability.ts`，增加版本化 DTO 与 service contracts。
- 实现：`observability` 增加确定性 privacy-aware sink behavior 与 diagnostic bundle creation。
- 测试：package、contract、integration、golden、compatibility 和 matrix 覆盖 privacy controls 与 diagnostic bundles。
- 文档/OpenSpec：archive 后产品路线图与 reference docs 将 observability/privacy v1 标记为已实现的 R2 safety infrastructure。
