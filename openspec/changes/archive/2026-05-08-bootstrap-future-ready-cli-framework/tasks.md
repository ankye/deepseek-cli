## 1. OpenSpec and Workspace Foundation

- [x] 1.1 Keep proposal, design, specs, and tasks bilingual in English/Chinese. / 保持 proposal、design、specs、tasks 中英文双语。
- [x] 1.2 Create TypeScript workspace metadata, package manager workspace config, root TypeScript config, lint/typecheck/test scripts. / 创建 TypeScript workspace 元数据、包管理 workspace 配置、根 TypeScript 配置、lint/typecheck/test 脚本。
- [x] 1.3 Create `src/apps/cli` and `src/apps/vscode-extension` as separate application directories. / 创建独立的 `src/apps/cli` 和 `src/apps/vscode-extension` 应用目录。
- [x] 1.4 Create `src/packages` directories for `platform-contracts`, `communication-protocol`, `runtime-message-bus`, `runtime`, `workflow-orchestration`, `concurrency-orchestration`, `agent-management`, `model-gateway`, `context-engine`, `memory-cache-management`, `capability-registry`, `command-system`, `skill-system`, `hook-system`, `mcp-gateway`, `plugin-system`, `extension-system`, `evolution-engine`, `credential-auth-management`, `usage-budget-management`, `workspace-state-management`, `code-intelligence`, `policy-sandbox`, `platform-abstraction`, `session-store`, `remote-runtime-connectivity`, `distribution-update-management`, `config`, `observability`, and `testing-regression`, and document future-only landing zones without creating implementation packages for deferred UX. / 创建对应平台包目录，并记录 deferred UX 的 future-only landing zones。
- [x] 1.5 Add package exports/path aliases so apps and packages import through package boundaries, not cross-package relative internals. / 添加 package exports/path aliases，避免跨包相对路径导入内部实现。

## 2. Platform Contracts

- [x] 2.1 Define branded ids, versioned envelopes, trace context, redacted error shape, serializable DTO conventions, and compatibility metadata. / 定义 branded ids、versioned envelopes、trace context、redacted error shape、serializable DTO conventions 和 compatibility metadata。
- [x] 2.2 Define contract modules for protocol, runtime message bus, runtime, host, workflow, concurrency, agent, model, capability, command, skill, hook, MCP, plugin, extension, context, memory, cache, credential, usage, workspace state, policy, sandbox, session, platform, evolution, code intelligence, remote, distribution, config, observability, and testing. / 定义各平台 contract 模块。
- [x] 2.3 Define service interfaces including `ProtocolRouter`, `RuntimeMessageBus`, `AgentRuntime`, `WorkflowOrchestrator`, `ConcurrencyOrchestrator`, `AgentManager`, `ModelGateway`, `ContextEngine`, `MemoryManager`, `CacheManager`, `CapabilityRegistry`, `CommandSystem`, `SkillSystem`, `HookSystem`, `McpGateway`, `PluginManager`, `ExtensionManager`, `EvolutionEngine`, `CredentialManager`, `UsageBudgetManager`, `WorkspaceStateManager`, `CodeIntelligenceService`, `PolicyEngine`, `ApprovalBroker`, `SandboxRuntime`, `SessionStore`, `PlatformRuntime`, `RemoteRuntimeConnectivity`, `DistributionUpdateManager`, `ConfigStore`, `ObservabilitySink`, and `RegressionHarness`. / 定义平台级服务接口。
- [x] 2.4 Define `RuntimeDependencies` and host adapter contracts for CLI, VSCode, test, and future server transports. / 定义 `RuntimeDependencies` 和 host adapter contracts。
- [x] 2.5 Add type-level or contract tests proving `platform-contracts` has no CLI, VSCode, Node-only process API, model SDK, or implementation-package dependency. / 添加 contract tests，证明 `platform-contracts` 无 host/实现依赖。

## 3. Communication Protocol and Pipeline

- [x] 3.1 Define versioned protocol envelope, request/response/event/control message types, correlation ids, routing metadata, trace context, redaction class, and error payloads. / 定义版本化 protocol envelope、消息类型、correlation ids、routing metadata、trace context、redaction class 和 error payloads。
- [x] 3.2 Implement protocol validation, encode/decode, routing, and transport-neutral pipeline stages. / 实现协议校验、编解码、路由和 transport-neutral pipeline stages。
- [x] 3.3 Implement in-process transport for tests and app adapters. / 实现 in-process transport。
- [x] 3.4 Define CLI stream-json transport semantics without making stdout parsing the internal integration contract. / 定义 CLI stream-json transport 语义，但不把 stdout parsing 作为内部集成契约。
- [x] 3.5 Define VSCode host transport contract for commands, chat input, editor context, approvals, cancellation, workspace edits, and event rendering. / 定义 VSCode host transport contract。
- [x] 3.6 Add protocol golden tests for envelope compatibility, routing, error handling, cancellation, backpressure, and event ordering. / 添加 protocol golden tests。

