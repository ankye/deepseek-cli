## Why

DeepSeek now has an honest 64-family scoring catalog, but most families are still planned with no executable capability. The next milestone is to turn the catalog into real product surface so the score reflects working tools, not only a taxonomy.

DeepSeek 现在已经有诚实的 64-family 评分目录，但大多数 family 仍然只是 planned，没有可执行 capability。下一步必须把目录变成真实产品能力，让分数反映可工作的工具，而不只是分类体系。

## What Changes

- Implement the remaining planned first-version tool families so every one of the 64 catalog families has at least one concrete executable capability.
- 实现第一版目录中剩余 planned 工具家族，使 64 个 catalog families 每个都至少拥有一个真实可执行 capability。
- Keep the no-placeholder rule: a family tool entry only exists when it has a capability id, manifest, executor, model-visible projection, governed preflight/policy path, bounded output, and tests.
- 保持“无占位工具”规则：只有具备 capability id、manifest、executor、model-visible projection、受治理 preflight/policy 路径、有界输出与测试时，family tool entry 才能存在。
- Land native built-in tools where DeepSeek owns the behavior directly, including workspace glob, local asset view, patch apply, revert undo, REPL execution, package manager operations, user input requests, approvals, pipeline composition, memory/context/session tools, worktree tools, scheduling, and observability.
- 对 DeepSeek 直接拥有行为的能力落地 native built-in tools，包括 workspace glob、local asset view、patch apply、revert undo、REPL execution、package manager operations、user input requests、approvals、pipeline composition、memory/context/session tools、worktree tools、scheduling 与 observability。
- Land connector-backed tools through their owner packages for browser, MCP, media, design, plugin, command palette, code intelligence, notebook, remote runtime, and web extraction/data lookup.
- 对 browser、MCP、media、design、plugin、command palette、code intelligence、notebook、remote runtime 与 web extraction/data lookup，通过所属 package 落地 connector-backed tools。
- Add deterministic fake implementations and contract tests for every family before requiring live external providers.
- 在要求真实外部 provider 前，为每个 family 增加 deterministic fake implementation 与 contract tests。
- Extend diagnostics, scorecards, and acceptance evidence so each family reports implementation, static contract, live/replayed execution, task outcome, and safety evidence separately.
- 扩展 diagnostics、scorecards 与 acceptance evidence，使每个 family 分别报告 implementation、static contract、live/replayed execution、task outcome 与 safety evidence。
- **BREAKING**: model-visible capability projection remains blocked for executable tools that lack valid family metadata; newly implemented tools must use the family registry path instead of ad hoc registration.
- **BREAKING**：缺少有效 family metadata 的 executable tools 仍会被阻止 model-visible projection；新增工具必须走 family registry 路径，不得 ad hoc 注册。

## Capabilities

### New Capabilities

- `complete-tool-family-implementation`: Tracks the requirement that all 64 first-version catalog families have concrete executable capabilities, deterministic tests, and family-level acceptance evidence.
- `complete-tool-family-implementation`：跟踪 64 个第一版 catalog families 全部拥有真实可执行 capability、确定性测试与 family-level acceptance evidence 的要求。

### Modified Capabilities

- `core-coding-tools`: Built-in family implementations expand from the existing core subset to all DeepSeek-owned local tools.
- `core-coding-tools`：内置 family implementation 从现有 core subset 扩展到所有 DeepSeek-owned local tools。
- `capability-registry`: Registry projection must support family-aware filtering and must reject incomplete concrete tool registration.
- `capability-registry`：registry projection 必须支持 family-aware filtering，并拒绝不完整的真实工具注册。
- `workflow-orchestration`: Runtime-owned pipeline families must become executable capabilities with replayable evidence.
- `workflow-orchestration`：runtime-owned pipeline families 必须成为可执行 capabilities，并产生可 replay 的证据。
- `mcp-gateway`: MCP, browser, media, and design connector profiles must expose concrete family capabilities through governed projections.
- `mcp-gateway`：MCP、browser、media 与 design connector profiles 必须通过受治理 projection 暴露真实 family capabilities。
- `model-gateway`: Provider capability metadata must drive web, image/media, browser/native-tool, structured output, and continuation support for family tools.
- `model-gateway`：provider capability metadata 必须驱动 web、image/media、browser/native-tool、structured output 与 family tools continuation 支持。
- `agent-management`: Agent scopes and delegated work orders must allow and deny the newly implemented family tools by family, domain, risk, and host requirement.
- `agent-management`：agent scopes 与 delegated work orders 必须能按 family、domain、risk 与 host requirement 管控新落地的 family tools。
- `cli-task-completion-evaluation`: Evaluation must include representative tasks for every implemented family and fail unsupported-family tasks explicitly.
- `cli-task-completion-evaluation`：evaluation 必须为每个已实现 family 包含代表性任务，并显式失败 unsupported-family tasks。
- `testing-regression`: Regression suites must cover all 64 family implementations, projections, fake connectors, score math, and acceptance snapshots.
- `testing-regression`：regression suites 必须覆盖全部 64 个 family implementations、projections、fake connectors、score math 与 acceptance snapshots。

## Impact

- Affected packages: `src/packages/platform-contracts`, `src/packages/core-coding-tools`, `src/packages/capability-registry`, `src/packages/runtime`, `src/packages/workflow-orchestration`, `src/packages/mcp-gateway`, `src/packages/model-gateway`, `src/packages/agent-management`, `src/packages/command-system`, `src/packages/code-intelligence`, `src/packages/memory-cache-management`, `src/packages/session-store`, `src/packages/workspace-state-management`, `src/packages/platform-abstraction`, `src/packages/testing-regression`, and `src/apps/cli`.
- 影响包：`src/packages/platform-contracts`、`src/packages/core-coding-tools`、`src/packages/capability-registry`、`src/packages/runtime`、`src/packages/workflow-orchestration`、`src/packages/mcp-gateway`、`src/packages/model-gateway`、`src/packages/agent-management`、`src/packages/command-system`、`src/packages/code-intelligence`、`src/packages/memory-cache-management`、`src/packages/session-store`、`src/packages/workspace-state-management`、`src/packages/platform-abstraction`、`src/packages/testing-regression` 与 `src/apps/cli`。
- Affected outputs: core tool manifests, connector projections, diagnostics evaluate output, tool family parity matrix, live/replayed coverage evidence, acceptance evidence, and release readiness reports.
- 影响输出：core tool manifests、connector projections、diagnostics evaluate output、tool family parity matrix、live/replayed coverage evidence、acceptance evidence 与 release readiness reports。
- External provider families must start with deterministic fake adapters and opt-in live execution; no `.env` secrets or network-only assumptions are required for normal tests.
- 外部 provider families 必须先使用 deterministic fake adapters 与 opt-in live execution；普通测试不得依赖 `.env` secrets 或仅网络可用的假设。
