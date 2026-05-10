## MODIFIED Requirements

### Requirement: Agent CLI Commands / Agent CLI 命令

The command system SHALL provide `deepseek run` and `deepseek chat` commands that submit work to runtime through platform contracts and render runtime events without owning model, tool, scheduler, or policy state machines. Under `--live`, these commands SHALL bind a runtime dependency bundle whose `platform`, `workspaceState`, and `codeIntelligence` are backed by the real host platform so model-emitted tool intents resolve against the real filesystem.

command system 必须提供 `deepseek run` 与 `deepseek chat` 命令，通过 platform contracts 向 runtime 提交工作，并渲染 runtime events，不得拥有 model、tool、scheduler 或 policy state machines。在 `--live` 下，这些命令必须绑定一个 runtime 依赖束，其中 `platform`、`workspaceState` 和 `codeIntelligence` 都由真实 host platform 支持，让模型发出的 tool intent 解析到真实文件系统。

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

## ADDED Requirements

### Requirement: Live CLI Dependency Factory / Live CLI 依赖 Factory

The CLI (and any future same-process host) SHALL obtain its live runtime dependencies from a single `createLiveCliDependencies` factory that composes a deterministic dependency bundle, then overrides `platform`, `workspaceState`, `codeIntelligence`, and `models` with real-platform implementations. Hosts SHALL NOT rebuild live wiring inline.

CLI（以及未来任何进程内 host）必须通过单一 `createLiveCliDependencies` factory 获取 live runtime 依赖；factory 先组合 deterministic 依赖束，然后用真实平台实现覆盖 `platform`、`workspaceState`、`codeIntelligence` 和 `models`。Host 不得内联重建 live wiring。

#### Scenario: Factory returns platform-overridden bundle / Factory 返回 platform 被覆盖的依赖束

- **WHEN** `createLiveCliDependencies({ workspaceRoot })` is called
- **THEN** the returned `RuntimeDependencies` has `platform`, `workspaceState`, and `codeIntelligence` constructed against a real `NodePlatformRuntime`, while all other keys mirror the deterministic factory
- **中文** 当调用 `createLiveCliDependencies({ workspaceRoot })` 时，返回的 `RuntimeDependencies` 必须让 `platform`、`workspaceState` 和 `codeIntelligence` 基于真实 `NodePlatformRuntime` 构造，其它键与 deterministic factory 一致。

#### Scenario: CLI delegates to factory under --live / CLI 在 --live 下委托到 factory

- **WHEN** `runCli` receives `--live` and calls `createCliAgentRuntime`
- **THEN** runtime construction delegates to `createLiveCliDependencies` so CLI code contains no inline live provider wiring beyond forwarding `workspaceRoot`, credential, and transport options
- **中文** 当 `runCli` 收到 `--live` 并调用 `createCliAgentRuntime` 时，runtime 构造必须委托到 `createLiveCliDependencies`，CLI 代码除了转发 `workspaceRoot`、credential 和 transport 选项外，不得包含内联 live provider wiring。