## 4. Runtime Message Bus

- [x] 4.1 Define bus envelope, topic model, command/event/request/reply/control messages, producer ownership, subscriber permissions, correlation ids, causation ids, trace context, and redaction metadata. / 定义 message bus envelope、topic model、消息类型、producer ownership、subscriber permissions、correlation ids、causation ids、trace context 和 redaction metadata。
- [x] 4.2 Implement deterministic in-memory bus with bounded queues, ordered correlation streams, cancellation propagation, backpressure, overflow errors, and fake clock hooks. / 实现 deterministic in-memory bus。
- [x] 4.3 Wire runtime, workflow, concurrency, agent, capability, command, skill, hook, MCP, plugin, policy, session, observability, and regression events through the bus. / 将各 runtime services 接入 bus。
- [x] 4.4 Persist selected bus records to session/replay traces with redaction and compatibility metadata. / 持久化可 replay 的 bus records。
- [x] 4.5 Add bus golden tests for topic ownership, ordering, backpressure, replay, redaction, and trust-boundary policy checks. / 添加 message bus golden tests。

## 5. Runtime Kernel

- [x] 5.1 Implement `AgentRuntime` skeleton with injected dependencies and no terminal/VSCode/global process dependency. / 实现无 host/global 依赖的 `AgentRuntime` 骨架。
- [x] 5.2 Implement start session, run turn, interrupt, dispose, and `AsyncIterable<RuntimeEvent>` lifecycle. / 实现 session、turn、interrupt、dispose 和事件流生命周期。
- [x] 5.3 Wire runtime to protocol router, runtime message bus, workflow orchestrator, concurrency orchestrator, agent manager, model gateway, context engine, memory/cache, capability registry, command system, skill system, hook system, MCP gateway, plugin manager, policy/sandbox, usage budget, credentials, workspace state, session store, observability, and regression hooks. / 将 runtime 接入各平台服务。
- [x] 5.4 Implement minimal `deepseek -p` headless path using deterministic fake dependencies. / 使用 deterministic fakes 跑通最小 `deepseek -p` 路径。

## 6. Workflow and Task/Pipeline Orchestration

- [x] 6.1 Define user task, workflow graph, step, dependency, checkpoint, artifact, handoff, rollback, retry policy, and completion criteria contracts. / 定义任务与流水线编排 contracts。
- [x] 6.2 Implement in-memory workflow orchestrator for single-turn/single-agent workflow with explicit step events. / 实现单 turn/单 agent 的 in-memory workflow orchestrator。
- [x] 6.3 Add checkpoint and rollback metadata integration with session store. / 接入 checkpoint 和 rollback metadata 到 session store。
- [x] 6.4 Add workflow template contribution point for future extensions. / 增加 future extensions 的 workflow template contribution point。
- [x] 6.5 Add tests for task graph validation, step ordering, checkpoint creation, rollback metadata, and workflow event emission. / 添加 workflow 测试。

## 7. Concurrency Orchestration

- [x] 7.1 Define task scope, task handle, task event, cancellation reason, deadline, resource lock, queue policy, rate limit, retry budget, and backpressure contracts. / 定义并发编排 contracts。
- [x] 7.2 Implement deterministic in-memory scheduler with parent/child scopes, cancellation propagation, deadlines, terminal task events, and fake clock hooks. / 实现确定性 in-memory scheduler。
- [x] 7.3 Implement locks for workspace, path, session, agent instance, model provider, process slot, extension loading, plugin install/update, MCP connection, hook execution, and remote transport. / 实现资源锁。
- [x] 7.4 Implement bounded queues, max concurrency, provider/tool/sandbox/plugin/hook/MCP limits, retry budget checks, and backpressure signals. / 实现队列、限流、重试预算和背压。
- [x] 7.5 Wire runtime, workflow, model streams, capability execution, context providers, extension loading, plugin lifecycle, hook execution, MCP calls, and sandbox execution through the orchestrator. / 将异步执行统一接入 orchestrator。
- [x] 7.6 Add tests for cancellation, deadline timeout, lock serialization, rate limiting, backpressure, retry exhaustion, and fake scheduler determinism. / 添加并发测试。

## 8. Agent Management

