# core-coding-tools Specification

## Purpose

Defines the built-in governed coding tools that let DeepSeek CLI operate on a repository through platform, policy, scheduling, replay, and host-neutral runtime boundaries.

定义内置受治理 coding tools，使 DeepSeek CLI 能通过 platform、policy、scheduling、replay 和 host-neutral runtime 边界操作仓库。

## Requirements

### Requirement: Built-In Core Coding Tool Set / 内置核心 Coding Tool 集合

The system SHALL provide built-in governed coding tools for file read, file write, exact edit, glob/list files, semantic search, shell/process execution, git status, git diff, test command execution, and todo/plan state.

系统必须提供内置受治理 coding tools，覆盖 file read、file write、exact edit、glob/list files、semantic search、shell/process execution、git status、git diff、test command execution 和 todo/plan state。

#### Scenario: Register core tools / 注册核心工具

- **WHEN** runtime dependencies register built-in coding tools
- **THEN** each tool has a stable capability id, version, input schema, output schema, side-effect level, permissions, timeout defaults, replay policy, and host/model projection metadata
- **中文** 当 runtime dependencies 注册内置 coding tools 时，每个工具必须具备稳定 capability id、version、input schema、output schema、side-effect level、permissions、timeout defaults、replay policy 和 host/model projection metadata。

#### Scenario: Disabled tool is not projected / 禁用工具不投影

- **WHEN** a core coding tool is disabled by policy or compatibility metadata
- **THEN** the model-visible tool projection excludes it and executable lookup cannot run it
- **中文** 当 core coding tool 被 policy 或 compatibility metadata 禁用时，model-visible tool projection 必须排除它，executable lookup 也不能运行它。

### Requirement: File Read And Listing Tools / 文件读取与列表工具

File read and listing tools SHALL resolve all paths through the platform workspace path contract, stay inside governed roots, bound output size, and return structured evidence.

文件读取与列表工具必须通过 platform workspace path contract 解析所有路径，保持在 governed roots 内，限制输出大小，并返回 structured evidence。

#### Scenario: Read file inside workspace / 读取 workspace 内文件

- **WHEN** a read tool receives a workspace-relative path inside the governed root
- **THEN** it returns content preview, byte count, line count, path metadata, redaction metadata, and replay-safe evidence
- **中文** 当 read tool 收到 governed root 内的 workspace-relative path 时，必须返回 content preview、byte count、line count、path metadata、redaction metadata 和 replay-safe evidence。

#### Scenario: Reject path escape / 拒绝路径逃逸

- **WHEN** a read, list, write, or edit tool receives traversal, home-relative, ambiguous drive-relative, or outside-root path input
- **THEN** it returns a typed diagnostic and does not read or mutate the target
- **中文** 当 read、list、write 或 edit tool 收到 traversal、home-relative、ambiguous drive-relative 或 outside-root path input 时，必须返回 typed diagnostic，且不得读取或修改目标。

### Requirement: File Write And Edit Transactions / 文件写入与编辑事务

Write and edit tools SHALL represent mutations as workspace edit transactions with preconditions, affected paths, rollback metadata, policy context, and post-edit evidence.

write 和 edit tools 必须把修改表示为 workspace edit transactions，包含 preconditions、affected paths、rollback metadata、policy context 和 post-edit evidence。

#### Scenario: Exact edit succeeds / 精确编辑成功

- **WHEN** an edit tool receives target path, expected old text, and replacement text and the expected text appears exactly once
- **THEN** it applies the edit, records pre-edit snapshot metadata, records rollback metadata, returns changed ranges, and emits replay-safe evidence
- **中文** 当 edit tool 收到 target path、expected old text 和 replacement text，且 expected text 恰好出现一次时，必须应用编辑、记录 pre-edit snapshot metadata、记录 rollback metadata、返回 changed ranges，并发出 replay-safe evidence。

#### Scenario: Edit precondition fails / 编辑前置条件失败

- **WHEN** expected old text is missing or appears more than once
- **THEN** the edit tool rejects without mutating the file and returns diagnostics explaining the precondition failure
- **中文** 当 expected old text 缺失或出现多次时，edit tool 必须拒绝且不修改文件，并返回说明 precondition failure 的 diagnostics。

### Requirement: Semantic Search And Glob Tools / 语义化搜索与 Glob 工具

Search and glob tools SHALL use platform semantic providers and SHALL expose provider metadata, fallback chain, timeout policy, and degradation diagnostics in results.

search 和 glob tools 必须使用 platform semantic providers，并在结果中暴露 provider metadata、fallback chain、timeout policy 和 degradation diagnostics。

#### Scenario: Search reports provider metadata / 搜索报告 provider metadata

