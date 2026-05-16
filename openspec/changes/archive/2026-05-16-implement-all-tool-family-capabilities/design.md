## Context

The current 64-family catalog is intentionally strict: only concrete executable capabilities appear as tool entries, and planned families remain in the denominator with zero score. At this point 18 families have real core-tool coverage, while 46 families still need implementation across core tools, runtime orchestration, MCP connectors, model/provider adapters, host adapters, and diagnostics.

当前 64-family catalog 是严格的：只有真实可执行 capability 会出现在 tool entries 中，planned families 留在分母里且得零分。目前已有 18 个 families 具备真实 core-tool coverage，另外 46 个 families 需要在 core tools、runtime orchestration、MCP connectors、model/provider adapters、host adapters 与 diagnostics 中落地。

This change is larger than the earlier catalog work. The earlier change made missing capabilities visible; this change turns every first-version family into working product surface with deterministic tests and score evidence.

本变更比前一轮 catalog 工作更大。前一轮让缺失能力可见；本变更要把每个第一版 family 变成可工作的产品能力，并提供确定性测试与评分证据。

## Goals / Non-Goals

**Goals:**

- Implement all 64 first-version tool families with at least one concrete executable capability.
- 实现全部 64 个第一版 tool families，每个 family 至少有一个真实可执行 capability。
- Keep ownership aligned with architecture boundaries: local coding tools in `core-coding-tools`, pipelines in runtime/workflow packages, connectors in MCP/model/host packages, and evidence in testing/diagnostics packages.
- 保持 ownership 符合架构边界：local coding tools 放在 `core-coding-tools`，pipelines 放在 runtime/workflow packages，connectors 放在 MCP/model/host packages，evidence 放在 testing/diagnostics packages。
- Make every family testable without live credentials by using deterministic fake providers, fake MCP servers, fake browser/design/media adapters, and replayable task fixtures.
- 通过 deterministic fake providers、fake MCP servers、fake browser/design/media adapters 与 replayable task fixtures，让每个 family 在没有 live credentials 时也可测试。
- Make family scorecards objective: implementation, static contract, live or replayed execution, task outcome, and safety evidence must be recorded separately.
- 让 family scorecards 保持客观：implementation、static contract、live 或 replayed execution、task outcome 与 safety evidence 必须分别记录。
- Preserve the no-placeholder rule and fail model projection if a tool cannot actually execute.
- 保持无占位工具规则；如果工具无法真实执行，则 model projection 必须失败。

**Non-Goals:**

- Do not require live network, browser, design, or image provider access in default tests.
- 默认测试不要求真实 network、browser、design 或 image provider access。
- Do not claim provider-native support when DeepSeek only has a local or fake connector.
- 当 DeepSeek 只有 local 或 fake connector 时，不声明 provider-native support。
- Do not merge connector implementation packages into `core-coding-tools`.
- 不把 connector implementation packages 合并进 `core-coding-tools`。
- Do not weaken safety gates to raise scores quickly.
- 不为了快速提高分数而放宽安全门槛。

## Decisions

### Decision: Implement Families In Owner Packages, Not One Giant Tool Package

Each family lands where the behavior is owned:

| Domain | Primary owner |
| --- | --- |
| Workspace I/O | `core-coding-tools`, `platform-abstraction` |
| Search and code intelligence | `core-coding-tools`, `code-intelligence` |
| Mutation and patching | `core-coding-tools`, `workspace-state-management` |
| Shell and process | `core-coding-tools`, `platform-abstraction` |
| Git and build | `core-coding-tools`, package manager helpers |
| Planning and control | `runtime`, `agent-management`, CLI host |
| Pipeline and composition | `runtime`, `workflow-orchestration`, `runtime-message-bus` |
| Agents and tasks | `agent-management`, `runtime`, core wrappers |
| Web and public data | `core-coding-tools`, `model-gateway`, deterministic providers |
| Browser automation | `mcp-gateway` or browser connector package |
| MCP connectors | `mcp-gateway` |
| Extensions and local commands | `skill-system`, `hook-system`, `plugin-system`, `command-system`, CLI host |
| Media and images | model/provider adapter package plus deterministic fake provider |
| Design and canvas | design MCP/profile package plus deterministic fake canvas |
| Memory, context, and session | `memory-cache-management`, `context-engine`, `session-store`, `runtime` |
| Remote, scheduling, and observability | `remote-runtime-connectivity`, `workspace-state-management`, `concurrency-orchestration`, `observability-privacy` |

