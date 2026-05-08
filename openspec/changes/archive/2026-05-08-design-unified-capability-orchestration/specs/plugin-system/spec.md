## ADDED Requirements

### Requirement: Plugin Contributions Are Not Execution Authority

The plugin system SHALL treat plugin packages as contribution containers, not privileged execution boundaries, and SHALL normalize every executable plugin contribution into its owning subsystem and governed execution pipeline.

plugin system 必须把 plugin packages 作为 contribution containers，而不是特权 execution boundaries，并且必须将每个 executable plugin contribution 规范化到其 owning subsystem 和 governed execution pipeline。

#### Scenario: Plugin contributes executable tool

- **WHEN** a plugin contributes a tool, skill, hook, command, MCP connector, workflow template, model profile, renderer, context provider, memory/cache provider, or agent definition
- **THEN** the owning subsystem validates and registers the contribution, and any execution uses the governed execution envelope rather than plugin-private execution

#### Scenario: Plugin lifecycle is scheduled work

- **WHEN** a plugin install, update, migration, rollback, health check, or uninstall runs
- **THEN** the action is represented as governed executable work with permission diff, resource locks, policy decision, audit, and replay metadata
