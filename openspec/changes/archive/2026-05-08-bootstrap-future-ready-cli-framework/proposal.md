## Why

DeepSeek CLI should be designed as a future-ready coding-agent platform, not as a CLI with growing side systems. The first framework must define stable platform contracts, communication protocols, orchestration boundaries, memory/cache governance, safety controls, test/regression loops, and thin host adapters before product features are built.

DeepSeek CLI 应被设计为面向未来的 coding-agent platform，而不是逐步膨胀的 CLI 工具。第一版基础框架必须先定义稳定的平台级接口、通信协议、编排边界、记忆/缓存治理、安全控制、测试/自回归闭环，以及薄 host adapters，再开始建设产品功能。

## What Changes

- Establish a TypeScript monorepo with separate `src/apps/cli` and `src/apps/vscode-extension` applications, backed by reusable packages under `src/packages`.
- Define `platform-contracts` as the canonical TypeScript interface layer for all cross-package boundaries.
- Define a protocol and communication pipeline for in-process, CLI stream, VSCode, test, and future server transports.
- Define an internal runtime message bus for service-to-service events, commands, replay, policy crossing, and runtime coordination.
- Define a headless runtime kernel that emits structured events and can serve CLI, VSCode, CI, tests, and future server modes.
- Define agent management for agent definitions, instances, lifecycle, scopes, profiles, sessions, and future delegation.
- Define workflow orchestration for user tasks, step graphs, checkpoints, handoff, rollback, and pipeline execution.
- Define concurrency orchestration for task scopes, cancellation, deadlines, locks, queues, backpressure, rate limits, and retry budgets.
- Define model gateway, context engine, memory management, and cache management as separate intelligence-layer services.
- Define capability registry, command system, first-class skill system, hook system, MCP gateway, plugin system, extension system, and evolution engine for typed tools, governed skill packages, commands, hooks, MCP connectors, resources, agent definitions, profiles, feature gates, migrations, and rollback.
- Define credential/auth management, usage/budget management, workspace state management, code intelligence, remote runtime connectivity, distribution/update management, policy, approval, sandbox, audit, platform abstraction, session store, observability, and config as platform services.
- Define future capability landing zones for deferred product capabilities such as voice, modal editing/keybindings, rich TUI, notifications, browser/native-host integration, recommendations, team/enterprise sync, daemon/server productization, production sandbox enforcement, and update UI.
- Define testing and self-regression infrastructure based on deterministic fakes, package-local unit tests, contract tests, integration tests, golden traces, replay, scenario suites, platform matrix tests, e2e smoke tests, artifact governance, compatibility checks, and CI gates.
- Define framework acceptance gates with pass/fail criteria, evidence artifacts, command/test mappings, and explicit deferral rules for future-only capabilities.
- Keep OpenSpec artifacts bilingual in English and Chinese for planning, behavior, and implementation guidance.
- Scope the first implementation to framework skeleton, contracts, deterministic adapters, and smoke paths, not a full production coding-agent product.

中文概述：

- 建立 TypeScript monorepo，`src/apps/cli` 与 `src/apps/vscode-extension` 分离，复用 `src/packages` 下的平台包。
- 定义 `platform-contracts` 作为所有跨包边界的 canonical TypeScript interface layer。
- 定义通信协议与通信管线，支持 in-process、CLI stream、VSCode、test，以及未来 server transports。
- 定义 internal runtime message bus，支撑 service-to-service events、commands、replay、policy crossing 和 runtime coordination。
- 定义 headless runtime kernel，输出结构化事件，支撑 CLI、VSCode、CI、测试和未来 server modes。
- 定义 agent management，管理 agent definitions、instances、lifecycle、scopes、profiles、sessions 和未来 delegation。
- 定义 workflow orchestration，管理用户任务、步骤图、checkpoint、handoff、rollback 和 pipeline execution。
- 定义 concurrency orchestration，管理 task scopes、cancellation、deadlines、locks、queues、backpressure、rate limits 和 retry budgets。
- 将 model gateway、context engine、memory management、cache management 作为独立 intelligence-layer services。
- 定义 capability registry、command system、一等 skill system、hook system、MCP gateway、plugin system、extension system、evolution engine，覆盖 typed tools、governed skill packages、commands、hooks、MCP connectors、resources、agent definitions、profiles、feature gates、migrations 和 rollback。
- 定义 credential/auth management、usage/budget management、workspace state management、code intelligence、remote runtime connectivity、distribution/update management、policy、approval、sandbox、audit、platform abstraction、session store、observability 和 config 等平台服务。
- 定义 future capability landing zones，为 voice、modal editing/keybindings、rich TUI、notifications、browser/native-host integration、recommendations、team/enterprise sync、daemon/server productization、production sandbox enforcement 和 update UI 等 deferred product capabilities 预留落点。
- 定义 testing/self-regression 基础设施，基于 deterministic fakes、package-local unit tests、contract tests、integration tests、golden traces、replay、scenario suites、platform matrix tests、e2e smoke tests、artifact governance、compatibility checks 和 CI gates。
- 定义 framework acceptance gates，包含 pass/fail criteria、evidence artifacts、command/test mappings，以及 future-only capabilities 的显式 deferral rules。
- OpenSpec 文档保持中英文双语，覆盖规划、行为和实现指导。
- 第一阶段只做框架骨架、契约、确定性 adapters 和 smoke paths，不做完整生产级 coding-agent 产品。