- [x] 8.1 Define agent definition, registry, instance, lifecycle, scopes, model/prompt profile binding, memory scope, session binding, and delegation metadata. / 定义 agent management contracts。
- [x] 8.2 Implement agent definition validation and registry for built-in, user, workspace, extension-contributed, and plugin-contributed definitions. / 实现 agent definition 校验和注册。
- [x] 8.3 Implement default agent resolver and in-memory instance lifecycle manager. / 实现默认 agent 和实例生命周期。
- [x] 8.4 Connect agent capability scope, context scope, memory scope, policy scope, skill scope, command scope, hook scope, and model/prompt profiles to runtime execution. / 接入 agent scopes 和 profiles。
- [x] 8.5 Persist agent identity, definition version, lifecycle events, scope decisions, and delegation metadata through session/audit boundaries. / 持久化 agent 元数据。

## 9. Model, Context, Memory, Cache, Credentials, and Usage

- [x] 9.1 Define provider-neutral model request, streaming event, tool-call, usage, error, token count, and model profile contracts. / 定义 model gateway contracts。
- [x] 9.2 Implement deterministic mock model adapter and DeepSeek adapter skeleton without requiring live credentials for tests. / 实现 mock model 和 DeepSeek adapter skeleton。
- [x] 9.3 Define credential references, auth flow contracts, secure storage extension points, secret redaction, expiration, rotation, and credential audit metadata. / 定义 credential/auth contracts。
- [x] 9.4 Define usage and budget contracts for tokens, cost, time, rate limits, workflow/session/agent/plugin budgets, warnings, and hard limits. / 定义 usage/budget contracts。
- [x] 9.5 Define context node, context graph, projection, compaction, retrieval, rehydration, and workspace state reference contracts. / 定义 context engine contracts。
- [x] 9.6 Implement in-memory context graph and deterministic projection strategy. / 实现 in-memory context graph 和 projection。
- [x] 9.7 Define memory scopes for working/session/project/user/semantic/skill memory with provenance, redaction, TTL/invalidation, confidence, and compatibility metadata. / 定义 memory scopes 和治理 metadata。
- [x] 9.8 Define cache namespaces for token counts, file snapshots, search indexes, model fragments, tool results, skill packages, plugin artifacts, extension manifests, MCP resources, code intelligence indexes, and platform availability with invalidation and TTL. / 定义 cache namespaces、invalidation 和 TTL。
- [x] 9.9 Implement deterministic in-memory memory store, cache store, credential fake, and usage budget fake with redaction hooks. / 实现确定性 memory/cache/credential/usage fakes。
- [x] 9.10 Add tests for memory scope isolation, cache invalidation, redaction, provenance, context projection with memory references, credential scoping, usage accounting, and deterministic cache hits. / 添加 memory/cache/credential/usage 测试。

## 10. Capability, Command, Skill, Hook, MCP, Plugin, Extension, and Evolution

- [x] 10.1 Define capability manifest, source, trust status, lifecycle, schemas, side-effect level, permissions, context behavior, compatibility, and enablement metadata. / 定义 capability manifest。
- [x] 10.2 Implement capability registration, duplicate rejection, model-visible tool projection, executor lookup, and input validation. / 实现 capability registry。
- [x] 10.3 Define command manifest, invocation modes, aliases, host support, side-effect metadata, structured result contracts, and help projection. / 定义 command system contracts。
- [x] 10.4 Define skill package manifest, discovery sources, trust, progressive loading, activation modes, execution modes, memory/cache hooks, and regression metadata. / 定义 skill system contracts。
- [x] 10.5 Define hook lifecycle points, schemas, ordering, isolation, timeout, failure policy, and typed output contracts. / 定义 hook system contracts。
- [x] 10.6 Define MCP gateway contracts for transports, connections, tools, prompts, resources, namespacing, trust, timeout, and audit metadata. / 定义 MCP gateway contracts。
- [x] 10.7 Define plugin manifest, package sources, lockfile, install scopes, integrity metadata, dependencies, permission diffs, lifecycle, quarantine, rollback, and audit contracts. / 定义 plugin system contracts。
- [x] 10.8 Define extension manifest, source, integrity metadata, trust, compatibility, activation conditions, permissions, and contribution points. / 定义 extension manifest。
- [x] 10.9 Implement minimal in-memory registries/loaders for capabilities, commands, skills, hooks, MCP fake servers, plugins, and extensions with untrusted sources disabled by default. / 实现最小 deterministic registries/loaders。
- [x] 10.10 Support contribution points for tools, commands, skills, agent definitions, hooks, MCP connectors, resources, renderers, context providers, memory/cache providers, policy fragments, workflow templates, model profiles, output/rendering styles, and host capabilities. / 支持 contribution points。
- [x] 10.11 Define evolution contracts for feature gates, capability bundles, skill versions, plugin versions, profile versions, migrations, deprecations, compatibility checks, feedback records, and rollback. / 定义 evolution contracts。
- [x] 10.12 Add tests for extension/plugin trust, manifest validation, permission diffs, contributed agent ownership, skill loading, hook isolation, MCP namespacing, feature gate defaults, migration metadata, and rollback compatibility. / 添加 capability/command/skill/hook/MCP/plugin/extension/evolution 测试。