每个 family 都落在行为所属 package，而不是塞进单一大工具包。这样评分、权限、依赖方向和发布边界都更清楚。

Alternative considered: implement all missing families inside `core-coding-tools`. Rejected because browser, MCP, media, design, memory, remote runtime, and observability are not local coding-tool responsibilities.

备选方案：把所有缺失 families 都实现在 `core-coding-tools`。拒绝原因是 browser、MCP、media、design、memory、remote runtime 与 observability 并不属于 local coding-tool 职责。

### Family Landing Matrix / Family 落地矩阵

Each row defines the first concrete landing target. "Fake-first" means deterministic local execution is required for default tests, while live provider execution remains opt-in.

每一行定义该 family 的第一版真实落地目标。"Fake-first" 表示默认测试必须支持确定性本地执行，真实 provider 执行为可选开启。

| Family | First concrete capability / 第一版真实能力 | Owner / 归属 | Evidence / 验收证据 |
| --- | --- | --- | --- |
| `file.read` | Bounded file read with path policy / 有界文件读取与路径策略 | `core-coding-tools` | existing executor plus family task fixture / 现有 executor 加 family task fixture |
| `file.list` | Bounded directory listing / 有界目录枚举 | `core-coding-tools` | existing executor plus matrix fixture / 现有 executor 加矩阵 fixture |
| `workspace.glob` | Glob pattern search over workspace paths / workspace 路径 glob 搜索 | `core-coding-tools`, `platform-abstraction` | glob contract and path rejection tests / glob 合同与路径拒绝测试 |
| `asset.view-local` | Read local image/text metadata and safe preview / 读取本地图片或文本元数据与安全预览 | `core-coding-tools`, host adapter | binary bounds and redaction tests / 二进制边界与脱敏测试 |
| `search.text` | Bounded text search / 有界文本搜索 | `core-coding-tools` | existing live/replay coverage / 现有 live/replay 覆盖 |
| `search.symbol` | Symbol definition/reference lookup / 符号定义与引用查询 | `code-intelligence`, `core-coding-tools` wrapper | deterministic code-index fixture / 确定性 code-index fixture |
| `code.diagnostics-lsp` | Diagnostics projection from code-intelligence/LSP-like service / code-intelligence 或 LSP 类诊断投影 | `code-intelligence` | TODO/FIXME/error fixture plus model-visible wrapper / 诊断 fixture 与模型可见 wrapper |
| `notebook.read` | Parse notebook cells and metadata with bounded outputs / 解析 notebook cells 与元数据并有界输出 | `core-coding-tools` | `.ipynb` fixture and malformed notebook test / `.ipynb` 与损坏文件测试 |
| `file.write` | Transactional file write / 事务性文件写入 | `core-coding-tools`, `workspace-state-management` | existing executor plus rollback evidence / 现有 executor 加 rollback evidence |
| `file.edit` | Exact edit with precondition / 带前置条件的精确编辑 | `core-coding-tools`, `workspace-state-management` | existing executor plus ambiguity tests / 现有 executor 加歧义测试 |
| `patch.apply` | Multi-hunk unified patch application / 多 hunk unified patch 应用 | `core-coding-tools`, `workspace-state-management` | patch precondition, affected-file, rollback tests / patch 前置条件、影响文件与回滚测试 |
| `revert.undo` | Revert checkpoint or latest mutation / 撤销 checkpoint 或最近 mutation | `workspace-state-management`, `core-coding-tools` wrapper | stale checkpoint and dry-run tests / stale checkpoint 与 dry-run 测试 |
| `shell.run` | Governed foreground/background process run / 受治理前台或后台进程执行 | `core-coding-tools` | existing executor plus shell policy fixture / 现有 executor 加 shell policy fixture |
| `process.output` | Fetch bounded background process output / 获取后台进程有界输出 | `core-coding-tools` | existing executor plus timeout fixture / 现有 executor 加 timeout fixture |
| `process.kill` | Stop background process by task id / 按 task id 停止后台进程 | `core-coding-tools` | existing executor plus idempotent kill test / 现有 executor 加幂等 kill 测试 |
| `repl.execute` | Execute one isolated REPL snippet with timeout / 带 timeout 的隔离 REPL 片段执行 | `core-coding-tools`, `platform-abstraction` | JS/TS fake REPL fixture and sandbox tests / JS/TS fake REPL 与 sandbox 测试 |
| `git.status-diff` | Git status and diff summary / Git 状态与 diff 摘要 | `core-coding-tools` | existing status/diff coverage / 现有 status/diff 覆盖 |
| `git.history-branch` | Log, branch list, current branch, and safe checkout preview / log、branch list、当前分支与安全 checkout preview | `core-coding-tools` | fake git fixture and no-mutation default / fake git fixture 与默认不修改测试 |
| `build.test-lint-typecheck` | Governed test/lint/typecheck command run / 受治理测试、lint、typecheck 命令执行 | `core-coding-tools` | existing test executor plus command class tests / 现有 test executor 加命令分类测试 |
| `package.manager` | Install/list/outdated/script dry-run and governed execution / 包管理 install/list/outdated/script dry-run 与受治理执行 | `core-coding-tools` | npm/pnpm/yarn fake process fixtures / npm/pnpm/yarn fake process fixtures |
| `plan.todo` | Structured todo plan update / 结构化 todo plan 更新 | `core-coding-tools` | existing plan executor coverage / 现有 plan executor 覆盖 |
| `mode.plan-auto-review` | Switch/report plan, auto, review modes / 切换或报告 plan、auto、review 模式 | `runtime`, CLI host | mode-state contract and chat command tests / mode-state 合同与 chat command 测试 |
| `user.input` | Runtime user-input request record / runtime 用户输入请求记录 | CLI host, `runtime` | headless fail-closed and interactive fake tests / headless fail-closed 与交互 fake 测试 |
| `approval.permission` | Approval request capability with audit evidence / 带审计证据的审批请求 capability | `policy-sandbox`, CLI host, `runtime` | approval allow/deny/cancel matrix / 审批 allow/deny/cancel 矩阵 |
| `pipeline.sequence` | Sequential runtime pipeline capability / 顺序 runtime pipeline capability | `runtime`, `workflow-orchestration` | read-patch-test pipeline fixture / read-patch-test 管线 fixture |
| `pipeline.parallel` | Parallel pipeline with declared locks / 带声明式 locks 的并行 pipeline | `runtime`, `workflow-orchestration`, concurrency | overlapping-write rejection fixture / 写范围重叠拒绝 fixture |
| `pipeline.artifact-routing` | Typed artifact references between steps / steps 间 typed artifact refs 路由 | `runtime`, `runtime-message-bus` | bounded artifact replay fixture / 有界 artifact replay fixture |
| `pipeline.stream` | Bounded stream routing with truncation metadata / 带截断元数据的有界 stream 路由 | `runtime`, `workflow-orchestration` | stream backpressure and cancellation tests / stream 背压与取消测试 |
| `agent.spawn` | Spawn worker agent with scope / 按 scope 创建 worker agent | `runtime`, `agent-management`, core wrapper | existing spawn coverage plus family scope tests / 现有 spawn 加 family scope 测试 |
| `agent.message-continue` | Send continuation to worker / 向 worker 发送继续消息 | `runtime`, `agent-management`, core wrapper | existing continue coverage / 现有 continue 覆盖 |
| `agent.wait-result` | Wait for worker completion with timeout / 等待 worker 完成并支持 timeout | `runtime`, `agent-management`, core wrapper | fake worker completion/timeout tests / fake worker 完成与 timeout 测试 |
| `agent.stop-close` | Stop or close worker session / 停止或关闭 worker session | `runtime`, `agent-management`, core wrapper | existing stop coverage plus idempotency / 现有 stop 加幂等测试 |
| `web.search` | Provider-neutral web search / provider-neutral web search | `core-coding-tools`, `model-gateway` | existing fake provider coverage / 现有 fake provider 覆盖 |
| `web.fetch` | Provider-neutral web fetch / provider-neutral web fetch | `core-coding-tools`, `model-gateway` | existing fake provider coverage / 现有 fake provider 覆盖 |
| `web.extract` | Extract title/text/links from fetched HTML / 从 HTML 提取 title/text/links | `core-coding-tools`, `model-gateway` | deterministic HTML fixture / 确定性 HTML fixture |
| `web.data-lookup` | Structured public data lookup adapter / 结构化公共数据查询 adapter | `model-gateway`, `core-coding-tools` wrapper | fake finance/weather/search lookup fixture / fake 数据查询 fixture |
| `browser.navigate` | Navigate fake/real browser page / 导航 fake 或真实 browser page | browser profile in `mcp-gateway` or connector package | fake browser route fixture / fake browser route fixture |
| `browser.interact` | Click/type/select browser elements / 点击、输入、选择 browser 元素 | browser connector | DOM state transition tests / DOM 状态转换测试 |
| `browser.inspect` | Inspect DOM, console, network summary / 检查 DOM、console、network 摘要 | browser connector | bounded DOM and console fixtures / 有界 DOM 与 console fixtures |
| `browser.screenshot` | Screenshot page or element artifact / 页面或元素截图 artifact | browser connector | fake screenshot artifact and optional real browser smoke / fake screenshot 与可选 real smoke |
| `mcp.server-lifecycle` | Connect/list/disconnect MCP server / 连接、列出、断开 MCP server | `mcp-gateway` | fake server lifecycle tests / fake server lifecycle 测试 |
| `mcp.tool-call` | Governed MCP tool invocation / 受治理 MCP tool 调用 | `mcp-gateway` | fake tool call with auth/redaction evidence / fake tool 调用含 auth/redaction 证据 |
| `mcp.resource-read` | Governed MCP resource read / 受治理 MCP resource 读取 | `mcp-gateway` | fake resource cache/replay tests / fake resource cache/replay 测试 |
| `mcp.prompt` | MCP prompt listing/rendering / MCP prompt 列出与渲染 | `mcp-gateway` | fake prompt projection tests / fake prompt projection 测试 |
| `skill.list-activate` | List and activate skills / 列出并激活 skills | `skill-system`, core wrappers | existing skill wrappers plus activation fixture / 现有 skill wrappers 加激活 fixture |
| `hook.list-run` | List and execute governed hooks / 列出并执行受治理 hooks | `hook-system`, core wrappers | existing hook list plus fake hook run / 现有 hook list 加 fake hook run |
| `plugin.install-verify` | Install, verify, lock, and diff plugin / 安装、验证、锁定与 diff plugin | `plugin-system`, CLI host | fake plugin lock/integrity tests / fake plugin lock 与 integrity 测试 |
| `command.palette-slash` | Palette and slash command capability projection / palette 与 slash command capability projection | `command-system`, CLI host | command composition fixtures / command composition fixtures |
| `image.generate` | Generate image artifact through fake/provider adapter / 通过 fake 或 provider adapter 生成图片 artifact | media provider package, `model-gateway` | deterministic image metadata artifact / 确定性图片元数据 artifact |
| `image.edit` | Edit image artifact through fake/provider adapter / 通过 fake 或 provider adapter 编辑图片 artifact | media provider package | input image bounds and output artifact tests / 输入图片边界与输出 artifact 测试 |
| `image.search-stock` | Search stock images through fake/provider adapter / 通过 fake 或 provider adapter 搜索图库 | media provider package | fake stock result fixture / fake stock result fixture |
| `image.inspect` | Inspect image dimensions/type/metadata / 检查图片尺寸、类型、元数据 | host/media package | local image metadata fixture / 本地图片元数据 fixture |
| `design.document-state` | Read design document/editor state / 读取 design document/editor state | design MCP/profile package | fake document state fixture / fake document state fixture |
| `design.node-query` | Query design nodes by id/pattern / 按 id/pattern 查询 design nodes | design connector | fake node tree query tests / fake node tree 查询测试 |
| `design.batch-edit` | Apply governed batch design operations / 应用受治理 batch design operations | design connector | transactional fake canvas edit tests / transactional fake canvas edit 测试 |
| `design.export-snapshot` | Export design node snapshot artifact / 导出 design node snapshot artifact | design connector | fake PNG/PDF artifact metadata tests / fake PNG/PDF artifact metadata 测试 |
| `memory.read-write` | Read/write scoped memory records / 读写 scoped memory records | `memory-cache-management`, core wrapper | session/workspace memory fixture / session/workspace memory fixture |
| `context.project-index` | Build/query project context index / 构建和查询 project context index | `context-engine`, `code-intelligence` | deterministic index refresh/query tests / 确定性 index refresh/query 测试 |
| `session.resume-fork` | Resume or fork session via capability / 通过 capability resume 或 fork session | `session-store`, `runtime`, core wrapper | existing session tests plus model-visible wrapper / 现有 session 测试加 model-visible wrapper |
| `compact.summary` | Produce bounded compact session summary / 生成有界 compact session summary | `runtime`, `prompt-assembly` | summary budget and replay tests / summary budget 与 replay 测试 |
| `remote.runtime` | Connect/query remote runtime profile / 连接或查询 remote runtime profile | `remote-runtime-connectivity`, host adapter | fake remote connection fixture / fake remote connection fixture |
| `worktree.environment` | Create/list/cleanup governed worktree env / 创建、列出、清理受治理 worktree env | `workspace-state-management`, `platform-abstraction` | fake git worktree and cleanup tests / fake git worktree 与 cleanup 测试 |
| `schedule.sleep-cron` | Sleep, schedule, and cancel deterministic jobs / sleep、schedule、cancel 确定性 jobs | `concurrency-orchestration`, runtime wrapper | fake clock tests / fake clock 测试 |
| `observability.trace-budget` | Query trace, usage, and budget evidence / 查询 trace、usage 与 budget evidence | `observability-privacy`, `usage-budget-management` | redacted diagnostics bundle fixture / 脱敏 diagnostics bundle fixture |

