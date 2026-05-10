## ADDED Requirements

### Requirement: Web Access Tools / 网络接入工具

The core coding tools SHALL expose `core.web.fetch` and `core.web.search` capabilities so agents can incorporate external web content within governed constraints. `core.web.fetch` SHALL convert HTML responses into redacted markdown by default and SHALL invoke a summarizer only when the caller opts in. `core.web.search` SHALL stay disabled unless an explicit `WebSearchProvider` is injected via runtime dependencies; when disabled it SHALL return a typed `WEB_SEARCH_UNAVAILABLE` diagnostic rather than attempting network access.

核心工具必须提供 `core.web.fetch` 与 `core.web.search` 两个 capability，使 agent 能在受约束前提下引入外部网页内容。`core.web.fetch` 默认必须把 HTML 响应转换为脱敏 markdown，只在调用方 opt-in 时调用摘要器。`core.web.search` 默认必须保持 disabled，除非通过 runtime dependencies 注入 `WebSearchProvider`；disabled 状态必须返回 typed `WEB_SEARCH_UNAVAILABLE` diagnostic，而不是发起网络请求。

#### Scenario: Fetch returns markdown without summarization by default / fetch 默认返回 markdown

- **WHEN** `core.web.fetch` is invoked without `summarize: true`
- **THEN** the tool fetches the URL via HTTP(S) only, follows at most 5 redirects, truncates the response body at 10 MB, strips `<script>` / `<style>` / `<iframe>`, returns the converted markdown plus response metadata, and does not call the model gateway
- **中文** 当 `core.web.fetch` 被调用且未设 `summarize: true` 时，必须仅通过 HTTP(S) 请求 URL、最多 follow 5 次 redirect、响应体 > 10MB 截断、剥离 `<script>` / `<style>` / `<iframe>`，返回转换后的 markdown 与响应 metadata，并不得调用 model gateway。

#### Scenario: Fetch summarization is explicit / fetch 摘要需显式 opt-in

- **WHEN** `core.web.fetch` is invoked with `summarize: true` and a non-empty `prompt`
- **THEN** the tool passes the extracted markdown and prompt to the configured model gateway with a bounded token budget and returns the structured summary alongside the source metadata
- **中文** 当 `core.web.fetch` 被调用且 `summarize: true` 并带非空 `prompt` 时，工具必须把抽取的 markdown 和 prompt 交给已配置的 model gateway，使用有界 token 预算，返回结构化摘要与来源 metadata。

#### Scenario: Search without provider reports unavailable / 未注入 provider 时报告不可用

- **WHEN** `core.web.search` is invoked and no `WebSearchProvider` is registered in runtime dependencies
- **THEN** the tool returns a typed `WEB_SEARCH_UNAVAILABLE` diagnostic listing supported provider names and does not perform any outbound network request
- **中文** 当 `core.web.search` 被调用且 runtime dependencies 未注册 `WebSearchProvider` 时，工具必须返回 typed `WEB_SEARCH_UNAVAILABLE` diagnostic 并列出支持的 provider 名称，且不得发起任何外部网络请求。

### Requirement: Sub-Agent Spawn Tool / 子 Agent 派生工具

The core coding tools SHALL expose `core.agent.spawn` to run a governed sub-agent in a forked session with a bounded tool projection, so that delegated research or bulk tasks do not pollute the parent agent's context. The returned result SHALL summarize the sub-agent's terminal status, assistant text, iterations, and child session id, while the sub-agent's intermediate events SHALL remain isolated to the forked session.

核心工具必须提供 `core.agent.spawn`，在 fork 出的子 session 中运行受治理的子 agent，并限定工具投影边界，使委派的调研或批量任务不污染父 agent 上下文。返回结果必须汇总子 agent 的终态、assistantText、iterations 与 childSessionId；子 agent 的中间事件必须隔离在 fork session 内。

#### Scenario: Spawn defaults to read-only projection / 默认只读投影

- **WHEN** `core.agent.spawn` is invoked without specifying `toolProjection`
- **THEN** the sub-agent loop runs with `toolProjection: "read-only"` regardless of the parent's projection, preventing accidental write side-effects during delegated work
- **中文** 当 `core.agent.spawn` 被调用且未指定 `toolProjection` 时，子 agent loop 必须以 `toolProjection: "read-only"` 运行，无论父 agent 投影如何，以免在委派工作中意外写入副作用。

