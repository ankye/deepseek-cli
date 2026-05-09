# policy-sandbox Specification

## Purpose
TBD - created by archiving change bootstrap-future-ready-cli-framework. Update Purpose after archive.
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

