## 1. CLI Host Split / CLI Host 拆分

- [x] 1.1 Create `src/apps/cli/src/entry`, `commands`, `renderers`, `input`, `host`, and `diagnostics` folders with behavior-preserving module boundaries. / 创建 `src/apps/cli/src/entry`、`commands`、`renderers`、`input`、`host` 和 `diagnostics` 目录，并保持行为等价的模块边界。
- [x] 1.2 Move command parsing and command adapter logic out of `src/apps/cli/src/index.ts` without changing supported CLI commands or flags. / 将 command parsing 与 command adapter 逻辑移出 `src/apps/cli/src/index.ts`，不改变已支持的 CLI commands 或 flags。
- [x] 1.3 Move text, JSON, JSONL, chat, and error rendering helpers into renderer modules while preserving output semantics. / 将 text、JSON、JSONL、chat 和 error rendering helpers 移入 renderer 模块，同时保持输出语义。
- [x] 1.4 Move chat input, scripted input, cancellation, and terminal flag handling into input/host modules without changing current chat behavior. / 将 chat input、scripted input、cancellation 和 terminal flag handling 移入 input/host 模块，不改变当前 chat 行为。
- [x] 1.5 Keep `src/apps/cli/src/index.ts` as a thin executable/export surface and update tests/imports accordingly. / 让 `src/apps/cli/src/index.ts` 保持为薄 executable/export surface，并相应更新 tests/imports。

## 2. Terminal Capability And Rendering Profiles / 终端能力与渲染 Profile

- [x] 2.1 Add typed terminal capability/profile contracts in the appropriate shared or CLI host module without introducing host APIs into `platform-contracts`. / 在合适的共享或 CLI host 模块中增加类型化 terminal capability/profile contracts，且不把 host APIs 引入 `platform-contracts`。
- [x] 2.2 Add renderer profiles for `plain`, `ansi`, `interactive`, `json`, and `jsonl`, and route current rendering decisions through them. / 增加 `plain`、`ansi`、`interactive`、`json` 和 `jsonl` renderer profiles，并让当前渲染决策经过它们。
- [x] 2.3 Add input strategy profiles for `line`, `raw`, `scripted`, and `none`, and route chat input decisions through them. / 增加 `line`、`raw`、`scripted` 和 `none` input strategy profiles，并让 chat input 决策经过它们。
- [x] 2.4 Add deterministic fixtures for Windows, PowerShell/cmd, ConPTY-like TTY, macOS/Linux TTY, CI, non-TTY, redirected output, no-color, and unknown-width profiles where applicable. / 增加适用的 Windows、PowerShell/cmd、类似 ConPTY 的 TTY、macOS/Linux TTY、CI、non-TTY、redirected output、no-color 和 unknown-width profile 确定性 fixtures。
- [x] 2.5 Add rendering/input parity tests proving unsupported terminals degrade to stable line/scripted input and plain/structured output. / 增加 rendering/input parity tests，证明不支持的终端会降级到稳定 line/scripted input 和 plain/structured output。

## 3. Vi-Inspired Composition Contracts / Vi 启发式组合契约

- [x] 3.1 Add composition contracts for modes, actions, targets, counts/repeats, command palette entries, keymap entries, and extension contribution metadata. / 增加 modes、actions、targets、counts/repeats、command palette entries、keymap entries 和 extension contribution metadata 的组合契约。
- [x] 3.2 Add reference-set contracts for files, directories, symbols, diffs, diagnostics, search results, prior messages, and tool evidence with provenance and budget metadata. / 增加 files、directories、symbols、diffs、diagnostics、search results、prior messages 和 tool evidence 的 reference-set 契约，包含 provenance 与 budget metadata。
- [x] 3.3 Add quickfix-style result-list contracts for diagnostics, search matches, test failures, code intelligence findings, tool results, and approval queues. / 增加 diagnostics、search matches、test failures、code intelligence findings、tool results 和 approval queues 的 quickfix 风格 result-list 契约。
- [x] 3.4 Add jump-history contracts for navigating between references, messages, diffs, approvals, result-list items, and sessions without re-running underlying work. / 增加 jump-history 契约，用于在 references、messages、diffs、approvals、result-list items 和 sessions 间导航，且不重新运行底层工作。
- [x] 3.5 Add request/turn-scoped revert targets and actions that connect selected turns, messages, result-list items, and session history to checkpoint/session revert commands. / 增加 request/turn-scoped revert targets 和 actions，将选中的 turns、messages、result-list items 和 session history 连接到 checkpoint/session revert commands。
- [x] 3.6 Add dry-run revert summaries for affected checkpoints, files, session events, context projections, stale restore risks, and non-reversible effects. / 增加 dry-run revert summaries，覆盖 affected checkpoints、files、session events、context projections、stale restore risks 和 non-reversible effects。
- [x] 3.7 Add manifest validation for plugin/user contributions to commands, actions, target resolvers, result-list providers, keymaps, palette entries, and render hints. / 增加 plugin/user 对 commands、actions、target resolvers、result-list providers、keymaps、palette entries 和 render hints 的贡献 manifest 校验。
- [x] 3.8 Add conflict-resolution diagnostics for overlapping core, user, and plugin interaction contributions. / 增加 core、user 和 plugin interaction contributions 重叠时的冲突解析 diagnostics。