## Capabilities

### New Capabilities

- `bilingual-openspec-documentation`: English and Chinese descriptions for planning and requirement artifacts.
- `platform-contracts`: Canonical TypeScript contracts, DTOs, ids, errors, event envelopes, and dependency boundaries.
- `communication-protocol`: Versioned message protocol, transport abstraction, routing, correlation, backpressure, and pipeline stages.
- `runtime-message-bus`: Internal typed message bus for service events, commands, topics, replay, policy crossing, and runtime coordination.
- `runtime-event-loop`: Headless runtime kernel, turn lifecycle, runtime event stream, and tool-call loop boundaries.
- `agent-management`: Agent definitions, registries, instances, lifecycle, scopes, profiles, session binding, and future delegation contracts.
- `workflow-orchestration`: User task model, step graph, pipeline stages, checkpoints, handoff, rollback, and workflow event contracts.
- `concurrency-orchestration`: Structured task scheduling, cancellation propagation, deadlines, locks, queues, backpressure, rate limits, retry budgets, and task telemetry.
- `model-gateway`: DeepSeek-first model adapter abstraction with provider-neutral streaming and tool-call support.
- `context-engine`: Context graph, context node lifecycle, prompt projection, compaction/retrieval extension points.
- `memory-cache-management`: Durable memory, working memory, semantic/project/user scopes, cache namespaces, invalidation, TTL, provenance, and redaction.
- `capability-registry`: Typed capability manifest and registry for tools and extension points.
- `command-system`: Typed command registration, invocation modes, host-agnostic command results, and command discovery.
- `skill-system`: Governed skill packages, discovery, trust, progressive loading, activation, execution modes, scoped state, and skill regression.
- `hook-system`: Governed lifecycle hooks with ordering, isolation, timeout, policy, audit, and typed outputs.
- `mcp-gateway`: External MCP servers adapted into governed capabilities, resources, prompts, commands, and context providers.
- `plugin-system`: Distributable plugin packages, manifests, lockfiles, installation scopes, lifecycle, permission diffs, and plugin audit.
- `extension-system`: Manifest-driven extension loading, contribution points, trust metadata, and source boundaries.
- `evolution-engine`: Versioned capability bundles, feature gates, migrations, deprecations, compatibility checks, feedback loops, and rollback contracts.
- `credential-auth-management`: Host-agnostic credentials, auth flows, secret references, secure storage extension points, and redaction.
- `usage-budget-management`: Tokens, cost, time, rate limits, workflow/session/agent/plugin budgets, and deterministic accounting.
- `workspace-state-management`: Workspace identity, trusted roots, file snapshots, edit transactions, worktree/overlay direction, and host edit coordination.
- `code-intelligence`: Diagnostics, symbols, definitions, references, code actions, file indexes, and LSP/IDE/local analyzer providers.
- `policy-sandbox`: Policy decision, approval broker, audit record, and sandbox enforcement contracts.
- `platform-abstraction`: macOS/Windows/Linux/fake adapter abstraction for paths, filesystem, processes, shells, environment, command resolution, search, and availability.
- `session-store`: Event-sourced session persistence, resume, fork, checkpoint, redaction, and encryption direction.
- `remote-runtime-connectivity`: Future transport boundary for local server, remote sessions, IDE bridge, relays, remote approval, and session continuity.
- `distribution-update-management`: Release, plugin catalog, bundled capability bundle, compatibility notice, migration, signed metadata, and rollback direction.
- `future-capability-landings`: Landing zones for deferred UX, integration, recommendation, team/enterprise, daemon/server, sandbox, and update UI capabilities.
- `vscode-extension-adapter`: VSCode host bridge, editor context injection, runtime event rendering, approval flow, edit application, and session binding.
- `testing-regression`: Test harness APIs, deterministic fakes, package-local unit tests, contract tests, integration tests, golden traces, replay harness, scenario suites, platform matrix tests, e2e smoke tests, artifact governance, CI gates, self-regression gates, and compatibility checks.
- `framework-acceptance`: Acceptance gates, pass/fail criteria, required evidence, verification command mapping, and explicit deferral rules.

### Modified Capabilities

- None.

## Impact

- Creates the OpenSpec contract for the first DeepSeek CLI platform framework.
- Guides initial source layout under `src/apps/cli`, `src/apps/vscode-extension`, and `src/packages`.
- Establishes a platform architecture where CLI and VSCode are host adapters over shared contracts.
- Introduces explicit package boundaries for contracts, protocol, runtime message bus, runtime, agent, workflow, concurrency, model, context, memory/cache, capabilities, commands, skills, hooks, MCP gateway, plugins, extensions, evolution, credentials/auth, usage/budget, workspace state, code intelligence, remote connectivity, distribution/update, future capability landing zones, policy/sandbox, platform, sessions, observability, config, and tests.
- Establishes minimum acceptance targets for a `deepseek -p` headless smoke path, VSCode contract fixture, deterministic replay, and OpenSpec validation.
- Establishes an acceptance evidence index so framework completion can be reviewed by gates rather than subjective readiness.
