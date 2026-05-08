# agent-management Specification

## Purpose
TBD - created by archiving change bootstrap-future-ready-cli-framework. Update Purpose after archive.
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

