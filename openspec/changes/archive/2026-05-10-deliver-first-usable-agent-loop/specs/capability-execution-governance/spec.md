## ADDED Requirements

### Requirement: Model-Requested Capability Governance / 模型请求能力治理

Every model-requested executable capability SHALL pass through execution envelope creation, capability lookup, schema validation, policy decision, scheduler admission, timeout control, retry policy, result evidence, and trace publication before the agent loop can continue.

每个模型请求的 executable capability 都必须经过 execution envelope creation、capability lookup、schema validation、policy decision、scheduler admission、timeout control、retry policy、result evidence 和 trace publication，agent loop 才能继续。

#### Scenario: Capability execution is admitted before start / 能力执行先准入再开始

- **WHEN** runtime receives a valid model tool intent for an executable capability
- **THEN** governance creates an execution envelope, validates inputs, obtains a policy decision, admits the work through scheduler, and only then starts execution
- **中文** 当 runtime 收到有效的模型 tool intent 并指向 executable capability 时，governance 必须创建 execution envelope、校验 inputs、取得 policy decision、通过 scheduler 准入，然后才开始执行。

#### Scenario: Policy denial returns model feedback / Policy 拒绝返回模型反馈

- **WHEN** policy denies a model-requested capability
- **THEN** governance emits denial evidence and returns a bounded provider-neutral tool result or terminal event according to runtime policy without executing the capability
- **中文** 当 policy 拒绝模型请求的 capability 时，governance 必须发出 denial evidence，并按 runtime policy 返回有界 provider-neutral tool result 或 terminal event，且不得执行该 capability。

### Requirement: Agent Loop Retry Governance / Agent Loop 重试治理

Retries in the agent loop SHALL be governed by retry policy, idempotency metadata, side-effect level, timeout budget, and trace continuity.

agent loop 中的 retries 必须受 retry policy、idempotency metadata、side-effect level、timeout budget 和 trace continuity 治理。

#### Scenario: Non-idempotent tool is not retried automatically / 非幂等工具不自动重试

- **WHEN** a non-idempotent write or shell capability fails after starting execution
- **THEN** governance does not retry automatically and emits failure evidence with checkpoint or rollback metadata when available
- **中文** 当非幂等 write 或 shell capability 在开始执行后失败时，governance 不得自动重试，并必须发出 failure evidence，适用时包含 checkpoint 或 rollback metadata。

#### Scenario: Retry preserves trace / 重试保留 trace

- **WHEN** an idempotent model request or read-only capability is retried
- **THEN** every attempt shares the same parent trace id and records attempt number, reason, delay, and terminal attempt status
- **中文** 当幂等 model request 或 read-only capability 被重试时，每次 attempt 必须共享同一 parent trace id，并记录 attempt number、reason、delay 和 terminal attempt status。