## 4. Request Revert And Checkpoint Integration / 请求回退与 Checkpoint 集成

- [x] 4.1 Extend checkpoint/session contracts to resolve checkpoints produced by a target request or turn id. / 扩展 checkpoint/session contracts，用于解析目标 request 或 turn id 产生的 checkpoints。
- [x] 4.2 Implement request/turn-scoped revert using existing checkpoint restore safety checks, including stale current-file rejection. / 使用现有 checkpoint restore safety checks 实现 request/turn-scoped revert，包括 current-file stale 时拒绝。
- [x] 4.3 Emit compensating revert events and evidence without deleting original request, model output, tool evidence, approvals, audit records, or checkpoint records. / 发出补偿性 revert events 与 evidence，不删除原始 request、model output、tool evidence、approvals、audit records 或 checkpoint records。
- [x] 4.4 Update context/session projection so reverted turns are visible as reverted and compensated workspace effects are not presented as current truth. / 更新 context/session projection，使 reverted turns 可见为已回退，并避免将已补偿 workspace effects 呈现为当前事实。
- [x] 4.5 Add tests for successful request revert, partial stale revert, empty revert target, dry-run, non-reversible effect reporting, and redacted revert evidence. / 增加测试，覆盖 successful request revert、partial stale revert、empty revert target、dry-run、non-reversible effect reporting 和 redacted revert evidence。

## 5. Package Index Split And Scale Guardrails / Package Index 拆分与规模护栏

- [x] 5.1 Identify implementation-heavy package `index.ts` files and split selected ones into private modules while preserving public exports. / 识别实现过重的 package `index.ts` 文件，并将选定文件拆入私有模块，同时保持 public exports。
- [x] 5.2 Add lint-framework conventions for central-file thresholds, implementation-heavy `index.ts`, and required split-plan behavior. / 增加 lint-framework conventions，覆盖中心文件阈值、实现过重的 `index.ts` 和必需 split-plan 行为。
- [x] 5.3 Add or update lint-framework rules that report central-file growth and host-edge import bypasses with stable rule ids. / 增加或更新 lint-framework rules，用稳定 rule ids 报告中心文件膨胀和 host-edge import bypass。
- [x] 5.4 Add lint tests or fixtures for file-size thresholds, package index responsibility, app-to-app imports, contract implementation imports, and host/process API boundaries. / 增加 lint tests 或 fixtures，覆盖文件体量阈值、package index 职责、app-to-app imports、contract implementation imports 和 host/process API boundaries。

## 6. Roadmap And OpenSpec Governance / 路线图与 OpenSpec 治理

- [x] 6.1 Update product roadmap docs so large CLI OpenSpecs require Directory Plan, terminal capability impact, vi-inspired composition impact, request/turn revert impact, and reference pit fixture coverage. / 更新产品路线图文档，使大型 CLI OpenSpecs 必须包含 Directory Plan、terminal capability impact、vi-inspired composition impact、request/turn revert impact 和 reference pit fixture coverage。
- [x] 6.2 Update implementation plan docs to include reference sets, quickfix-style result lists, jump history, request/turn revert, and extension contributions as the chosen vi-inspired CLI architecture. / 更新实施方案文档，将 reference sets、quickfix-style result lists、jump history、request/turn revert 和 extension contributions 纳入选定的 vi-inspired CLI architecture。
- [x] 6.3 Ensure new planning text remains bilingual where it describes planning, behavior, or implementation guidance. / 确保新增规划、行为或实现指导文本保持双语。

## 7. Verification / 校验

- [x] 7.1 Run `openspec validate split-cli-host-and-architecture-scale-guardrails --type change --strict`. / 运行 `openspec validate split-cli-host-and-architecture-scale-guardrails --type change --strict`。
- [x] 7.2 Run `openspec validate --specs --strict`. / 运行 `openspec validate --specs --strict`。
- [x] 7.3 Run `npm run typecheck`, `npm run lint`, `npm test`, and `node scripts/check-boundaries.mjs`. / 运行 `npm run typecheck`、`npm run lint`、`npm test` 和 `node scripts/check-boundaries.mjs`。
- [x] 7.4 Run CLI parity checks including text, JSON, JSONL, chat scripted input, golden replay, request revert evidence, and smoke evidence relevant to this refactor. / 运行 CLI parity checks，覆盖 text、JSON、JSONL、chat scripted input、golden replay、request revert evidence 和本重构相关 smoke evidence。
- [x] 7.5 Review `git status --short --ignored` and confirm `参考/`, `.codex/`, `node_modules/`, caches, and secrets are not added. / 检查 `git status --short --ignored`，确认未加入 `参考/`、`.codex/`、`node_modules/`、caches 和 secrets。