### Decision: Every Family Gets A Minimal Real Operation First

The first implementation for each family may be narrow, but it must be real. A minimal family operation needs schema, executor, governed runtime path, bounded output, deterministic fake dependency where needed, and family evidence.

每个 family 的第一版实现可以很窄，但必须真实。最小 family operation 需要 schema、executor、受治理 runtime path、有界输出、必要时的 deterministic fake dependency，以及 family evidence。

Examples:

- `workspace.glob`: use platform file search with glob semantics and bounded path output.
- `workspace.glob`：使用 platform file search 实现 glob semantics，并输出有界 paths。
- `patch.apply`: apply multi-hunk unified patches with precondition checks and rollback evidence.
- `patch.apply`：应用 multi-hunk unified patches，包含 precondition checks 与 rollback evidence。
- `browser.screenshot`: capture from deterministic fake browser in default tests and optionally from a real browser connector.
- `browser.screenshot`：默认测试使用 deterministic fake browser capture，可选支持真实 browser connector。
- `image.generate`: produce deterministic artifact metadata from fake provider by default, with opt-in provider-native execution later.
- `image.generate`：默认通过 fake provider 生成确定性 artifact metadata，之后可选接入 provider-native execution。

Alternative considered: wait until every family has production-grade implementation before registration. Rejected because deterministic minimal operations let us build the scoring and governance loop safely, then improve depth family by family.

