## Why

DeepSeek CLI has defined a future-ready platform architecture, but the repository still needs a first executable runtime kernel that turns those contracts into a usable control plane. Without this kernel, CLI, VSCode, plugins, skills, MCP, hooks, agents, and tests will be forced to invent local execution paths.

DeepSeek CLI 已经定义了面向未来的平台架构，但仓库还需要第一个可运行的 runtime kernel，把这些契约变成真正可复用的控制面。否则 CLI、VSCode、plugin、skill、MCP、hook、agent 和测试都会各自发明执行路径。

## What Changes

- Implement an in-process runtime execution kernel with explicit lifecycle, dependency injection, host-neutral event streaming, and deterministic shutdown.
- 实现一个 in-process runtime execution kernel，具备明确 lifecycle、dependency injection、host-neutral event streaming 和 deterministic shutdown。
- Introduce a canonical execution envelope builder and validation boundary used by all runtime-triggered executable work.
- 引入统一 execution envelope builder 与 validation boundary，所有 runtime-triggered executable work 都必须使用。
- Implement the first governed capability registry and execution pipeline for built-in capabilities.
- 实现第一版 governed capability registry 与 execution pipeline，先支持 built-in capabilities。
- Implement a minimal concurrency scheduler with queueing, cancellation, timeout, trace propagation, and resource budget hooks.
- 实现最小 concurrency scheduler，覆盖 queueing、cancellation、timeout、trace propagation 和 resource budget hooks。
- Implement a runtime message bus that emits canonical execution, workflow, scheduler, and host projection events.
- 实现 runtime message bus，输出 canonical execution、workflow、scheduler 和 host projection events。
- Add CLI integration for a headless runtime command that proves the CLI consumes runtime events instead of owning execution state.
- 增加 CLI headless runtime command，证明 CLI 消费 runtime events，而不是自己维护 execution state。
- Add contract, integration, e2e, regression, and architecture lint coverage for the kernel.
- 增加 contract、integration、e2e、regression 和 architecture lint 覆盖，保护该内核。

## Capabilities

### New Capabilities

- `runtime-execution-kernel`: Defines the first executable runtime control plane, including lifecycle, dependency injection, execution envelope creation, capability invocation, scheduler integration, event streaming, host adapters, and acceptance coverage.

### Modified Capabilities

- `runtime-event-loop`: Runtime must expose a concrete kernel entry point and execute user turns through the governed kernel.
- `capability-execution-governance`: Execution envelopes must have a first implemented builder, validator, and governed invocation path.
- `capability-registry`: Registry must support first-class built-in capability registration, lookup, schema metadata, and executable bindings.
- `concurrency-orchestration`: Scheduler must provide an in-process deterministic queue with cancellation, timeout, and trace events.
- `runtime-message-bus`: Bus must provide an implemented event stream consumed by CLI, tests, and future VSCode adapters.
- `workflow-orchestration`: The first kernel must create a minimal workflow/task boundary around runtime requests.
- `policy-sandbox`: The first kernel must route policy and sandbox decisions through stubbed but explicit interfaces.
- `testing-regression`: Tests must cover runtime contracts, event ordering, cancellation, timeout, lint boundaries, and CLI e2e behavior.
- `command-system`: CLI command execution must delegate runtime work to the kernel instead of local direct execution.
- `vscode-extension-adapter`: VSCode must have a documented adapter seam for consuming the same runtime event stream, even if the extension implementation remains minimal.

## Impact

- Affects `src/packages/runtime`, `src/packages/contracts`, `src/packages/capabilities`, `src/packages/scheduler`, `src/packages/message-bus`, `src/apps/cli`, `src/apps/vscode-extension`, architecture lint rules, and test suites.
- 影响 runtime、contracts、capabilities、scheduler、message-bus、CLI、VSCode adapter、architecture lint 和测试套件。
- Establishes the first production-shaped path for all future DeepSeek executable abilities: model calls, tools, commands, hooks, plugins, skills, MCP, memory/cache jobs, workflows, and subagents.
- 为未来所有 DeepSeek executable abilities 建立第一条生产形态路径：model calls、tools、commands、hooks、plugins、skills、MCP、memory/cache jobs、workflows 和 subagents。
- This change intentionally remains in-process and deterministic; distributed scheduling, remote daemon mode, full sandbox enforcement, and full VSCode UI are future changes.
- 本变更刻意保持 in-process 和 deterministic；distributed scheduling、remote daemon mode、完整 sandbox enforcement 和完整 VSCode UI 留给后续变更。
