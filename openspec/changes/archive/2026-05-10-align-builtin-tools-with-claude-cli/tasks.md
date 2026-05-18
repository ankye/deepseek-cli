## A. Web Access / 网络接入

- [x] A.1 `platform-contracts` 增加 `WebFetchInput/Provider`、`WebSearchInput/Provider/ResultItem`、`WebFetchResponseMetadata`；`RuntimeDependencies` 加可选 `webFetch`/`webSearch`。
- [x] A.2 `NodePlatformRuntime` 新增 `httpFetch(url, options)` 封装（https-only、5 redirect、10MB 截断、AbortSignal.any 复合超时）+ `readBinaryFile`。
- [x] A.3 `core-coding-tools` 拆分后新增 `tools/web-fetch/`、`tools/web-search/`；`shared/html.ts` 手写 HTML→markdown。
- [x] A.4 `core.web.fetch`：默认纯 markdown 抽取 + 15 分钟缓存；`summarize: true` 走注入 provider。
- [x] A.5 `core.web.search`：缺 provider 时 typed `WEB_SEARCH_UNAVAILABLE`；`allowedDomains`/`blockedDomains` 过滤。
- [x] A.6 `tests/contracts/web-tools.test.ts`：HTTP mock server + 不同入参 5 case。

## B. Sub-Agent Delegation / 子 agent 委派

- [x] B.1 `platform-contracts` 定义 `AgentSpawnRequest/Result/Spawner`、`RuntimeDependencies.agentSpawner` 可选字段。
- [x] B.2 `core.agent.spawn` tool 通过注入的 `AgentSpawner` 调用；缺注入时 typed `AGENT_SPAWNER_UNAVAILABLE`。
- [x] B.3 默认 `toolProjection: "read-only"`。
- [x] B.4 `@deepseek/runtime` 新增 `createAgentSpawner(deps, kernel, workspaceRoot)`：fork session、独立 `runAgentLoop`、只把 terminal summary 返回调用方。
- [x] B.5 `tests/contracts/agent-spawn.test.ts` 3 case 全绿（fail-closed、真实 spawn、默认 projection）。

## C. Background Shell / 后台 Shell

- [x] C.1 `platform-contracts` 定义 `BackgroundTaskManager`、`BackgroundTaskSummary`、`BackgroundTaskOutput`、`ShellOutputInput`、`ShellKillInput`；`shell.run` 输入加可选 `runInBackground`。
- [x] C.2 `platform-abstraction` 新增 `NodeBackgroundTaskManager`（`child_process.spawn` + stdout/stderr buffer + SIGTERM→SIGKILL disposer）。
- [x] C.3 `core.shell.run` 分流：`runInBackground: true` 走 `backgroundTasks.start()` 返回 `taskId`；否则原同步路径。
- [x] C.4 新增 `core.shell.output`、`core.shell.kill` 工具。
- [x] C.5 `testing-regression` 提供 `FakeBackgroundTaskManager`；`createDeterministicRuntimeDependencies` + `createLiveCliDependencies` 都挂接。
- [x] C.6 `tests/contracts/background-shell.test.ts` 5 case 全绿。

## D. Grep / Glob / Read Polish / 精细化

- [x] D.1 `search.text` 新增 `contextLines`、`multiline`、`glob`、`caseInsensitive`、`outputMode`（默认 `files_with_matches`）；向后兼容（缺省参数时走原 `platform.searchText` 快路径）。
- [x] D.2 `file.list` 新增 `sort: "alpha" | "mtime-desc"`（默认 mtime 降序）；`NodePlatformRuntime.statFile` 支撑。
- [x] D.3 `file.read` 新增 `offset`/`limit` 行级切片 + 图片 base64 + PDF placeholder（`PDF_READER_UNAVAILABLE`）；向后兼容（缺省时返回完整文件）。
- [x] D.4 `tests/contracts/grep-glob-read-polish.test.ts` 7 case 全绿。

## E. Docs / 文档

- [x] E.1 `docs/development/testing-and-acceptance.md` 新增「Built-in tools / 内建工具集」小节：列全部 15 个 capability、依赖注入约定、后台 shell 行为、测试入口。
- [x] E.2 现有 `openspec/specs/core-coding-tools` 的 Semantic Search / File Read 语义在 change delta 里通过 MODIFIED Requirements 升级。

## F. Refactor 前置 / Pre-refactor

- [x] F.1 `core-coding-tools/src/index.ts` 拆分为 `tools/<tool-name>/index.ts` + `shared/{tool-kit,workspace,html,ids}.ts`；0 行为变化。
- [x] F.2 `scripts/lint-framework/rules/imports.mjs` 的 `imports/no-cross-package-relative-imports` 改为只在真正跨越 `packages/<name>` / `apps/<name>` 边界时报错。

## G. Verification / 验证

- [x] G.1 `npm run typecheck` —— 通过。
- [x] G.2 `npm run lint` —— ast lint passed (237 files, 16 rules)。
- [x] G.3 `node scripts/check-boundaries.mjs` —— 27 packages 通过。
- [x] G.4 `npm test` —— 300 pass + 4 skip（新增 20 case）。
- [x] G.5 `npm run smoke:live:e2e` —— 环境门控；无 key 时 skip。
- [x] G.6 刷新 `tests/acceptance/latest/` 证据。
- [x] G.7 `openspec validate align-builtin-tools-with-claude-cli --strict` + `openspec validate --specs --strict` —— 通过。