备选方案：等每个 family 都达到 production-grade 后再注册。拒绝原因是确定性的最小真实操作可以先把评分与治理闭环搭起来，再逐个 family 加深能力。

### Decision: Connector Families Use Fake-First Profiles

Browser, MCP, media, design, remote, and provider-dependent web/data families start with fake-first connector profiles. A fake profile is not a placeholder because it executes through the same manifest, policy, preflight, runtime, evidence, and scorecard path as a real connector.

Browser、MCP、media、design、remote 与 provider-dependent web/data families 先使用 fake-first connector profiles。fake profile 不是占位，因为它和真实 connector 走同样的 manifest、policy、preflight、runtime、evidence 与 scorecard 路径。

Alternative considered: mark connector families unavailable until live services are configured. Rejected because default tests need deterministic coverage and product contracts should be testable locally.

备选方案：在配置 live services 前把 connector families 标为 unavailable。拒绝原因是默认测试需要确定性覆盖，产品契约也必须能本地测试。

### Decision: Pipeline Families Are Runtime Capabilities, Not Shell Syntax

The four `pipeline.*` families are implemented as runtime-owned capabilities that execute declared steps through the registry. They record policy, preflight, execution, artifact routing, stream bounds, cancellation, replay ids, and final evidence. Shell pipes inside `shell.run` do not count.