- **WHEN** text search runs
- **THEN** each result or result summary includes selected provider, fallback chain, timeout metadata, degraded reasons when present, matched path, line number, and bounded text preview
- **中文** 当 text search 运行时，每个结果或结果摘要必须包含 selected provider、fallback chain、timeout metadata、适用时的 degraded reasons、matched path、line number 和 bounded text preview。

#### Scenario: Glob uses deterministic listing / Glob 使用确定性列表

- **WHEN** glob/list files runs in tests
- **THEN** deterministic fake platform fixtures produce stable ordering and stable path metadata across fake macOS, Windows, Linux, WSL, CI, and remote host modes
- **中文** 当 glob/list files 在测试中运行时，deterministic fake platform fixtures 必须在 fake macOS、Windows、Linux、WSL、CI 和 remote host modes 下产生稳定排序和稳定 path metadata。

### Requirement: Shell Process And Test Command Tools / Shell Process 与测试命令工具

Shell/process and test command tools SHALL declare platform provider context, cwd, argv or shell profile, timeout, resource locks, environment scope, policy metadata, and redacted output limits before scheduling.

shell/process 和 test command tools 必须在 scheduling 前声明 platform provider context、cwd、argv 或 shell profile、timeout、resource locks、environment scope、policy metadata 和脱敏 output limits。

#### Scenario: Process execution requires policy / 进程执行要求策略

- **WHEN** a shell/process or test command tool is invoked
- **THEN** policy receives side effect, command summary, cwd, shell profile when any, process provider, timeout, and resource locks before scheduler submission
- **中文** 当 shell/process 或 test command tool 被调用时，policy 必须在 scheduler submission 前收到 side effect、command summary、cwd、适用时的 shell profile、process provider、timeout 和 resource locks。

#### Scenario: Remote no-shell fails closed / 远程无 shell 安全失败

- **WHEN** shell syntax is requested on a remote/no-local-shell host
- **THEN** the tool returns a typed platform unavailable diagnostic and no command is scheduled
- **中文** 当 remote/no-local-shell host 请求 shell syntax 时，工具必须返回 typed platform unavailable diagnostic，且不调度任何命令。

### Requirement: Git Evidence Tools / Git 证据工具

Git status and diff tools SHALL be read-only semantic tools that collect repository evidence through governed platform process semantics or deterministic fallbacks.

git status 和 diff tools 必须是 read-only semantic tools，通过受治理 platform process semantics 或 deterministic fallbacks 收集 repository evidence。

#### Scenario: Git status summarizes repository state / Git status 汇总仓库状态

- **WHEN** git status runs in a repository
- **THEN** it returns branch metadata when available, changed file summaries, provider metadata, diagnostics, and bounded output evidence
- **中文** 当 git status 在仓库中运行时，必须返回可用的 branch metadata、changed file summaries、provider metadata、diagnostics 和 bounded output evidence。

#### Scenario: Git unavailable returns diagnostics / Git 不可用返回诊断

- **WHEN** git is unavailable or the workspace is not a repository
- **THEN** git tools return structured diagnostics instead of shell-specific failures
- **中文** 当 git 不可用或 workspace 不是仓库时，git tools 必须返回 structured diagnostics，而不是 shell-specific failures。

### Requirement: Todo And Plan Tool / Todo 与计划工具

The todo/plan tool SHALL store structured task state as replayable runtime evidence and SHALL not create a host-owned state machine.

todo/plan tool 必须把 structured task state 存储为可 replay 的 runtime evidence，且不得创建 host-owned state machine。

#### Scenario: Update plan state / 更新计划状态

- **WHEN** the todo/plan tool receives a list of tasks and statuses
- **THEN** it validates statuses, records a replay-safe plan snapshot, and emits a runtime-visible output
- **中文** 当 todo/plan tool 收到 tasks 与 statuses 列表时，必须校验 statuses、记录 replay-safe plan snapshot，并发出 runtime-visible output。

### Requirement: Tool Result Evidence / 工具结果证据

Every core coding tool result SHALL use a structured evidence object with redaction metadata, bounded previews, affected paths, diagnostics, provider metadata, and replay metadata.

每个核心 coding tool result 必须使用 structured evidence object，包含 redaction metadata、bounded previews、affected paths、diagnostics、provider metadata 和 replay metadata。

#### Scenario: Large output is bounded / 大输出有边界

- **WHEN** a file read, search, shell, git, or test command result exceeds configured limits
- **THEN** the tool returns a preview, truncation metadata, digest or byte counts, and redaction metadata rather than unbounded raw output
- **中文** 当 file read、search、shell、git 或 test command result 超过配置限制时，工具必须返回 preview、truncation metadata、digest 或 byte counts 和 redaction metadata，而不是无边界 raw output。
