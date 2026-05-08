## ADDED Requirements

### Requirement: CLI Commands Are Kernel Backed

CLI commands that trigger executable runtime work SHALL delegate to `RuntimeKernel` and SHALL NOT own direct execution state machines.

触发 executable runtime work 的 CLI commands 必须委托给 `RuntimeKernel`，不得拥有 direct execution state machines。

#### Scenario: Default prompt uses kernel

- **WHEN** a user runs the default CLI prompt command
- **THEN** the command emits kernel-backed runtime events and does not call legacy runtime direct execution

#### Scenario: CLI direct bypass fails lint

- **WHEN** CLI code directly calls model, capability, scheduler, policy, workflow, bus, command, skill, hook, MCP, plugin, or sandbox execution primitives
- **THEN** architecture lint fails before tests pass
