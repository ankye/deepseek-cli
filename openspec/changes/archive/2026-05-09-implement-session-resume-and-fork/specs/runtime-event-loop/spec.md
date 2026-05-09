## ADDED Requirements

### Requirement: Runtime Uses Resumed Session Id / Runtime 使用恢复的 Session Id

The runtime event loop SHALL allow callers to submit kernel-backed turns with a resumed or forked session id.

runtime event loop 必须允许 caller 使用 resumed 或 forked session id 提交 kernel-backed turns。

#### Scenario: Resumed turn preserves session id / 恢复后的 turn 保留 session id

- **WHEN** a caller resumes a session and submits a new prompt
- **THEN** the runtime kernel invocation uses the resumed session id and appends subsequent runtime events to that session event log
- **中文** 当 caller 恢复 session 并提交新 prompt 时，runtime kernel invocation 必须使用恢复后的 session id，并将后续 runtime events 追加到该 session event log。

#### Scenario: Forked turn uses child session id / 分叉后的 turn 使用 child session id

- **WHEN** a caller forks a parent session and submits a prompt on the child
- **THEN** the runtime kernel invocation uses the child session id and preserves lineage metadata through session events
- **中文** 当 caller 分叉 parent session 并在 child 上提交 prompt 时，runtime kernel invocation 必须使用 child session id，并通过 session events 保留 lineage metadata。

### Requirement: Resume/Fork Preserve Kernel Governance / Resume/Fork 保持 Kernel 治理

Resume and fork-lite SHALL NOT create separate runtime execution paths.

resume 与 fork-lite 不得创建独立 runtime execution paths。

#### Scenario: Resumed execution remains governed / 恢复执行仍受治理

- **WHEN** a resumed or forked session executes model, tool, command, policy, scheduler, sandbox, or capability work
- **THEN** execution still passes through the runtime kernel, execution envelope, policy, scheduler, bus, observability, and replay boundaries
- **中文** 当 resumed 或 forked session 执行 model、tool、command、policy、scheduler、sandbox 或 capability work 时，执行仍必须经过 runtime kernel、execution envelope、policy、scheduler、bus、observability 和 replay boundaries。

#### Scenario: Direct resume bypass fails lint / 直接恢复绕过触发 lint

- **WHEN** host adapter code attempts to mutate session event logs and execute capabilities directly during resume or fork
- **THEN** architecture lint or tests fail before default test suites pass
- **中文** 当 host adapter code 在 resume 或 fork 期间尝试直接修改 session event logs 并直接执行 capabilities 时，architecture lint 或 tests 必须在默认测试通过前失败。
