# agent-management Specification

## Purpose
Define agent modes, worker lifecycle, delegation records, namespace quotas, and governance requirements for multi-agent runtime surfaces.

定义多 agent runtime 表面的 agent modes、worker lifecycle、delegation records、namespace quotas 与治理要求。

## Requirements
### Requirement: Agent Definition Registry

The system SHALL define an agent management layer that owns agent definitions from built-in, user, workspace, extension, and future catalog sources.

系统必须定义 agent management layer，统一管理来自 built-in、user、workspace、extension 和未来 catalog sources 的 agent definitions。

#### Scenario: Register valid agent definition

- **WHEN** a valid `AgentDefinition` is discovered
- **THEN** the agent manager validates identity, version, source, role, model profile, prompt profile, scopes, lifecycle metadata, and compatibility metadata
- **AND** it registers the definition without granting runtime permissions by default

#### Scenario: Reject invalid agent definition

- **WHEN** an agent definition is missing required identity, scope, model profile, prompt profile, or compatibility metadata
- **THEN** the agent manager rejects it with a structured validation error

### Requirement: Agent Instance Lifecycle

The agent manager SHALL own agent instance lifecycle including create, activate, start turn, pause, resume, cancel, checkpoint, complete, fail, and terminate states.

agent manager 必须管理 agent instance lifecycle，包括 create、activate、start turn、pause、resume、cancel、checkpoint、complete、fail 和 terminate states。

#### Scenario: Create default agent instance

- **WHEN** a runtime session starts without an explicit agent selection
- **THEN** the agent manager creates or resolves the configured default agent instance
- **AND** the runtime records the agent id and definition version in session metadata

#### Scenario: Cancel active agent turn

- **WHEN** a host cancels an active turn
- **THEN** the agent manager updates the active agent instance lifecycle state
- **AND** the runtime emits a terminal cancellation event with agent metadata

### Requirement: Agent Scopes

Agent definitions SHALL declare model profile, prompt profile, capability scope, context scope, policy scope, memory scope, session scope, and host capability scope.

agent definitions 必须声明 model profile、prompt profile、capability scope、context scope、policy scope、memory scope、session scope 和 host capability scope。

#### Scenario: Agent capability scope filters tools

- **WHEN** the runtime projects model-visible tools for an agent turn
- **THEN** the projection is filtered by the active agent capability scope, extension trust state, feature gates, policy, and user configuration

#### Scenario: Agent context scope filters context

- **WHEN** the context engine builds a prompt projection for an agent
- **THEN** it uses the active agent context scope to decide which context nodes can be visible

### Requirement: Agent Session Binding and Audit

Agent identity, definition version, lifecycle events, scope decisions, delegation metadata, and selected profiles SHALL be recorded through session and audit boundaries.

agent identity、definition version、lifecycle events、scope decisions、delegation metadata 和 selected profiles 必须通过 session 与 audit boundaries 记录。

#### Scenario: Persist agent lifecycle event

- **WHEN** an agent instance changes lifecycle state
- **THEN** the session store can persist an ordered event with agent id, instance id, definition version, state, timestamp, and redacted reason metadata

#### Scenario: Audit agent scope decision

- **WHEN** an agent is denied access to a capability or context node by scope
- **THEN** an audit record can include the agent id, scope rule, and redacted decision summary

### Requirement: Agent Contribution Boundary

Extensions SHALL contribute agent definitions through the extension system, but the agent manager SHALL own validation, enablement, lifecycle, scopes, and runtime binding.

extensions 必须通过 extension system 贡献 agent definitions，但 validation、enablement、lifecycle、scopes 和 runtime binding 必须由 agent manager 管理。

#### Scenario: Extension contributes agent definition

- **WHEN** an enabled extension contributes an agent definition
- **THEN** the extension loader forwards it to the agent manager
- **AND** the extension does not directly create runtime agent instances

### Requirement: Future Delegation Contract

The agent manager SHALL define handoff and delegation metadata for future sub-agents and multi-agent graphs while allowing the first implementation to run a single default agent.

agent manager 必须为未来 sub-agents 和 multi-agent graphs 定义 handoff 与 delegation metadata，同时允许第一版只运行 single default agent。

#### Scenario: Single-agent implementation remains valid

- **WHEN** the first runtime implementation runs only the default agent
- **THEN** it still uses agent manager contracts for definition, instance, scope, lifecycle, and session metadata

#### Scenario: Delegation request is represented

- **WHEN** a future runtime needs to delegate work to another agent
- **THEN** the request can be represented with source agent id, target agent definition id, task summary, scope constraints, session linkage, and approval requirements

