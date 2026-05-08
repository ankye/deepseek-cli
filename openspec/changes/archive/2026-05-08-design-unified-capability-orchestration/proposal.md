## Why

DeepSeek CLI already has agents, commands, skills, hooks, MCP, plugins, extensions, model calls, memory/cache, sandbox, workflow, and host adapters, but these capabilities must not evolve into separate execution islands with separate approval, cancellation, telemetry, replay, and resource rules.

DeepSeek CLI 已经规划了 agent、command、skill、hook、MCP、plugin、extension、model、memory/cache、sandbox、workflow 和 host adapters，但这些能力不能各自形成独立执行孤岛，否则 approval、cancellation、telemetry、replay 和资源规则会分裂。

The platform needs one capability specification and invocation governance model so every executable capability can be composed, scheduled, constrained, audited, and replayed consistently across CLI, VSCode, tests, CI, and future server modes.

平台需要一套统一的能力规范与调用治理模型，让所有可执行能力都能在 CLI、VSCode、tests、CI 和未来 server modes 中被一致地组合、调度、约束、审计和回放。

## What Changes

- Define a platform-level capability execution specification for executable work units, contribution sources, constraints, invocation envelopes, runtime bindings, and result contracts.
- 定义平台级 capability execution specification，覆盖 executable work units、contribution sources、constraints、invocation envelopes、runtime bindings 和 result contracts。
- Define capability constraints for trust, permissions, side effects, resources, idempotency, retry safety, context access, memory/cache access, sandbox requirements, host support, compatibility, and lifecycle state.
- 定义能力约束，覆盖 trust、permissions、side effects、resources、idempotency、retry safety、context access、memory/cache access、sandbox requirements、host support、compatibility 和 lifecycle state。
- Define invocation rules that route all side-effecting or asynchronous capability execution through workflow orchestration, concurrency scheduling, policy/approval, sandbox, runtime message bus, observability, and regression replay.
- 定义调用规则，要求所有有副作用或异步的能力执行通过 workflow orchestration、concurrency scheduling、policy/approval、sandbox、runtime message bus、observability 和 regression replay。
- Clarify the boundary between registration, projection, planning, scheduling, execution, eventing, audit, and replay.
- 明确 registration、projection、planning、scheduling、execution、eventing、audit 和 replay 的边界。
- Establish how skills, plugins, hooks, MCP tools/resources, commands, agents, model calls, context providers, memory/cache jobs, workspace edits, and remote calls become governed executable work.
- 建立 skill、plugin、hook、MCP tools/resources、command、agent、model call、context provider、memory/cache job、workspace edit 和 remote call 如何转成受治理的 executable work。

## Capabilities

### New Capabilities

- `capability-execution-governance`: Defines the shared capability specification, constraints, invocation envelope, execution pipeline, and governance rules for all executable platform capabilities.

### Modified Capabilities

- `capability-registry`: Capabilities must carry execution metadata and constraint metadata before projection or execution.
- `workflow-orchestration`: Workflows must plan capability invocations as typed executable nodes with dependencies and rollback semantics.
- `concurrency-orchestration`: Scheduler must own executable task scopes, resource locks, deadlines, retry budgets, backpressure, and cancellation for governed capability work.
- `runtime-event-loop`: Runtime must invoke executable capabilities through the governed pipeline instead of direct subsystem calls.
- `runtime-message-bus`: Bus must carry capability invocation, decision, result, telemetry, and replay events with ownership and redaction metadata.
- `policy-sandbox`: Policy, approval, sandbox, and audit must evaluate capability invocation envelopes rather than ad hoc tool requests.
- `agent-management`: Agent scopes must filter and constrain capability invocations.
- `skill-system`: Skill activation and skill-backed execution must produce governed executable work.
- `plugin-system`: Plugin-contributed items must be normalized into governed capabilities and cannot bypass invocation rules.
- `hook-system`: Hooks must be invoked as governed executable work when they do more than observe.
- `mcp-gateway`: MCP tools/resources/prompts must be normalized into governed capability invocations.
- `testing-regression`: Regression harness must replay capability invocation decisions, events, outputs, and failure modes.

## Impact

- Affects platform contracts, capability registry, runtime loop, workflow orchestration, concurrency orchestration, policy/sandbox, runtime message bus, observability, regression, and all extension systems.
- 影响 platform contracts、capability registry、runtime loop、workflow orchestration、concurrency orchestration、policy/sandbox、runtime message bus、observability、regression 和所有 extension systems。
- Establishes a future-proof control plane for multi-agent delegation, plugins, skills, MCP, background jobs, IDE/server hosts, team policy, and deterministic self-regression.
- 为 multi-agent delegation、plugins、skills、MCP、background jobs、IDE/server hosts、team policy 和 deterministic self-regression 建立面向未来的控制面。
- Does not require implementing a distributed scheduler in this change; the first implementation may remain deterministic, in-process, and minimal while preserving the contracts.
- 本变更不要求实现分布式调度器；第一版实现可以保持 deterministic、in-process、minimal，但必须保留契约。
