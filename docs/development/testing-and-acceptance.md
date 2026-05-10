# Testing And Acceptance / 测试与验收

DeepSeek CLI treats tests as product infrastructure. Every platform guarantee should map to a deterministic test, replay trace, matrix fixture, or explicit acceptance evidence.

DeepSeek CLI 将测试视为产品基础设施。每个系统保证都应映射到确定性测试、replay trace、matrix fixture 或显式验收证据。

## Default Gate / 默认门禁

Run this before committing framework or runtime changes:

提交 framework 或 runtime 变更前运行：

```bash
npm run typecheck
npm run lint
npm test
node scripts/check-boundaries.mjs
```

## Release Or Archive Gate / 发布或归档门禁

For OpenSpec archive, release, or acceptance work:

OpenSpec 归档、发布或验收工作需要运行：

```bash
openspec validate <change-id> --type change --strict
openspec validate --specs --strict
npm run test:contracts
npm run test:integration
npm run test:golden
npm run test:versioning
npm run test:matrix
npm run test:e2e
npm run build:cli
npm run smoke:headless
```

## Test Layers / 测试层

| Layer / 层 | Command / 命令 | What it proves / 证明内容 |
| --- | --- | --- |
| Typecheck / 类型检查 | `npm run typecheck` | Type contracts compile across packages. / 跨包类型契约可编译。 |
| Architecture lint / 架构 lint | `npm run lint` | AST and manifest rules catch boundary bypasses. / AST 与 manifest 规则发现边界绕过。 |
| Boundary check / 边界检查 | `node scripts/check-boundaries.mjs` | Package dependencies obey direction rules. / 包依赖遵守方向规则。 |
| Unit/package tests / 单元与包测试 | `npm test` | Local package behavior and core scenarios. / 包内行为与核心场景。 |
| Contract tests / 契约测试 | `npm run test:contracts` | DTOs, schemas, boundaries, manifests, persisted shapes. / DTO、schema、边界、manifest、持久化形态。 |
| Integration tests / 集成测试 | `npm run test:integration` | Kernel, policy, scheduler, bus, session, capability pipeline. / kernel、policy、scheduler、bus、session、capability 管线。 |
| Golden tests / Golden 测试 | `npm run test:golden` | Replayable trace shape and deterministic evidence. / 可 replay trace 与确定性证据。 |
| Versioning tests / 版本契约测试 | `npm run test:versioning` | Schema version, persisted artifact requirements, and fail-closed unsupported versions. / schema version、持久化产物要求，以及不支持版本的 fail-closed 行为。 |
| Matrix tests / 矩阵测试 | `npm run test:matrix` | Platform and scenario matrix behavior. / 平台与场景矩阵行为。 |
| E2E tests / E2E | `npm run test:e2e` | CLI and VSCode host adapters consume runtime events correctly. / CLI 与 VSCode host 正确消费 runtime events。 |

## Recovery Regression / 恢复回归

Checkpoint and undo changes must cover:

checkpoint 与 undo 变更必须覆盖：

- unit tests for checkpoint creation, restore success, stale rejection, empty undo, and secret-safe evidence. / unit tests 覆盖 checkpoint creation、restore success、stale rejection、empty undo 和 secret-safe evidence。
- contract tests for DTO shape and redaction-safe public checkpoint records. / contract tests 覆盖 DTO shape 和脱敏安全的 public checkpoint records。
- integration tests proving core tools emit checkpoint metadata through runtime events. / integration tests 证明 core tools 通过 runtime events 输出 checkpoint metadata。
- golden tests proving replay traces do not contain raw rollback content. / golden tests 证明 replay traces 不包含 raw rollback content。
- matrix tests proving stale restore rejection is consistent across fake platform modes. / matrix tests 证明 stale restore rejection 在 fake platform modes 中一致。

## Acceptance Evidence / 验收证据

Latest acceptance evidence lives under:

最近一次验收证据位于：

```text
tests/acceptance/latest/
```

Acceptance evidence should record:

验收证据应记录：

- Command executed. / 执行的命令。
- Result summary. / 结果摘要。
- Relevant test count or validation count. / 相关测试数量或校验数量。
- Security or boundary evidence when applicable. / 适用时记录安全或边界证据。

## Live Tests / Live 测试

Live DeepSeek API tests are opt-in. Default CI and local verification must stay deterministic.

