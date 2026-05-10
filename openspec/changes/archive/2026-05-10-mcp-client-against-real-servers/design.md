## Context

MCP 规范用 JSON-RPC 2.0 over stdio 做 transport。client 向 server 的 stdin 写一行 JSON-RPC（`\n` 结尾），从 stdout 读一行。生命周期是 `initialize` → 各种调用 → `shutdown`。协议简单到可以 100 行手写完成，且手写避免拉 `@modelcontextprotocol/sdk` 依赖（减少供应链风险、不影响打包体积）。

MCP 已有参考实现生态：`@modelcontextprotocol/server-filesystem`、`server-git`、`server-brave-search`、`server-github` 等。这些是标准 Node CLI 包，`npx @modelcontextprotocol/server-filesystem <path>` 就能启动一个 stdio server。CLI 只要能连上 stdio 就能接入整个 MCP 生态。

MCP speaks JSON-RPC 2.0 over stdio with newline framing; lifecycle is `initialize` → operations → `shutdown`. The protocol is compact enough to implement in ~100 lines by hand, avoiding a dependency on `@modelcontextprotocol/sdk`. The existing MCP server ecosystem (filesystem, git, brave-search, github, etc.) is distributed as standard Node CLI packages, so `npx <server>` yields a working stdio endpoint; wiring stdio is the one gate between us and the ecosystem.

## Goals / Non-Goals

**Goals:**

- 可以启动一个本地 stdio MCP server（比如自带的 echo server 或 `@modelcontextprotocol/server-filesystem`），列工具、调用工具、读资源、关闭。
- 默认关闭，满足现有「v1 fail closed」规范。
- 只暴露显式 opt-in：`MCP_REAL_TRANSPORT=1` 环境变量或 `--enable-real-mcp` CLI flag；programmatic 用户通过 `gateway.registerRealTransport()` 注入。
- stdio 子进程有超时（继承 manifest `timeoutMs`）、cleanup（关闭时 `shutdown` 通知 + 杀子进程）、redaction（JSON-RPC 原始响应按 `McpResourceReadResult` 的 redaction 约定脱敏）。
- 手写实现零第三方依赖，纯 Node 标准库。

- Real stdio MCP servers connect, list tools/resources, execute calls, shut down.
- Default stays fail-closed.
- Opt-in only via env/flag/API.
- Timeout, cleanup, redaction inherited from manifest.
- Zero new third-party dependencies.

**Non-Goals:**

- 不做 HTTP/WebSocket transport —— 之后单独 change pack。
- 不做 stdio server 发现 / marketplace / 安装自动化 —— 用户手动写 manifest。
- 不做 server-to-client notification 处理 —— 只覆盖 request/response。MCP 的 `notifications/*` 走但不做业务用途。
- 不做 MCP 的 prompt / sampling API（这两个 R1 都不用）。
- 不做 PowerShell / cmd.exe 原生启动差异处理 —— 依赖 `@deepseek/platform-abstraction` 既有的 `runProcess`。

- No HTTP / WebSocket transport.
- No marketplace / discovery / install automation.
- No notification routing (outside request/response).
- No prompt / sampling API.
- No OS-specific shell launching — defer to `platform-abstraction`.

## Decisions

### Decision 1: 手写 100 行 stdio client，不引入 `@modelcontextprotocol/sdk`

官方 SDK 有 prompt、sampling、progress、logging 等完整特性，打包 200+ KB，依赖链深。我们只需要 `initialize`、`tools/list`、`tools/call`、`resources/list`、`resources/read`、`shutdown` 六个方法 + 换行分帧。手写 100 行就够，可控性、审计性、启动时间、打包体积都更好。

Official SDK ships ~200 KB of prompt/sampling/progress/logging machinery we do not need. The six methods + newline framing we need fit in 100 lines. Writing it keeps the supply chain and bundle tight.

Rejected: 拉 `@modelcontextprotocol/sdk`。依赖太重。

Rejected: adopt `@modelcontextprotocol/sdk` — too heavy for the scope.

### Decision 2: `registerRealTransport(kind, factory)` 机制而不是「默认开启 + env 关闭」

当前 gateway fail-closed 是默认。保持这个默认是 R1 规范承诺 —— 不能偷偷开启网络/进程访问。所以 API 是「注册真实 transport」，未注册时按 v1 路径走（`MCP_TRANSPORT_UNAVAILABLE`）。`runtime` 层根据 env 决定要不要注册；test 代码可以直接在单测里注册，不污染其他测试。

Registration is opt-in, never opt-out. The runtime inspects env and calls `registerRealTransport` when `MCP_REAL_TRANSPORT=1`; tests call it directly in isolated test bodies. This way the default is never "accidentally on" — spec remains satisfied.

Rejected: 默认开启 stdio，env 关闭。违反现有规范承诺。

Rejected: default-on with env opt-out — violates the current spec contract.

### Decision 3: 使用 `deps.platform.runProcess`（或等价）启动子进程，不直接 `child_process.spawn`

