# DeepSeek CLI

Future-ready AI coding-agent platform for DeepSeek.

DeepSeek CLI is a contract-first TypeScript monorepo for building a governed, extensible, cross-host AI engineering tool. It benchmarks the product surface of Claude Code and Codex, but the implementation is DeepSeek-owned: the CLI, VSCode extension, runtime kernel, provider gateway, tools, policies, memory, orchestration, and tests are designed as platform layers instead of one growing command-line script.

DeepSeek CLI 是一个面向未来的 AI Coding Agent 平台，采用 contract-first 的 TypeScript monorepo 架构。项目对标 Claude Code 和 Codex 的产品能力面，但实现完全按 DeepSeek 自有架构推进：CLI、VSCode 扩展、运行时内核、模型网关、工具、策略、记忆、编排和测试都作为平台层设计，而不是一个不断膨胀的命令行脚本。

## Project Goals / 项目目标

- Build a headless runtime kernel that can be reused by CLI, VSCode, local server, SDK, and future hosts.
- Provide a first-class DeepSeek AI provider through OpenAI-compatible APIs while keeping provider differences isolated behind `model-gateway`.
- Make every capability discoverable, governable, testable, schedulable, and observable.
- Enforce architecture boundaries with AST lint rules before the codebase becomes large.
- Keep platform contracts stable and implementation-free, so future tools, skills, plugins, MCP servers, subagents, and workflows can evolve independently.
- Prefer deterministic local tests by default, with optional live DeepSeek API verification behind explicit environment gates.

- 构建可被 CLI、VSCode、本地 server、SDK 和未来 host 复用的 headless runtime kernel。
- 通过 OpenAI-compatible API 接入 DeepSeek，同时把不同模型供应商的差异隔离在 `model-gateway` 之后。
- 让每一种能力都可以注册、治理、测试、调度和观测。
- 在代码规模变大之前，用 AST lint 规则强制架构边界。
- 保持平台契约稳定且无实现依赖，让工具、skills、plugins、MCP、subagents 和 workflows 可以独立演进。
- 默认使用确定性的本地测试；真实 DeepSeek API 验证必须显式开启。

## Architecture / 架构

```text
Hosts / Host 适配层
  src/apps/cli
  src/apps/vscode-extension

Protocol and runtime / 协议与运行时
  communication-protocol
  runtime-message-bus
  runtime
  session-store

Capability platform / 能力平台
  capability-registry
  workflow-orchestration
  concurrency-orchestration
  agent-management
  tool-intent-preflight
  command-system

Governance / 治理层
  platform-contracts
  policy-sandbox
  platform-abstraction
  config
  credential-auth-management
  usage-budget-management
  observability

AI and context / AI 与上下文
  model-gateway
  context-engine
  memory-cache-management
  code-intelligence

Extension surface / 扩展面
  skill-system
  hook-system
  mcp-gateway
  plugin-system
  extension-system
  distribution-update-management
  remote-runtime-connectivity

Quality platform / 质量平台
  testing-regression
  tests/contracts
  tests/integration
  tests/golden
  tests/compatibility
  tests/matrix
  tests/e2e
```

The core rule is simple: app hosts are thin adapters, shared behavior lives in `src/packages/*`, and cross-package APIs go through `@deepseek/platform-contracts`.

核心规则很简单：app host 只做薄适配，共享能力放在 `src/packages/*`，跨包 API 必须走 `@deepseek/platform-contracts`。

## Current Status / 当前状态

The project is in foundation stage. The first platform skeleton is in place, the DeepSeek provider layer exists, persistent local config/auth readiness has been implemented, and the next active OpenSpec is hardening the cross-platform platform layer.

项目当前处于基础设施阶段。第一版平台骨架已经落地，DeepSeek provider 层已经存在，本地持久化 config/auth readiness 已实现；当前活跃 OpenSpec 正在推进跨平台 platform layer 加固。

Active OpenSpec:

当前活跃 OpenSpec：

```text
harden-cross-platform-platform-layer
```

Completed archived OpenSpec examples:

已完成并归档的 OpenSpec 示例：

```text
2026-05-08-implement-persistent-config-and-auth
```

## Done / 已完成

