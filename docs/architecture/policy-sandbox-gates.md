# Policy Sandbox Gates / Policy Sandbox 门禁

Policy-sandbox is the mandatory gate for risky execution. Runtime, tools, MCP, plugins, credentials, remote operations, sandbox selection, and workspace mutations must not execute without a policy decision record.

Policy-sandbox 是风险执行的强制门禁。Runtime、tools、MCP、plugins、credentials、remote operations、sandbox selection 与 workspace mutations 在没有 policy decision record 时不得执行。

## Risky Operation Taxonomy / 风险操作分类

| Family / 家族 | Operation / 操作 | Owner / 责任方 | Gate / 门禁 |
| --- | --- | --- | --- |
| file | `file.mutation` | `core-coding-tools` | release-blocking |
| shell | `shell.execution` | `core-coding-tools` | release-blocking |
| MCP | `mcp.invocation` | `mcp-gateway` | release-blocking |
| plugin | `plugin.execution` | `plugin-system` | release-blocking |
| credential | `credential.access` | `credential-auth-management` | release-blocking |
| remote | `remote.operation` | `remote-runtime-connectivity` | not product-ready |
| sandbox | `sandbox.selection` | `policy-sandbox` | release-blocking |
| workspace mutation | `workspace.mutation` | `workspace-state-management` | release-blocking |

## Decision Records / 决策记录

Every policy decision record carries:

每个 policy decision record 携带：

- actor, operation, operation family / actor、operation、operation family
- resource scope / resource scope
- decision outcome: allow, deny, prompt, redact, audit-only, require-sandbox, quarantine, or bypass-detected / 决策结果
- stable reason codes / 稳定 reason codes
- audit id / audit id
- replay behavior / replay behavior
- redaction metadata / redaction metadata

Runtime normalizes records even when a custom policy engine returns only a basic decision. If policy evaluation throws or produces no usable decision, the runtime fails closed before scheduling.

即使自定义 policy engine 只返回基础 decision，runtime 也会标准化 record。如果 policy evaluation 抛错或没有可用 decision，runtime 在调度前 fail closed。

## Readiness / 就绪

`diagnostics release` exposes `governance.policy-sandbox-gates`. It reports taxonomy coverage, covered operations, deferred operations, fixture decisions, and release-blocking gaps.

`diagnostics release` 暴露 `governance.policy-sandbox-gates`。它报告 taxonomy coverage、covered operations、deferred operations、fixture decisions 与 release-blocking gaps。

Remote runtime remains not product-ready; it is tracked as deferred rather than treated as covered.

Remote runtime 仍非 product-ready；它以 deferred 跟踪，而不是宣称 covered。
