## ADDED Requirements

### Requirement: Mandatory Policy Gate / 强制 Policy Gate

Risky operations SHALL pass through policy-sandbox before execution.

有风险操作执行前必须经过 policy-sandbox。

#### Scenario: Risky operation requests decision / 风险操作请求 Decision

- **WHEN** runtime, tool execution, MCP, plugin, credential access, remote connectivity, shell, file mutation, or workspace mutation wants to execute
- **THEN** it obtains a policy decision before performing the operation
- **中文** 当 runtime、tool execution、MCP、plugin、credential access、remote connectivity、shell、file mutation 或 workspace mutation 要执行时，必须先获得 policy decision。

### Requirement: Auditable Policy Decision Records / 可审计 Policy Decision Records

Policy decisions SHALL include actor, operation, scope, decision, reason, redaction metadata, audit id, and replay behavior.

Policy decisions 必须包含 actor、operation、scope、decision、reason、redaction metadata、audit id 与 replay behavior。

#### Scenario: Denied operation is stable / Denied Operation 稳定

- **WHEN** policy denies an operation
- **THEN** runtime receives a stable denial reason and emits a redacted audit record suitable for replay
- **中文** 当 policy 拒绝操作时，runtime 必须收到稳定 denial reason，并发出适合 replay 的脱敏 audit record。

### Requirement: Policy Bypass Fails Product Readiness / Policy Bypass 阻止产品就绪

Product-ready claims SHALL fail when risky operations can bypass policy-sandbox.

当有风险操作可绕过 policy-sandbox 时，产品就绪声明必须失败。

#### Scenario: Readiness detects bypass path / Readiness 检测到 Bypass 路径

- **WHEN** diagnostics identifies a file, shell, MCP, plugin, credential, remote, or mutation path without policy handoff
- **THEN** readiness reports a release-blocking finding for product surfaces depending on that path
- **中文** 当 diagnostics 识别到没有 policy handoff 的 file、shell、MCP、plugin、credential、remote 或 mutation 路径时，readiness 必须为依赖该路径的产品表面报告 release-blocking finding。