DeepSeek live API 测试是可选开关。默认 CI 和本地验证必须保持确定性。

```bash
DEEPSEEK_LIVE_TESTS=1 npm run smoke:live:deepseek
DEEPSEEK_LIVE_AUTH_TESTS=1 npm test -- tests/live/deepseek-auth-live-verification.test.ts
DEEPSEEK_LIVE_AGENT_LOOP_TESTS=1 npm run smoke:live:agent-loop
DEEPSEEK_LIVE_AGENT_TOOL_TESTS=1 npm run smoke:live:agent-tools
```

Never commit `.env` or raw credentials.

不要提交 `.env` 或 raw credential。

## Live Agent Tool Execution / Live Agent 工具执行

The live agent tool loop normalises DeepSeek tool calls, runs preflight
safety checks, executes accepted intents through the runtime kernel, and
sends bounded typed feedback (`success`, `repaired`, `rejected`,
`denied`, `timeout`, `cancelled`, `failed`) back to the model until the
turn completes or a terminal failure is emitted.

Live agent tool loop 会归一化 DeepSeek tool calls、执行 preflight 安全
校验、通过 runtime kernel 执行已接受的 intent，并把有界 typed
feedback 回传模型，直到 turn 完成或产生终态失败。

Safety boundaries / 安全边界:

- Live calls default to `toolProjection: "read-only"`; write, process,
  and network capabilities are hidden from the model until the host
  explicitly opts in. / Live 调用默认 `toolProjection: "read-only"`；
  write/process/network 能力默认不向模型投影，除非 host 显式放开。
- Preflight rejects traversal, home, absolute, drive-relative, null-byte,
  and unknown tool intents before envelope creation. / Preflight 在
  envelope 创建前会拒绝 traversal、home、absolute、drive-relative、null
  byte 和未知工具。
- Every tool outcome produces a redacted `ToolResultFeedback` with a
  bounded preview and trace identifiers; raw executor output stays in
  replay/audit records. / 每个 tool 结果都会产生脱敏的
  `ToolResultFeedback`，包含有界 preview 和 trace 标识；raw 输出保留在
  replay/audit 中。
- Recoverable feedback (`rejected`, `denied`, `repaired`) is sent back
  to the model so it can self-correct; non-recoverable feedback
  (`failed`, `timeout`, `cancelled`) terminates the turn. / 可恢复的
  feedback 会回传模型让它自我修正；不可恢复的 feedback 终结本轮。

Commands / 命令:

```bash
npm run smoke:headless
npx tsx src/apps/cli/src/index.ts tools-smoke --output jsonl
npm run smoke:live:e2e
DEEPSEEK_LIVE_AGENT_TOOL_TESTS=1 npm run smoke:live:agent-tools
```

`smoke:live:e2e` runs a real-filesystem integration test through
`createLiveCliDependencies` against `tests/fixtures/fake-workspace/`
using deterministic models, so contributors can reproduce a live
platform tool turn without credentials. / `smoke:live:e2e` 通过
`createLiveCliDependencies` 加 deterministic 模型在 `tests/fixtures/fake-workspace/`
上跑真实文件系统集成测试，贡献者无需凭证即可复现 live 平台工具回合。

Live dependency contract / Live 依赖契约:

- `--live` swaps `platform`, `workspaceState`, `codeIntelligence`,
  and `models` for real-host implementations. All other dependencies
  (bus, workflow, scheduler, sessions, policy, sandbox, usage,
  context, hooks, skills, MCP, plugins, capability registry,
  observability, regression) stay deterministic to keep event
  ordering and replay stable. / `--live` 会替换 `platform`、
  `workspaceState`、`codeIntelligence` 和 `models` 为真实 host 实现，
  其它依赖保持 deterministic 以便事件顺序和回放稳定。
- `createLiveCliDependencies({ workspaceRoot, credentials,
  transport, timeoutMs })` in `@deepseek/testing-regression` is the
  single factory both CLI and future same-process hosts import. /
  `@deepseek/testing-regression` 中的 `createLiveCliDependencies` 是
  CLI 与未来进程内 host 共用的唯一 factory。

Thinking-mode continuation / Thinking 模式继续:

- DeepSeek thinking-mode responses stream `reasoning_content`
  chunks before tool calls. The runtime accumulates them per
  iteration and attaches them to the `assistant` chat message
  that records the tool call via `reasoningContent`, so the
  continuation request includes `reasoning_content` as DeepSeek
  requires. / DeepSeek thinking 模式响应会在 tool call 之前流式
  发送 `reasoning_content` chunk。runtime 按 iteration 累积并附加
  到记录 tool call 的 `assistant` chat message 的 `reasoningContent`
  字段，让 continuation 请求按 DeepSeek 要求携带 `reasoning_content`。
- A typed `model.reasoning.persisted` runtime event fires exactly
  once per iteration that persists reasoning. The event carries
  iteration number, byte length, and redaction tag, but never the
  reasoning text. / runtime 每次持久化 reasoning 时发出唯一的
  `model.reasoning.persisted` typed event，字段为 iteration、byte
  length 和 redaction tag，不含 reasoning 原文。

Text-mode streaming contract / text 模式流式契约:

- In text output mode the CLI coalesces streaming events into
  per-iteration lines: consecutive `model.delta` chunks form one
  inline growing line, and consecutive `model.reasoning` chunks
  share a single `[reasoning]` indicator line (the prefix is
  emitted with a trailing space at runtime). Any non-streaming
  event (`model.tool.intent`, `capability.completed`, etc.) closes
  the open streaming line with a newline before rendering its own
  status. JSON and JSONL modes keep one-event-per-line semantics,
  byte-identical to before. / text 输出模式下 CLI 把流式事件合并
  为每 iteration 一行：连续 `model.delta` chunk 拼成一条 inline
  递增行，连续 `model.reasoning` chunk 共用一个 `[reasoning]` 指示
  行（运行时在该前缀后带一个空格）。任何非流式事件
  （`model.tool.intent`、`capability.completed` 等）在渲染自身状态
  前先用一次换行关闭打开的流式行。JSON 与 JSONL 模式保持一事件
  一行语义，与之前字节一致。

Troubleshooting / 排障:

- `skipped`: gate env var missing, or no credentials in `.env` / 环境
  变量没开，或 `.env` 缺凭证。
- `TOOL_INTENT_*_REJECTED`: preflight blocked the call; inspect
  diagnostics inside the `model.tool.rejected` event. / preflight 拒绝
  了这次调用，检查 `model.tool.rejected` 事件里的 diagnostics。
- `KERNEL_POLICY_DENIED`: policy profile does not allow the side
  effect; raise `toolProjection` or configure policy. / policy profile
  不允许此 side effect；提升 `toolProjection` 或配置 policy。

Session persistence / 会话持久化:

- Live CLI runs persist session events to a per-user directory:
  POSIX `~/.deepseek/sessions`, Windows
  `%APPDATA%/deepseek/sessions`, XDG `$XDG_DATA_HOME/deepseek/sessions`
  when set. The deterministic runtime dependencies still use the
  in-memory store, so unit/contract tests stay hermetic. / Live CLI
  会把 session 事件持久化到每用户目录：POSIX
  `~/.deepseek/sessions`、Windows `%APPDATA%/deepseek/sessions`、有
  `XDG_DATA_HOME` 时落到 `$XDG_DATA_HOME/deepseek/sessions`。确定性
  依赖仍然用 in-memory store，单测与契约测试保持隔离。
- After a text-mode `deepseek run` or `deepseek chat` finishes, the
  CLI prints `[session] deepseek session resume <id>` so you can
  copy-paste to continue later. JSON summaries include the same
  command as a `resumeCommand` field. JSONL output keeps raw events
  only. / text 模式下 `deepseek run` 或 `deepseek chat` 结束时会打印
  `[session] deepseek session resume <id>`，可直接复制继续；JSON 摘要
  通过 `resumeCommand` 字段给出同一命令；JSONL 仍是原始事件流。
- `deepseek session resume <id>` and `deepseek session fork <id>`
  read from the same per-user directory, so they work across CLI
  invocations without any extra flag. To wipe history, remove the
  directory (`rm -rf ~/.deepseek/sessions`, or delete the Windows
  folder in Explorer). / `deepseek session resume <id>` 与
  `deepseek session fork <id>` 读同一个每用户目录，跨进程调用无需额外
  参数。如需清空历史，删除该目录即可
  （`rm -rf ~/.deepseek/sessions`，Windows 可在资源管理器里删掉对应
  文件夹）。

