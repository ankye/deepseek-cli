# policy-sandbox Specification

## Purpose
Define policy sandbox requirements for policy decisions, approvals, sandbox gates, bypass prevention, audit records, and risk classification.

定义 policy sandbox 对 policy decisions、approvals、sandbox gates、bypass prevention、audit records 与 risk classification 的要求。

## Requirements
### Requirement: Pure Policy Decision

The policy engine SHALL evaluate capability execution requests and return allow, ask, deny, rewrite, or require-sandbox decisions without directly prompting users or executing tools.

#### Scenario: Policy allows safe request

- **WHEN** a capability request matches an allow policy
- **THEN** the policy engine returns an allow decision

#### Scenario: Policy asks for uncertain request

- **WHEN** a capability request requires user approval
- **THEN** the policy engine returns an ask decision without rendering UI

### Requirement: Approval Broker Boundary

The system SHALL define an approval broker interface responsible for obtaining user or host decisions when policy returns ask.

#### Scenario: Headless approval request

- **WHEN** policy returns ask in a headless caller
- **THEN** the runtime emits a structured permission requested event or uses the configured approval broker

### Requirement: Sandbox Runtime Boundary

The system SHALL define a sandbox runtime interface for executing side-effecting capabilities with filesystem, process, network, environment, and timeout controls.

#### Scenario: Execute through sandbox adapter

- **WHEN** a capability requires sandbox enforcement
- **THEN** the tool orchestrator executes it through the sandbox runtime boundary

### Requirement: Audit Records

The system SHALL create audit records for policy decisions, approval outcomes, sandbox mode, capability id, and redacted input summaries.

#### Scenario: Record denied request

- **WHEN** policy denies a capability request
- **THEN** an audit record is created with the decision and redacted request summary

### Requirement: Policy Evaluates Execution Envelopes

The policy engine, approval broker, sandbox runtime, and audit sink SHALL evaluate governed execution envelopes instead of ad hoc tool-specific request shapes.

policy engine、approval broker、sandbox runtime 和 audit sink 必须评估 governed execution envelopes，而不是零散的 tool-specific request shapes。

#### Scenario: Policy has complete caller and resource context

- **WHEN** policy evaluates an executable capability
- **THEN** it receives caller, source, trust boundary, permissions, side-effect level, agent scope, session scope, resource locks, sandbox profile, redaction class, and trace metadata

#### Scenario: Sandbox execution is envelope-linked

- **WHEN** sandbox runtime executes a side-effecting capability
- **THEN** sandbox events and audit records reference the invocation id and trace context from the execution envelope

### Requirement: Deterministic Policy Decision Interface

The policy/sandbox package SHALL expose a deterministic first policy decision interface for kernel envelopes.

policy/sandbox package 必须为 kernel envelopes 暴露 deterministic first policy decision interface。

#### Scenario: Allow read-only built-in capability

- **WHEN** the kernel evaluates a read-only deterministic built-in capability envelope
- **THEN** policy returns an allow decision with audit metadata before scheduler submission

#### Scenario: Deny disallowed side effect

- **WHEN** an envelope declares a side effect that the current policy does not allow
- **THEN** policy returns a deny decision and the kernel emits a rejection event without scheduling the task

### Requirement: Explicit Sandbox Profile Selection

The policy/sandbox package SHALL select or stub a sandbox profile explicitly for each governed invocation.

policy/sandbox package 必须为每个 governed invocation 显式选择或 stub sandbox profile。

#### Scenario: Sandbox decision is evented

- **WHEN** policy selects a sandbox profile for an invocation
- **THEN** the kernel publishes the selected profile metadata in a redacted policy/sandbox event

### Requirement: Mandatory Policy Before Scheduling

The runtime kernel SHALL evaluate policy and sandbox profile selection after strict envelope validation and before scheduler submission.

runtime kernel 必须在 strict envelope validation 之后、scheduler submission 之前执行 policy 和 sandbox profile selection。

#### Scenario: Policy denial prevents scheduling

- **WHEN** policy denies or quarantines a governed invocation
- **THEN** no scheduler task is created and the canonical event stream contains a typed rejection

#### Scenario: Invalid envelope prevents policy

- **WHEN** envelope validation fails
- **THEN** policy and sandbox are not called

### Requirement: Platform-Aware Execution Policy / 平台感知执行策略

The policy and sandbox layer SHALL evaluate platform descriptor, shell profile, process provider, native capability, search provider, and secure-storage status before allowing governed execution.

policy and sandbox layer 必须在允许 governed execution 前评估 platform descriptor、shell profile、process provider、native capability、search provider 和 secure-storage status。

#### Scenario: Shell execution requires policy context / Shell 执行要求策略上下文

- **WHEN** a governed invocation requests shell-syntax execution
- **THEN** policy receives the declared shell profile, platform descriptor, sandbox profile, cwd, environment scope, timeout, and resource locks before scheduler submission
- **中文** 当 governed invocation 请求 shell-syntax execution 时，policy 必须在 scheduler submission 前收到 declared shell profile、platform descriptor、sandbox profile、cwd、environment scope、timeout 和 resource locks。

