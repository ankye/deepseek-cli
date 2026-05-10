## Why

`@deepseek/mcp-gateway` 当前 `InMemoryMcpGateway` 实现 + 规范明文要求：`v1 SHALL only execute deterministic fake or in-process handlers and SHALL fail closed for real transports`。这是 R1 的刻意选择 —— 让运行时在没有真实 MCP server 时也不会偷偷发网络或进程调用。问题是，当一个 MCP server 真的可用（比如用户本地装了 `@modelcontextprotocol/server-filesystem`），系统完全没法用它。

当 stdio transport 被声明时，gateway 直接返回 `MCP_TRANSPORT_UNAVAILABLE` 而不尝试连接。这让 CLI 无法接入生态里已有的 MCP server（filesystem、git、brave-search、github 等），即便用户显式声明了信任。Claude CLI、Cursor 等竞品已经通过 MCP 连接了大量工具，这是我们追赶的最后一块缺口。

`@deepseek/mcp-gateway` currently implements `InMemoryMcpGateway` and the spec mandates `v1 SHALL only execute deterministic fake or in-process handlers and SHALL fail closed for real transports`. This was a deliberate R1 choice — keep the runtime deterministic when no real MCP server is present. The cost is that even when a user has `@modelcontextprotocol/server-filesystem` installed locally, the CLI cannot reach it; `stdio` manifests immediately return `MCP_TRANSPORT_UNAVAILABLE`. Claude CLI and Cursor already talk to real MCP servers. This is the remaining feature gap.

这次改动解锁 stdio transport：用极小的手写 JSON-RPC 2.0 over stdio 客户端实现 `McpServerAdapter`，通过 `deps.platform.spawnProcess` 启动 server 子进程、按换行分帧收发 JSON-RPC。默认关闭（保持 v1 「安全失败」语义），通过 `MCP_REAL_TRANSPORT=1` 环境变量或 `gateway.registerRealTransport()` 显式打开。关闭时行为与今天一致。

This change unlocks stdio transport via a minimal hand-written JSON-RPC 2.0 stdio client that satisfies `McpServerAdapter`, spawning the server with `deps.platform.spawnProcess` and framing messages by newline. It is **off by default** (preserving v1 fail-closed semantics) and only activates when an explicit environment flag (`MCP_REAL_TRANSPORT=1`) or programmatic opt-in (`gateway.registerRealTransport()`) is set.

## What Changes

- 新增 `StdioMcpClient` 类于 `src/packages/mcp-gateway/src/stdio-client.ts`：手写 JSON-RPC 2.0 over stdio，支持 `initialize`、`tools/list`、`tools/call`、`resources/list`、`resources/read`、`shutdown` 六个方法。消息按换行（`\n`）分帧（MCP 标准 framing 就是换行）。
- 新增 `createRealMcpAdapter(manifest, processRunner)` 工厂：接收 manifest 和一个 `ProcessProvider`（复用 `@deepseek/platform-abstraction` 的 `NodePlatformRuntime.runProcess`），返回一个兼容的 `McpServerAdapter` 对象。其 `toolHandlers` 和 `resourceHandlers` 内部通过 `StdioMcpClient.call()` 转发到子进程。
- 在 `InMemoryMcpGateway` 新增 `registerRealTransport(kind: McpTransportKind, factory)` 方法，允许外部注入真实 transport 工厂。注册后，`connectServer` 在 transport kind 匹配且 adapter 未提供时调用工厂构造 adapter。
- 在 `@deepseek/runtime` 层启动时检查 `process.env.MCP_REAL_TRANSPORT === "1"`（默认关闭）；若开启，调用 `gateway.registerRealTransport("stdio", ...)` 装配 stdio 工厂。CLI 新增 `--enable-real-mcp` flag 作为等价入口。
- CLI `deepseek mcp test <manifest-path>` 命令（新命令）：加载本地 manifest JSON、按 `--enable-real-mcp` 连到真实 server、列 tools/resources、可选调用一个 tool，返回结构化结果（text + json 两种输出）。
- **非破坏性**：默认行为不变（`MCP_REAL_TRANSPORT=0` 或未设置时，stdio 仍然 `MCP_TRANSPORT_UNAVAILABLE`）。既有测试、golden replay、契约测试全部不受影响。
- 更新 `mcp-gateway` spec：从「v1 SHALL only execute deterministic fake」放宽为「v1 SHALL only execute deterministic fake unless opt-in explicitly enables a real transport」，并新增一条 Requirement 描述 stdio 真实通道的安全模型（explicit opt-in、子进程沙箱、超时、redaction）。