`platform-abstraction` 已经封装了跨平台 process launching（Windows cmd/powershell 差异、PATH 查找、stdout/stderr 分流、signal 处理）。直接用 `spawn` 会绕过这些 —— 破坏测试可注入性、跨平台一致性。一个薄 adapter，把 stdin/stdout 流暴露给 `StdioMcpClient`。

`platform-abstraction` already handles cross-platform process launching. Bypassing it would fork our cross-platform story. The MCP adapter gets a slim wrapper that exposes the launched process's stdin/stdout to `StdioMcpClient`.

### Decision 4: 新增一个 `node scripts/mcp-echo-server.mjs` 最小 server，作为测试 fixture

要真正跑 JSON-RPC + stdio + 进程启动，需要一个 target。拉 `@modelcontextprotocol/server-filesystem` 作 dev dep 又成了「测试依赖外部包」，不可复现、网络不稳定。自写 80 行的 echo server（支持 initialize、tools/list 返回 1 个 `echo` tool、tools/call 回显 input、shutdown）就够测试用，且永远在仓库里。

Bundle a hand-written minimal MCP echo server (`scripts/mcp-echo-server.mjs`) as a test fixture — avoids a flaky network dependency, always reproducible. Supports the same 6 methods, returns a single `echo` tool.

### Decision 5: `registerRealTransport` 只接受一个工厂函数，不暴露 transport 实例

工厂函数签名：`(manifest: McpServerManifest) => Promise<McpServerAdapter>`。这让 gateway 按需构造（每个 server 一个子进程），且 adapter 生命周期与 server 绑定 —— server 被 disable 时 gateway 可以 dispose adapter 杀进程。

Factory signature `(manifest) => Promise<McpServerAdapter>` keeps adapter lifetime tied to server registration; disabling a server disposes the adapter and kills the subprocess.

## Safety Model

- **Default off.** 无 `MCP_REAL_TRANSPORT=1` 或 `--enable-real-mcp` 时行为与 v1 一致 —— stdio 返回 `MCP_TRANSPORT_UNAVAILABLE`。
- **Opt-in 写在日志**：当 gateway 注册真实 transport 时，runtime 发一条 `kernel.observability.degraded`（class=info）事件标记 `mcp.real-transport.enabled=true`，审计可追。
- **子进程沙箱**：继承 `platform-abstraction` 的 process launching（没有 shell expansion，参数数组传递），避免 command injection。manifest 的 `transport.command` 必须是字符串，参数在 `transport.metadata.args` 数组里，不做字符串拼接。
- **Timeout**：每次 JSON-RPC request 用 `manifest.timeoutMs` 做 abort timer；超时 reject 并不影响其他 pending request（request id 隔离）。
- **Cleanup**：server disconnect / gateway shutdown 时发送 JSON-RPC `shutdown` 通知，然后 `SIGTERM` 子进程，2 秒后 `SIGKILL`。
- **Redaction**：所有 MCP response 走既有的 `redactMcpMetadata`；错误里 server stderr 的前 256 字节附在 `diagnostic.details` 但 class=internal。

- Default off. Without the env or flag, behavior is identical to v1.
- Activation emits `kernel.observability.degraded` info event with `mcp.real-transport.enabled=true` so it is audit-visible.
- Subprocess launching uses `platform-abstraction`'s runProcess (no shell expansion).
- Per-request timeout from `manifest.timeoutMs`; other requests unaffected.
- Shutdown: JSON-RPC `shutdown` notification, then `SIGTERM`, then `SIGKILL` after 2s.
- Responses redacted via existing `redactMcpMetadata`; stderr tail redaction-classed `internal`.

## Acceptance Strategy

- **Contract**: `tests/contracts/mcp-stdio-client.test.ts` 直接用 `child_process.spawn(process.execPath, [path_to_echo_server])` 启动 echo server，对 `StdioMcpClient` 跑 initialize/tools/list/tools/call/shutdown 全流程，断言 JSON-RPC 收发正确。
- **Integration**: `tests/integration/mcp-real-transport-opt-in.test.ts` 准备一个 manifest 文件指向 echo server，分别跑 `runCli(["mcp", "test", manifest])` 和 `runCli(["mcp", "test", manifest, "--enable-real-mcp"])`，断言默认版本返回 `MCP_TRANSPORT_UNAVAILABLE`，opt-in 版本返回一条 echo tool 的结果。
- **Regression**: 全量 `npm test` 继续 275 pass + 4 skip；typecheck、lint、boundaries 都绿。
- **Spec**: `openspec validate --specs --strict` 通过；新 Requirement 与现有 Requirement 无冲突。
- **Doc**: `docs/development/testing-and-acceptance.md` 新增「Real MCP transport」小节，列出 env flag、CLI flag、使用示例。

- Contract test drives `StdioMcpClient` against a spawned echo server.
- Integration test drives `runCli` in both off and on modes.
- Full suite stays green; spec validation passes; docs updated.
