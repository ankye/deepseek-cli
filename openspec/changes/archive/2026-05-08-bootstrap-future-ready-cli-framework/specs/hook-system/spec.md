## ADDED Requirements

### Requirement: Governed Hook System

The platform SHALL define a governed hook system for lifecycle extension points before and after user input, model calls, tool execution, skill activation, workflow steps, file edits, session changes, plugin lifecycle actions, and host rendering.

平台必须定义 governed hook system，覆盖 user input、model calls、tool execution、skill activation、workflow steps、file edits、session changes、plugin lifecycle actions 和 host rendering 的前后 lifecycle extension points。

#### Scenario: Register hook contribution

- **WHEN** an extension, plugin, workspace, or built-in package contributes a hook
- **THEN** the hook system validates event point, input schema, output schema, permissions, timeout, ordering, isolation mode, and compatibility metadata

#### Scenario: Hook cannot bypass policy

- **WHEN** a hook requests side effects or modifies runtime-bound data
- **THEN** the request is routed through policy, approval, sandbox, audit, and runtime message bus boundaries

### Requirement: Hook Ordering, Isolation, and Failure Policy

The hook system SHALL define deterministic hook ordering, timeout behavior, concurrency limits, cancellation propagation, isolation modes, and failure policies.

hook system 必须定义 deterministic hook ordering、timeout behavior、concurrency limits、cancellation propagation、isolation modes 和 failure policies。

#### Scenario: Hook timeout is contained

- **WHEN** a hook exceeds its configured deadline
- **THEN** the hook system cancels the hook, emits a structured hook failure event, and applies the configured continue, block, or rollback policy

#### Scenario: Hook ordering is reproducible

- **WHEN** multiple hooks subscribe to the same lifecycle point
- **THEN** execution order is determined by declared priority, source trust, dependency metadata, and stable tie-breaking rules

### Requirement: Hook Output Contracts

Hook outputs SHALL be typed as observe-only records, context additions, policy suggestions, workflow suggestions, capability requests, or host render hints.

hook outputs 必须被类型化为 observe-only records、context additions、policy suggestions、workflow suggestions、capability requests 或 host render hints。

#### Scenario: Hook adds context node

- **WHEN** a hook contributes context
- **THEN** it returns a structured context node with source, provenance, redaction, priority, and lifecycle metadata

#### Scenario: Hook suggestion is not automatic authority

- **WHEN** a hook returns a policy or workflow suggestion
- **THEN** the owning policy or workflow subsystem decides whether to apply it