## 11. Policy, Sandbox, Audit, Platform, Workspace, and Code Intelligence

- [x] 11.1 Define policy decision, approval request/decision, sandbox request/event, audit record, redaction summary, trust boundary, and permission diff contracts. / 定义 policy/sandbox/audit contracts。
- [x] 11.2 Implement policy stub supporting allow, ask, deny, rewrite, require-sandbox, and quarantine. / 实现 policy stub。
- [x] 11.3 Implement approval broker contract and headless approval adapter for capability, command, plugin, MCP, remote, and workspace edit approvals. / 实现 approval broker 和 headless adapter。
- [x] 11.4 Implement development sandbox adapter that records controls and reports non-production enforcement mode. / 实现 development sandbox adapter。
- [x] 11.5 Define `PlatformRuntime`, path, filesystem, environment, process, shell profile, command resolver, text search, file discovery, native availability, and host capability contracts. / 定义 platform abstraction contracts。
- [x] 11.6 Implement macOS, Windows, Linux, and fake platform adapter skeletons with command fallback rules for `rg`, POSIX `grep`, PowerShell `Select-String`, and JS fallback. / 实现平台 adapter skeleton 和搜索 fallback。
- [x] 11.7 Define workspace state contracts for workspace identity, trusted roots, file snapshots, diff state, edit transactions, patch artifacts, worktree/overlay direction, rollback metadata, and host edit coordination. / 定义 workspace state contracts。
- [x] 11.8 Define code intelligence contracts for diagnostics, symbols, definitions, references, code actions, file indexes, provider lifecycle, cache invalidation, and edit evidence. / 定义 code intelligence contracts。
- [x] 11.9 Add policy/sandbox/platform/workspace/code-intelligence tests for approvals, denials, audit records, fallback reasons, path behavior, argv-based process execution, edit transactions, diagnostics context, and provider fallback. / 添加 policy/sandbox/platform/workspace/code-intelligence 测试。

## 12. Session, Config, Remote, Distribution, Observability, and Regression

- [x] 12.1 Define event-sourced session events, snapshots, checkpoints, resume, fork, redaction, encryption extension points, remote binding, and attachment transfer metadata. / 定义 session store contracts。
- [x] 12.2 Implement in-memory session store and development filesystem store with redaction hooks. / 实现 in-memory 和 development filesystem session store。
- [x] 12.3 Define config profiles, workspace settings, environment binding, secret references, plugin settings, marketplace/catalog settings, and precedence rules. / 定义 config contracts。
- [x] 12.4 Define remote runtime connectivity contracts for local server, remote session, IDE bridge, relay, trusted device metadata, remote approval, reconnect, cancellation, and session continuity. / 定义 remote runtime connectivity contracts。
- [x] 12.5 Define distribution/update contracts for release metadata, plugin catalogs, bundled capability bundles, compatibility notices, signed metadata, blocklists, migrations, and rollback. / 定义 distribution/update contracts。
- [x] 12.6 Define observability events, logs, metrics, traces, audit sink, task telemetry, plugin telemetry, usage telemetry, bus telemetry, and redaction rules. / 定义 observability contracts。
- [x] 12.7 Define regression harness, test directory map, golden trace format, replay input, bus trace replay, plugin/skill/hook/MCP scenario suites, semantic assertion, compatibility check, artifact governance, and self-regression gate contracts. / 定义 testing/self-regression contracts 和测试目录地图。
- [x] 12.8 Define shared deterministic fakes for protocol, bus, runtime dependencies, model, workflow, concurrency, platform, workspace state, session, memory/cache, credentials, usage, policy, sandbox, code intelligence, plugin, skill, hook, MCP, and clocks. / 定义共享 deterministic fakes。
- [x] 12.9 Define repository test layout: package-local `test/`, `tests/contracts`, `tests/integration`, `tests/golden`, `tests/scenarios`, `tests/compatibility`, `tests/fixtures`, `tests/matrix`, and `tests/e2e`. / 定义 repository test layout。
- [x] 12.10 Implement deterministic replay harness over protocol events, runtime bus events, session events, audit events, usage events, workflow events, and workspace events. / 实现 protocol/bus/session replay harness。
- [x] 12.11 Add golden trace tests for the minimal headless runtime, protocol pipeline, runtime message bus, and deterministic plugin/skill/hook/MCP fakes. / 添加最小 runtime/protocol/bus golden trace tests。
- [x] 12.12 Define CI gates for typecheck, lint, package unit tests, contract tests, integration tests, golden replay, compatibility checks, fake platform matrix, e2e smoke, and optional live suites. / 定义 CI gates。
- [x] 12.13 Define acceptance evidence layout under `tests/acceptance` with gate-to-command/test/evidence mapping and latest verification artifacts. / 定义 acceptance evidence layout。

