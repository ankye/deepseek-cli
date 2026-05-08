## ADDED Requirements

### Requirement: Canonical Platform Contract Package

The system SHALL provide a canonical `platform-contracts` package that owns stable TypeScript interfaces, serializable DTOs, branded ids, versioned envelopes, error shapes, runtime events, host contracts, and dependency injection contracts.

系统必须提供 canonical `platform-contracts` package，统一承载稳定 TypeScript interfaces、serializable DTOs、branded ids、versioned envelopes、error shapes、runtime events、host contracts 和 dependency injection contracts。

#### Scenario: Contracts are centralized

- **WHEN** a package needs a cross-package interface
- **THEN** it imports the interface from `platform-contracts`
- **AND** it does not import another package's implementation internals

#### Scenario: Contracts are implementation-free

- **WHEN** `platform-contracts` is compiled
- **THEN** it has no dependency on CLI, VSCode APIs, terminal UI libraries, model SDKs, filesystem adapters, process adapters, or concrete tool executors

### Requirement: Platform Interface Groups

The `platform-contracts` package SHALL define interface groups for protocol, runtime message bus, runtime, host, workflow, concurrency, agent, model, capability, command, skill, hook, MCP, plugin, extension, context, memory, cache, credential, usage, workspace state, policy, approval, sandbox, session, platform runtime, evolution, code intelligence, remote runtime connectivity, distribution/update, config, observability, and testing.

`platform-contracts` package 必须定义 protocol、runtime message bus、runtime、host、workflow、concurrency、agent、model、capability、command、skill、hook、MCP、plugin、extension、context、memory、cache、credential、usage、workspace state、policy、approval、sandbox、session、platform runtime、evolution、code intelligence、remote runtime connectivity、distribution/update、config、observability 和 testing 的接口分组。

#### Scenario: Runtime dependency graph is explicit

- **WHEN** `AgentRuntime` is constructed
- **THEN** its dependencies are described by a typed dependency injection contract such as `RuntimeDependencies`
- **AND** tests can replace each dependency with a fake implementation

#### Scenario: Host adapters use shared contracts

- **WHEN** CLI or VSCode integrates with runtime
- **THEN** it implements or consumes host contracts from `platform-contracts`
- **AND** it does not require runtime packages to import CLI or VSCode APIs

### Requirement: Versioned Serializable Contracts

Runtime events, runtime bus events, session events, workspace events, edit transactions, audit records, plugin manifests, extension manifests, skill manifests, hook manifests, command manifests, MCP connector manifests, agent definitions, capability manifests, credential references, usage records, policy decisions, distribution records, and migration records SHALL be serializable and versioned.

runtime events、runtime bus events、session events、workspace events、edit transactions、audit records、plugin manifests、extension manifests、skill manifests、hook manifests、command manifests、MCP connector manifests、agent definitions、capability manifests、credential references、usage records、policy decisions、distribution records 和 migration records 必须可序列化并带版本。

#### Scenario: Event envelope includes schema version

- **WHEN** a cross-package event is emitted or persisted
- **THEN** it includes a stable kind, schema version, id, timestamp, payload, and optional trace context

#### Scenario: DTO does not contain implementation object

- **WHEN** a contract type crosses a package boundary
- **THEN** it contains serializable data or explicit interface references
- **AND** it does not contain concrete classes from implementation packages

### Requirement: Dependency Direction

Application adapters and implementation packages SHALL depend on `platform-contracts`; `platform-contracts` SHALL NOT depend on application adapters or implementation packages.

application adapters 和 implementation packages 必须依赖 `platform-contracts`；`platform-contracts` 不能依赖 application adapters 或 implementation packages。

#### Scenario: Implementation package exports factory

- **WHEN** an implementation package provides a runtime, model adapter, platform adapter, session store, or capability executor
- **THEN** it exports a factory or class implementing interfaces from `platform-contracts`

#### Scenario: Contract package remains portable

- **WHEN** `platform-contracts` is imported by a browser-like test, CLI, VSCode extension, or server package
- **THEN** it can be loaded without requiring Node-only globals or host-specific modules

### Requirement: Contract Compatibility and Evolution

The platform contract layer SHALL support additive evolution through schema versions, compatibility metadata, deprecation metadata, and migration hooks.

平台 contract layer 必须通过 schema versions、compatibility metadata、deprecation metadata 和 migration hooks 支持增量演进。

#### Scenario: Additive contract change is versioned

- **WHEN** a contract event, manifest, or persisted DTO adds fields
- **THEN** the schema version or compatibility metadata identifies the expected shape

#### Scenario: Breaking contract change requires migration plan

- **WHEN** a contract change breaks existing persisted sessions, protocol traces, bus traces, plugin manifests, extension manifests, skill manifests, hook manifests, command manifests, MCP connector manifests, or capability manifests
- **THEN** the evolution engine defines a migration or compatibility rejection path

### Requirement: Type-Level Verification

The first framework implementation SHALL include type-level checks or contract tests that verify contract exports, dependency direction, serializability conventions, and fake implementation substitutability.

第一版框架实现必须包含 type-level checks 或 contract tests，用于验证 contract exports、dependency direction、serializability conventions 和 fake implementation substitutability。

#### Scenario: Fake dependencies satisfy runtime contracts

- **WHEN** runtime tests construct fake dependencies for protocol, runtime message bus, workflow, concurrency, model, agent, capability, command, skill, hook, MCP, plugin, extension, context, memory, cache, credential, usage, workspace state, policy, sandbox, session, platform, code intelligence, remote connectivity, distribution/update, evolution, config, observability, and testing
- **THEN** those fakes satisfy the `platform-contracts` interfaces without importing production implementations
