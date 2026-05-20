# Agent Namespace And Quotas / Agent Namespace 与 Quota

DeepSeek treats write-capable subagents as scoped execution units, similar to Linux processes running under namespaces, cgroups, ownership, and signals.

DeepSeek 将可写 subagent 视为受作用域约束的执行单元，类似 Linux process 受 namespaces、cgroups、ownership 与 signals 约束。

## Kernel Rule / 内核规则

Every coordinator, worker, verifier, repair, and implementer agent receives an `AgentNamespace` before work starts.

每个 coordinator、worker、verifier、repair 与 implementer agent 在开始工作前都会获得 `AgentNamespace`。

The namespace records:

- path permissions / path 权限
- allowed tools / 允许的 tools
- memory and scratchpad scope / memory 与 scratchpad 范围
- checkpoint policy / checkpoint 策略
- environment and network access / environment 与 network access
- token, tool-call, wall-clock, retry, and file-mutation quotas / token、tool-call、wall-clock、retry 与 file-mutation quotas
- parent lineage, owner, output ownership, and merge responsibility / parent lineage、owner、output ownership 与 merge responsibility

## Enforcement / 执行约束

The runtime event loop does not launch subagent work until `agent-management` evaluates scope.

Runtime event loop 在 `agent-management` 完成 scope 评估前不会启动 subagent work。

If a child requests broader authority than its parent namespace, runtime calls policy-sandbox with `agent.namespace.expand`.

如果 child 请求比 parent namespace 更宽的权限，runtime 会通过 `agent.namespace.expand` 调用 policy-sandbox。

Outcomes:

| Condition | Runtime behavior |
| --- | --- |
| write path inside namespace / 写入路径在 namespace 内 | emit `agent.scope.evaluated`, then launch worker |
| write path outside namespace / 写入路径越界 | emit `agent.scope.denied`, do not launch worker |
| file mutation quota exhausted / file mutation quota 耗尽 | emit `agent.quota.exhausted`, do not launch worker |
| child namespace expands parent without policy / child namespace 无 policy 扩权 | require policy decision |
| policy denies expansion / policy 拒绝扩权 | emit `agent.scope.denied`, do not launch worker |

## Product Gate / 产品门禁

Multi-agent write execution remains rollout-gated unless diagnostics can prove:

多 agent 写执行在 diagnostics 证明以下条件前保持 rollout-gated：

- namespace fixtures cover allowed writes, denied writes, quota exhaustion, cancellation, and repair scopes
- 每个 namespace fixture 覆盖 allowed write、denied write、quota exhaustion、cancellation 与 repair scope
- quotas include tokens, tool calls, wall-clock time, retries, and file mutations
- quotas 覆盖 tokens、tool calls、wall-clock time、retries 与 file mutations
- parent/child lineage records include owner, parent instance, output owner, and merge responsibility
- parent/child lineage records 包含 owner、parent instance、output owner 与 merge responsibility
- release readiness reports `governance.agent-namespace-quotas`
- release readiness 报告 `governance.agent-namespace-quotas`

## Current Evidence / 当前证据

- Contracts: `src/packages/platform-contracts/src/agent.ts`
- Implementation: `src/packages/agent-management/src/namespace.ts`
- Runtime handoff: `src/packages/runtime/src/agent-spawner.ts`
- CLI readiness: `src/apps/cli/src/diagnostics/agent-namespace-governance.ts`
- Tests: `tests/contracts/agent-management-modes.test.ts`, `tests/contracts/agent-spawn.test.ts`, `tests/contracts/local-readiness.test.ts`, `tests/e2e/local-readiness-cli.test.ts`
