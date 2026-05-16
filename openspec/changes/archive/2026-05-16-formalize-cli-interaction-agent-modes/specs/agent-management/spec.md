## ADDED Requirements

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
