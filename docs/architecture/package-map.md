# Package Map / 包地图

This page maps packages to architectural ownership. It is a developer reference for where code should go.

本页将 package 映射到架构责任，是开发者判断代码应放在哪里的参考。

## Apps / 应用

| Package / 包 | Responsibility / 职责 |
| --- | --- |
| `src/apps/cli` | CLI host adapter, npm package entry, text, JSON, JSONL, TUI, and cache-aware statusline rendering from runtime telemetry. / CLI host 适配器、npm 入口、text、JSON、JSONL、TUI，以及基于 runtime telemetry 的缓存感知 statusline 渲染。 |
| `src/apps/vscode-extension` | VSCode host adapter skeleton, event projection, editor-context bridge. / VSCode host 适配器骨架、事件投影、编辑器上下文桥接。 |

## Core Platform Packages / 核心平台包

| Package / 包 | Responsibility / 职责 |
| --- | --- |
| `platform-contracts` | DTOs, ids, service interfaces, envelopes, errors. / DTO、id、service interface、envelope、error。 |
| `runtime` | Headless runtime kernel, turn lifecycle, execution envelope, owner-package handoffs, and status telemetry publication. / headless runtime kernel、turn 生命周期、execution envelope、责任包 handoff 与状态 telemetry 发布。 |
| `communication-protocol` | Host/runtime protocol codec, routing, additive metadata, prefix hashes, cache evidence, and status telemetry envelopes. / host/runtime 协议 codec、路由、增量 metadata、prefix hash、cache evidence 与 status telemetry envelope。 |
| `runtime-message-bus` | Internal replayable event bus with ordered delivery and backpressure records. / 内部可 replay event bus，提供有序传递与背压记录。 |
| `session-store` | Session event persistence, resume, fork. / session event 持久化、resume、fork。 |
| `workspace-state-management` | Workspace identity, write checkpoints, undo, request revert, and redacted rollback evidence. / workspace identity、写入 checkpoint、undo、request revert 与脱敏 rollback evidence。 |

## Capability Packages / 能力包

| Package / 包 | Responsibility / 职责 |
| --- | --- |
| `capability-registry` | Manifest registry and executor binding. / manifest registry 与 executor binding。 |
| `core-coding-tools` | File/search/edit/shell/git/todo tool foundation. / 文件、搜索、编辑、shell、git、todo 工具基础。 |
| `command-system` | Host-agnostic commands and chat controls. / host-agnostic 命令和交互控制。 |
| `skill-system` | Canonical skills v1 manifest validation, summary-first progressive loading, trust inertness, activation, and context-only projection. / canonical skills v1 manifest 校验、summary-first 渐进加载、trust inertness、activation 与 context-only projection。 |
| `hook-system` | Canonical hooks v1 manifest validation, deterministic ordering, observe-only invocation, timeout containment, and failure policy. / canonical hooks v1 manifest 校验、确定性排序、observe-only invocation、超时隔离与失败策略。 |
| `mcp-gateway` | Canonical MCP gateway v1 manifest validation, deterministic fake/in-process server connection, tool/resource/prompt discovery, governed calls/reads, fail-closed real transport diagnostics, and replay evidence. / canonical MCP gateway v1 manifest 校验、deterministic fake/in-process server connection、tool/resource/prompt discovery、受治理 calls/reads、真实 transport 安全失败 diagnostics 与 replay evidence。 |
| `plugin-system` | Plugin manifest, governed module projection, public contract paths, private API rejection, lifecycle disable/unload evidence, and contribution diagnostics. / plugin manifest、受治理 module 投影、公共契约路径、私有 API 拒绝、lifecycle disable/unload 证据与 contribution diagnostics。 |
| `extension-system` | Shared extension contribution contracts. / 共享 extension contribution 契约。 |

## Orchestration Packages / 编排包

| Package / 包 | Responsibility / 职责 |
| --- | --- |
| `workflow-orchestration` | Workflow templates, task graph, invocation lifecycle. / workflow 模板、task graph、invocation 生命周期。 |
| `concurrency-orchestration` | Scheduler, locks, timeout, cancellation, backpressure. / 调度器、锁、超时、取消、背压。 |
| `agent-management` | Agent definitions, lifecycle, namespaces, quotas, lineage, ownership, and scope evaluation. / agent 定义、生命周期、namespace、quota、lineage、ownership 与 scope evaluation。 |
| `tool-intent-preflight` | Model/provider tool-call validation and repair. / 模型/provider 工具调用校验与修复。 |

## Governance Packages / 治理包

| Package / 包 | Responsibility / 职责 |
| --- | --- |
| `policy-sandbox` | Policy decisions, secret redaction helpers, sandbox profile selection. / policy 决策、secret 脱敏 helper、sandbox profile 选择。 |
| `platform-abstraction` | OS/platform capability matrix and platform operations. / OS/platform 能力矩阵与平台操作。 |
| `config` | Persistent config with schema and source precedence. / 带 schema 与来源优先级的持久化配置。 |
| `credential-auth-management` | Credential references and provider credential presence. / credential references 与 provider credential presence。 |
| `usage-budget-management` | Usage and context budget decisions. / usage 与 context budget 决策。 |

## AI And Context Packages / AI 与上下文包

