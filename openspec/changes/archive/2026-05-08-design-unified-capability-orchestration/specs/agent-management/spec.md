## ADDED Requirements

### Requirement: Agent Scope Constrains Executable Capabilities

The agent manager SHALL apply active agent capability, skill, hook, context, memory, policy, host, and model scopes before a governed execution envelope is scheduled or executed.

agent manager 必须在 governed execution envelope 被调度或执行前应用 active agent 的 capability、skill、hook、context、memory、policy、host 和 model scopes。

#### Scenario: Agent denied capability cannot execute it

- **WHEN** an agent scope excludes a capability, command, skill, hook, MCP tool, model profile, memory scope, host capability, or subagent target
- **THEN** the execution envelope is rejected or rewritten before scheduling and the decision is recorded for audit

#### Scenario: Delegated agent gets child scope

- **WHEN** a future subagent delegation is represented as executable work
- **THEN** its envelope includes parent agent, target agent definition, delegated scope constraints, session linkage, approval requirements, and parent invocation id