#### Scenario: Native capability cannot bypass sandbox / Native capability 不能绕过 sandbox

- **WHEN** a capability requests voice, clipboard, URL handler, image processing, or another native capability
- **THEN** policy evaluates the native capability probe and sandbox decision before any native module is loaded
- **中文** 当 capability 请求 voice、clipboard、URL handler、image processing 或其他 native capability 时，policy 必须在加载任何 native module 前评估 native capability probe 和 sandbox decision。

### Requirement: Degraded Platform Decision Events / 降级平台决策事件

The policy and sandbox layer SHALL emit redacted decision events when platform behavior is unavailable, degraded, denied, or rewritten.

policy and sandbox layer 必须在 platform behavior unavailable、degraded、denied 或 rewritten 时发出 redacted decision events。

#### Scenario: Missing shell is denied with audit / 缺失 shell 带审计拒绝

- **WHEN** a remote/no-local-shell host receives a shell-dependent invocation
- **THEN** policy denies or rewrites the invocation with a typed event and audit record
- **中文** 当 remote/no-local-shell host 收到 shell-dependent invocation 时，policy 必须用 typed event 和 audit record deny 或 rewrite invocation。

### Requirement: Secret-Aware Policy Decisions / Secret 感知 Policy 决策

The policy and sandbox layer SHALL evaluate secret exposure metadata before allowing model-visible or side-effecting work.

policy and sandbox layer 必须在允许 model-visible 或 side-effecting work 前评估 secret exposure metadata。

#### Scenario: Secret exposure can deny execution / Secret exposure 可拒绝执行

- **WHEN** an execution envelope declares raw secret exposure or unsafe redaction metadata
- **THEN** policy returns deny or rewrite before scheduler submission
- **中文** 当 execution envelope 声明 raw secret exposure 或 unsafe redaction metadata 时，policy 必须在 scheduler submission 前返回 deny 或 rewrite。

### Requirement: Sandbox Enforcement Matrix / Sandbox Enforcement Matrix

The policy and sandbox layer SHALL evaluate filesystem, process, shell, network, environment, native, timeout, and platform degradation dimensions before scheduler submission.

policy and sandbox layer 必须在 scheduler submission 前评估 filesystem、process、shell、network、environment、native、timeout 和 platform degradation dimensions。

#### Scenario: Process execution requires explicit shell profile / Process 执行要求显式 Shell Profile

- **WHEN** an invocation requests process or shell execution
- **THEN** policy receives shell profile, cwd, environment scope, timeout, output redaction, and platform availability metadata
- **中文** 当 invocation 请求 process 或 shell execution 时，policy 必须收到 shell profile、cwd、environment scope、timeout、output redaction 和 platform availability metadata。

#### Scenario: Filesystem write requires path scope / Filesystem 写入要求路径范围

- **WHEN** an invocation requests filesystem write
- **THEN** policy receives workspace root, normalized path, traversal status, rollback evidence availability, and sandbox profile metadata
- **中文** 当 invocation 请求 filesystem write 时，policy 必须收到 workspace root、normalized path、traversal status、rollback evidence availability 和 sandbox profile metadata。

### Requirement: Policy Pit Fixtures / Policy 坑位 Fixtures

Policy and sandbox behavior SHALL include deterministic negative fixtures for permission bypass, headless approval defaults, shell parser fallback risks, and hard safety checks.

policy 与 sandbox 行为必须包含针对 permission bypass、headless approval defaults、shell parser fallback risks 和 hard safety checks 的确定性负向 fixtures。

#### Scenario: Bypass cannot disable hard safety / Bypass 不能关闭硬安全

- **WHEN** a policy request is labeled as bypass or break-glass but contains raw secret exposure, unsafe path scope, missing sandbox enforcement, or unavailable required platform capability
- **THEN** policy still returns rewrite, deny, require-sandbox, or another non-allow decision with audit evidence
- **中文** 当 policy request 标记为 bypass 或 break-glass，但包含 raw secret exposure、unsafe path scope、missing sandbox enforcement 或 unavailable required platform capability 时，policy 仍必须返回 rewrite、deny、require-sandbox 或其他非 allow decision，并带 audit evidence。

#### Scenario: Headless approval fails closed / Headless 审批 Fail Closed

- **WHEN** headless execution requires approval and no explicit approval decision can be obtained
- **THEN** the approval broker denies by default and records a deterministic reason without mutating workspace state
- **中文** 当 headless execution 需要审批且无法获得显式 approval decision 时，approval broker 必须默认 deny，并记录确定性 reason，且不修改 workspace state。

#### Scenario: Shell parser fallback is explicit / Shell Parser Fallback 显式化

- **WHEN** process execution includes wrappers, env prefixes, pipes, newlines, nested shells, PowerShell syntax, or parser-unavailable fallback
- **THEN** the policy fixture records the shell risk as rejected, sandbox-required, or manually reviewable rather than silently allowing execution
- **中文** 当 process execution 包含 wrappers、env prefixes、pipes、newlines、nested shells、PowerShell syntax 或 parser-unavailable fallback 时，policy fixture 必须将 shell risk 记录为 rejected、sandbox-required 或 manually reviewable，而不是静默 allow execution。

