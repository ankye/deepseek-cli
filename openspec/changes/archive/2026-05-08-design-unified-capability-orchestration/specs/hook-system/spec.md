## ADDED Requirements

### Requirement: Hook Invocation Governance

The hook system SHALL route hook invocations through governed execution when a hook can block, rewrite, mutate runtime state, call tools, access external resources, or produce side effects.

hook system 必须在 hook 能 block、rewrite、mutate runtime state、call tools、access external resources 或产生 side effects 时，通过 governed execution 路由 hook invocation。

#### Scenario: Observe-only hook is lightweight

- **WHEN** a hook only observes lifecycle data and returns no mutation, policy suggestion, workflow suggestion, capability request, or host render effect
- **THEN** it can execute with minimal envelope metadata, deterministic ordering, timeout, trace, and failure policy

#### Scenario: Side-effect hook is governed

- **WHEN** a hook requests side effects or modifies runtime-bound data
- **THEN** it is scheduled as governed executable work with policy, approval, sandbox, bus, audit, and replay metadata