### Requirement: Agent Scope Constrains Executable Capabilities

The agent manager SHALL apply active agent capability, skill, hook, context, memory, policy, host, and model scopes before a governed execution envelope is scheduled or executed.

agent manager 必须在 governed execution envelope 被调度或执行前应用 active agent 的 capability、skill、hook、context、memory、policy、host 和 model scopes。

#### Scenario: Agent denied capability cannot execute it

- **WHEN** an agent scope excludes a capability, command, skill, hook, MCP tool, model profile, memory scope, host capability, or subagent target
- **THEN** the execution envelope is rejected or rewritten before scheduling and the decision is recorded for audit

#### Scenario: Delegated agent gets child scope

- **WHEN** a future subagent delegation is represented as executable work
- **THEN** its envelope includes parent agent, target agent definition, delegated scope constraints, session linkage, approval requirements, and parent invocation id

### Requirement: Product Agent Roles / 产品 Agent 角色

Agent definitions SHALL declare product-facing roles and supported agent modes in addition to identity, model profile, prompt profile, and scopes.

Agent definitions 除 identity、model profile、prompt profile 与 scopes 外，必须声明面向产品的 roles 与 supported agent modes。

#### Scenario: Agent definition declares modes / Agent Definition 声明 Modes
- **WHEN** an agent definition is registered
- **THEN** validation requires declared supported modes such as default, evidence, planner, implementer, verifier, coordinator, worker, repair, or synthesis
- **中文** 当 agent definition 被注册时，validation 必须要求声明 supported modes，例如 default、evidence、planner、implementer、verifier、coordinator、worker、repair 或 synthesis。

#### Scenario: Unsupported mode selection fails closed / 不支持的 Mode 选择安全失败
- **WHEN** runtime or CLI requests an agent mode not declared by the selected agent definition
- **THEN** the agent manager rejects the binding with a structured validation error before runtime execution
- **中文** 当 runtime 或 CLI 请求 selected agent definition 未声明的 agent mode 时，agent manager 必须在 runtime execution 前以 structured validation error 拒绝绑定。

### Requirement: Delegation Lifecycle Ownership / 委派生命周期所有权

The agent manager SHALL own delegated agent lifecycle metadata including spawn, continue, stop, resume, complete, fail, and dispose states.

agent manager 必须拥有 delegated agent lifecycle metadata，包括 spawn、continue、stop、resume、complete、fail 与 dispose states。

#### Scenario: Delegated instance records parent lineage / 委派实例记录父级链路
- **WHEN** a coordinator, runtime policy, or tool spawns a worker
- **THEN** the agent manager records parent agent id, parent session id, child session id, work order id, mode, scope, and lifecycle state
- **中文** 当 coordinator、runtime policy 或 tool spawn worker 时，agent manager 必须记录 parent agent id、parent session id、child session id、work order id、mode、scope 与 lifecycle state。

#### Scenario: Continue preserves lineage / Continue 保留链路
- **WHEN** a worker is continued
- **THEN** the continuation event links to the previous worker instance state and records the new work order id
- **中文** 当 worker 被 continued 时，continuation event 必须链接到之前的 worker instance state，并记录新的 work order id。

### Requirement: Agent Scope Projection By Mode / 按 Mode 投影 Agent Scope

Agent manager SHALL project agent scopes differently by active mode before tools, commands, context, memory, skills, hooks, MCP, or model profiles are visible.

agent manager 必须在 tools、commands、context、memory、skills、hooks、MCP 或 model profiles 可见前，按 active mode 投影 agent scopes。

#### Scenario: Verifier gets proof-oriented scope / Verifier 获得证明导向 Scope
- **WHEN** verifier mode is active
- **THEN** scope projection can include test, build, read, diagnostics, and artifact-inspection capabilities while excluding unrelated write actions unless explicitly approved
- **中文** 当 verifier mode 激活时，scope projection 可以包含 test、build、read、diagnostics 与 artifact-inspection capabilities，同时排除无关 write actions，除非显式批准。

#### Scenario: Coordinator scope prefers delegation / Coordinator Scope 偏向委派
- **WHEN** coordinator mode is active
- **THEN** scope projection favors planning, delegation, worker status, stop/continue, result synthesis, and local diagnostics over direct workspace mutation
- **中文** 当 coordinator mode 激活时，scope projection 必须偏向 planning、delegation、worker status、stop/continue、result synthesis 与 local diagnostics，而不是直接 workspace mutation。

### Requirement: Worker Result Provenance / Worker 结果出处

Agent manager SHALL preserve worker result provenance for replay, diagnostics, evaluation, and user-facing synthesis.