Chat slash commands / 聊天斜杠命令:

- The chat REPL resolves `/help`, `/exit`, `/quit`, `/clear`,
  `/cancel`, plus CLI-local `/cost` and `/model` before any input is
  sent to the model. Unknown slash inputs print
  `[chat] unknown command /x` and stay in the REPL; they never reach
  the provider. / chat REPL 先在本地解析 `/help`、`/exit`、`/quit`、
  `/clear`、`/cancel` 以及 CLI 本地 `/cost`、`/model`，再决定是否送
  model。未知斜杠输入会打印 `[chat] unknown command /x`，不触达 provider。
- `/cost` sums `usage.updated` events emitted during the current chat
  session. `/model` prints the active profile. Neither command mutates
  runtime, session, or kernel state. / `/cost` 汇总当前 chat session
  的 `usage.updated` 事件；`/model` 打印活跃 profile。两者都不改
  runtime、session 或 kernel 状态。
- Ctrl+C once during a streaming turn aborts the in-flight model /
  tool call through an `AbortSignal` plumbed into `runAgentLoop`;
  the runtime emits `agent.loop.cancelled` as the terminal event and
  the REPL keeps running. A second Ctrl+C within 2 seconds (or a
  Ctrl+C while idle) exits with the usual resume hint. `/cancel`
  follows the same path as Ctrl+C. / chat 流式输出中按一次 Ctrl+C，
  通过 `AbortSignal` 取消当前 model/tool 调用，runtime 发
  `agent.loop.cancelled` 作为终态事件，REPL 继续；2 秒内再按 Ctrl+C
  （或空闲时按 Ctrl+C）带 resume 提示退出。`/cancel` 与 Ctrl+C 同路径。
- Regression cover: `tests/contracts/chat-slash-commands.test.ts`
  exercises each command with a deterministic runtime;
  `tests/integration/chat-sigint-cancel.test.ts` drives
  `process.emit("SIGINT")` and asserts the cancelled event lands.
  / 回归用例：`tests/contracts/chat-slash-commands.test.ts` 用
  deterministic runtime 跑每个命令；
  `tests/integration/chat-sigint-cancel.test.ts` 触发
  `process.emit("SIGINT")` 并校验取消事件。

Built-in tools / 内建工具集:

- 全部 15 个 capability 都通过 `@deepseek/core-coding-tools` 注册，每个
  工具独立一个 `tools/<tool-name>/index.ts`，共用逻辑（manifest builder、
  bounded text、edit transaction）在 `shared/`。跨平台 I/O 一律走
  `@deepseek/platform-abstraction`（`readFile`、`findFiles`、`statFile`、
  `searchText`、`runProcess`、`spawnMcpServer`、`httpFetch`、
  `readBinaryFile`），tool 层只收集输入、调 platform、包装成 typed
  evidence。The 15 capabilities each live in their own
  `tools/<tool-name>/index.ts` folder; cross-platform I/O goes
  exclusively through `@deepseek/platform-abstraction` so tools just
  gather inputs, call the platform, and wrap the typed evidence.
- 工具矩阵：file.read / file.write / file.edit / file.list /
  search.text / shell.run / shell.output / shell.kill / git.status /
  git.diff / test.run / todo.plan / web.fetch / web.search /
  agent.spawn。最后三个需要显式的依赖注入：web.fetch 可由
  `RuntimeDependencies.webFetch` 提供自定义 provider（缺省走 platform
  的 `httpFetch` + HTML→markdown），web.search 没注册时返回 typed
  `WEB_SEARCH_UNAVAILABLE`，agent.spawn 依赖 runtime 构造的
  `createAgentSpawner(deps, kernel, workspaceRoot)` 注入。Tool
  matrix: the last three require explicit dependency injection —
  `web.fetch` uses `RuntimeDependencies.webFetch` when set otherwise
  falls back to the platform's `httpFetch` + local HTML→markdown;
  `web.search` returns `WEB_SEARCH_UNAVAILABLE` without a provider;
  `agent.spawn` requires `createAgentSpawner(deps, kernel,
  workspaceRoot)` from `@deepseek/runtime`.