四个 `pipeline.*` families 作为 runtime-owned capabilities 实现，通过 registry 执行声明式 steps。它们必须记录 policy、preflight、execution、artifact routing、stream bounds、cancellation、replay ids 与最终 evidence。`shell.run` 内部的 shell pipe 不计入 pipeline 能力。

Alternative considered: implement pipelines by concatenating command stdout into next tool input. Rejected because that bypasses schema validation, redaction, policy, and replay.

备选方案：通过把 command stdout 拼接进下一个 tool input 来实现 pipeline。拒绝原因是这会绕过 schema validation、redaction、policy 与 replay。

### Decision: Score Completion Requires Family-Level Task Evidence

Family implementation alone does not make a family fully pass. Each family needs static contract tests, deterministic execution tests, safety tests, and at least one representative task fixture. Live provider evidence remains optional unless the user enables live tests.

仅有 family implementation 不代表该 family 完全通过。每个 family 都需要 static contract tests、deterministic execution tests、safety tests 与至少一个代表性 task fixture。除非用户启用 live tests，否则 live provider evidence 保持可选。

Alternative considered: count a family as complete when it registers a manifest and executor. Rejected because registration alone does not prove task usefulness or safe behavior.

备选方案：只要注册 manifest 与 executor 就计为 complete。拒绝原因是注册本身不能证明任务有用性或安全行为。

