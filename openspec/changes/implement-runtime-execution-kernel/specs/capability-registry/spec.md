## ADDED Requirements

### Requirement: Built-In Executable Capability Registration

The capability registry SHALL support registration of built-in executable capabilities with metadata, constraints, schemas, and executor bindings.

capability registry 必须支持 built-in executable capabilities 的注册，包含 metadata、constraints、schemas 和 executor bindings。

#### Scenario: Register deterministic built-in capability

- **WHEN** the runtime package initializes its built-in capability set
- **THEN** the registry contains at least one deterministic built-in executable capability that can prove the full kernel pipeline

#### Scenario: Reject duplicate capability id

- **WHEN** a second capability is registered with an existing capability id and incompatible version metadata
- **THEN** the registry rejects the registration with a typed registry error

### Requirement: Registry Lookup for Kernel Execution

The capability registry SHALL expose lookup APIs that return executable capability definitions without allowing hosts to run executors directly.

capability registry 必须暴露 lookup APIs 返回 executable capability definitions，但不允许 hosts 直接运行 executors。

#### Scenario: Kernel resolves executor

- **WHEN** the runtime kernel resolves a registered executable capability
- **THEN** it receives the executor binding and constraint metadata needed for governed execution

#### Scenario: Host receives metadata only

- **WHEN** CLI, VSCode, or another host lists capabilities
- **THEN** it receives projection-safe metadata and not a direct primitive execution path
