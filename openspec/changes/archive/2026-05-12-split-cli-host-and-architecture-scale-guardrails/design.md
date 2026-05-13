## Context

The CLI-first roadmap depends on the terminal becoming the first polished product surface. The current implementation has a good contract-first package map, but `src/apps/cli/src/index.ts` and several package `index.ts` files are already large enough to become long-term bottlenecks if new approval, diagnostics, extension, and terminal UX work lands in place.

CLI-first 路线依赖终端成为第一个打磨成熟的产品面。当前实现已有良好的 contract-first package map，但 `src/apps/cli/src/index.ts` 和多个 package `index.ts` 已经足够大；如果 approvals、diagnostics、extension 和 terminal UX 继续原地堆叠，会成为长期瓶颈。

The reference CLI also shows that cross-platform terminal input and display become fragile when the product treats terminals as a uniform ANSI surface. DeepSeek should model terminal capability explicitly before adding richer prompts, approval screens, or vi-style input.

参考 CLI 也显示，如果产品把终端统一视为 ANSI 表面，跨平台输入和展示会变得脆弱。DeepSeek 应在加入 richer prompts、approval screens 或 vi-style input 前显式建模 terminal capability。

## Goals / Non-Goals

**Goals:**

- Split CLI host-edge code by responsibility while preserving existing behavior. / 按职责拆分 CLI host-edge code，同时保持现有行为。
- Split implementation-heavy package `index.ts` files so public exports stay stable but implementation moves into private modules. / 拆分实现过重的 package `index.ts`，保持 public exports 稳定，把实现移入私有模块。
- Add lint or lint-framework conventions that prevent central files from silently growing again. / 增加 lint 或 lint-framework conventions，防止中心文件再次无声膨胀。
- Define terminal capability and renderer profiles for text/ANSI/JSON/JSONL, TTY/non-TTY, CI, Windows, macOS, Linux, remote terminals, raw input, and vi-inspired composition profiles. / 定义 terminal capability 与 renderer profiles，覆盖 text/ANSI/JSON/JSONL、TTY/non-TTY、CI、Windows、macOS、Linux、remote terminals、raw input 和 vi-inspired composition profiles。
- Define a vi-inspired CLI composition model for modal interaction, multi-file reference sets, quickfix-style result lists, jump history, composable actions/targets, and user/plugin extension contributions. / 定义 vi-inspired CLI composition model，覆盖模式化交互、多文件引用集、quickfix 风格结果列表、jump history、可组合 actions/targets，以及用户/plugin 扩展贡献。
- Add parity tests proving the refactor does not change current CLI behavior. / 增加 parity tests，证明重构不改变当前 CLI 行为。

**Non-Goals:**

- Do not implement the full permissions approval UX in this change. / 本变更不实现完整 permissions approval UX。
- Do not implement full Vim emulation. / 不实现完整 Vim 模拟。
- Do not add new model, tool, MCP, plugin, or runtime behavior. / 不新增 model、tool、MCP、plugin 或 runtime 行为。
- Do not change public runtime contracts except additive terminal/profile contracts if needed. / 除必要的 additive terminal/profile contracts 外，不改变 public runtime contracts。

## Decisions

### Decision: Split CLI by host-edge responsibility

`src/apps/cli/src/index.ts` will be split into folders such as `entry`, `commands`, `renderers`, `input`, `host`, and `diagnostics`. The current `index.ts` remains a thin executable/export surface that delegates to those modules.

`src/apps/cli/src/index.ts` 将拆分到 `entry`、`commands`、`renderers`、`input`、`host` 和 `diagnostics` 等目录。当前 `index.ts` 保留为薄 executable/export surface，委托给这些模块。

Alternative considered: wait until permissions UX is implemented, then refactor. Rejected because the permissions work would deepen the same file and make the split riskier.

备选方案：等 permissions UX 实现后再重构。该方案被拒绝，因为 permissions 工作会进一步加深同一个文件，使拆分风险更高。

### Decision: Keep package index files as public surfaces

Implementation-heavy package `index.ts` files should be reduced to exports and small composition functions. Private modules should own engine logic, adapters, validation, and rendering helpers.

实现过重的 package `index.ts` 应收敛为导出和少量组合函数。私有模块负责 engine logic、adapters、validation 和 rendering helpers。

Alternative considered: enforce this only through code review. Rejected because central-file growth is easy to miss and should be mechanically visible.

备选方案：仅靠 code review 强制。该方案被拒绝，因为中心文件膨胀很容易被忽略，应该能被机械化发现。

### Decision: Terminal capability is a typed profile, not inline platform branching