- Contract-first monorepo with separate CLI and VSCode host directories.
- Platform package boundaries and architecture lint framework.
- Headless runtime kernel skeleton with message bus, protocol, scheduler, workflow, policy, and capability contracts.
- DeepSeek model provider integration through an OpenAI-compatible provider boundary.
- Provider request normalization, streaming/event normalization, usage metadata, retry/timeout policy, and optional live verification hooks.
- Tool-intent preflight for validating and repairing model-produced tool calls before execution.
- Persistent config service with workspace/user/default precedence, schema validation, platform-controlled metadata paths, and migration diagnostics.
- Credential/auth management with secret references instead of raw secret propagation.
- Local readiness commands for init/config/doctor style workflows.
- Deterministic fakes, contract tests, integration tests, golden tests, compatibility tests, matrix tests, and E2E test surfaces.
- OpenSpec-driven planning and archive workflow.

- 已建立 contract-first monorepo，并将 CLI 与 VSCode host 目录分离。
- 已建立平台包边界和架构 lint 框架。
- 已建立 headless runtime kernel 骨架，包含 message bus、protocol、scheduler、workflow、policy 和 capability contracts。
- 已通过 OpenAI-compatible provider boundary 接入 DeepSeek 模型。
- 已支持 provider request 归一化、stream/event 归一化、usage metadata、retry/timeout policy 和可选 live verification hooks。
- 已建立 tool-intent preflight，在工具执行前校验和修复模型生成的工具调用。
- 已实现持久化 config service，包含 workspace/user/default 优先级、schema validation、platform-controlled metadata paths 和 migration diagnostics。
- 已实现 credential/auth management，通过 secret references 传递凭证引用，避免 raw secret 扩散。
- 已实现 init/config/doctor 等本地 readiness 命令能力。
- 已建立 deterministic fakes、contract tests、integration tests、golden tests、compatibility tests、matrix tests 和 E2E test surfaces。
- 已建立 OpenSpec 驱动的规划、实现和归档流程。

## Roadmap / 产品规划

| Node | Outcome | 结果 |
| --- | --- | --- |
| R0 Foundation | Governed runtime platform with contracts, provider gateway, scheduling, policy, testing, and lint boundaries. | 建立受治理的运行时平台，包含契约、provider gateway、调度、策略、测试和 lint 边界。 |
| R1 MVP Coding Agent | `deepseek -p` and a minimal interactive CLI can inspect, edit, and test local repositories through safe tools. | `deepseek -p` 和最小交互式 CLI 能通过安全工具检查、编辑和测试本地仓库。 |
| R2 Context And Safety | Long sessions gain context graph, memory/cache, compaction, sandbox matrix, budgets, checkpoints, and code intelligence. | 长会话具备 context graph、memory/cache、compaction、sandbox matrix、预算、checkpoint 和 code intelligence。 |
| R3 Extensibility | Skills, hooks, MCP, plugins, commands, permission diff, lockfiles, and scoped credentials. | 支持 skills、hooks、MCP、plugins、commands、permission diff、lockfiles 和 scoped credentials。 |
| R4 IDE And Server | CLI, VSCode, local daemon/server, and SDK share one runtime protocol and session model. | CLI、VSCode、本地 daemon/server 和 SDK 共享同一 runtime protocol 与 session model。 |
| R5 Multi-Agent Engineering | Subagents, task graphs, concurrency control, team memory, review/test agents, and replayable orchestration. | 支持 subagents、task graphs、并发控制、team memory、review/test agents 和可 replay 的编排。 |
| R6 Product UX And Collaboration | Advanced TUI, keybindings, voice/native host, notifications, tips, browser bridge, and collaboration features. | 支持高级 TUI、快捷键、voice/native host、通知、tips、browser bridge 和协作能力。 |
| R7 Enterprise And Ecosystem | Managed policy, audit, update channels, enterprise sync, plugin ecosystem, and compatibility guarantees. | 支持受管策略、审计、更新通道、企业同步、插件生态和兼容性保障。 |

## Next Todo / 下一步待办

- Finish `harden-cross-platform-platform-layer`: shell/search providers, WSL awareness, secure storage probes, native capability probes, platform diagnostics, and matrix coverage.
- Implement core coding tools through governed execution: read, write, edit, glob, search, shell, git status/diff, and test command.
- Build the minimal interactive CLI on top of the same runtime events used by `stream-json`.
- Add session resume, fork, checkpoint, and workspace state history.
- Add context graph, memory/cache governance, compaction, and budget controls.
- Add skills, hooks, MCP gateway, plugin manifest, plugin lockfile, and permission diff.
- Connect VSCode and local server through the same communication protocol instead of separate state machines.
- Expand subagent/task orchestration and concurrency scheduling into a product-grade multi-agent system.
- Add product UX layers: advanced TUI, keybindings, notifications, banners, tips, voice/native host, and browser bridge.