| Package / 包 | Responsibility / 职责 |
| --- | --- |
| `model-gateway` | DeepSeek provider boundary and OpenAI-compatible transport normalization. / DeepSeek provider 边界与 OpenAI-compatible transport 归一化。 |
| `prompt-assembly` | Provider-neutral prompt sections, deterministic ordering, budget enforcement, tool projection, and replay evidence. / provider-neutral prompt section、确定性排序、预算门禁、tool projection 与 replay evidence。 |
| `context-engine` | ContextGraph projection, immutable context layers, redaction, budgets, prefix hashes, and cache metadata. / ContextGraph 投影、不可变 context layers、脱敏、预算、prefix hash 与缓存 metadata。 |
| `index-provider` | PageIndex-first recall diagnostics; ZVec and code-index activation remain evidence-gated and deferred until implementation evidence exists. / PageIndex-first recall 诊断；ZVec 与 code-index activation 在实现证据出现前保持 evidence-gated 与 deferred。 |
| `memory-cache-management` | Memory/cache contracts, content-addressed block storage, context manifests, and future governance. / memory/cache 契约、内容寻址 block storage、context manifest 与未来治理。 |
| `code-intelligence` | Diagnostics, symbols, references, code evidence. / diagnostics、symbols、references、code evidence。 |

## Quality And Evolution Packages / 质量与演进包

| Package / 包 | Responsibility / 职责 |
| --- | --- |
| `testing-regression` | Deterministic fakes, matrix helpers, replay support. / 确定性 fake、matrix helper、replay support。 |
| `observability` | Trace/audit/diagnostic event surface. / trace、audit、diagnostic event 面。 |
| `evolution-engine` | Future feedback/eval/evolution loops. / 未来反馈、eval、演进闭环。 |
| `distribution-update-management` | Future update channels and release metadata. / 未来更新通道和发布 metadata。 |

## Governed Placeholder Aliases / 受治理 Placeholder Aliases

The following package-map entries are intentional future landing zones, not implemented packages. Their `@deepseek/*` aliases remain only because `scripts/lint-framework/rules/architecture-drift.mjs` has explicit governance records with owners, allowed consumers, blocked product claims, replacement triggers, and evidence ids.

以下 package-map 条目是有意保留的未来落点，不是已实现 package。它们的 `@deepseek/*` alias 只有在 `scripts/lint-framework/rules/architecture-drift.mjs` 拥有显式治理记录时才能保留，记录必须包含 owner、allowed consumers、blocked product claims、replacement triggers 与 evidence ids。

| Alias / Alias | Current owner / 当前责任方 | Product claim status / 产品声明状态 |
| --- | --- | --- |
| `@deepseek/distribution-update-management` | `platform-abstraction` placeholder adapter | blocked until real update-channel package and acceptance evidence exist |
| `@deepseek/evolution-engine` | `platform-abstraction` placeholder adapter | blocked until feedback/eval/evolution package and acceptance evidence exist |
| `@deepseek/extension-system` | `plugin-system` governed module path | blocked until extension runtime package or merged plugin-system path is accepted |
| `@deepseek/remote-runtime-connectivity` | `platform-abstraction` placeholder adapter | blocked until real remote transport, identity, policy, and acceptance evidence exist |

## Placement Rule / 放置规则

When unsure where code belongs, answer these questions:

不确定代码放哪里时，回答这些问题：

1. Is it host-specific rendering or input? Put it in an app. / 是否是 host-specific 渲染或输入？放 app。
2. Is it a contract used across packages? Put it in `platform-contracts`. / 是否是跨包契约？放 `platform-contracts`。
3. Does it execute work? It needs a capability manifest and runtime envelope. / 是否执行工作？需要 capability manifest 和 runtime envelope。
4. Does it decide permission, platform, secret, budget, or sandbox? Put it in governance packages. / 是否决策权限、平台、secret、预算或 sandbox？放治理包。
5. Does it let a plugin, extension, MCP bridge, skill, hook, or UI surface enter the platform? Project it through `plugin-system` as a governed module and route execution to the owner package. / 是否让 plugin、extension、MCP bridge、skill、hook 或 UI surface 进入平台？通过 `plugin-system` 投影为受治理模块，并把执行路由给责任包。
6. Does it assemble model-visible instructions, selected evidence, or tool visibility without executing side effects? Put it in `prompt-assembly`. / 是否组装模型可见指令、已选证据或工具可见性，且不执行副作用？放 `prompt-assembly`。
7. Does it create immutable context blocks, layer manifests, prefix hashes, or context budget/cache telemetry? Put selection in `context-engine`, storage in `memory-cache-management`, and provider translation in `model-gateway`. / 是否创建不可变 context block、layer manifest、prefix hash 或 context budget/cache telemetry？选择逻辑放 `context-engine`，存储放 `memory-cache-management`，provider 翻译放 `model-gateway`。
8. Does it manage recall provider activation or PageIndex/ZVec/code-index diagnostics? Put it in `index-provider`; keep semantic providers deferred until activation evidence exists. / 是否管理 recall provider activation 或 PageIndex/ZVec/code-index diagnostics？放 `index-provider`；semantic provider 在 activation evidence 存在前保持 deferred。
9. Does it create rollback checkpoints, undo, or request-scoped revert evidence? Put it in `workspace-state-management`. / 是否创建 rollback checkpoint、undo 或 request-scoped revert evidence？放 `workspace-state-management`。
10. Is it test-only behavior? Put it in tests or `testing-regression`, not runtime. / 是否只用于测试？放 tests 或 `testing-regression`，不要放 runtime。
