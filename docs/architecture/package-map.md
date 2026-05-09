# Package Map / 包地图

This page maps packages to architectural ownership. It is a developer reference for where code should go.

本页将 package 映射到架构责任，是开发者判断代码应放在哪里的参考。

## Apps / 应用

| Package / 包 | Responsibility / 职责 |
| --- | --- |
| `src/apps/cli` | CLI host adapter, npm package entry, text and stream-json rendering. / CLI host 适配器、npm 入口、text 与 stream-json 渲染。 |
| `src/apps/vscode-extension` | VSCode host adapter skeleton, event projection, editor-context bridge. / VSCode host 适配器骨架、事件投影、编辑器上下文桥接。 |

## Core Platform Packages / 核心平台包

| Package / 包 | Responsibility / 职责 |
| --- | --- |
| `platform-contracts` | DTOs, ids, service interfaces, envelopes, errors. / DTO、id、service interface、envelope、error。 |
| `runtime` | Headless runtime kernel and projected runtime turns. / headless runtime kernel 与 projected runtime turn。 |
| `communication-protocol` | Host/runtime protocol codec and routing. / host/runtime 协议 codec 与路由。 |
| `runtime-message-bus` | Internal replayable event bus. / 内部可 replay event bus。 |
| `session-store` | Session event persistence, resume, fork. / session event 持久化、resume、fork。 |

## Capability Packages / 能力包

| Package / 包 | Responsibility / 职责 |
| --- | --- |
| `capability-registry` | Manifest registry and executor binding. / manifest registry 与 executor binding。 |
| `core-coding-tools` | File/search/edit/shell/git/todo tool foundation. / 文件、搜索、编辑、shell、git、todo 工具基础。 |
| `command-system` | Host-agnostic commands and interactive controls. / host-agnostic 命令和交互控制。 |
| `skill-system` | Canonical skills v1 manifest validation, summary-first progressive loading, trust inertness, activation, and context-only projection. / canonical skills v1 manifest 校验、summary-first 渐进加载、trust inertness、activation 与 context-only projection。 |
| `hook-system` | Canonical hooks v1 manifest validation, deterministic ordering, observe-only invocation, timeout containment, and failure policy. / canonical hooks v1 manifest 校验、确定性排序、observe-only invocation、超时隔离与失败策略。 |
| `mcp-gateway` | MCP server/tool/resource normalization. / MCP server、tool、resource 归一化。 |
| `plugin-system` | Plugin manifest and installed contribution model. / plugin manifest 与安装贡献模型。 |
| `extension-system` | Shared extension contribution contracts. / 共享 extension contribution 契约。 |

## Orchestration Packages / 编排包

| Package / 包 | Responsibility / 职责 |
| --- | --- |
| `workflow-orchestration` | Workflow templates, task graph, invocation lifecycle. / workflow 模板、task graph、invocation 生命周期。 |
| `concurrency-orchestration` | Scheduler, locks, timeout, cancellation, backpressure. / 调度器、锁、超时、取消、背压。 |
| `agent-management` | Agent definitions, lifecycle, scopes, budgets. / agent 定义、生命周期、范围、预算。 |
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
| `context-engine` | ContextGraph projection, redaction, budgets, cache metadata. / ContextGraph 投影、脱敏、预算、缓存 metadata。 |
| `memory-cache-management` | Memory/cache contracts and future governance. / memory/cache 契约与未来治理。 |
| `code-intelligence` | Diagnostics, symbols, references, code evidence. / diagnostics、symbols、references、code evidence。 |

## Quality And Evolution Packages / 质量与演进包

| Package / 包 | Responsibility / 职责 |
| --- | --- |
| `testing-regression` | Deterministic fakes, matrix helpers, replay support. / 确定性 fake、matrix helper、replay support。 |
| `observability` | Trace/audit/diagnostic event surface. / trace、audit、diagnostic event 面。 |
| `evolution-engine` | Future feedback/eval/evolution loops. / 未来反馈、eval、演进闭环。 |
| `distribution-update-management` | Future update channels and release metadata. / 未来更新通道和发布 metadata。 |

## Placement Rule / 放置规则

When unsure where code belongs, answer these questions:

不确定代码放哪里时，回答这些问题：

1. Is it host-specific rendering or input? Put it in an app. / 是否是 host-specific 渲染或输入？放 app。
2. Is it a contract used across packages? Put it in `platform-contracts`. / 是否是跨包契约？放 `platform-contracts`。
3. Does it execute work? It needs a capability manifest and runtime envelope. / 是否执行工作？需要 capability manifest 和 runtime envelope。
4. Does it decide permission, platform, secret, budget, or sandbox? Put it in governance packages. / 是否决策权限、平台、secret、预算或 sandbox？放治理包。
5. Is it test-only behavior? Put it in tests or `testing-regression`, not runtime. / 是否只用于测试？放 tests 或 `testing-regression`，不要放 runtime。
