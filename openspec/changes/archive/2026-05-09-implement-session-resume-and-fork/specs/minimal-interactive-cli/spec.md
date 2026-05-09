## ADDED Requirements

### Requirement: Interactive Session Controls / 交互式 Session 控制

The minimal interactive CLI SHALL expose session resume and fork-lite controls through structured command results.

minimal interactive CLI 必须通过 structured command results 暴露 session resume 与 fork-lite controls。

#### Scenario: Resume control selects session / Resume 控制选择 session

- **WHEN** the user invokes an interactive resume control with a session id
- **THEN** the CLI requests session resume through session/runtime contracts and uses the resumed session id for subsequent prompt turns
- **中文** 当用户使用 session id 调用 interactive resume control 时，CLI 必须通过 session/runtime contracts 请求 session resume，并为后续 prompt turns 使用恢复后的 session id。

#### Scenario: Fork control selects child session / Fork 控制选择 child session

- **WHEN** the user invokes an interactive fork control with a parent session id
- **THEN** the CLI requests fork-lite through session/runtime contracts and uses the child session id for subsequent prompt turns
- **中文** 当用户使用 parent session id 调用 interactive fork control 时，CLI 必须通过 session/runtime contracts 请求 fork-lite，并为后续 prompt turns 使用 child session id。

#### Scenario: Session control failure is typed / Session 控制失败是类型化的

- **WHEN** resume or fork-lite fails in the interactive CLI
- **THEN** the shell renders a structured command failure and keeps the previous active session selection unchanged
- **中文** 当 interactive CLI 中 resume 或 fork-lite 失败时，shell 必须渲染 structured command failure，并保持之前的 active session selection 不变。

### Requirement: Headless Session Commands / Headless Session 命令

The CLI SHALL provide scriptable session commands for resume and fork-lite.

CLI 必须提供可脚本化的 session resume 与 fork-lite commands。

#### Scenario: Scriptable resume returns structured output / 可脚本化 resume 返回结构化输出

- **WHEN** a user runs a headless session resume command with stream-json output
- **THEN** the CLI emits structured resume result metadata without requiring an interactive terminal
- **中文** 当用户以 stream-json output 运行 headless session resume command 时，CLI 必须输出 structured resume result metadata，且不需要 interactive terminal。

#### Scenario: Scriptable fork returns child id / 可脚本化 fork 返回 child id

- **WHEN** a user runs a headless session fork command with stream-json output
- **THEN** the CLI emits the child session id, parent id, fork point sequence, and redacted metadata
- **中文** 当用户以 stream-json output 运行 headless session fork command 时，CLI 必须输出 child session id、parent id、fork point sequence 和 redacted metadata。
