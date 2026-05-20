# usage-budget-management Specification

## Purpose
Define usage and budget management requirements for token, cost, quota, rate, cache, and runtime budget accounting.

定义 usage and budget management 对 token、cost、quota、rate、cache 与 runtime budget accounting 的要求。

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

### Requirement: Provider Usage Normalization

Model provider adapters SHALL report normalized usage metadata for input tokens, output tokens, reasoning tokens, cache hit tokens, cache miss tokens, provider name, model name, and provider request id when available.

model provider adapters 必须在可用时报告 normalized usage metadata，包括 input tokens、output tokens、reasoning tokens、cache hit tokens、cache miss tokens、provider name、model name 和 provider request id。

#### Scenario: DeepSeek usage is mapped

- **WHEN** DeepSeek returns prompt, completion, reasoning, and cache token usage
- **THEN** the model gateway emits a usage event that maps those fields to platform-neutral metadata without provider-shaped leakage

#### Scenario: Missing usage remains explicit

- **WHEN** a provider response completes without usage metadata
- **THEN** the model gateway emits completion events without inventing token counts and tests can assert the absence explicitly

### Requirement: Context Projection Budget Decision / Context Projection 预算决策

The usage budget service SHALL provide deterministic context-token budget inputs to ContextGraph projection before model dispatch.

usage budget service 必须在 model dispatch 前向 ContextGraph projection 提供确定性的 context-token budget inputs。

#### Scenario: Projection receives hard and soft limits / Projection 接收硬软限制

- **WHEN** runtime prepares projection for a model target
- **THEN** the budget service provides hard context limit, soft context target, reserved output budget, and budget policy metadata
- **中文** 当 runtime 为 model target 准备 projection 时，budget service 必须提供 hard context limit、soft context target、reserved output budget 和 budget policy metadata。

### Requirement: Token Estimation Is Deterministic By Default / Token 估算默认确定性

Context projection token estimation SHALL be deterministic in default tests and SHALL NOT require live provider tokenizers.

context projection token estimation 在默认测试中必须是确定性的，且不得要求 live provider tokenizers。

#### Scenario: Fake estimator drives default tests / Fake estimator 驱动默认测试

- **WHEN** default unit, integration, golden, matrix, or e2e tests run
- **THEN** they use deterministic token estimation fixtures and do not require network access or provider SDK calls
- **中文** 当默认 unit、integration、golden、matrix 或 e2e tests 运行时，必须使用 deterministic token estimation fixtures，且不要求 network access 或 provider SDK calls。

### Requirement: Projection Budget Evidence / Projection 预算证据

Projection budget decisions SHALL be emitted as structured usage evidence for replay and host summaries.

projection budget decisions 必须作为 structured usage evidence 发出，用于 replay 与 host summaries。

#### Scenario: Budget decision is replayable / 预算决策可 replay

- **WHEN** a projection result is recorded
- **THEN** it includes estimated input tokens, hard limit, soft target, reserved output tokens, selected token total, excluded token estimate, and decision reason
- **中文** 当 projection result 被记录时，必须包含 estimated input tokens、hard limit、soft target、reserved output tokens、selected token total、excluded token estimate 和 decision reason。
