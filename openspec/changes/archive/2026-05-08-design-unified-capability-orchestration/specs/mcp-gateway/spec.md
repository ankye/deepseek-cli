## ADDED Requirements

### Requirement: MCP Calls Use Governed Invocation

The MCP gateway SHALL normalize MCP tools, resource reads, prompts, commands, and context providers into governed capability invocations when they are fetched, projected into runtime context, or executed.

MCP gateway 必须在 MCP tools、resource reads、prompts、commands 和 context providers 被 fetch、project into runtime context 或 execute 时，将其规范化为 governed capability invocations。

#### Scenario: External MCP tool is governed

- **WHEN** an MCP tool is called
- **THEN** the gateway creates an envelope with server id, namespace, transport, trust, permissions, timeout, resource policy, redaction, audit, and replay metadata before dispatch

#### Scenario: MCP resource read is governed

- **WHEN** a model, skill, command, hook, agent, or user requests an MCP resource
- **THEN** the request is authorized and traced through the governed execution pipeline rather than treated as untracked context
