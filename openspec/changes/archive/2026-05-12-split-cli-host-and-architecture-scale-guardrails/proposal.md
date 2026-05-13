## Why

DeepSeek is about to move from a minimal CLI into a polished CLI-first product. The current package map is sound, but the CLI host entrypoint and several package `index.ts` files are already large enough that adding approvals, diagnostics, extension UX, and rich terminal behavior directly would recreate the central-file pressure seen in mature reference CLIs.

DeepSeek 即将从最小 CLI 进入 CLI-first 产品打磨阶段。当前 package map 方向正确，但 CLI host entrypoint 和多个 package `index.ts` 已经足够大；如果直接继续加入 approvals、diagnostics、extension UX 和 rich terminal behavior，就会重演成熟参考 CLI 的中心文件压力。

This change creates the enabling architecture guardrails before feature expansion: split host-edge code, constrain implementation hubs, require directory plans, and introduce terminal capability profiles so cross-platform input and rendering are not treated as raw ANSI strings plus stdin.

本变更在功能扩张前建立先行架构护栏：拆分 host-edge code，约束实现中心文件，要求目录计划，并引入 terminal capability profiles，避免把跨平台输入与展示简单当作 ANSI 字符串加 stdin。

## What Changes

- Split `src/apps/cli/src/index.ts` into CLI host-edge modules for entry, command adapters, renderers, input, host wiring, and diagnostics without changing product behavior. / 将 `src/apps/cli/src/index.ts` 拆成 entry、command adapters、renderers、input、host wiring 和 diagnostics 等 CLI host-edge 模块，不改变产品行为。
- Split implementation-heavy package `index.ts` files into private modules while preserving public exports and import compatibility. / 将实现过重的 package `index.ts` 拆成私有模块，同时保持 public exports 和 import compatibility。
- Add architecture lint rules or lint-framework conventions that flag central-file growth, implementation-heavy package `index.ts`, and host-edge imports that bypass shared contracts. / 增加架构 lint 规则或 lint-framework conventions，识别中心文件膨胀、实现过重的 package `index.ts` 和绕过共享契约的 host-edge imports。
- Add a required "Directory Plan / 目录计划" standard for large future OpenSpecs, including owner packages, subdirectories, public exports, private modules, fixtures, and split triggers. / 为后续大型 OpenSpec 增加必需的 "Directory Plan / 目录计划" 标准，包含 owner packages、子目录、公开导出、私有模块、fixtures 和拆分触发条件。
- Introduce terminal capability and renderer profiles so text, ANSI, JSON, JSONL, interactive prompt, vi-inspired interaction profiles, non-TTY, CI, Windows, macOS, Linux, and remote terminals are handled through typed capability decisions. / 引入 terminal capability 与 renderer profiles，使 text、ANSI、JSON、JSONL、interactive prompt、vi-inspired interaction profiles、non-TTY、CI、Windows、macOS、Linux 和 remote terminals 通过类型化 capability decisions 处理。
- Define a vi-inspired CLI composition model: small core modes, composable actions and targets, keymap profiles, command palette entries, multi-file workspace navigation, quickfix-style result lists, jump history, and user/plugin extension contributions. / 定义 vi-inspired CLI composition model：小核心模式、可组合 actions 与 targets、keymap profiles、command palette entries、多文件 workspace navigation、quickfix 风格结果列表、jump history，以及用户/plugin 扩展贡献。
- Define request/turn-level revert as a first-class CLI action over checkpoint/session contracts, so users can revert a previous request's workspace effects without deleting audit history. / 将 request/turn 级 revert 定义为基于 checkpoint/session contracts 的一等 CLI action，使用户可以撤销之前请求造成的 workspace effects，同时不删除审计历史。
- Preserve existing CLI behavior through snapshot, smoke, golden, and e2e parity evidence. / 通过 snapshot、smoke、golden 和 e2e parity evidence 保持现有 CLI 行为。
- Do not add new product workflows in this change. / 本变更不新增产品 workflow。

## Capabilities

### New Capabilities

- `architecture-scale-guardrails`: Directory, file-size, public-export, host-boundary, and lint guardrails that keep large CLI-first implementation packs from collapsing into central files. / 目录、文件体量、公开导出、host boundary 和 lint 护栏，避免大型 CLI-first 实施包坍缩到中心文件。
- `terminal-capability-rendering`: Terminal capability detection, input strategy selection, vi-inspired interaction profile selection, and renderer profiles for cross-platform CLI input and display parity. / 终端能力探测、输入策略选择、vi-inspired interaction profile selection 和 renderer profiles，用于跨平台 CLI 输入与展示一致性。
- `vi-inspired-cli-composition`: Modal, composable, extension-friendly CLI interaction contracts for commands, actions, targets, buffers/reference sets, quickfix lists, jump history, keymaps, and user/plugin contributions. / 面向 commands、actions、targets、buffers/reference sets、quickfix lists、jump history、keymaps 与用户/plugin 贡献的模式化、可组合、可扩展 CLI 交互契约。

### Modified Capabilities

- `product-roadmap`: Require future large product-facing OpenSpecs to include directory plans, reference coverage, pit-fixture coverage, and terminal capability impact when host UX changes. / 要求后续大型产品 OpenSpec 在涉及 host UX 时包含目录计划、参考覆盖、坑位 fixture 覆盖和 terminal capability impact。
- `minimal-chat-cli`: Require chat input and rendering to be routed through terminal capability and renderer profiles instead of hard-coded terminal assumptions. / 要求 chat input 与 rendering 通过 terminal capability 和 renderer profiles，而不是硬编码终端假设。
- `checkpoint-undo`: Extend checkpoint undo from latest/file-scoped mutation undo to request/turn-scoped revert with structured session evidence, workspace safety checks, and context projection updates. / 将 checkpoint undo 从最新/file-scoped mutation undo 扩展为 request/turn-scoped revert，包含结构化 session evidence、workspace safety checks 和 context projection updates。

## Impact

- Affects `src/apps/cli/src/*`, especially the current single CLI entry file. / 影响 `src/apps/cli/src/*`，尤其是当前单文件 CLI 入口。
- Affects implementation-heavy package entry files such as `platform-abstraction`, `mcp-gateway`, `model-gateway`, `context-engine`, `policy-sandbox`, and `command-system`, but should preserve public exports. / 影响 `platform-abstraction`、`mcp-gateway`、`model-gateway`、`context-engine`、`policy-sandbox` 和 `command-system` 等实现较重的 package entry files，但应保持 public exports。
- Affects `scripts/lint-framework/` conventions and rules. / 影响 `scripts/lint-framework/` conventions 与 rules。
- Affects CLI rendering and input tests by adding terminal profile fixtures. / 通过增加 terminal profile fixtures 影响 CLI rendering 和 input tests。
- No runtime API behavior change is intended. / 不意图改变 runtime API 行为。
