## ADDED Requirements

### Requirement: Agent CLI Commands / Agent CLI 命令

The command system SHALL provide `deepseek run` and `deepseek chat` commands that submit work to runtime through platform contracts and render runtime events without owning model, tool, scheduler, or policy state machines.

command system 必须提供 `deepseek run` 与 `deepseek chat` 命令，通过 platform contracts 向 runtime 提交工作，并渲染 runtime events，不得拥有 model、tool、scheduler 或 policy state machines。

#### Scenario: Run command submits one task / Run 命令提交一个任务

- **WHEN** a user executes `deepseek run "fix tests"` with valid configuration
- **THEN** the command creates a runtime request with task text, workspace scope, output mode, session options, and cancellation signal, then streams runtime events until the turn reaches a terminal state
- **中文** 当用户以有效配置执行 `deepseek run "fix tests"` 时，该命令必须创建包含 task text、workspace scope、output mode、session options 和 cancellation signal 的 runtime request，并串流 runtime events 直到 turn 达到终态。

#### Scenario: Chat command submits multiple turns / Chat 命令提交多个 turns

- **WHEN** a user executes `deepseek chat`
- **THEN** the command opens a chat prompt loop and submits each user message as a runtime turn using the active session id
- **中文** 当用户执行 `deepseek chat` 时，该命令必须打开 chat prompt loop，并使用 active session id 把每条 user message 提交为 runtime turn。

### Requirement: Agent CLI Output Modes / Agent CLI 输出模式

The command system SHALL support text, JSON, and JSONL output modes for agent loop commands with stable exit codes and redacted diagnostics.

command system 必须为 agent loop commands 支持 text、JSON 和 JSONL output modes，并提供稳定 exit codes 与脱敏 diagnostics。

#### Scenario: JSONL output is stream-safe / JSONL 输出适合流式消费

- **WHEN** `deepseek run --output jsonl "inspect repo"` is executed
- **THEN** each runtime event is written as one JSON line and process exit code reflects terminal success, failure, cancellation, or usage error
- **中文** 当执行 `deepseek run --output jsonl "inspect repo"` 时，每个 runtime event 必须写成一行 JSON，且进程退出码反映 terminal success、failure、cancellation 或 usage error。

#### Scenario: JSON output summarizes final result / JSON 输出总结最终结果

- **WHEN** `deepseek run --output json "inspect repo"` completes
- **THEN** stdout contains a single JSON object with final status, assistant summary, trace id, session id, turn id, diagnostics, and redaction metadata
- **中文** 当 `deepseek run --output json "inspect repo"` 完成时，stdout 必须包含单个 JSON object，包含 final status、assistant summary、trace id、session id、turn id、diagnostics 和 redaction metadata。

### Requirement: Agent Command Configuration / Agent 命令配置

Agent CLI commands SHALL resolve model profile, credential reference, workspace root, policy profile, output mode, timeout, and live/offline mode through the shared config service and platform abstraction.

agent CLI commands 必须通过 shared config service 与 platform abstraction 解析 model profile、credential reference、workspace root、policy profile、output mode、timeout 和 live/offline mode。

#### Scenario: Missing configuration fails with guidance / 缺少配置时返回指引

- **WHEN** agent command configuration is missing a required model profile or credential for live mode
- **THEN** the command exits with a typed diagnostic, redacted details, and suggested setup command or environment variable
- **中文** 当 agent command configuration 缺少 live mode 必需的 model profile 或 credential 时，命令必须以 typed diagnostic、脱敏 details 和建议的 setup command 或 environment variable 退出。