The CLI should create a `TerminalCapability` or equivalent host profile once from stdin/stdout/stderr, environment, output mode, CI flags, platform facts, and user preferences. Renderers and input handlers consume this profile instead of branching directly on `process.platform`, `isTTY`, or ANSI assumptions.

CLI 应从 stdin/stdout/stderr、environment、output mode、CI flags、platform facts 和用户偏好一次性创建 `TerminalCapability` 或等价 host profile。renderer 和 input handler 消费该 profile，而不是直接基于 `process.platform`、`isTTY` 或 ANSI 假设分支。

Alternative considered: keep the current minimal `stdinIsTTY/stdoutIsTTY` flags. Rejected because they cannot represent color depth, raw mode support, unicode width behavior, alternate-screen support, paste behavior, CI, remote terminals, or vi-inspired composition support.

备选方案：继续使用当前最小 `stdinIsTTY/stdoutIsTTY` flags。该方案被拒绝，因为它们无法表示 color depth、raw mode support、unicode width behavior、alternate-screen support、paste behavior、CI、remote terminals 或 vi-inspired composition support。

### Decision: Vi-inspired composition is the CLI interaction architecture

The CLI should borrow vi's architecture, not merely its keys: a small core, explicit modes, composable actions/operators, named targets/objects, counts/repeatability, command entries, buffer-like reference sets, quickfix-style result lists, and jump history. This maps naturally to engineering workflows where the user references many files, switches context quickly, walks diagnostics/search results, applies diffs, and repeats actions across targets.

CLI 应借鉴 vi 的架构，而不只是按键：小核心、显式 modes、可组合 actions/operators、命名 targets/objects、counts/repeatability、command entries、类似 buffer 的引用集、quickfix 风格结果列表和 jump history。这天然适合工程工作流：用户会引用多个文件、快速切换上下文、遍历诊断/搜索结果、应用 diff，并在多个 target 上重复动作。

The first implementation pack defines the contracts and host boundaries only. It SHALL NOT require full Vim emulation. Keybindings become one contribution type over the composition model rather than the model itself.

第一个实现包只定义契约与 host boundaries，不要求完整 Vim 模拟。keybindings 只是 composition model 上的一类贡献，而不是模型本身。

### Decision: Multi-file work uses reference sets, result lists, and jumps

The CLI should represent multi-file context as structured workspace objects instead of implicit prompt text. A reference set captures user-selected files, symbols, diffs, diagnostics, or prior turns. A quickfix-style list captures ordered results from search, diagnostics, tests, code intelligence, and tool output. A jump history records navigation between references, messages, diffs, approvals, and results.

CLI 应把多文件上下文表示为结构化 workspace objects，而不是隐含在 prompt 文本里。reference set 捕获用户选择的文件、符号、diff、diagnostics 或历史 turn。quickfix 风格列表捕获 search、diagnostics、tests、code intelligence 和 tool output 产生的有序结果。jump history 记录 references、messages、diffs、approvals 和 results 之间的导航。

This gives plugin authors stable extension points without letting plugins mutate runtime internals. Plugins can contribute target resolvers, list providers, commands, and keymap entries; the CLI host turns user actions into typed command/action requests that flow through shared contracts.

这为 plugin 作者提供稳定扩展点，同时不允许 plugin 修改 runtime internals。plugin 可以贡献 target resolvers、list providers、commands 和 keymap entries；CLI host 将用户动作转换成类型化 command/action requests，并通过共享契约流转。

Full Vim features such as macros, registers, marks, visual mode, and exact editor-buffer semantics are deferred to later rich CLI input packs.

完整 Vim 功能，如 macros、registers、marks、visual mode 和精确 editor-buffer semantics，延后到后续 rich CLI input 包。

### Decision: Revert previous requests through checkpoints and session events

The CLI should support reverting a previous request or turn as a structured action target. This is not transcript deletion and not a raw `git reset`: it is a governed command that resolves a user request/turn id, finds the checkpoints and session effects produced by that turn, restores eligible workspace mutations through checkpoint safety checks, and emits a new revert event that future context projection can honor.

CLI 应支持将之前的 request 或 turn 作为结构化 action target 进行 revert。这不是删除 transcript，也不是裸 `git reset`：它是受治理的 command，会解析 user request/turn id，找到该 turn 产生的 checkpoints 与 session effects，通过 checkpoint safety checks 恢复 eligible workspace mutations，并发出新的 revert event，供后续 context projection 识别。

The original request, model output, tool evidence, approval decisions, and audit records remain immutable. Revert creates compensating evidence: what was targeted, which checkpoint restores succeeded or were rejected as stale, which session/context projections should treat the turn as reverted, and which effects could not be automatically undone.