#### Scenario: Sub-agent events isolated to forked session / 子 agent 事件隔离

- **WHEN** a sub-agent emits `agent.loop.started`, `model.delta`, `agent.loop.completed`, or any other runtime event
- **THEN** those events are appended to the forked child session's event log only; the parent session bus SHALL NOT observe them; the parent agent SHALL receive only a structured `AgentSpawnResult` summarizing the terminal outcome
- **中文** 当子 agent 发出 `agent.loop.started`、`model.delta`、`agent.loop.completed` 等任何 runtime event 时，必须仅追加到 fork 出的子 session 事件日志；父 session bus 必须看不到这些事件；父 agent 仅能收到结构化 `AgentSpawnResult` 汇总终态。

### Requirement: Background Shell Tools / 后台 Shell 工具

The core coding tools SHALL support `core.shell.run` with an optional `runInBackground` flag, and expose companion `core.shell.output` and `core.shell.kill` capabilities, backed by a runtime-injected `BackgroundTaskManager`. Background tasks SHALL write stdout and stderr to workspace-scoped files addressable by `taskId`, and the CLI SHALL terminate any surviving tasks on shutdown.

核心工具必须支持 `core.shell.run` 的 `runInBackground` 可选 flag，并提供 `core.shell.output` 与 `core.shell.kill` 配套 capability，由 runtime 注入 `BackgroundTaskManager` 承载。后台任务必须把 stdout/stderr 写到以 `taskId` 寻址的工作区内文件，CLI 关闭时必须终止所有存活任务。

#### Scenario: Background shell returns task id immediately / 后台 shell 立即返回 taskId

- **WHEN** `core.shell.run` is invoked with `runInBackground: true`
- **THEN** the tool returns `{ taskId, status: "running" }` without waiting for the process to complete, and subsequent `core.shell.output` calls for that `taskId` return accumulated stdout and stderr plus a `done` flag and `exitCode` once the process terminates
- **中文** 当 `core.shell.run` 被调用且 `runInBackground: true` 时，工具必须立即返回 `{ taskId, status: "running" }` 而不等待进程结束；后续对该 `taskId` 调用 `core.shell.output` 必须返回累计的 stdout/stderr，进程结束后带 `done` 标记与 `exitCode`。

#### Scenario: Kill terminates task by id / 按 id 终止任务

- **WHEN** `core.shell.kill` is invoked with a live `taskId`
- **THEN** the tool sends `SIGTERM` to the subprocess, waits up to 2 seconds for graceful exit, and escalates to `SIGKILL` if still alive; the subsequent `core.shell.output` for that `taskId` reports `done: true` with the observed `exitCode`
- **中文** 当 `core.shell.kill` 被调用且 `taskId` 对应任务存活时，工具必须发送 `SIGTERM`、等待至多 2 秒优雅退出、仍存活则发 `SIGKILL`；随后对该 `taskId` 的 `core.shell.output` 必须报告 `done: true` 与观察到的 `exitCode`。

#### Scenario: CLI shutdown disposes background tasks / CLI 退出时清理后台任务

- **WHEN** the CLI process exits after running one or more background tasks
- **THEN** the runtime SHALL call `backgroundTasks.disposeAll()`, which sends `SIGTERM` followed by `SIGKILL` (2 s grace) to every surviving task so no orphan processes remain
- **中文** 当 CLI 在运行过一个或多个后台任务后退出时，runtime 必须调 `backgroundTasks.disposeAll()`，对所有存活任务发 `SIGTERM`、2 秒后 `SIGKILL`，不留孤儿进程。

## MODIFIED Requirements

### Requirement: Semantic Search And Glob Tools / 语义化搜索与 Glob 工具

The core coding tools SHALL expose typed semantic search and glob capabilities that operate on the governed workspace scope. Search tools SHALL support ripgrep-style options including case-insensitive matching, context lines (`-C`), multiline patterns, glob filters, and explicit output modes (`content` / `files_with_matches` / `count`), while preserving the existing required parameters and default behavior. Glob tools SHALL sort matches by modification time (descending) by default and accept `**`-style recursive patterns.

