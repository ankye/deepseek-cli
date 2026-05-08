## ADDED Requirements

### Requirement: Tool Intent Preflight

The governed execution pipeline SHALL validate and optionally repair normalized model tool-call intents before creating an execution envelope or scheduling tool execution.

 governed execution pipeline 必须在创建 execution envelope 或调度 tool execution 前，对 normalized model tool-call intents 进行校验，并在安全时执行修复。

#### Scenario: Repair safe workspace path

- **WHEN** a model tool-call intent contains a workspace file path with provider-produced slash direction, redundant current-directory prefix, or relative path notation
- **THEN** preflight resolves it through the platform path contract, keeps it inside the workspace boundary, records the repair action, and returns repaired input for governed execution

#### Scenario: Reject unsafe path

- **WHEN** a model tool-call intent contains an absolute path, parent traversal, home-directory expansion, or platform-incompatible path that cannot be proven inside the workspace
- **THEN** preflight rejects the intent with typed diagnostics before policy evaluation or scheduler submission

#### Scenario: Reject unknown tool

- **WHEN** a normalized tool-call intent names a capability that is not model-visible or executable
- **THEN** preflight rejects the intent and does not create an execution envelope

#### Scenario: Preflight emits replayable metadata

- **WHEN** preflight repairs or rejects an intent
- **THEN** the result includes original input, repaired input when available, repair actions, diagnostics, platform metadata, workspace root, and replay-safe redaction metadata

### Requirement: Provider-Specific Tool Intent Profiles

The governed execution pipeline SHALL support provider-specific preflight profiles for deterministic tool-call repair while preserving the mandatory common safety core.

governed execution pipeline 必须支持 provider-specific preflight profiles，用于 deterministic tool-call repair，同时保留强制 common safety core。

#### Scenario: Provider profile repairs shape before safety checks

- **WHEN** a provider emits tool-call intent with provider-specific aliases, nested argument JSON, or provider-specific path field names
- **THEN** preflight applies the matching provider profile first and then runs common model-visible tool, workspace path, platform, policy, and replay checks

#### Scenario: Provider profile cannot weaken safety

- **WHEN** a provider profile attempts to repair input that remains absolute, parent-traversing, outside the workspace, unknown, or platform-unsafe
- **THEN** common preflight rejects the intent before envelope creation or scheduler submission

#### Scenario: Provider profile is recorded

- **WHEN** provider-specific repair is applied
- **THEN** preflight result records provider id, profile id when available, repair actions, and diagnostics for replay and audit
