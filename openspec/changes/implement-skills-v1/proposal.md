## Why

R3 Extensibility should begin with skills because skills are the smallest governed extension unit: they can add reusable instructions and context before the platform allows hooks, MCP, or plugins to run side effects. The current skill system is a minimal manifest registry, so it cannot yet prove progressive loading, trust isolation, context budget governance, or regression replay.

R3 可扩展平台应从 skills 开始，因为 skills 是最小的受治理扩展单元：它们可以先增加可复用 instructions 与 context，再逐步允许 hooks、MCP 或 plugins 执行副作用。当前 skill system 只是最小 manifest registry，尚无法证明 progressive loading、trust isolation、context budget governance 或 regression replay。

## Roadmap Metadata / 路线图元数据

```text
Roadmap node / 路线图节点: R3 Extensibility Platform
Launch gate / 发布门禁: alpha
Owner packages / 责任包: platform-contracts, skill-system, context-engine, runtime-message-bus, testing-regression
Dependencies / 依赖: R1/R2 runtime kernel, context projection, policy/sandbox hardening, observability/privacy
Required tests / 必需测试: unit, contract, integration, golden, matrix, compatibility
Acceptance evidence / 验收证据: trusted context-only skill projection, untrusted skill inertness, progressive content loading, replayable skill activation evidence
Risk class / 风险等级: high
Data/privacy class / 数据与隐私等级: sensitive
Host surfaces / Host 表面: cli | vscode | server | sdk
Protocol impact / 协议影响: additive
Feature flag / 功能开关: required
Migration/rollback / 迁移与回滚: not-needed for v1 in-memory skill records
```

## What Changes

- Define versioned skill DTOs for manifests, activation rules, content summaries, context segments, activation results, validation diagnostics, and loading metadata.
- Implement a deterministic in-memory skill system that validates manifests, rejects incomplete packages, and keeps untrusted skills inert.
- Add progressive loading: manifests and summaries are available eagerly, while large instructions/resources are loaded only after explicit activation or relevance selection.
- Add context-only skill projection that returns bounded, redacted context segments without scheduling work or granting filesystem/process/network access.
- Add regression coverage for contracts, context integration, golden replay, compatibility, matrix trust modes, and secret-safe skill content.
- No breaking changes. Existing `register`, `activate`, and `list` remain available, with richer additive methods and stricter validation.

- 定义版本化 skill DTO，覆盖 manifests、activation rules、content summaries、context segments、activation results、validation diagnostics 和 loading metadata。
- 实现确定性的 in-memory skill system，校验 manifests、拒绝不完整 packages，并让 untrusted skills 保持 inert。
- 增加 progressive loading：manifests 与 summaries eager 可用，大型 instructions/resources 只在 explicit activation 或 relevance selection 后加载。
- 增加 context-only skill projection，返回有界、脱敏 context segments，不进入 scheduler，也不给 filesystem/process/network 权限。
- 增加 regression 覆盖 contracts、context integration、golden replay、compatibility、matrix trust modes 和 secret-safe skill content。
- 不引入破坏性变更。现有 `register`、`activate` 和 `list` 保留，并通过 additive methods 和更严格 validation 扩展。

## Capabilities

### New Capabilities

No new capability namespace is required. This change implements the existing `skill-system` capability.

不需要新增 capability namespace。本变更实现已有 `skill-system` 能力。

### Modified Capabilities

- `skill-system`: Skill manifests, progressive loading, context-only projection, trust inertness, activation metadata, and regression behavior become executable requirements.
- `context-engine`: Context projection must accept bounded skill context segments with provenance, compatibility, budget, and redaction metadata.
- `testing-regression`: Regression suites must cover skill fixtures without live plugins, external catalogs, network access, or host-specific APIs.

## Impact

- Contracts: `platform-contracts` expands skill DTOs and `SkillSystem`.
- Implementation: `skill-system` becomes a deterministic progressive-loading registry and context projector.
- Tests: unit, contract, integration, golden, compatibility, and matrix tests for trust, validation, activation, projection, and redaction.
- Docs/OpenSpec: product roadmap and reference docs mark skills v1 as the first R3 extensibility node after archive.

- 契约：`platform-contracts` 扩展 skill DTO 与 `SkillSystem`。
- 实现：`skill-system` 升级为确定性的 progressive-loading registry 与 context projector。
- 测试：unit、contract、integration、golden、compatibility 和 matrix 覆盖 trust、validation、activation、projection 与 redaction。
- 文档/OpenSpec：archive 后产品路线图与 reference docs 将 skills v1 标记为第一个 R3 extensibility 节点。
