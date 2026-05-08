## ADDED Requirements

### Requirement: VSCode Adapter Is Kernel Projection Only

The VSCode adapter SHALL only project canonical runtime kernel events and SHALL NOT invoke executable primitives directly.

VSCode adapter 只能投影 canonical runtime kernel events，不得直接调用 executable primitives。

#### Scenario: VSCode direct bypass fails lint

- **WHEN** VSCode extension code directly calls model, capability, scheduler, policy, workflow, bus, command, skill, hook, MCP, plugin, or sandbox execution primitives
- **THEN** architecture lint fails with a stable rule id