- New `StdioMcpClient` in `src/packages/mcp-gateway/src/stdio-client.ts`: hand-rolled JSON-RPC 2.0 over stdio with newline framing, supporting `initialize`, `tools/list`, `tools/call`, `resources/list`, `resources/read`, `shutdown`.
- New `createRealMcpAdapter(manifest, processRunner)` factory; `toolHandlers` and `resourceHandlers` delegate to `StdioMcpClient.call()`.
- New `InMemoryMcpGateway.registerRealTransport(kind, factory)` method: opt-in registration of real transport factories; `connectServer` consults it when the manifest kind matches and no adapter is provided.
- Runtime startup inspects `process.env.MCP_REAL_TRANSPORT === "1"` (default off) and calls `gateway.registerRealTransport("stdio", ...)` when set. CLI `--enable-real-mcp` flag does the same programmatically.
- New CLI command `deepseek mcp test <manifest-path>`: load a local manifest, connect (honoring `--enable-real-mcp`), list tools/resources, optionally call a tool, return a structured result.
- **Non-breaking by default**: without the flag, stdio still returns `MCP_TRANSPORT_UNAVAILABLE`; existing tests and golden replays stay unchanged.
- `mcp-gateway` spec relaxed: add scenario for opt-in real transport, add requirement covering subprocess safety model.

## Impact

- 受影响规范：`mcp-gateway`（松绑 v1 fail-closed 条件 + 新增真实 stdio transport 要求）。
- 受影响包：
  - `@deepseek/mcp-gateway`：新增 `stdio-client.ts`、`real-adapter.ts`、`registerRealTransport` 方法。文件行数从 621 → ~900。
  - `@deepseek/runtime`：启动时可选注册真实 transport；不改 public API。
  - `@deepseek/platform-contracts`：无变动（`McpServerAdapter` 已经足够通用）。
  - `src/apps/cli`：新增 `mcp` 子命令 + `--enable-real-mcp` flag。
- 新增测试：
  - `tests/contracts/mcp-stdio-client.test.ts`：通过 `child_process.spawn` 启动 `node scripts/mcp-echo-server.mjs`（一个本次同时加的最小 MCP 回显 server），完整跑一遍 initialize → tools/list → tools/call → shutdown。
  - `tests/integration/mcp-real-transport-opt-in.test.ts`：驱动 `runCli(["mcp", "test", ...])`，验证默认关闭时失败、开启后成功。
- 默认行为零回归（既有 275 测试 + 4 skip 继续绿）。
- 文档：`docs/development/testing-and-acceptance.md` 新增「Real MCP transport / 真实 MCP 通道」小节。

- Specs: `mcp-gateway` gets a relaxed v1 condition plus a new real-stdio requirement.
- Packages: `mcp-gateway` grows to host the stdio client; `runtime` adds the opt-in wiring; CLI adds the `mcp` subcommand and `--enable-real-mcp` flag; `platform-contracts` unchanged.
- Tests: new contract test exercises a local echo MCP server via stdio; new integration test drives `runCli(["mcp", "test", ...])` in both opt-out and opt-in modes.
- Default behavior unchanged; existing suite stays green.
- Docs: new "Real MCP transport" subsection.
