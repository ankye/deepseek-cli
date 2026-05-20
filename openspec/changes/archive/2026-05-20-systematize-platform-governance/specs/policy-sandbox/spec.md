## ADDED Requirements

### Requirement: Mandatory Policy Gate / 强制 Policy 门禁

Policy-sandbox SHALL act as an LSM-style mandatory gate for risky capability, file, shell, MCP, plugin, credential, remote, sandbox, and workspace mutation operations.

Policy-sandbox 必须作为 LSM 风格强制门禁，覆盖有风险 capability、file、shell、MCP、plugin、credential、remote、sandbox 与 workspace mutation operations。

#### Scenario: Execution cannot bypass policy / 执行不能绕过 Policy

- **WHEN** any package initiates a risky operation
- **THEN** the operation is routed through policy decision records before scheduling or execution, and architecture lint rejects direct bypass paths
- **中文** 当任何 package 发起有风险 operation 时，该 operation 必须在 scheduling 或 execution 前经过 policy decision records，architecture lint 必须拒绝直接绕过路径。

#### Scenario: Policy decision is replayable / Policy Decision 可 Replay

- **WHEN** policy allows, denies, degrades, or requires approval for an operation
- **THEN** the decision includes subject, resource, action, risk class, redaction metadata, trace context, and replay fingerprint
- **中文** 当 policy 对 operation 作出 allow、deny、degrade 或 require approval 决策时，decision 必须包含 subject、resource、action、risk class、redaction metadata、trace context 与 replay fingerprint。

### Requirement: Hooks Observe Policy, Not Override It / Hooks 观察 Policy 而非覆盖 Policy

Hooks, plugins, skills, MCP servers, and extensions SHALL NOT override mandatory policy decisions through private side channels.

Hooks、plugins、skills、MCP servers 与 extensions 不得通过私有 side channels 覆盖强制 policy decisions。

#### Scenario: Extension cannot self-authorize / Extension 不能自授权

- **WHEN** an extension or plugin requests a risky operation
- **THEN** policy-sandbox evaluates the request using declared permissions and host/user policy, regardless of extension-provided recommendations
- **中文** 当 extension 或 plugin 请求有风险 operation 时，policy-sandbox 必须基于声明权限与 host/user policy 评估该请求，而不受 extension-provided recommendations 自行授权影响。
