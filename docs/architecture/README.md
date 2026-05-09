# Architecture Volume / 架构卷

This volume explains the DeepSeek CLI platform architecture for engineers working on runtime, protocol, capabilities, policy, platform abstraction, and host adapters.

本卷解释 DeepSeek CLI 的平台架构，面向 runtime、protocol、capability、policy、platform abstraction 和 host adapter 的工程师。

## Architecture Documents / 架构文档

| Document / 文档 | Purpose / 用途 |
| --- | --- |
| [System Overview](system-overview.md) | Overall platform shape and layer boundaries. / 整体平台形态与分层边界。 |
| [Execution Model](execution-model.md) | Runtime turn lifecycle, execution envelope, and policy/scheduler handoff. / runtime turn 生命周期、execution envelope、policy/scheduler 交接。 |
| [Orchestration And Scheduling](orchestration-and-scheduling.md) | Workflow graph, scheduler, agent manager, task events, and multi-agent direction. / workflow graph、scheduler、agent manager、task events、多 Agent 方向。 |
| [Capability Model](capability-model.md) | How tools, commands, skills, hooks, MCP, plugins, workflows, and subagents enter the platform. / 工具、命令、skills、hooks、MCP、plugins、workflows、subagents 如何进入平台。 |
| [Security And Policy](security-and-policy.md) | Secret redaction, sandbox, platform matrix, fail-closed behavior. / secret 脱敏、sandbox、平台矩阵、fail-closed 行为。 |
| [Protocol And Events](protocol-and-events.md) | Protocol envelope, runtime events, bus replay, and host consumption. / protocol envelope、runtime events、bus replay、host 消费方式。 |
| [Package Map](package-map.md) | Package ownership, allowed dependencies, and boundary rules. / 包责任、允许依赖和边界规则。 |
| [Future Host Landing Zones](future-host-landings.md) | Reserved locations for future UX and host capabilities. / 未来 UX 与 host 能力的落点。 |

## Architecture Principles / 架构原则

1. Runtime owns execution. Hosts render events. / runtime 负责执行，host 渲染事件。
2. Contracts precede implementation. / 契约先于实现。
3. Every executable capability goes through one envelope. / 每个可执行能力走同一个 envelope。
4. Policy and sandbox gate work before scheduling. / policy 与 sandbox 在调度前门禁。
5. Platform differences live in `platform-abstraction`. / 平台差异归 `platform-abstraction`。
6. Tests and lint enforce architecture. / 测试和 lint 强制架构。

## Related OpenSpec Specs / 相关 OpenSpec Specs

- `openspec/specs/runtime-execution-kernel/spec.md`
- `openspec/specs/runtime-event-loop/spec.md`
- `openspec/specs/workflow-orchestration/spec.md`
- `openspec/specs/concurrency-orchestration/spec.md`
- `openspec/specs/agent-management/spec.md`
- `openspec/specs/capability-execution-governance/spec.md`
- `openspec/specs/policy-sandbox/spec.md`
- `openspec/specs/secret-sandbox-hardening/spec.md`
- `openspec/specs/platform-abstraction/spec.md`
