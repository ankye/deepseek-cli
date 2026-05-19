## ADDED Requirements

### Requirement: Plugin execution stays host-owned
The command system SHALL provide inert plugin action descriptors for preview and inspection, while real plugin execution remains host-owned.

Command system 必须为 preview 与 inspection 提供惰性的 plugin action descriptors，而真实 plugin execution 必须保持 host-owned。

#### Scenario: Plugin action descriptor does not execute route
- **WHEN** a plugin action descriptor is created by command-system
- **THEN** it contains permissions, side effects, governance metadata, and dry-run status but does not execute owner routes
- **中文** 当 command-system 创建 plugin action descriptor 时，它必须包含 permissions、side effects、governance metadata 与 dry-run status，但不得执行 owner routes。

#### Scenario: Host execution record proves dispatch boundary
- **WHEN** an interactive plugin action is actually executed
- **THEN** the resulting execution record identifies the host-owned owner route and not a command-system private callback
- **中文** 当 interactive plugin action 实际执行时，产生的 execution record 必须标识 host-owned owner route，而不是 command-system private callback。
