## Why

R3 extensibility needs hooks after skills because hooks are the first extension surface that can observe or influence lifecycle events. The current hook system is only a minimal point runner, so it cannot yet prove schema validation, deterministic ordering, timeout containment, failure policy, trust isolation, redaction, or replayable evidence.

R3 可扩展平台在 skills 之后需要 hooks，因为 hooks 是第一个可以观察或影响 lifecycle events 的扩展面。当前 hook system 只是最小 point runner，尚无法证明 schema validation、deterministic ordering、timeout containment、failure policy、trust isolation、redaction 或 replayable evidence。

## Roadmap Metadata / 路线图元数据

```text
Roadmap node / 路线图节点: R3 Extensibility Platform
Launch gate / 发布门禁: alpha
Owner packages / 责任包: platform-contracts, hook-system, runtime-message-bus, policy-sandbox, testing-regression
Dependencies / 依赖: R0/R1 runtime kernel, governed execution, runtime message bus, policy/sandbox hardening, skills v1
Required tests / 必需测试: unit, contract, integration, golden, matrix, compatibility, lint
Acceptance evidence / 验收证据: deterministic hook ordering, timeout containment, failure policy behavior, observe-only output typing, replayable hook evidence
Risk class / 风险等级: high
Data/privacy class / 数据与隐私等级: sensitive
Host surfaces / Host 表面: cli | vscode | server | sdk
Protocol impact / 协议影响: additive
Feature flag / 功能开关: required
Migration/rollback / 迁移与回滚: not-needed before launch; fail closed by disabling hook invocation
```

## What Changes

- Define versioned hook DTOs for manifests, lifecycle points, invocation requests, outputs, diagnostics, ordering metadata, isolation metadata, failure policy, and replay fingerprints.
- Replace the minimal hook point runner with canonical hooks v1 APIs for validation, registration, listing, invocation, and dry-run ordering projection.
- Implement deterministic in-memory hooks with schema validation, stable priority/source/name tie-breaking, per-hook deadlines, cancellation, and failure policy handling.
- Support observe-only hook outputs first: observation records, context suggestions, policy suggestions, workflow suggestions, capability requests, and host render hints as typed suggestions that do not apply authority directly.
- Keep side-effecting hooks routed to future governed execution envelopes; v1 does not execute arbitrary hook code outside registered deterministic handlers.
- Add regression coverage for unit, contract, integration, golden replay, compatibility, matrix, and architecture lint.
- **BREAKING before launch:** generic `register` and `run` hook APIs are replaced by canonical v1 methods so hook behavior is explicit and schema-governed.

- 定义版本化 hook DTO，覆盖 manifests、lifecycle points、invocation requests、outputs、diagnostics、ordering metadata、isolation metadata、failure policy 和 replay fingerprints。
- 将最小 hook point runner 替换为 canonical hooks v1 APIs，用于 validation、registration、listing、invocation 和 dry-run ordering projection。
- 实现确定性的 in-memory hooks，包含 schema validation、稳定 priority/source/name tie-breaking、per-hook deadlines、cancellation 和 failure policy handling。
- v1 先支持 observe-only hook outputs：observation records、context suggestions、policy suggestions、workflow suggestions、capability requests 和 host render hints 都是 typed suggestions，不直接获得 authority。
- side-effecting hooks 保持未来必须进入 governed execution envelopes；v1 不在 registered deterministic handlers 之外执行任意 hook code。
- 增加 unit、contract、integration、golden replay、compatibility、matrix 和 architecture lint 回归覆盖。
- **上线前破坏性调整：** 用 canonical v1 methods 替换泛化 `register` 和 `run` hook APIs，使 hook 行为显式且受 schema 治理。

## Capabilities

### New Capabilities

No new capability namespace is required. This change implements the existing `hook-system` capability.

不需要新增 capability namespace。本变更实现已有 `hook-system` 能力。

### Modified Capabilities

- `hook-system`: Hook manifests, canonical v1 APIs, ordering, deadlines, failure policy, output typing, trust isolation, and replay behavior become executable requirements.
- `testing-regression`: Regression suites must cover hook fixtures without live plugins, host-specific APIs, network access, or nondeterministic timers.
- `runtime-message-bus`: Hook invocation evidence and terminal hook results must be representable as replayable redacted runtime records.

## Impact

- Contracts: `platform-contracts` expands hook DTOs and replaces `HookSystem` with canonical hooks v1.
- Implementation: `hook-system` becomes a deterministic validation, ordering, invocation, and replay evidence surface.
- Lint: architecture lint prevents reintroducing generic pre-launch hook APIs and direct hook invocation bypasses outside approved owners.
- Tests: package, contract, integration, golden, compatibility, and matrix tests cover ordering, timeout, failure policy, output typing, redaction, and schema enforcement.
- Docs/OpenSpec: product roadmap and reference docs mark hooks v1 as the next R3 extensibility node after archive.

- 契约：`platform-contracts` 扩展 hook DTO，并将 `HookSystem` 替换为 canonical hooks v1。
- 实现：`hook-system` 升级为 deterministic validation、ordering、invocation 与 replay evidence 表面。
- Lint：architecture lint 防止重新引入泛化的上线前 hook APIs，并阻止 approved owners 之外的 direct hook invocation bypass。
- 测试：package、contract、integration、golden、compatibility 和 matrix 覆盖 ordering、timeout、failure policy、output typing、redaction 与 schema enforcement。
- 文档/OpenSpec：archive 后产品路线图与 reference docs 将 hooks v1 标记为下一个 R3 extensibility 节点。