原始 request、model output、tool evidence、approval decisions 和 audit records 保持不可变。revert 创建补偿性 evidence：目标是什么、哪些 checkpoint restore 成功或因 stale 被拒绝、哪些 session/context projection 应将该 turn 视为 reverted，以及哪些 effects 无法自动撤销。

Initial scope should cover CLI-visible commands such as revert latest request, revert selected result-list/turn target, and dry-run revert summary. Arbitrary historical rewriting, force restore over changed files, external side-effect reversal, and full Git history manipulation remain out of scope unless a later policy explicitly adds them.

初始范围应覆盖 CLI-visible commands，例如 revert latest request、revert selected result-list/turn target 和 dry-run revert summary。任意历史改写、覆盖已变更文件的 force restore、外部副作用反转和完整 Git 历史操作不在范围内，除非后续策略显式加入。

### Decision: Renderer profiles choose lowest reliable output

The renderer should choose among `plain`, `ansi`, `interactive`, `json`, and `jsonl` profiles. Non-TTY, CI, redirected output, unknown width, or unsupported unicode/ANSI should degrade to stable plain text or structured JSON/JSONL rather than broken rich output.

renderer 应在 `plain`、`ansi`、`interactive`、`json` 和 `jsonl` profiles 中选择。non-TTY、CI、redirected output、unknown width 或不支持 unicode/ANSI 时，应降级为稳定 plain text 或 structured JSON/JSONL，而不是破损 rich output。

Alternative considered: make rich ANSI the default everywhere. Rejected because cross-platform output bugs reduce trust and make golden tests unstable.

备选方案：让 rich ANSI 在所有地方默认启用。该方案被拒绝，因为跨平台输出问题会降低信任，并使 golden tests 不稳定。

## Risks / Trade-offs

- [Risk] Splitting files creates churn without user-visible features. -> Mitigation: keep scope behavior-preserving and require parity tests before feature work resumes.
- [风险] 拆分文件会产生无用户可见功能的 churn。-> 缓解：保持范围为行为等价，并要求 parity tests 后再恢复功能工作。
- [Risk] File-size lint can be too rigid. -> Mitigation: warnings at the lower threshold, hard failures only for central files or missing split plans.
- [风险] 文件体量 lint 可能过于僵硬。-> 缓解：低阈值只警告；只对中心文件或缺少拆分计划时 hard fail。
- [Risk] Terminal detection can become platform-specific complexity. -> Mitigation: isolate it in the CLI host/input layer and test with profile fixtures instead of live terminal assumptions.
- [风险] terminal detection 可能变成平台特定复杂度。-> 缓解：隔离在 CLI host/input 层，并通过 profile fixtures 测试，而不是依赖 live terminal 假设。
- [Risk] Vi-inspired composition can consume too much scope. -> Mitigation: this change defines contracts, directory boundaries, and fixtures only; full vi/vim UX remains deferred.
- [风险] vi-inspired composition 可能吞掉太多范围。-> 缓解：本变更只定义 contracts、目录边界和 fixtures；完整 vi/vim UX 延后。

## Migration Plan

1. Create the new CLI host-edge folders and move existing functions without changing call order. / 创建新的 CLI host-edge 目录，并移动现有函数，不改变调用顺序。
2. Add terminal capability/profile types and route current render/input decisions through them with equivalent defaults. / 增加 terminal capability/profile 类型，并用等价默认值让当前 render/input decisions 经过它们。
3. Add vi-inspired composition contracts for modes, actions, targets, reference sets, result lists, jump history, request/turn revert targets, keymaps, and extension contributions without changing runtime execution behavior. / 增加 vi-inspired composition contracts，覆盖 modes、actions、targets、reference sets、result lists、jump history、request/turn revert targets、keymaps 和 extension contributions，且不改变 runtime execution 行为。
4. Add request/turn-scoped revert contracts that connect CLI actions to checkpoint undo and session/context projection evidence. / 增加 request/turn-scoped revert contracts，将 CLI actions 连接到 checkpoint undo 与 session/context projection evidence。
5. Split selected implementation-heavy package `index.ts` files into private modules while preserving public exports. / 将选定的实现过重 package `index.ts` 拆到私有模块，同时保持 public exports。
6. Add lint-framework rules/conventions and tests for central-file size and index responsibility. / 增加 lint-framework rules/conventions 和测试，覆盖中心文件体量与 index 职责。
7. Run typecheck, lint, unit/contract/integration/golden/e2e smoke, and OpenSpec validation. / 运行 typecheck、lint、unit/contract/integration/golden/e2e smoke 和 OpenSpec validation。

Rollback: because behavior should remain equivalent, rollback is a source-level revert of this refactor. No data migration is expected.

回滚：由于行为应保持等价，回滚为源码级 revert。本变更不预期数据迁移。
