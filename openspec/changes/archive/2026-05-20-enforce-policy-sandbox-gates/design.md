## Context

As the platform grows, every extension point becomes an execution risk. A mandatory policy gate gives the runtime a single enforcement handoff without hardcoding every permission rule into the kernel.

随着平台增长，每个扩展点都会成为执行风险。强制 policy gate 让 runtime 拥有单一 enforcement handoff，而不必把所有 permission rule 硬编码进 kernel。

## Goals / Non-Goals

**Goals:**

- Require policy decisions before risky execution. / 要求风险执行前有 policy decision。
- Emit auditable, replay-safe decision records. / 输出可审计、replay-safe 的 decision records。
- Surface bypasses as release-blocking when product claims depend on them. / 当产品声明依赖 bypass 时，将其作为 release-blocking 暴露。

**Non-Goals:**

- Do not design enterprise policy distribution here. / 本专项不设计企业策略分发。
- Do not implement full plugin signing here. / 本专项不实现完整插件签名。

## Decisions

1. Policy is mandatory for risky operations. / Policy 对风险操作是强制的。

   Runtime and extension systems must not execute file, shell, MCP, plugin, credential, remote, or mutation operations without a policy decision.

   Runtime 与扩展系统不得在没有 policy decision 的情况下执行 file、shell、MCP、plugin、credential、remote 或 mutation 操作。

2. Decisions are records, not side effects. / Decision 是记录，不只是副作用。

   Policy outcomes must include actor, operation, scope, decision, reason, redaction, audit id, and replay behavior.

   Policy outcomes 必须包含 actor、operation、scope、decision、reason、redaction、audit id 与 replay behavior。

3. Missing policy evidence blocks promotion. / 缺失 policy evidence 阻止推广。

   Multi-agent writes, plugin execution, remote operations, and enterprise surfaces cannot be product-ready without policy evidence.

   多 agent 写入、plugin execution、remote operations 与企业级表面在缺少 policy evidence 时不能 product-ready。

## Rollout

1. Define risky operation taxonomy. / 定义风险操作分类。
2. Add policy decision envelopes and diagnostics. / 增加 policy decision envelopes 与 diagnostics。
3. Add bypass fixtures and readiness gates. / 增加 bypass fixtures 与 readiness gates。

## Open Questions

- Which read-only operations need audit-only policy decisions? / 哪些 read-only 操作需要 audit-only policy decisions？
