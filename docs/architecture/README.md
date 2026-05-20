# Architecture Volume / 架构卷

This volume explains the DeepSeek CLI platform architecture for engineers working on runtime, protocol, capabilities, policy, platform abstraction, and host adapters.

本卷解释 DeepSeek CLI 的平台架构，面向 runtime、protocol、capability、policy、platform abstraction 和 host adapter 的工程师。

## Architecture Documents / 架构文档

| Document / 文档 | Purpose / 用途 |
| --- | --- |
| [System Overview](system-overview.md) | Overall platform shape and layer boundaries. / 整体平台形态与分层边界。 |
| [Execution Model](execution-model.md) | Runtime turn lifecycle, execution envelope, and policy/scheduler handoff. / runtime turn 生命周期、execution envelope、policy/scheduler 交接。 |
| [Platform Contracts UAPI](platform-contracts-uapi.md) | Stable UAPI classification, migration evidence, fail-closed version handling, and implementation-free guardrails. / 稳定 UAPI 分类、迁移证据、fail-closed 版本处理与无实现护栏。 |
| [Execution Model](execution-model.md#evidence-first-turn-phase--evidence-first-回合阶段) | Evidence-first turn phase and prompt assembly phase. / evidence-first 回合阶段与 prompt assembly 阶段。 |
| [Orchestration And Scheduling](orchestration-and-scheduling.md) | Workflow graph, scheduler, agent manager, task events, and multi-agent direction. / workflow graph、scheduler、agent manager、task events、多 Agent 方向。 |
| [Capability Model](capability-model.md) | How tools, commands, skills, hooks, MCP, plugins, workflows, and subagents enter the platform. / 工具、命令、skills、hooks、MCP、plugins、workflows、subagents 如何进入平台。 |
| [Security And Policy](security-and-policy.md) | Secret redaction, sandbox, platform matrix, fail-closed behavior. / secret 脱敏、sandbox、平台矩阵、fail-closed 行为。 |
| [Policy Sandbox Gates](policy-sandbox-gates.md) | Mandatory policy gate taxonomy, decision records, replay behavior, and readiness diagnostics. / 强制 policy gate 分类、decision records、replay behavior 与 readiness diagnostics。 |
| [Agent Namespace And Quotas](agent-namespace-quotas.md) | Subagent namespace, cgroup-style quotas, lineage ownership, policy expansion, and readiness diagnostics. / subagent namespace、cgroup-style quotas、lineage ownership、policy expansion 与 readiness diagnostics。 |
| [Plugin Module Boundaries](plugin-module-boundaries.md) | Governed module manifests, public contract paths, private API rejection, policy handoff, disable/unload, and readiness diagnostics. / 受治理 module manifest、公共契约路径、私有 API 拒绝、policy 交接、disable/unload 与 readiness diagnostics。 |
| [Kernel Diagnostics Readiness](kernel-diagnostics-readiness.md) | `/proc/deepseek/*` governance diagnostics, product-ready claim gates, filters, and evidence coverage. / `/proc/deepseek/*` 治理诊断、product-ready 声明门禁、过滤器与证据覆盖。 |
| [Governance Evidence Matrix](governance-evidence-matrix.md) | Package-level evidence categories, risk tiers, promotion blockers, and readiness integration. / 包级证据类型、风险等级、推广阻断与 readiness 集成。 |
| [Architecture Guardrails Drift](architecture-guardrails-drift.md) | Ghost alias governance, placeholder ownership, package-map drift, and roadmap evidence alignment. / ghost alias 治理、placeholder ownership、package-map drift 与 roadmap evidence alignment。 |
| [Protocol And Events](protocol-and-events.md) | Protocol envelope, runtime events, bus replay, and host consumption. / protocol envelope、runtime events、bus replay、host 消费方式。 |
| [Context Pipeline And Prefix Cache](context-pipeline-cache.md) | Immutable layered context pipeline, prefix hashes, provider-neutral cache hints, and cache diagnostics. / 不可变分层上下文管道、prefix hashes、provider-neutral cache hints 与缓存诊断。 |
| [Bounded Runtime Pipes](bounded-runtime-pipes.md) | Runtime stream capacity, pressure states, overflow policy, replay impact, and diagnostics. / runtime stream capacity、pressure states、overflow policy、replay impact 与 diagnostics。 |
| [Runtime Kernel Boundary](runtime-kernel-boundary.md) | Runtime kernel ownership, forbidden imports, allowed handoffs, and compatibility shims. / runtime kernel 责任、禁止导入、允许 handoff 与兼容 shim。 |
| [Package Map](package-map.md) | Package ownership, allowed dependencies, and boundary rules. / 包责任、允许依赖和边界规则。 |
| [Future Host Landing Zones](future-host-landings.md) | Reserved locations for future UX and host capabilities. / 未来 UX 与 host 能力的落点。 |

## Architecture Principles / 架构原则

1. Runtime owns execution. Hosts render events. / runtime 负责执行，host 渲染事件。
2. Contracts precede implementation. / 契约先于实现。
3. Every executable capability goes through one envelope. / 每个可执行能力走同一个 envelope。
4. Fact-sensitive output is evidence-first by default. / 事实敏感输出默认 evidence-first。
5. Prompt assembly is deterministic and replayable. / prompt assembly 必须确定性且可回放。
6. Context pipeline layers are an ABI: stable prefixes must not be reordered by volatile turns. / 上下文管道层是 ABI：稳定前缀不得被易变 turn 重排。
7. Runtime pipes are bounded: pressure, overflow, and replay impact are explicit. / runtime pipes 必须有界：pressure、overflow 与 replay impact 必须显式。
8. Policy and sandbox gate work before scheduling. / policy 与 sandbox 在调度前门禁。
9. Write-capable subagents run inside explicit namespaces and quotas. / 可写 subagent 在显式 namespace 与 quota 中运行。
10. Plugins, extensions, MCP bridges, skills, hooks, and UI contributions are governed modules: public contracts only, private runtime objects never. / plugins、extensions、MCP bridges、skills、hooks 与 UI contributions 都是受治理模块：只能走公共契约，绝不接触 runtime 私有对象。
11. Governance diagnostics are `/proc`-style introspection: stable ids, redaction, evidence links, and release blockers before product-ready claims. / 治理诊断是 `/proc` 风格内省：稳定 id、脱敏、证据链接，并在 product-ready 声明前执行发布阻断。
12. Evidence matrices distinguish contract coverage from product readiness. / 证据矩阵区分 contract coverage 与 product readiness。
13. Ghost aliases and placeholder package-map claims require explicit governance records before they can remain in the repo. / ghost alias 与 placeholder package-map 声明必须先有显式治理记录，才能保留在仓库中。
14. Platform differences live in `platform-abstraction`. / 平台差异归 `platform-abstraction`。
15. Tests and lint enforce architecture. / 测试和 lint 强制架构。

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
- `openspec/changes/evidence-first-agent-workflow/specs/evidence-first-agent-workflow/spec.md`

## Related Archived OpenSpec Governance Changes / 相关已归档 OpenSpec 治理变更

- `openspec/changes/archive/2026-05-20-systematize-platform-governance`
- `openspec/changes/archive/2026-05-20-harden-runtime-kernel-boundary`
- `openspec/changes/archive/2026-05-20-introduce-context-pipeline-prefix-cache`
- `openspec/changes/archive/2026-05-20-define-bounded-runtime-pipes`
- `openspec/changes/archive/2026-05-20-enforce-policy-sandbox-gates`
- `openspec/changes/archive/2026-05-20-govern-agent-namespace-quotas`
- `openspec/changes/archive/2026-05-20-govern-plugin-module-boundaries`
- `openspec/changes/archive/2026-05-20-expose-kernel-diagnostics-readiness`
- `openspec/changes/archive/2026-05-20-establish-governance-evidence-matrix`
- `openspec/changes/archive/2026-05-20-enforce-architecture-guardrails-drift`
