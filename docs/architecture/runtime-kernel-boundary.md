# Runtime Kernel Boundary / Runtime 内核边界

This document is the implementation inventory for `harden-runtime-kernel-boundary`. It records what the runtime kernel may own, what must stay in owner packages, and which compatibility shims are allowed while the platform is being hardened.

本文档是 `harden-runtime-kernel-boundary` 的实现盘点。它记录 runtime kernel 可以拥有的职责、必须留在责任包中的职责，以及平台加固期间允许存在的 compatibility shims。

## Kernel-Owned Responsibilities / Kernel 自有职责

The runtime execution kernel owns only:

Runtime execution kernel 只负责：

- Turn and invocation lifecycle. / Turn 与 invocation 生命周期。
- Execution envelope creation and validation. / Execution envelope 创建与校验。
- Policy handoff before risky execution. / 风险执行前的 policy handoff。
- Scheduler handoff, cancellation, timeout, and task status projection. / Scheduler handoff、取消、超时与任务状态投影。
- Canonical runtime event emission, replay persistence, and bus publication. / 规范 runtime event emission、replay persistence 与 bus publication。
- Model/tool continuation orchestration through injected dependencies and public contracts. / 通过注入依赖与公共契约编排 model/tool continuation。

## Runtime Inventory / Runtime 盘点

| Area | Files | Classification | Notes |
| --- | --- | --- | --- |
| Kernel core / 内核核心 | `kernel.ts`, `envelope.ts`, `events.ts`, `errors.ts`, `deterministic.ts` | kernel-owned | May import `@deepseek/platform-contracts`, `@deepseek/policy-sandbox`, and local kernel helpers. |
| Public facade / 公共门面 | `index.ts`, `headless.ts` | compatibility shim | Keeps current ergonomic exports while kernel handoffs stabilize. |
| Agent loop / Agent 循环 | `agent-loop*.ts`, `model-tooling.ts`, `trace.ts` | compatibility shim | Existing CLI product path; extraction target is event-loop/prompt/model handoff governance. |
| Context integration / Context 集成 | `context-projection.ts`, `prompt-assembly-integration.ts`, `memory-context.ts`, `lossless-context.ts`, `permanent-memory.ts` | owner-package-owned through shims | Long-term owners are `context-engine`, `prompt-assembly`, and `memory-cache-management`. |
| Capability registration / Capability 注册 | `echo-capability.ts`, `family-capabilities.ts`, `family-pipeline-capabilities.ts`, `platform-family-capabilities.ts` | compatibility shim | Long-term owner is governed module/capability registration. |
| Agent modes and repair / Agent 模式与修复 | `agent-spawner.ts`, `modes/*`, `self-repair/*` | owner-package-owned through shims | Long-term owners are `agent-management`, `workflow-orchestration`, and self-repair governance. |
| User hook loading / 用户 Hook 加载 | `user-hooks.ts` | compatibility shim | Must stay behind platform abstraction and hook-system contracts. |

## Allowed Handoffs / 允许的 Handoff

Runtime may call these subsystems only through injected dependencies, public package APIs, or platform contracts:

Runtime 只能通过注入依赖、公共 package API 或 platform contracts 调用这些子系统：

- `bus` -> `runtime-message-bus`
- `workflow` -> `workflow-orchestration`
- `scheduler` / `concurrency` -> `concurrency-orchestration`
- `capabilities` -> `capability-registry`
- `policy` / `sandbox` / approval records -> `policy-sandbox`
- `models` -> `model-gateway`
- `context` -> `context-engine`
- `prompt` -> `prompt-assembly`
- `memory` / `cache` -> `memory-cache-management`
- `platform` -> `platform-abstraction`
- `sessions` -> `session-store`
- `observability` -> `observability`

## Forbidden Dependency Directions / 禁止依赖方向

Runtime source must not import:

Runtime source 不得导入：

- App packages such as `deepseek-agent-cli` or `@deepseek/vscode-extension`. / app packages，例如 `deepseek-agent-cli` 或 `@deepseek/vscode-extension`。
- Host APIs such as `vscode`, `node:fs`, `node:child_process`, or `node:process` outside approved adapters. / approved adapters 外的 host APIs，例如 `vscode`、`node:fs`、`node:child_process` 或 `node:process`。
- Provider SDKs such as `openai`, `@anthropic-ai/sdk`, or provider-specific adapters. / provider SDK，例如 `openai`、`@anthropic-ai/sdk` 或 provider-specific adapters。
- Test fakes such as `@deepseek/testing-regression`. / 测试 fake，例如 `@deepseek/testing-regression`。
- Private package internals such as `@deepseek/model-gateway/src/*`, `@deepseek/*/dist/*`, or `@deepseek/*/internal/*`. / 私有 package internals，例如 `@deepseek/model-gateway/src/*`、`@deepseek/*/dist/*` 或 `@deepseek/*/internal/*`。

## Compatibility Shims / 兼容 Shim

| Shim | Owner | Extraction target | Expiration trigger |
| --- | --- | --- | --- |
| `runtime.agent-loop-compat` | `runtime` | `runtime-event-loop`, `prompt-assembly`, `model-gateway` | After layered context pipeline and model request planning are enabled on the main path. |
| `runtime.capability-registration-compat` | `runtime` | `capability-registry`, `plugin-system`, `first-party-dev-plugins` | After governed module contribution registration owns built-in capability wiring. |
| `runtime.platform-family-compat` | `runtime` | `platform-abstraction`, `workspace-state-management`, `session-store`, `observability` | After platform family tools are exported through owner packages. |
| `runtime.context-memory-compat` | `runtime` | `context-engine`, `memory-cache-management`, `prompt-assembly` | After context pipeline block storage and prompt assembly handoff are product-ready. |
| `runtime.agent-mode-compat` | `runtime` | `agent-management`, `workflow-orchestration` | After agent namespace/quota governance is enforced. |

Every shim must remain visible in diagnostics until its expiration trigger is satisfied.

每个 shim 在过期触发条件满足前都必须持续出现在 diagnostics 中。