## Risks / Trade-offs

- [Risk] The implementation surface is large. -> Mitigation: split work by domain slices and require each slice to land tests and diagnostics before moving to the next.
- [风险] 实现面很大。-> 缓解：按 domain slices 拆分，每个 slice 必须带测试和 diagnostics 后再进入下一 slice。
- [Risk] Fake connectors could create misleading confidence. -> Mitigation: scorecards label fake/replayed/live evidence separately and do not claim provider-native support from fake evidence.
- [风险] fake connectors 可能制造误导性信心。-> 缓解：scorecards 分开标注 fake/replayed/live evidence，不用 fake evidence 声称 provider-native support。
- [Risk] New tools may pressure permissions and sandboxing. -> Mitigation: every family declares risk, host requirements, policy/preflight gates, timeout, redaction, and safety tests.
- [风险] 新工具可能给 permissions 与 sandboxing 带来压力。-> 缓解：每个 family 都声明 risk、host requirements、policy/preflight gates、timeout、redaction 与 safety tests。
- [Risk] Provider and host APIs may diverge. -> Mitigation: normalize all external surfaces through provider-neutral contracts and connector profiles before model projection.
- [风险] provider 与 host APIs 可能分化。-> 缓解：所有外部 surfaces 在 model projection 前先归一化为 provider-neutral contracts 与 connector profiles。

## Migration Plan

1. Add missing platform contracts for tool family registration, projection filtering, pipeline records, connector profiles, artifact refs, and family task evidence.
2. 增加缺失 platform contracts：tool family registration、projection filtering、pipeline records、connector profiles、artifact refs 与 family task evidence。
3. Implement local deterministic families first: workspace glob, asset view, patch, revert, REPL, package manager, plan/control, memory/context/session, worktree, schedule, and observability.
4. 先实现本地确定性 families：workspace glob、asset view、patch、revert、REPL、package manager、plan/control、memory/context/session、worktree、schedule 与 observability。
5. Implement runtime pipeline families and forbid executor-to-executor private chaining through lint/runtime validation.
6. 实现 runtime pipeline families，并通过 lint/runtime validation 禁止 executor-to-executor 私下互调。
7. Implement connector-backed fake-first families for browser, MCP, media, design, remote runtime, and web data lookup.
8. 实现 connector-backed fake-first families：browser、MCP、media、design、remote runtime 与 web data lookup。
9. Extend diagnostics evaluate and acceptance evidence with 64-family parity, family task fixtures, and family safety fixtures.
10. 扩展 diagnostics evaluate 与 acceptance evidence，加入 64-family parity、family task fixtures 与 family safety fixtures。
11. Update release readiness to report family capability completion separately from live provider parity.
12. 更新 release readiness，将 family capability completion 与 live provider parity 分开报告。

Rollback is per-family: disable a failing family projection while keeping the catalog denominator and scorecard entry. Do not remove family ids or replace failed implementations with placeholders.

回滚按 family 执行：禁用失败 family projection，但保留 catalog denominator 与 scorecard entry。不得删除 family id，也不得用占位实现替代失败实现。

## Open Questions

- Which families should be release-blocking for the first public CLI release versus reported as implemented but provider-limited?
- 哪些 families 应作为首个公开 CLI release 的阻断项，哪些可以报告为已实现但 provider-limited？
- Should browser/design/media connector packages be separate packages or profiles inside `mcp-gateway` for the first implementation?
- 第一版 browser/design/media connector packages 应拆成独立包，还是先作为 `mcp-gateway` 内 profiles？
- Should live family coverage run one representative task per family or group related families into multi-family scenarios?
- live family coverage 应每个 family 跑一个代表性任务，还是把相关 families 合并进 multi-family scenarios？