### Requirement: Renderable Approval Evidence / 可渲染审批证据

The policy and sandbox layer SHALL produce redacted, renderable approval evidence for every ask, deny, rewrite, require-sandbox, timeout, and cancelled approval decision.

policy 与 sandbox layer 必须为每个 ask、deny、rewrite、require-sandbox、timeout 和 cancelled approval decision 产出脱敏、可渲染的 approval evidence。

#### Scenario: Policy ask includes risk summary / Policy Ask 包含风险摘要

- **WHEN** policy returns an ask decision for a governed invocation
- **THEN** the decision includes a stable approval id, decision options, capability summary, resource summary, risk summaries, redaction metadata, audit reference, and applicable reference pit fixture ids
- **中文** 当 policy 为 governed invocation 返回 ask decision 时，该 decision 必须包含 stable approval id、decision options、capability summary、resource summary、risk summaries、redaction metadata、audit reference 和适用的 reference pit fixture ids。

#### Scenario: Deny includes user-visible reason / Deny 包含用户可见原因

- **WHEN** policy denies, rewrites, or requires sandbox for an invocation
- **THEN** the decision includes a redacted user-visible reason and machine-readable reason codes suitable for text, JSON, JSONL, replay, and diagnostics
- **中文** 当 policy 对 invocation 执行 deny、rewrite 或 require sandbox 时，该 decision 必须包含脱敏的用户可见原因和 machine-readable reason codes，适用于 text、JSON、JSONL、replay 和 diagnostics。

### Requirement: Headless Broker Denies By Default / Headless Broker 默认拒绝

The approval broker SHALL deny approval-required work by default in headless or non-interactive modes unless an explicit decision provider is configured.

approval broker 在 headless 或 non-interactive modes 中必须默认拒绝需要审批的 work，除非配置了显式 decision provider。

#### Scenario: No decision provider fails closed / 无 Decision Provider 安全失败

- **WHEN** a headless broker receives an approval request and no explicit decision provider is configured
- **THEN** it returns a deny decision with reason `headless.fail_closed`, cites `pit.headless-trust.fail-closed`, and performs no workspace mutation
- **中文** 当 headless broker 收到 approval request 且没有配置显式 decision provider 时，它必须返回 reason 为 `headless.fail_closed` 的 deny decision，引用 `pit.headless-trust.fail-closed`，且不得修改 workspace。

### Requirement: Bypass Hard Safety Approval Evidence / Bypass 硬安全审批证据

Bypass or break-glass modes SHALL keep hard safety checks active and expose non-allow decisions as approval or denial evidence.

bypass 或 break-glass modes 必须保持 hard safety checks 生效，并把 non-allow decisions 暴露为 approval 或 denial evidence。

#### Scenario: Bypass denial cites pit fixture / Bypass 拒绝引用坑位 Fixture

- **WHEN** bypass metadata is present but raw secret exposure, unsafe path scope, missing sandbox enforcement, or unavailable platform capability is detected
- **THEN** policy returns a non-allow decision with redacted denial evidence and cites `pit.permission-bypass.hard-safety`
- **中文** 当存在 bypass metadata，但检测到 raw secret exposure、unsafe path scope、missing sandbox enforcement 或 unavailable platform capability 时，policy 必须返回带脱敏 denial evidence 的 non-allow decision，并引用 `pit.permission-bypass.hard-safety`。

### Requirement: Shell Risk Approval Classification / Shell 风险审批分类

Shell parser fallback, wrapper, compound command, PowerShell, parser-unavailable, and degraded shell analysis statuses SHALL be classified for approval UX before scheduler submission.

shell parser fallback、wrapper、compound command、PowerShell、parser-unavailable 和 degraded shell analysis statuses 必须在 scheduler submission 前被分类为 approval UX 可消费的信息。

#### Scenario: Shell fallback cannot silently allow / Shell Fallback 不能静默放行

- **WHEN** shell analysis is unavailable, degraded, manually reviewable, or detects compound/wrapped syntax
- **THEN** policy returns reject, ask, require-sandbox, or another non-silent decision with shell risk evidence citing `pit.shell-parser.fallback-risk`
- **中文** 当 shell analysis 不可用、降级、需要人工复核，或检测到 compound/wrapped syntax 时，policy 必须返回 reject、ask、require-sandbox 或其他非静默 decision，并带引用 `pit.shell-parser.fallback-risk` 的 shell risk evidence。

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

### Requirement: Module Permission Policy / Module Permission Policy

Policy-sandbox SHALL evaluate module permissions before risky plugin, extension, MCP, hook, or skill behavior executes.

Policy-sandbox 必须在有风险 plugin、extension、MCP、hook 或 skill 行为执行前评估 module permissions。

#### Scenario: Module permission is missing / Module Permission 缺失

- **WHEN** a module attempts a risky operation not declared in its manifest permissions
- **THEN** policy denies or prompts according to configured policy and emits an audit record
- **中文** 当 module 尝试未在 manifest permissions 中声明的风险操作时，policy 必须按配置 deny 或 prompt，并发出 audit record。

