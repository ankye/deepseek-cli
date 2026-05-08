# usage-budget-management Specification

## Purpose
TBD - created by archiving change bootstrap-future-ready-cli-framework. Update Purpose after archive.
## Requirements
### Requirement: Usage and Budget Service

The platform SHALL define a usage and budget service for model tokens, provider cost, tool execution cost, wall-clock time, workflow budgets, session budgets, agent budgets, plugin budgets, and rate-limit telemetry.

平台必须定义 usage and budget service，覆盖 model tokens、provider cost、tool execution cost、wall-clock time、workflow budgets、session budgets、agent budgets、plugin budgets 和 rate-limit telemetry。

#### Scenario: Runtime checks budget before model call

- **WHEN** runtime prepares a model call
- **THEN** it checks token, cost, time, provider, session, workflow, and agent budgets before dispatch

#### Scenario: Tool execution consumes budget

- **WHEN** a capability executes with declared cost or resource usage
- **THEN** the usage service records usage against session, workflow, agent, capability, plugin, and provider dimensions

### Requirement: Budget Policy and User Visibility

The usage and budget service SHALL expose structured budget warnings, limit decisions, and usage summaries through protocol events for CLI, VSCode, JSON, tests, and future server transports.

usage and budget service 必须通过 protocol events 暴露 structured budget warnings、limit decisions 和 usage summaries，供 CLI、VSCode、JSON、tests 和未来 server transports 使用。

#### Scenario: Budget limit blocks turn

- **WHEN** executing a turn would exceed a configured hard budget
- **THEN** runtime emits a structured budget-limit event and does not continue execution unless policy or approval changes the limit

#### Scenario: Usage summary is host-neutral

- **WHEN** a session or workflow completes
- **THEN** usage summaries are emitted as structured data without embedding terminal or editor UI details

### Requirement: Deterministic Usage Tests

Usage and budget behavior SHALL be testable with deterministic token counters, fake provider pricing, fake clocks, and replayed runtime traces.

usage and budget behavior 必须可用 deterministic token counters、fake provider pricing、fake clocks 和 replayed runtime traces 测试。

#### Scenario: Replay verifies usage accounting

- **WHEN** a golden trace is replayed
- **THEN** normalized usage records match expected token, cost, time, rate-limit, and budget decision events

