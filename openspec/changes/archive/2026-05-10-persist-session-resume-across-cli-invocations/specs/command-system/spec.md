## MODIFIED Requirements

### Requirement: Agent CLI Commands / Agent CLI 命令

The command system SHALL provide `deepseek run` and `deepseek chat` commands that submit work to runtime through platform contracts and render runtime events without owning model, tool, scheduler, or policy state machines. Under `--live`, these commands SHALL bind a runtime dependency bundle whose `platform`, `workspaceState`, and `codeIntelligence` are backed by the real host platform so model-emitted tool intents resolve against the real filesystem. After a terminal status in text or JSON output, the CLI SHALL surface the session id and a ready-to-paste resume command so users can continue the session on a later invocation. `deepseek session resume` and `deepseek session fork` SHALL read from the same persistent session store so sessions created by earlier CLI invocations are reachable.

command system 必须提供 `deepseek run` 与 `deepseek chat` 命令，通过 platform contracts 向 runtime 提交工作，并渲染 runtime events，不得拥有 model、tool、scheduler 或 policy state machines。在 `--live` 下，这些命令必须绑定一个 runtime 依赖束，其中 `platform`、`workspaceState` 和 `codeIntelligence` 都由真实 host platform 支持，让模型发出的 tool intent 解析到真实文件系统。text 或 JSON 输出出现终态后，CLI 必须呈现 session id 以及可直接复制的 resume 命令，让用户能在后续调用继续会话。`deepseek session resume` 与 `deepseek session fork` 必须读取同一持久化 session store，让前次 CLI 调用创建的会话可被找到。

#### Scenario: Run command submits one task / Run 命令提交一个任务

- **WHEN** a user executes `deepseek run "fix tests"` with valid configuration
- **THEN** the command creates a runtime request with task text, workspace scope, output mode, session options, and cancellation signal, then streams runtime events until the turn reaches a terminal state
- **中文** 当用户以有效配置执行 `deepseek run "fix tests"` 时，该命令必须创建包含 task text、workspace scope、output mode、session options 和 cancellation signal 的 runtime request，并串流 runtime events 直到 turn 达到终态。

#### Scenario: Chat command submits multiple turns / Chat 命令提交多个 turns

- **WHEN** a user executes `deepseek chat`
- **THEN** the command opens a chat prompt loop and submits each user message as a runtime turn using the active session id
- **中文** 当用户执行 `deepseek chat` 时，该命令必须打开 chat prompt loop，并使用 active session id 把每条 user message 提交为 runtime turn。

#### Scenario: Live run reads real files / Live run 读取真实文件

- **WHEN** a user executes `deepseek run --live` and the model emits a `core.file.read` tool intent for a workspace-relative path that exists on the real filesystem
- **THEN** the tool result feedback contains the real file contents from the host filesystem, not a fake-filesystem error
- **中文** 当用户执行 `deepseek run --live`，模型发出针对真实文件系统中存在路径的 `core.file.read` tool intent 时，tool result feedback 必须包含真实 host 文件内容，而不是 fake 文件系统错误。

#### Scenario: Text output surfaces session resume hint / text 输出展示 resume 提示

- **WHEN** `deepseek run --output text` or `deepseek chat --output text` completes a turn under `--live`
- **THEN** after the terminal status line the CLI prints a `[session]` hint containing the literal `deepseek session resume <id>` command that reuses the current session id
- **中文** 当 `deepseek run --output text` 或 `deepseek chat --output text` 在 `--live` 下完成一轮时，CLI 必须在终态状态行之后打印一行 `[session]` 提示，内容是可直接复制的 `deepseek session resume <id>`。

#### Scenario: JSON output includes resume command / JSON 输出包含 resume 命令

- **WHEN** `deepseek run --output json` completes
- **THEN** the final summary object includes a `resumeCommand` string alongside the existing `sessionId`
- **中文** 当 `deepseek run --output json` 完成时，最终 summary 对象必须在既有 `sessionId` 旁边包含 `resumeCommand` 字符串。

#### Scenario: Session commands read persistent store / session 命令读取持久化 store

- **WHEN** a user invokes `deepseek session resume <id>` for a session id written by a prior CLI invocation
- **THEN** the command resolves the session from the on-disk persistent store and returns its events, metadata, and trace context rather than `SESSION_NOT_FOUND`
- **中文** 当用户对前次 CLI 调用写入的 session id 执行 `deepseek session resume <id>` 时，该命令必须从磁盘持久化 store 解析该 session，并返回其 events、metadata 和 trace context，而不是返回 `SESSION_NOT_FOUND`。