agent manager 必须为 replay、diagnostics、evaluation 与 user-facing synthesis 保留 worker result provenance。

#### Scenario: Worker result is structured / Worker 结果结构化
- **WHEN** a worker completes, fails, is stopped, or is cancelled
- **THEN** the result includes worker id, task id, status, summary, evidence ids, changed scope, usage summary, verification status when any, diagnostics, and redaction metadata
- **中文** 当 worker completed、failed、stopped 或 cancelled 时，result 必须包含 worker id、task id、status、summary、evidence ids、changed scope、usage summary、可能的 verification status、diagnostics 与 redaction metadata。

#### Scenario: Parent synthesis cites worker result / 父级综合引用 Worker 结果
- **WHEN** the parent agent reports delegated work to the user
- **THEN** it cites structured worker result ids or evidence ids rather than unsupported claims about worker output
- **中文** 当 parent agent 向用户报告 delegated work 时，必须引用 structured worker result ids 或 evidence ids，而不是对 worker output 作无证据声明。

### Requirement: Agent Mode Persistence / Agent Mode 持久化

Agent manager SHALL provide mode metadata suitable for session persistence and resume/fork replay.

agent manager 必须提供适合 session persistence 与 resume/fork replay 的 mode metadata。

#### Scenario: Resume restores agent mode metadata / Resume 恢复 Agent Mode 元数据
- **WHEN** a session with active or historical agent modes is resumed
- **THEN** the restored metadata includes agent definition id, mode, lifecycle status, lineage, scopes, and compatibility version without relying on process environment state
- **中文** 当包含 active 或 historical agent modes 的 session 被 resumed 时，恢复的 metadata 必须包含 agent definition id、mode、lifecycle status、lineage、scopes 与 compatibility version，且不得依赖 process environment state。

### Requirement: Agent Scopes Include Tool Families / Agent Scope 包含工具家族
Agent definitions and active agent scopes SHALL allow and deny capabilities by tool family, domain, risk class, connector trust, host requirement, and individual capability id.

agent definitions 与 active agent scopes 必须支持按 tool family、domain、risk class、connector trust、host requirement 与单个 capability id 允许或拒绝 capabilities。

#### Scenario: Verifier scope allows tests but denies mutation / Verifier Scope 允许测试但拒绝修改
- **WHEN** verifier mode is active
- **THEN** it may allow `build.test-lint-typecheck` and `git.status-diff` while denying `file.write`, `file.edit`, and `patch.apply` unless explicitly elevated
- **中文** 当 verifier mode 激活时，它可以允许 `build.test-lint-typecheck` 与 `git.status-diff`，同时拒绝 `file.write`、`file.edit` 与 `patch.apply`，除非显式提权。

### Requirement: Delegation Work Orders Declare Family Scope / 委派工作单声明 Family Scope
Delegated work orders SHALL declare allowed and denied tool families in addition to specific files, targets, and done criteria.

delegated work orders 除 specific files、targets 与 done criteria 外，必须声明允许和拒绝的 tool families。

#### Scenario: Browser worker receives browser family scope / Browser Worker 获得 Browser Family Scope
- **WHEN** a coordinator delegates browser verification
- **THEN** the worker work order includes the required `browser.*` families and denies unrelated mutation families unless explicitly needed
- **中文** 当 coordinator 委派 browser verification 时，worker work order 必须包含所需 `browser.*` families，并拒绝无关 mutation families，除非明确需要。

### Requirement: Agent Scopes Cover All Implemented Families / Agent Scope 覆盖全部已实现 Families
Agent scopes and delegated work orders SHALL allow and deny every implemented family by family id, domain id, risk class, host requirement, connector trust, and individual capability id.

agent scopes 与 delegated work orders 必须支持按 family id、domain id、risk class、host requirement、connector trust 与单个 capability id 允许或拒绝每个已实现 family。

#### Scenario: Verifier denies mutation and media / Verifier 拒绝修改与媒体
- **WHEN** verifier mode is active
- **THEN** mutation, image edit, design batch edit, package manager write, and worktree write families are denied unless explicitly elevated
- **中文** 当 verifier mode 激活时，mutation、image edit、design batch edit、package manager write 与 worktree write families 必须被拒绝，除非显式提权。

### Requirement: Worker Orders Declare Required Families / Worker 任务单声明所需 Families
Delegated worker orders SHALL list required families, optional families, denied families, and evidence expectations for the assigned task.

delegated worker orders 必须列出 assigned task 所需 families、可选 families、拒绝 families 与 evidence expectations。