核心工具必须暴露 typed 语义搜索与 glob capability，在受治理的工作区范围内运行。搜索工具必须支持 ripgrep 风格选项，包括大小写不敏感、上下文行（`-C`）、multiline 模式、glob 过滤、显式 output 模式（`content` / `files_with_matches` / `count`），并保留原有必选参数与默认行为。Glob 工具默认必须按修改时间降序排序匹配，并接受 `**` 风格递归 pattern。

#### Scenario: Default search returns file paths with redaction / 默认搜索返回带脱敏的文件路径

- **WHEN** the search tool is invoked with only a `pattern`
- **THEN** it returns the list of matching files with redaction metadata and no surprising content inlining
- **中文** 当搜索工具仅带 `pattern` 被调用时，必须返回匹配的文件路径列表，带 redaction metadata，且不意外内联文件内容。

#### Scenario: Context lines expose surrounding matches / 上下文行暴露匹配周围

- **WHEN** the search tool is invoked with `contextLines: n` and `outputMode: "content"`
- **THEN** each match includes up to `n` lines before and after the matching line, separated by a deterministic boundary, without exceeding the configured byte cap
- **中文** 当搜索工具以 `contextLines: n` 与 `outputMode: "content"` 被调用时，每次命中必须包含前后最多 `n` 行，用确定性分隔标识，且不超过配置的字节上限。

#### Scenario: Multiline matching requires explicit opt-in / 多行匹配需显式开启

- **WHEN** the search tool is invoked with `multiline: true`
- **THEN** patterns may match across line boundaries; otherwise patterns match within a single line as today
- **中文** 当搜索工具以 `multiline: true` 被调用时，pattern 可跨行匹配；否则按今天的单行匹配行为。

#### Scenario: Glob filter restricts file set / glob 过滤限定文件集

- **WHEN** the search tool is invoked with `glob: "*.ts"` (or similar)
- **THEN** only files matching the glob participate in the search, independent of `pattern`
- **中文** 当搜索工具以 `glob: "*.ts"`（或类似）被调用时，必须只让匹配该 glob 的文件参与搜索，与 `pattern` 无关。

### Requirement: File Read And Listing Tools / 文件读取与列表工具

The core coding tools SHALL expose typed file read and listing capabilities scoped to the governed workspace. Read tools SHALL support `offset` and `limit` parameters for large files, return a typed `{ kind: "image", mime, base64 }` shape for image MIME types under a configurable size cap, and (where a PDF reader is injected) accept an explicit `pages: "M-N"` range to extract text from the first 20 pages. Existing callers that omit these parameters SHALL continue to receive the current behavior.

核心工具必须暴露 typed 文件读取与列表 capability，范围限定在受治理工作区。读取工具必须支持 `offset` 与 `limit` 参数用于大文件，对图片 MIME 在可配置大小上限内返回 typed `{ kind: "image", mime, base64 }`，并且（在注入 PDF reader 时）接受显式 `pages: "M-N"` 范围从前 20 页抽取文字。既有不传这些参数的调用方必须保留今天行为。

#### Scenario: Read returns bounded content with offset / 支持 offset/limit

- **WHEN** the read tool is invoked with `offset: k` and `limit: n`
- **THEN** the tool returns at most `n` lines starting from line `k`, preserving redaction, and the result metadata records the `nextOffset`
- **中文** 当读取工具以 `offset: k` 与 `limit: n` 被调用时，必须返回从第 `k` 行开始的最多 `n` 行，保留 redaction，结果 metadata 记录 `nextOffset`。

#### Scenario: Read returns base64 for image MIME / 图片返回 base64

- **WHEN** the read tool is invoked for a path whose MIME is `image/png`, `image/jpeg`, or `image/gif` and whose size is within 10 MB
- **THEN** the result is `{ kind: "image", mime, base64, sizeBytes }` with no textual body
- **中文** 当读取工具访问 MIME 为 `image/png`、`image/jpeg` 或 `image/gif` 且大小 ≤ 10MB 的路径时，结果必须是 `{ kind: "image", mime, base64, sizeBytes }`，不含文本主体。

#### Scenario: List sorts by modification time / 列表按 mtime 排序

- **WHEN** the list tool returns multiple matches
- **THEN** results are sorted by file modification time in descending order (most recent first) unless an explicit `sort` parameter overrides
- **中文** 当列表工具返回多条匹配时，必须按文件修改时间降序排序（最新在前），除非 `sort` 参数显式覆盖。
