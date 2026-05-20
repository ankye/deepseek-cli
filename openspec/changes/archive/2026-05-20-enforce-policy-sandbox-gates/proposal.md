## Why

DeepSeek needs policy-sandbox to act like a mandatory LSM-style gate, not an optional helper. / DeepSeek 需要 policy-sandbox 像强制 LSM-style gate 一样工作，而不是可选 helper。

File writes, shell commands, MCP calls, plugin execution, credential access, remote operations, and workspace mutation must all pass through auditable policy decisions before higher-level features are promoted. / file writes、shell commands、MCP calls、plugin execution、credential access、remote operations 与 workspace mutation 在高级功能推广前都必须经过可审计的 policy decisions。

## What Changes

- Require risky operations to pass through policy-sandbox before execution. / 要求有风险操作执行前经过 policy-sandbox。
- Define policy decision records for allow, deny, prompt, redact, and audit outcomes. / 定义 allow、deny、prompt、redact 与 audit outcomes 的 policy decision records。
- Require CLI diagnostics/readiness to report bypass risk and missing policy evidence. / 要求 CLI diagnostics/readiness 报告 bypass risk 与缺失 policy evidence。

## Capabilities

### New Capabilities

### Modified Capabilities

- `policy-sandbox`: Add mandatory gate and audit requirements for risky operations. / 增加有风险操作的强制门禁与审计要求。
- `cli-diagnostics-release-readiness`: Add policy-gate readiness reporting and bypass diagnostics. / 增加 policy-gate readiness reporting 与 bypass diagnostics。

## Impact

- Owner packages / 责任包: `policy-sandbox`, `runtime`, `command-system`, `mcp-gateway`, `plugin-system`, `apps/cli`.
- Security posture / 安全姿态: fail-closed for product-ready claims when risky operations bypass policy. / 当有风险操作绕过 policy 时，对产品就绪声明 fail-closed。
