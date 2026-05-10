## Why

DeepSeek CLI 的 `@deepseek/core-coding-tools` 目前提供 10 个工具（`file.read/write/edit/list`、`search.text`、`shell.run`、`git.status/diff`、`test.run`、`todo.plan`）。对照 Claude CLI 的日常工具矩阵，缺少的部分让 agent 在相同场景下能力不对等：

- **WebFetch / WebSearch**：无法把文档、API 参考、搜索结果带进上下文。
- **Agent（sub-agent spawn）**：无法把大搜索、大研究 delegate 出去保护主上下文。
- **Bash 后台任务**：`core.shell.run` 只支持同步阻塞，无法 `run_in_background` + 轮询输出，复杂构建 / 开发服务器场景必须手工绕开。
- **Glob / Grep 语义**：现有 `file.list` 是简单 pattern，`search.text` 缺 `-C` 上下文、`multiline`、`glob` 过滤等 ripgrep 级能力。
- **Read**：不支持 offset/limit/图片/PDF pages。

这次变更按「补齐差距 + 保持现有契约稳定」的思路分四组工作。不是为了追平 Claude CLI 的每一个工具（`NotebookEdit`、`ScheduleWakeup` 等 R1 不需要），而是把 DeepSeek agent 能稳定完成真实软件工程任务的工具面补齐。

DeepSeek CLI currently ships 10 tools in `@deepseek/core-coding-tools`. Compared to Claude CLI's working tool surface, we are missing web access, sub-agent delegation, background shell, and several ripgrep-level options on Grep. This change pack fills the gaps needed for DeepSeek to handle the same class of real engineering work, without blindly porting every Claude tool (NotebookEdit, ScheduleWakeup, etc. are out of scope).

## What Changes

### Group A — Web access (new tools)

- 新增 `core.web.fetch`：给定 URL + prompt，抓取网页，HTML → markdown，用本地小模型（或直接纯文本 fallback）按 prompt 摘要，返回结构化结果。缓存 15 分钟。
- 新增 `core.web.search`：给定 query，调用 DeepSeek 网关的 search 函数（如果可用）或返回 `WEB_SEARCH_UNAVAILABLE`。返回标题 + URL + 摘要数组。

### Group B — Sub-agent delegation (new tool)

- 新增 `core.agent.spawn`：在新的 `RuntimeKernel`（继承同 session 或 fork 一个 child session）中跑一个 prompt，可选限定工具子集（`read-only`、`read-write`、`all`）、timeout、max iterations，返回 sub-agent 的 `AgentLoopSummary`。调用方（主 agent）只看到结构化结果，sub-agent 的中间事件隔离。

### Group C — Background shell (augment existing tool)

- `core.shell.run` 增加 `runInBackground: boolean`。为 true 时：启动子进程后立即返回 `{ taskId, status: "running" }`，stdout/stderr 追加到工作区临时文件。
- 新增 `core.shell.output`：按 `taskId` 读取最新输出（跟踪 offset），返回 `{ stdout, stderr, done, exitCode? }`。
- 新增 `core.shell.kill`：按 `taskId` 发送 SIGTERM。
- 后台任务注册表在 `RuntimeDependencies` 加 `backgroundTasks` 字段（新 contract）。

### Group D — Grep/Glob/Read polish (augment existing tools)

- `core.search.text` 增加 `-C <n>` 上下文参数、`multiline: boolean`、`glob: string` 过滤、`outputMode: "content" | "files_with_matches" | "count"`。
- `core.file.list` 默认对 matches 按 mtime 降序排序；支持 `**/**` 递归 pattern。
- `core.file.read` 支持 `offset: number`、`limit: number`、图片（PNG/JPG）返回 base64、PDF 指定 `pages: "1-5"` 读取首 20 页（或拒绝）。

- **Non-breaking**: 每个既有 tool 只增不减输入字段；既有调用方默认参数保持今天行为。
- **可选 dependency**：Web fetch 的小模型和 PDF 解析通过 `deps.platform`/`deps.models` 注入，缺失时返回结构化 `UNAVAILABLE`。

## Impact

- 受影响规范：`core-coding-tools`（新增 4 工具 + 扩展 3 工具输入 schema）、`platform-contracts`（新增 `BackgroundTaskManager` 接口 + `core.web.fetch`/`core.web.search`/`core.agent.spawn`/`core.shell.output`/`core.shell.kill` 的 `capability id`）。
- 受影响包：`@deepseek/core-coding-tools` 主体；`@deepseek/platform-contracts`（id 枚举 + interface）；`@deepseek/runtime`（BackgroundTaskManager 注入 + agent.spawn 的 sub-kernel 构造）；`@deepseek/platform-abstraction`（后台进程 + tempdir 管理）；`@deepseek/testing-regression`（fakes 补充 BackgroundTaskManager）。
- 新增测试：
  - `tests/contracts/web-tools.test.ts`：web.fetch / web.search 确定性分支（测试用 stub provider）。
  - `tests/contracts/agent-spawn.test.ts`：sub-agent 在隔离 session 中执行且不污染父 session 的 events。
  - `tests/contracts/background-shell.test.ts`：run_in_background → shell.output → shell.kill 全流程。
  - `tests/contracts/grep-glob-read-polish.test.ts`：新参数 semantics。
- 文档：`docs/development/testing-and-acceptance.md` 新增「内建工具集 / Built-in tools」小节列每个工具的契约。

## Non-Goals

- 不做 `NotebookEdit`（低优）。
- 不做 `ScheduleWakeup` / `CronCreate`（属于调度系统，非工具）。
- 不做 IDE 相关 `EnterPlanMode` / `ExitPlanMode`（已有 OpenSpec 体系）。
- 不引入第三方 search API 付费凭证 —— `web.search` 默认 `UNAVAILABLE`，只在未来 provider 具备时激活。