## 13. Host Adapters

- [x] 13.1 Implement `src/apps/cli` as a thin host adapter over protocol/runtime contracts. / 实现薄 CLI host adapter。
- [x] 13.2 Implement `deepseek -p` with text and stream-json event rendering. / 实现 `deepseek -p` 和事件渲染。
- [x] 13.3 Add host command rendering for command/plugin/skill/policy/usage events without owning platform lifecycle logic. / 添加 host command rendering。
- [x] 13.4 Create `src/apps/vscode-extension` skeleton with package metadata and activation entrypoint. / 创建 VSCode extension skeleton。
- [x] 13.5 Implement VSCode host bridge skeleton for commands, chat input, selected ranges, active documents, diagnostics, workspace folders, approvals, cancellation, event rendering, and workspace edit application. / 实现 VSCode host bridge skeleton。
- [x] 13.6 Ensure VSCode imports shared contracts and does not import CLI application code. / 确保 VSCode 不导入 CLI 应用代码。
- [x] 13.7 Document future host landing zones for voice, modal editing/keybindings, rich TUI, notifications, browser/native-host integration, daemon/server mode, and update UI without implementing them in the first framework. / 记录 future host landing zones，但第一版不实现这些 deferred UX/product capabilities。

## 14. Verification

- [x] 14.1 Run OpenSpec strict validation for `bootstrap-future-ready-cli-framework` and save evidence. / 运行 OpenSpec strict validation 并保存证据。
- [x] 14.2 Run OpenSpec reference hygiene scan and save evidence. / 运行 OpenSpec reference hygiene scan 并保存证据。
- [x] 14.3 Verify workspace layout, package directories, test directories, package exports, and dependency boundaries; save evidence. / 校验 workspace layout、package directories、test directories、package exports 和 dependency boundaries，并保存证据。
- [x] 14.4 Run workspace typecheck across all apps and packages and save evidence. / 运行 workspace typecheck 并保存证据。
- [x] 14.5 Run package-local unit tests and contract tests for platform contracts, protocol, runtime message bus, runtime, workflow, concurrency, agent, model, context, memory/cache, credentials, usage, workspace state, capabilities, commands, skills, hooks, MCP gateway, plugins, extensions, evolution, policy/sandbox, platform, code intelligence, session, remote, distribution, and regression harness; save evidence. / 运行各 package unit/contract tests 并保存证据。
- [x] 14.6 Run integration tests across protocol, runtime, workflow, concurrency, session, policy, workspace, and host adapter seams; save evidence. / 运行 integration tests 并保存证据。
- [x] 14.7 Run golden replay and compatibility checks for protocol, bus, runtime, session, manifests, schemas, migrations, and artifacts; save evidence. / 运行 golden replay 和 compatibility checks 并保存证据。
- [x] 14.8 Run fake platform matrix tests for macOS, Windows, Linux, filesystem, process, shell, and clock behavior; save evidence. / 运行 fake platform matrix tests 并保存证据。
- [x] 14.9 Run smoke test showing `deepseek -p` emits runtime events with session, agent, task, workflow, bus, usage, and trace metadata; save smoke trace evidence. / 运行 `deepseek -p` smoke test 并保存 smoke trace evidence。
- [x] 14.10 Run deterministic replay of the smoke trace through the regression harness and save evidence. / 使用 regression harness replay smoke trace 并保存证据。
- [x] 14.11 Run CLI and VSCode host adapter smoke tests proving thin-host boundaries and save evidence. / 运行 CLI/VSCode host adapter smoke tests 并保存证据。
- [x] 14.12 Complete `tests/acceptance/acceptance-index.md` mapping every acceptance gate to command, test suite, trace, fixture, scenario, artifact, or explicit deferral. / 完成 acceptance evidence index。
