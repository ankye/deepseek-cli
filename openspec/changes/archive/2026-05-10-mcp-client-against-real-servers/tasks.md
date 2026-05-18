## 1. Stdio Client / Stdio 客户端

- [x] 1.1 新建 `src/packages/mcp-gateway/src/stdio-client.ts`：实现 `StdioMcpClient` 类。
- [x] 1.2 实现内部缓冲 + 换行分帧 + `pendingRequests` map。
- [x] 1.3 实现 `call(method, params)`：递增 request id、超时、错误映射。
- [x] 1.4 实现 `initialize / listTools / callTool / listResources / readResource / shutdown` 封装。
- [x] 1.5 实现 `dispose(reason)`：标记 closed 并 reject 所有 pending。

## 2. Real Adapter / 真实 Adapter

- [x] 2.1 新建 `src/packages/mcp-gateway/src/real-adapter.ts`：`createRealMcpAdapter(manifest, runner)`。
- [x] 2.2 `runner` 参数类型：`(command, args) => McpSubprocess`。由 CLI 通过 `NodePlatformRuntime.spawnMcpServer` 注入。
- [x] 2.3 `toolHandlers[toolName]` 调 `client.callTool`，映射 `SerializableResult<JsonObject>`；失败返回 typed diagnostic。
- [x] 2.4 `resourceHandlers[uri]` 调 `client.readResource`，映射结果。
- [x] 2.5 `dispose()`：shutdown → SIGTERM → 2s 后 SIGKILL。

## 3. Gateway Registration / Gateway 注册

- [x] 3.1 `InMemoryMcpGateway.registerRealTransport(kind, factory)` + 内部 `Map`。
- [x] 3.2 `connectServer` 在未传 adapter 且已注册 factory 时自动 build adapter，保存 dispose。
- [x] 3.3 `initialHealth` 自动适配：有 adapter 即 `connected`。
- [x] 3.4 `disposeAll()` 关闭所有 server 的 disposer。

## 4. Platform Runner / 平台 Runner

- [x] 4.1 `NodePlatformRuntime.spawnMcpServer(command, args)` 基于 `child_process.spawn`（数组参数、无 shell）。
- [x] 4.2 `FakePlatformRuntime`：保持不变 —— 确定性测试走 gateway 的 fake adapter 路径，不需要 spawn。
- [x] 4.3 不改 `PlatformRuntime` 正式契约；`spawnMcpServer` 作为 `NodePlatformRuntime` 类方法存在。

## 5. Runtime & CLI Wiring / 运行时与 CLI 接线

- [x] 5.1 CLI 在 `runMcpCommand` 里按 flag/env 决定注册真实 transport；runtime 层不强制依赖（后续 change pack 如需要再接 `registerRealMcpTransports`）。
- [x] 5.2 新增 `mcp` 子命令 + `--enable-real-mcp` + `--call <tool>` + `--input <json>` flag，`parseCliArgs` 解析。
- [x] 5.3 `runMcpCommand` 读 manifest、连 server、列 tools、可选 callTool、输出 text/json。
- [x] 5.4 `cliUsageLines()` 加入 `deepseek mcp test` 行。

## 6. Test Fixture / 测试 Fixture

- [x] 6.1 `scripts/mcp-echo-server.mjs`：~80 行 JSON-RPC echo server。

## 7. Tests / 测试

- [x] 7.1 `tests/contracts/mcp-stdio-client.test.ts`：3 case（正常流程、超时、JSON-RPC error）全绿。
- [x] 7.2 `tests/integration/mcp-real-transport-opt-in.test.ts`：2 case（fail-closed 默认、opt-in 成功调 echo）全绿。
- [x] 7.3 全量 `npm test` 绿：280 pass + 4 skip（新增 5 个 case）。

## 8. Docs / 文档

- [x] 8.1 `docs/development/testing-and-acceptance.md` 新增「Real MCP transport / 真实 MCP 通道」小节，覆盖 opt-in 方式、`deepseek mcp test` 用法、连 `@modelcontextprotocol/server-*` 示例、安全模型。
- [x] 8.2 spec 已在 change delta 里修改 `MCP Transport and Connection Management` 和新增 `Opt-In Real MCP Transport`。

## 9. Verification / 验证

- [x] 9.1 `npm run typecheck`。
- [x] 9.2 `npm run lint`。
- [x] 9.3 `node scripts/check-boundaries.mjs`（27 packages 不变）。
- [x] 9.4 `npm test`（280 pass + 4 skip）。
- [x] 9.5 `npm run smoke:live:e2e`（环境门控；无 key 时 skip）。
- [x] 9.6 手动验证：`node scripts/mcp-echo-server.mjs` 可独立启动并响应 `initialize`。
- [x] 9.7 刷新 `tests/acceptance/latest/` 证据。
- [x] 9.8 `openspec validate mcp-client-against-real-servers --strict` + `openspec validate --specs --strict`。
