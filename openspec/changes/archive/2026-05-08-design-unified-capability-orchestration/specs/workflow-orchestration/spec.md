## ADDED Requirements

### Requirement: Executable Workflow Nodes

The workflow orchestrator SHALL represent executable capability invocations as typed workflow nodes with dependencies, owner agent, expected artifacts, rollback metadata, checkpoint policy, and execution envelope references.

workflow orchestrator 必须将 executable capability invocations 表示为 typed workflow nodes，并包含 dependencies、owner agent、expected artifacts、rollback metadata、checkpoint policy 和 execution envelope references。

#### Scenario: Workflow plans tool execution

- **WHEN** a user turn requires a tool, command, skill-backed action, MCP call, hook mutation, model call, workspace edit, plugin lifecycle action, or subagent delegation
- **THEN** the workflow graph contains an executable node instead of allowing direct primitive invocation from the host or arbitrary package

#### Scenario: Workflow does not own locks

- **WHEN** an executable workflow node declares resource needs
- **THEN** the workflow records semantic dependencies and resource intent but leaves lock acquisition, rate limits, cancellation, deadlines, and retry budget enforcement to the concurrency scheduler