#### Scenario: Browser worker receives browser-only scope / Browser Worker 获得 Browser-Only Scope
- **WHEN** a coordinator delegates browser verification
- **THEN** the worker order allows `browser.navigate`, `browser.interact`, `browser.inspect`, and `browser.screenshot` while denying unrelated write families
- **中文** 当 coordinator 委派 browser verification 时，worker order 必须允许 `browser.navigate`、`browser.interact`、`browser.inspect` 与 `browser.screenshot`，同时拒绝无关 write families。

### Requirement: Agent Namespace And Quota Governance / Agent Namespace 与配额治理

Agent management SHALL define explicit scopes for every non-default agent mode before write-capable multi-agent execution is promoted.

Agent management 必须在可写多 agent 执行被推广前，为每个非 default agent mode 定义显式 scopes。

#### Scenario: Worker has bounded namespace / Worker 具备有界 Namespace

- **WHEN** a worker agent is spawned for a task
- **THEN** its work order includes path scope, tool scope, memory scope, scratchpad scope, checkpoint policy, token budget, deadline, lineage, and ownership metadata
- **中文** 当 worker agent 为任务被 spawn 时，其 work order 必须包含 path scope、tool scope、memory scope、scratchpad scope、checkpoint policy、token budget、deadline、lineage 与 ownership metadata。

#### Scenario: Missing scope blocks write promotion / 缺失 Scope 阻止写执行推广

- **WHEN** coordinator, worker, repair, or implementer mode attempts write-capable default execution without required scopes
- **THEN** runtime or diagnostics rejects promotion and records a governance finding rather than falling back to implicit broad access
- **中文** 当 coordinator、worker、repair 或 implementer mode 在缺少必需 scopes 时尝试默认可写执行，runtime 或 diagnostics 必须拒绝推广并记录治理发现，而不是回退到隐式宽权限。

### Requirement: Agent Resource Accounting / Agent 资源记账

Agent orchestration SHALL account for budgets, fan-out, over-delegation, conflict risk, and verification evidence.

Agent orchestration 必须对 budgets、fan-out、over-delegation、conflict risk 与 verification evidence 进行记账。

#### Scenario: Coordinator default enablement requires evidence / Coordinator 默认启用需要证据

- **WHEN** coordinator mode is proposed for default enablement
- **THEN** evidence shows bounded worker fan-out, lower correction cost or failure rate than baseline, scoped writes, conflict handling, and verification quality
- **中文** 当 coordinator mode 被提议默认启用时，证据必须证明 bounded worker fan-out、相比 baseline 更低的 correction cost 或 failure rate、scoped writes、conflict handling 与 verification quality。

### Requirement: Agent Namespace / Agent Namespace

Write-capable agents SHALL execute within explicit namespaces that bound paths, tools, memory, scratchpad, checkpoints, budgets, deadlines, lineage, and ownership.

可写 agents 必须在显式 namespaces 中执行，用于约束 paths、tools、memory、scratchpad、checkpoints、budgets、deadlines、lineage 与 ownership。

#### Scenario: Agent write is scoped / Agent 写入受 Scope 约束

- **WHEN** a coordinator, worker, verifier, repair, or implementer agent attempts a write operation
- **THEN** agent-management verifies the operation is within the agent namespace before execution proceeds
- **中文** 当 coordinator、worker、verifier、repair 或 implementer agent 尝试写操作时，agent-management 必须在执行前验证该操作位于 agent namespace 内。

### Requirement: Agent Quotas / Agent Quotas

Agent execution SHALL enforce quotas for token budget, tool calls, wall-clock deadlines, retries, and mutation scope.

Agent execution 必须执行 token budget、tool calls、wall-clock deadlines、retries 与 mutation scope 的 quotas。

#### Scenario: Quota exhaustion stops work / Quota 耗尽停止工作

- **WHEN** an agent exhausts a configured quota
- **THEN** execution stops or requests policy-approved extension and emits a quota diagnostic
- **中文** 当 agent 耗尽配置 quota 时，execution 必须停止或请求 policy-approved extension，并发出 quota diagnostic。

### Requirement: Agent Lineage And Ownership / Agent Lineage 与 Ownership

Child agents SHALL record parent lineage, delegated scope, output ownership, and merge responsibility.

Child agents 必须记录 parent lineage、delegated scope、output ownership 与 merge responsibility。

#### Scenario: Child scope cannot silently expand / Child Scope 不能静默扩大

- **WHEN** a child agent requests broader paths, tools, memory, or budget than its parent delegated
- **THEN** the request requires an explicit policy decision and lineage record
- **中文** 当 child agent 请求比 parent delegated 更宽的 paths、tools、memory 或 budget 时，该请求必须需要显式 policy decision 与 lineage record。

