## ADDED Requirements

### Requirement: Interactive CLI Event Consumption / 交互式 CLI 事件消费

The communication protocol SHALL allow the interactive CLI to consume the same canonical runtime events and control semantics as headless CLI, VSCode, tests, and future server transports.

communication protocol 必须允许 interactive CLI 消费与 headless CLI、VSCode、tests 和未来 server transports 相同的 canonical runtime events 与 control semantics。

#### Scenario: Interactive prompt uses canonical events / 交互 prompt 使用规范事件

- **WHEN** an interactive prompt turn runs
- **THEN** prompt submission, runtime events, terminal states, errors, and cancellation are represented as protocol-compatible request, event, and control messages
- **中文** 当 interactive prompt turn 运行时，prompt submission、runtime events、terminal states、errors 和 cancellation 必须表示为 protocol-compatible request、event 与 control messages。

#### Scenario: Host renderers share event semantics / Host renderer 共享事件语义

- **WHEN** CLI text, CLI stream-json, VSCode, tests, or future server adapters consume the same runtime event stream
- **THEN** each host renderer receives equivalent event ids, correlation ids, trace metadata, terminal states, and redaction classes
- **中文** 当 CLI text、CLI stream-json、VSCode、tests 或未来 server adapters 消费同一 runtime event stream 时，每个 host renderer 必须收到等价的 event ids、correlation ids、trace metadata、terminal states 和 redaction classes。

### Requirement: Interactive Backpressure And Shutdown / 交互式背压与关闭

The protocol and host adapter boundary SHALL define bounded behavior for slow terminal output, EOF, cancellation, and runtime shutdown in the interactive shell.

protocol 与 host adapter 边界必须为 interactive shell 中的 slow terminal output、EOF、cancellation 和 runtime shutdown 定义有界行为。

#### Scenario: Slow terminal output is bounded / 慢终端输出有界

- **WHEN** the interactive shell receives runtime events faster than the terminal writer can flush
- **THEN** the host adapter applies bounded buffering, awaits writes, or emits a structured overflow error according to protocol policy
- **中文** 当 interactive shell 接收 runtime events 的速度快于 terminal writer flush 时，host adapter 必须根据 protocol policy 应用 bounded buffering、等待写入，或发出 structured overflow error。

#### Scenario: EOF shuts down runtime resources / EOF 关闭运行时资源

- **WHEN** the interactive input stream reaches EOF
- **THEN** the host adapter sends or performs orderly shutdown for active runtime resources and emits no orphaned active invocation
- **中文** 当 interactive input stream 到达 EOF 时，host adapter 必须发送或执行 active runtime resources 的有序关闭，并且不得留下 orphaned active invocation。
