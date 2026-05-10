## Context

Claude CLI 的工具矩阵是工业级 agent 最小够用集的一个成熟参考。对照之后，DeepSeek CLI 的缺口聚焦在四个方向（按对主 agent 可完成任务面影响从大到小排）：

1. **Web 接入**：agent 没法看最新文档、API 参考、issue 跟踪页，写代码时只能按训练数据的知识猜。Claude CLI 的 `WebFetch` + `WebSearch` 是每次写代码几乎必用的组合。
2. **Sub-agent 委派**：长研究任务如果在主 agent 里做会把上下文窗口撑满。Claude CLI 的 `Agent` tool 把任务交给子 agent（独立 session、独立预算），只把摘要带回主 agent。
3. **后台 shell**：`npm run dev`、`node server.mjs` 类长驻进程是现代开发日常。同步 shell 不能搞 —— 要么 hang 要么手工开另一个 shell。Claude CLI 的 `Bash(run_in_background=true)` + `BashOutput` + `KillShell` 组合解决这个。
4. **Grep/Glob/Read 精细度**：已有工具覆盖主路径，但缺 ripgrep 的常用开关（`-C`、`multiline`、`glob`）和大文件分页。这些不是「有无」差距，而是「用起来舒不舒服」差距。

## Goals / Non-Goals

**Goals:**

- 新增 web.fetch / web.search / agent.spawn / shell.output / shell.kill 五个 tool id，连同 `shell.run` 的 `runInBackground` 扩展，一次性把四组差距填上。
- Group D 的 polish 不破坏既有调用：所有新参数可选、默认行为保持今天。
- Sub-agent spawn 用真实 kernel（复用 `createDefaultRuntimeKernel`），但 session id fork 出去，events 不回灌主 session。主 agent 只看 `AgentLoopSummary`。
- 后台任务有统一 manager（`BackgroundTaskManager` 契约），runtime 统一注入，CLI 退出时自动清理未收尾 task。
- 每个工具有契约测试 + 集成测试（CLI 路径）。
- 默认开销小：web.fetch 默认不跑大模型摘要（纯 markdown 抽取），只有 `summarize: true` 时才打本地 gateway。

**Non-Goals:**

- 不做付费 search API 凭证管理；web.search 默认 `UNAVAILABLE`。
- 不做 Chrome / Playwright headless browser（超出 scope，后续单独 change pack）。
- 不做 PDF 全文解析（只支持 `pages: "1-N"` 抽取文字，复杂版面靠第三方工具）。
- 不做 Jupyter Notebook 编辑（`NotebookEdit` 跳过）。

## Decisions

### Decision 1: web.fetch 默认不调模型，只做 HTML→markdown

大多数 agent 调用 `WebFetch` 是为了把文档抓进来做 grep / 引用。把 HTML 解析成 markdown 后再交给主 agent 看更节省 token，也避免抓一篇文章就烧一个 completion。`summarize: true` 时才走 `deps.models` 总结。默认 15 分钟 in-memory 缓存。

Default `web.fetch` just fetches and converts HTML → markdown. Invoke summarization only when `summarize: true` is passed. Cache 15 minutes in-memory so repeated fetches inside a session are cheap.

Rejected: 每次必跑总结。token 开销 + 延迟都翻倍，且主 agent 往往想看原文。

Rejected: always summarize. Doubles latency and tokens; callers usually want the original text.

### Decision 2: web.search 默认 `UNAVAILABLE`，pluggable provider

我们不想把 Google / Bing / SerpAPI 密钥打进 CLI。`web.search` 的 tool 注册是无条件的，但 handler 里检查 `deps.webSearch?.provider`；没注册就返回 typed `WEB_SEARCH_UNAVAILABLE`，diagnostic 列出支持的 provider 名字。项目后续可以通过 `deps.webSearch = new BraveSearchProvider({ apiKey })` 或等价注入。

Register `web.search` unconditionally but keep it `UNAVAILABLE` until `deps.webSearch.provider` is injected. Providers are pluggable (Brave, SerpAPI, Bing, ...); credentials never ship in the CLI.

### Decision 3: agent.spawn 用 fork session

Sub-agent 独立 kernel + fork 出 child session。父 agent 在结果里拿到 `childSessionId`，想事后 resume 或 inspect 都可以。child session 用 `session.fork` API 已经有的 lineage 表达。sub-agent 发的 events 只写进 child session store，不回放到父 session bus。

Sub-agent spawns inside a forked child session using the existing `session.fork` API. Events land in the child session only; the main agent sees just the final `AgentLoopSummary`. Parent can resume the child later via `session resume <childSessionId>` if it wants.

### Decision 4: BackgroundTaskManager 是新 contract

后台任务不塞进 `concurrency` 或 `scheduler` —— 它们管单次任务执行，不管长驻进程。新 contract `BackgroundTaskManager`：`start(command, args, cwd) => taskId`、`output(taskId, offsetBytes) => { stdout, stderr, done, exitCode?, nextOffset }`、`kill(taskId, signal?) => void`、`list() => readonly BackgroundTaskSummary[]`、`disposeAll()`。`NodeBackgroundTaskManager` 实现基于 `child_process.spawn` + 文件 append；deterministic fake 在 `testing-regression` 提供。

New `BackgroundTaskManager` contract in `platform-contracts`; separate from `concurrency` (which is per-invocation). Node impl uses `child_process.spawn` and appends stdout/stderr to tempfiles; deterministic fake in `testing-regression`. CLI `disposeAll` runs in the `finally` of `runChatCommand` / `runOneShotCommand`.

### Decision 5: Grep/Glob/Read 升级全部 pure-node，不依赖外部 ripgrep

Claude CLI 能用 ripgrep 是因为它跑在容器里预装了 `rg`。我们的目标用户没有这个保证。用 Node 自带 `fs.readdir` + 字符串 regex 实现等价功能，性能弱一点但可移植。

### Decision 6: 增量发布

Group A/B/C/D 之间没有强依赖。本 change pack 的 tasks.md 按组列出，实现时可以分批 commit。gates 每组结束跑一次。

## Safety Model

- `web.fetch` 默认只跟随 `https://` 或 `http://`，不跟随 `file://`、`ftp://`；follow redirect 最多 5 次；响应体 > 10MB 截断；HTML→markdown 阶段剥离 `<script>`、`<style>`、`<iframe>`。
- `web.search` 的 provider 接口强制 credential ref（不裸字符串）。
- `agent.spawn` 的 sub-agent 默认 `toolProjection: "read-only"`，调用方必须显式 `"read-write"` 或 `"all"` 才能写。
- `shell.run(runInBackground=true)` 把 stdout/stderr 写进 workspace 下 `.deepseek/tasks/<taskId>.{out,err}`，不是系统 tmp，便于用户 `cat` 查看。CLI 退出时询问是否清理。
- 所有后台任务在 CLI 关闭时 SIGTERM → 2s → SIGKILL，防止孤儿进程。
- Read 对图片 / PDF 读取时强制 size limit（默认图片 10MB、PDF 5MB），超限返回 typed diagnostic。

## Acceptance Strategy

- Contract 测试：每个新工具 + 每个扩展参数有对应 case。
- Integration 测试：通过 `runCli` 驱动 agent loop 触发这些工具（在 deterministic 模式下 mock 网络、后台任务）。
- Golden replay：不新增 golden —— 新工具进 `projectToolSet` 的 `read-only` / `read-write` 归类，但默认 agent loop 不触发它们，既有 golden 不变。
- 全套 gates 绿。
