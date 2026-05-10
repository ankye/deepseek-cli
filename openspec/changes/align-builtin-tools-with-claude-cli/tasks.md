## A. Web Access / 网络接入

- [ ] A.1 `platform-contracts`：新增 `core.web.fetch` / `core.web.search` capability id（在 `coreToolIds` 同源 ids 里），新增 `WebFetchProvider` + `WebSearchProvider` 接口（可选，`RuntimeDependencies.webFetch`/`webSearch`）。
- [ ] A.2 `core-coding-tools`：新增 `coreToolIds.webFetch` / `webSearch`；注册 `core.web.fetch` + `core.web.search` manifest（`sideEffect: "read"`, permissions: `network:read`）。
- [ ] A.3 `core.web.fetch` 实现：Node `fetch` 请求 URL（强制 https/http、5 次 redirect 上限、10MB 截断）；HTML→markdown（剥离 script/style/iframe 后按标签转换）；默认 `summarize: false` 直接返回 markdown；`summarize: true` 时调 `deps.models.stream(prompt)` 总结。15 分钟内存缓存按 URL。
- [ ] A.4 `core.web.search` 实现：检查 `deps.webSearch?.provider`；无则返回 `WEB_SEARCH_UNAVAILABLE`；有则调 provider 返回 `[{title, url, snippet}]`。
- [ ] A.5 `tests/contracts/web-tools.test.ts`：`web.fetch` 用 `node:http` 起本地 mock server 验证 markdown 转换 + 缓存；`web.search` 无 provider 时返回 `UNAVAILABLE`、注入 stub provider 返回 mock 结果。

## B. Sub-Agent Delegation / 子 agent 委派

- [ ] B.1 `platform-contracts`：新增 `core.agent.spawn` id 和 `AgentSpawnRequest` / `AgentSpawnResult` schema（prompt、toolProjection、timeoutMs、maxIterations、childSessionId、terminalStatus、assistantText、iterations、toolCalls、diagnostics）。
- [ ] B.2 `core-coding-tools`：注册 `core.agent.spawn` manifest（`sideEffect: "process"`, permissions: 继承父 agent）。handler 内部：调 `deps.sessions.fork({ parentSessionId, reason: "agent.spawn" })` → 构造独立 `RuntimeKernel`（同 `deps`）→ `runAgentLoop` 生成器消费所有 events → 返回 terminal summary。
- [ ] B.3 sub-agent 默认 `toolProjection: "read-only"`；`timeoutMs` 默认父 agent 的 1/2，不超过 60s；`maxIterations` 默认 8。
- [ ] B.4 sub-agent events 写进 child session store，不 emit 到父 session bus（通过不共享 `deps.bus` 的 replay channel 实现，或构造一个 `ForkedBus` 装饰器）。
- [ ] B.5 `tests/contracts/agent-spawn.test.ts`：deterministic model 模式下 spawn 一个 "say hello" sub-agent，断言返回 summary、childSessionId 在 `deps.sessions.events(childId)` 可见、父 session events 不包含 sub-agent 的 `agent.loop.started`。

## C. Background Shell / 后台 Shell

- [ ] C.1 `platform-contracts`：新增 `BackgroundTaskManager` 接口 + `BackgroundTaskSummary` + `BackgroundTaskOutput` 类型；新增 `core.shell.output` / `core.shell.kill` capability id。
- [ ] C.2 `platform-abstraction`：`NodeBackgroundTaskManager` 实现（spawn 子进程、stdout/stderr append 到 `<workspaceRoot>/.deepseek/tasks/<taskId>.{out,err}`）；`dispose()` SIGTERM 所有存活任务。
- [ ] C.3 `core-coding-tools`：`shell.run` schema 增加 `runInBackground: boolean` 可选，为 true 时走 `deps.backgroundTasks.start()` 并立刻返回 `{taskId, status:"running"}`；新增 `core.shell.output` handler 读取 `.deepseek/tasks/` 文件；新增 `core.shell.kill` handler 调 `deps.backgroundTasks.kill`。
- [ ] C.4 `RuntimeDependencies` 加 `backgroundTasks: BackgroundTaskManager` 字段；`testing-regression` fake 提供 `FakeBackgroundTaskManager`（不真 spawn，直接合成 stdout）。
- [ ] C.5 CLI 的 `runOneShotCommand` / `runChatCommand` 在 `finally` 调 `deps.backgroundTasks.dispose()`。
- [ ] C.6 `tests/contracts/background-shell.test.ts`：fake 模式下跑 runInBackground=true → 读 shell.output → 调 shell.kill，断言 exitCode 和 done 字段；真实模式下（`process.env.BACKGROUND_TASK_SMOKE=1` 门控）跑 `sleep 1` 流程。

## D. Grep / Glob / Read Polish / 精细化

- [ ] D.1 `core.search.text` schema 增加 `contextLines`（`-C`）、`multiline`、`glob`（`*.ts` 过滤）、`outputMode`（默认 `files_with_matches`）、`headLimit`（限条目数）、`caseInsensitive`。实现按 Node regex 组合。
- [ ] D.2 `core.file.list`：匹配文件按 mtime 降序排序（stat 调用数限流）；支持 `**/**` pattern。
- [ ] D.3 `core.file.read`：schema 加 `offset`（从第 N 行开始）、`limit`（最多 N 行）；内容是图片 mime 时返回 `{ kind: "image", mime, base64 }`（size limit 10MB）；PDF mime 时读取 `pages: "1-5"` 文本（需要 `deps.platform.readPdfPages` 可选扩展，缺失时 UNAVAILABLE）。
- [ ] D.4 `tests/contracts/grep-glob-read-polish.test.ts`：每个新参数一个用例 + 向后兼容 sanity（不传参数时行为等于改造前）。

## E. Docs / 文档

- [ ] E.1 `docs/development/testing-and-acceptance.md` 新增「内建工具集 / Built-in tools」小节列出所有 14 个 tool id、它们的 sideEffect / permissions / 典型输入输出，并标注 web.search 默认 UNAVAILABLE。
- [ ] E.2 `docs/architecture/` 若有 capability 矩阵，同步更新。

## F. Verification / 验证

- [ ] F.1 `npm run typecheck`。
- [ ] F.2 `npm run lint`（新加 web.fetch 注意 `node:net` / credential 相关 lint 规则）。
- [ ] F.3 `node scripts/check-boundaries.mjs`（27 packages，testing-regression 依赖集可能增加 network adapter 相关）。
- [ ] F.4 `npm test`（预计原 280 + 新增 4 个文件 × 3-4 case ≈ 293 pass；确定性模式下网络全 stub）。
- [ ] F.5 刷新 `tests/acceptance/latest/` 证据。
- [ ] F.6 `openspec validate align-builtin-tools-with-claude-cli --strict` + `openspec validate --specs --strict`。