- 后台 shell：`shell.run` 带 `runInBackground: true` 时通过
  `RuntimeDependencies.backgroundTasks`（`NodeBackgroundTaskManager`
  实现基于 `child_process.spawn`，fake 实现在 testing-regression 里）
  启动子进程并立即返回 `taskId`；之后 `shell.output` 按 offset 拉
  stdout/stderr，`shell.kill` 发 SIGTERM→2s→SIGKILL。CLI 退出时
  runtime 负责 `disposeAll()`。Background shell routes through
  `backgroundTasks` — Node impl spawns a child process and returns a
  `taskId`; `shell.output` polls stdout/stderr at an offset and
  `shell.kill` drains via SIGTERM→SIGKILL. CLI shutdown calls
  `disposeAll`.
- Grep/Glob/Read 精细化：`search.text` 新增 `contextLines`、
  `multiline`、`glob`、`caseInsensitive`、`outputMode`（默认
  `files_with_matches`）；`file.list` 默认按 mtime 降序，可 `sort:
  "alpha"` 切回字母序；`file.read` 新增 `offset`/`limit` 切片、
  图片（png/jpeg/gif/webp）返回 `{kind:"image",mime,base64}`，PDF 返回
  `PDF_READER_UNAVAILABLE` 直到注入 reader。
- 回归用例：`tests/contracts/web-tools.test.ts`、
  `tests/contracts/grep-glob-read-polish.test.ts`、
  `tests/contracts/background-shell.test.ts`、
  `tests/contracts/agent-spawn.test.ts`。

Real MCP transport / 真实 MCP 通道:

- 默认行为不变：未 opt-in 时，stdio/HTTP/WebSocket/IDE 传输一律返回
  `MCP_TRANSPORT_UNAVAILABLE`，契约测试继续按现有 fail-closed 语义
  通过。Default behavior is unchanged: without opt-in, stdio/HTTP/
  WebSocket/IDE transports still return `MCP_TRANSPORT_UNAVAILABLE`;
  the existing fail-closed contract tests continue to pass.
- Opt-in 方式两种：环境变量 `MCP_REAL_TRANSPORT=1`，或 CLI flag
  `--enable-real-mcp`。可以对等使用；CLI flag 优先级高。
  Opt-in is via `MCP_REAL_TRANSPORT=1` or the CLI `--enable-real-mcp`
  flag (the flag wins when both are set).
- 新增 `deepseek mcp test <manifest.json>` 子命令：读取本地 manifest，
  按 opt-in 状态决定是否注册 stdio 真实 transport，随后 `connect` →
  `listTools` →（可选）`callTool`，按 text/JSON 输出。
  The new `deepseek mcp test <manifest.json>` subcommand reads a
  local manifest, optionally registers the real transport, connects,
  lists tools, optionally calls a tool, and prints text or JSON.
- 测试 fixture：`scripts/mcp-echo-server.mjs` 是一个 ~80 行手写 JSON-RPC
  echo server，提供 `initialize / tools/list / tools/call (echo)
  / shutdown`。`tests/contracts/mcp-stdio-client.test.ts` 直接用
  `child_process.spawn` 启动它跑协议；
  `tests/integration/mcp-real-transport-opt-in.test.ts` 走 CLI 路径
  比较 opt-in 前后行为。Test fixture `scripts/mcp-echo-server.mjs` is
  a tiny hand-rolled JSON-RPC echo server; the contract test drives
  `StdioMcpClient` directly, while the integration test drives the
  CLI subcommand in both off and on modes.
- 连接生产 MCP server（filesystem、git、brave-search、github 等）：
  把 manifest 的 `transport.command` 设为 `npx`、`transport.metadata.args`
  设为 `["-y", "@modelcontextprotocol/server-filesystem", "/path"]` 之
  类即可。To connect an ecosystem server, point
  `transport.command` at `npx` and `transport.metadata.args` at
  `["-y", "@modelcontextprotocol/server-<name>", ...]`.
- 安全模型：子进程参数走数组（无 shell expansion）；每次请求超时继承
  manifest `timeoutMs`；gateway `disposeAll()` 发 JSON-RPC `shutdown`
  通知 → `SIGTERM` → 2s 后 `SIGKILL`。Subprocess args are passed as an
  array (no shell expansion); per-request timeout follows manifest
  `timeoutMs`; `gateway.disposeAll()` sends the JSON-RPC `shutdown`
  notification, then `SIGTERM`, then `SIGKILL` after 2 s.