- 完成 `harden-cross-platform-platform-layer`：shell/search providers、WSL 感知、secure storage probes、native capability probes、platform diagnostics 和 matrix 覆盖。
- 通过受治理执行实现核心 coding tools：read、write、edit、glob、search、shell、git status/diff 和 test command。
- 基于同一套 runtime events 构建最小交互式 CLI，并与 `stream-json` 保持一致。
- 增加 session resume、fork、checkpoint 和 workspace state history。
- 增加 context graph、memory/cache governance、compaction 和 budget controls。
- 增加 skills、hooks、MCP gateway、plugin manifest、plugin lockfile 和 permission diff。
- 让 VSCode 和 local server 通过同一通信协议接入，避免各自实现状态机。
- 将 subagent/task orchestration 和 concurrency scheduling 扩展为产品级 multi-agent system。
- 增加产品 UX 层：高级 TUI、快捷键、通知、banner、tips、voice/native host 和 browser bridge。

## Local Development / 本地开发

Install dependencies:

安装依赖：

```bash
npm install
```

Run the default quality gate:

运行默认质量门禁：

```bash
npm run typecheck
npm run lint
npm test
```

Build and smoke-test the CLI:

构建并 smoke-test CLI：

```bash
npm run build:cli
npm run smoke:headless
```

Try local CLI flows:

尝试本地 CLI 流程：

```bash
npx tsx src/apps/cli/src/index.ts -p "smoke" --output stream-json
npx tsx src/apps/cli/src/index.ts init
npx tsx src/apps/cli/src/index.ts config set model deepseek-v4-flash --output json
npx tsx src/apps/cli/src/index.ts doctor --fake-live --output json
```

Published package metadata:

发布包信息：

```text
npm package: deekseek-cli
binary: deepseek
workspace: src/apps/cli
```

## Testing And Acceptance / 测试与验收

Default tests must be offline and deterministic.

默认测试必须离线且确定性运行。

```bash
npm run test:contracts
npm run test:integration
npm run test:golden
npm run test:compatibility
npm run test:matrix
npm run test:e2e
```

Release or acceptance work should also run:

发布或验收工作还应运行：

```bash
npm run build:cli
npm run smoke:headless
node scripts/check-boundaries.mjs
```

Optional live DeepSeek checks require explicit environment opt-in and a local API key. Do not commit `.env` or secrets.

可选的 DeepSeek live checks 需要显式环境开关和本地 API key。不要提交 `.env` 或任何密钥。

```bash
DEEPSEEK_LIVE_TESTS=1 npm run smoke:live:deepseek
DEEPSEEK_LIVE_AUTH_TESTS=1 npm test -- tests/live/deepseek-auth-live-verification.test.ts
```

## OpenSpec Workflow / OpenSpec 工作流

Use OpenSpec for non-trivial architecture, platform, product, protocol, and test-surface changes.

非平凡的架构、平台、产品、协议和测试面变更都应使用 OpenSpec。

```bash
openspec list
openspec validate <change-id> --type change --strict
openspec validate --specs --strict
```

OpenSpec artifacts that describe planning, behavior, or implementation guidance must remain bilingual. Reference implementations may inform capability discovery, but DeepSeek OpenSpecs should describe DeepSeek's own architecture and decisions.

凡是描述规划、行为或实现指导的 OpenSpec 文档必须保持中英双语。参考实现可以用于发现能力面，但 DeepSeek 的 OpenSpec 应描述 DeepSeek 自己的架构和决策。

## Repository Rules / 仓库规则

- Do not commit `参考/`, `.codex/`, `node_modules/`, generated caches, build output, or local secrets.
- Keep `platform-contracts` host-agnostic and implementation-free.
- Do not import one app from another app.
- Prefer package imports such as `@deepseek/runtime` over cross-package relative imports.
- Use the lint framework for architecture boundaries, not manual review alone.
- Treat tests and replay evidence as first-class product artifacts.

- 不要提交 `参考/`、`.codex/`、`node_modules/`、生成缓存、构建产物或本地密钥。
- 保持 `platform-contracts` host-agnostic 且 implementation-free。
- 不允许一个 app 直接 import 另一个 app。
- 跨包引用优先使用 `@deepseek/runtime` 这类 package import，而不是跨包相对路径。
- 架构边界必须靠 lint 框架强制，不只依赖人工 review。
- 测试和 replay evidence 是一等产品资产。

