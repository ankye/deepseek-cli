<div align="center">

# 🧠 DeepSeek CLI

**Future-Ready AI Engineering Runtime for Local Coding Agents**

**面向未来的本地 Coding Agent AI 工程运行时**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-Win%20%7C%20macOS%20%7C%20Linux%20%7C%20WSL-blue)]()

</div>

---

## 🤔 What Is This? / 这是什么？

DeepSeek CLI is **not** a single CLI script. It is a **contract-first platform** — one governed runtime kernel that serves every host surface:

DeepSeek CLI **不是**一个单体脚本，而是一套**契约先行平台** — 一个受治理 runtime kernel 服务所有 host 端：

```
                    ┌─── Terminal CLI
                    ├─── VSCode Extension
 Runtime Kernel ────├─── Local Server / SDK
                    ├─── Native Host
                    └─── Browser Bridge
```

> **One kernel. One protocol. Many hosts. / 一个内核，一套协议，多端适配。**

---

## ❓ Why Build This? / 为什么做这个？

Claude Code and Codex have proven the trend: **coding agents are becoming programmable engineering systems** — reading repos, editing files, running commands, calling tools, integrating IDEs, coordinating subagents.

Claude Code 和 Codex 证明了趋势：**coding agent 正在演变为可编排的工程系统**。

**The problem / 问题：** existing products build each surface (CLI, IDE, cloud) as separate state machines with duplicated logic.

**现有产品的问题：** 每个端（CLI、IDE、Cloud）各自维护独立状态机和重复逻辑。

**Our approach / 我们的方案：** start from a clean platform architecture on day one:

| Principle / 原则 | What it means / 含义 |
| :--- | :--- |
| 🏛️ **One Kernel, Many Hosts** | CLI · VSCode · Server · SDK are thin adapters over the same runtime |
| 📨 **One Execution Envelope** | Every action (tool, skill, hook, MCP, plugin, subagent) enters one governed pipeline |
| 📡 **One Protocol Stream** | All hosts consume the same event stream — no surface-specific state machines |
| 🌍 **One Platform Abstraction** | macOS · Linux · Windows · WSL · CI · Remote degrade predictably |
| 🧪 **One Quality System** | Architecture lint → contract tests → golden replay → platform matrix → e2e |
| 🔎 **Evidence-First Output** | Project facts, commands, product copy, reports, and generated artifacts must be grounded before acceptance |
| 🧭 **Visible Reasoning Surface** | TUI, text, JSON, and JSONL show bounded intent, evidence, action, verification, and outcome summaries |

Evidence-first is a product guarantee, not a prompt-writing burden. When a task is fact-sensitive, the CLI workflow is expected to gather local project evidence, classify claims as verified/inferred/assumption/unsupported, and reject unsupported strict claims such as invented package names or commands.

Evidence-first 是产品保证，不是用户写 prompt 的负担。当任务涉及项目事实时，CLI workflow 应先搜集本地项目证据，将声明分类为 verified/inferred/assumption/unsupported，并拒绝虚构 package names 或 commands 等未支持严格声明。

Visible reasoning is the user-facing explanation layer for that workflow. It records concise summaries for intent, assumptions, context selection, tool intent, edit decisions, verification, risk, and outcome, with ids and evidence links that the TUI inspector can follow. It is not raw provider reasoning or hidden chain-of-thought; records and diagnostic bundles keep only redacted summaries, evidence counts/fingerprints, and projection replay fingerprints.

可见推理是该 workflow 的用户可见解释层。它以简洁摘要记录 intent、assumptions、context selection、tool intent、edit decisions、verification、risk 与 outcome，并带有 TUI inspector 可导航的 ids 与 evidence links。它不是 raw provider reasoning 或 hidden chain-of-thought；records 与 diagnostic bundles 只保留脱敏摘要、evidence counts/fingerprints 与 projection replay fingerprints。

The chat TUI is now designed as a DeepSeek Workbench: transcript, command bar, reasoning rail, inspector, activity feed, plugin shelf, and vi-inspired focus keys share one deterministic projection. Current terminals render it as bounded text frames; future fullscreen/raw renderers consume the same model.

Chat TUI 现在按 DeepSeek Workbench 设计：transcript、command bar、reasoning rail、inspector、activity feed、plugin shelf 与 vi-inspired focus keys 共用同一套确定性 projection。当前终端渲染为有界 text frames；未来 fullscreen/raw renderer 复用同一模型。

---

## 🚀 Quick Start / 快速开始

```bash
npm install                # Install dependencies / 安装依赖
npm run typecheck           # Type check / 类型检查
npm run lint                # Architecture + code lint
npm test                    # Run test suite / 运行测试

npm run build:cli           # Build CLI / 构建 CLI
npm run smoke:headless      # Smoke test / 冒烟测试
```

**Try it locally / 本地体验：**

```bash
npx tsx src/apps/cli/src/index.ts run "smoke" --output jsonl
npx tsx src/apps/cli/src/index.ts chat --output jsonl
npx tsx src/apps/cli/src/index.ts context status --output json
npx tsx src/apps/cli/src/index.ts init
npx tsx src/apps/cli/src/index.ts config set model deepseek-v4-flash --output json
npx tsx src/apps/cli/src/index.ts doctor --fake-live --output json
```

<details>
<summary>🔑 Optional: Live DeepSeek API Tests（需要 API Key）</summary>

> Requires explicit env opt-in and local credentials. **Do not commit `.env`.**

```bash
DEEPSEEK_LIVE_TESTS=1 npm run smoke:live:deepseek
DEEPSEEK_LIVE_AGENT_LOOP_TESTS=1 npm run smoke:live:agent-loop
DEEPSEEK_LIVE_AUTH_TESTS=1 npm test -- tests/live/deepseek-auth-live-verification.test.ts
```

</details>

---

## 🏗️ How It Works / 工作原理

The architecture has a clear top-down flow. Read from top to bottom:

整体架构自顶向下流转，从上往下阅读即可：

### Step 1: Host collects intent / Host 收集意图

```
User → CLI / VSCode / Server / SDK → protocol request
```

Hosts are **thin adapters** — they render output and collect input, nothing more.

Host 是**轻量适配器** — 只负责渲染输出和收集输入。

### Step 2: Runtime governs execution / Runtime 治理执行

Every request enters the **same pipeline**, regardless of source:

所有请求进入**同一条管线**，不论来源：

```
Intent → Evidence → Prompt Assembly → Preflight → Policy → Scheduler → Execute → Artifact Gate → Host
         (搜证)     (可重放组装)       (归一化)    (安全门)   (调度)      (执行)    (产物验收)      (渲染)
```

```mermaid
sequenceDiagram
  participant Host
  participant Runtime
  participant Evidence
  participant Prompt
  participant Preflight
  participant Policy
  participant Scheduler
  participant Capability
  participant Bus

  Host->>Runtime: intent / protocol request
  Runtime->>Evidence: classify task + select local evidence
  Evidence-->>Runtime: evidence plan + bounded items
  Runtime->>Prompt: assemble replayable prompt sections
  Prompt-->>Runtime: messages + tool projection + fingerprint
  Runtime->>Preflight: normalize intent
  Preflight->>Policy: envelope + scope + sandbox
  Policy-->>Runtime: allow / deny / rewrite
  Runtime->>Scheduler: schedule governed work
  Scheduler->>Capability: execute (timeout, retry, trace)
  Capability-->>Bus: redacted events + audit
  Bus-->>Host: renderable protocol events
```

### Step 3: Capabilities execute under governance / 能力在治理下执行

All capability types — tools, skills, hooks, MCP, plugins, commands, subagents — are modeled uniformly:

所有能力类型统一建模：

```
                        ┌─── core-coding-tools (read, write, edit, search, shell, git)
                        ├─── skill-system
 capability-registry ───├─── hook-system
                        ├─── mcp-gateway
                        ├─── plugin-system
                        ├─── command-system
                        └─── agent-management (subagents)
```

Each executable capability must declare: **manifest · scope · policy · sandbox · timeout · retry · audit metadata**.

每个可执行能力必须声明：**manifest · scope · policy · sandbox · timeout · retry · audit metadata**。

### Step 4: Evidence gates factual output / 证据门禁事实输出

For fact-sensitive repository, product, command, architecture, evaluation, or generated-artifact tasks, the runtime classifies the turn before model dispatch, selects bounded local evidence, injects it through `@deepseek/prompt-assembly`, and emits redacted evidence events. Generated factual artifacts must carry an evidence manifest; webpage output is checked by `scripts/check-webpage-generation.mjs`.

对于涉及 repository、product、command、architecture、evaluation 或 generated artifact 的事实任务，runtime 会在模型调用前分类 turn、选择有界本地证据、通过 `@deepseek/prompt-assembly` 注入，并发出脱敏 evidence events。事实型生成产物必须携带 evidence manifest；网页产物由 `scripts/check-webpage-generation.mjs` 验收。

### Step 5: Orchestration schedules work / 编排调度任务

For complex tasks, the workflow engine decomposes work into a **task graph**:

复杂任务由 workflow 引擎拆解为**任务图**：

```
Intent → Preflight → Workflow (task graph) → Policy → Scheduler → Agent/Capability → Evidence → Replay
```

| Component / 组件 | Owns / 负责 | Does NOT own / 不负责 |
| :--- | :--- | :--- |
| **Workflow** | What work exists, dependencies, phases, completion criteria | Thread pools, locks, timeouts |
| **Scheduler** | When work runs, resource locks, queue, cancel, backpressure | Model reasoning, host rendering |
| **Agent Mgmt** | Agent lifecycle, scope, budgets, parent/child lineage | Low-level scheduling |

> This separation is the key future-proofing decision: multi-agent work becomes testable, schedulable, auditable, and replayable.
>
> 这个拆分是面向未来的关键决策：多 Agent 工作可测试、可调度、可审计、可回放。

---

## 📦 Package Map / 包地图

Packages are organized by layer, top to bottom mirrors the data flow:

包按层级组织，自顶向下对应数据流：

| Layer / 层 | Packages / 包 | What it does / 职责 |
| :--- | :--- | :--- |
| 🖥️ **Hosts** | `cli` · `vscode-extension` | Render events, collect input / 渲染与输入 |
| 📜 **Contracts** | `platform-contracts` | DTOs, envelopes, errors, interfaces *(no implementation)* / 纯契约 |
| 📡 **Protocol** | `communication-protocol` · `runtime-message-bus` | Host↔kernel protocol, event bus / 协议与事件总线 |
| ⚙️ **Runtime** | `runtime` · `session-store` · `workspace-state-management` | Turn lifecycle, session, checkpoints, replay / 生命周期、会话、checkpoint 与回放 |
| 🧩 **Capability** | `capability-registry` · `core-coding-tools` · `command-system` · `skill-system` · `hook-system` · `mcp-gateway` · `plugin-system` | Discoverable & executable surfaces / 能力面 |
| 🎭 **Orchestration** | `workflow-orchestration` · `concurrency-orchestration` · `agent-management` · `tool-intent-preflight` | Task graph, scheduling, agents / 编排、调度、Agent |
| 🛡️ **Governance** | `policy-sandbox` · `platform-abstraction` · `config` · `credential-auth-management` · `usage-budget-management` | Policy, sandbox, platform matrix / 治理与安全 |
| 🤖 **AI/Context** | `model-gateway` · `prompt-assembly` · `context-engine` · `index-provider` · `memory-cache-management` · `code-intelligence` | Provider isolation, replayable prompts, context, recall, memory / AI、可回放 prompt、上下文、索引与记忆 |
| 🧪 **Quality** | `testing-regression` · `tests/*` · `scripts/lint-framework` | Fakes, golden replay, matrix, lint / 质量系统 |

---

## 📡 Status / 当前状态

| Area / 领域 | Status |
| :--- | :--- |
| ⚙️ Runtime kernel & protocol | ✅ Foundation implemented, hardening continues |
| 🖥️ CLI host | 🟡 Headless + DeepSeek Workbench line TUI with command bar, reasoning rail, inspector, activity feed, and plugin shelf; raw/full-screen renderers planned |
| 💻 VSCode host | 🟡 Skeleton exists; stays as protocol consumer |
| 🤖 DeepSeek provider | ✅ OpenAI-compatible gateway with deterministic tests |
| 🧠 Prompt assembly | ✅ Provider-neutral, deterministic, replayable section pipeline |
| 🔎 Evidence-first workflow | 🟡 Enabled for fact-sensitive agent runs; claim extraction still expanding |
| 🧭 Visible reasoning | 🟡 Runtime records, text/JSON/JSONL output, TUI panel state, plugin contributions, and diagnostics policy implemented |
| 🌐 Webpage artifact gate | ✅ Requires `evidence.json`, source coverage, and command grounding |
| 🛠️ Core coding tools | 🔨 Read/write/edit/search/shell/git/todo under policy |
| 🔒 Safety | 🔨 Secret & sandbox hardening active |
| 🧩 Extensibility | 🟡 Built-in first-party dev plugin metadata pack active; third-party execution/marketplace deferred |
| 🧪 Quality system | ✅ Typecheck, lint, boundary checks, deterministic test layers |

First-party release plugins are bundled as trusted manifest metadata: `@deepseek/plugin-dev-checks`, `@deepseek/plugin-repo-navigator`, `@deepseek/plugin-git-review`, and `@deepseek/plugin-context-compactor`. They project into help, palette, TUI summaries, and extension diagnostics without plugin-private execution. The context compactor exposes `deepseek context ...` and `/context ...` for lossless context status, grep, describe, summarize, expand, budget, and pin workflows.

一方发布插件以可信 manifest metadata 形式内置：`@deepseek/plugin-dev-checks`、`@deepseek/plugin-repo-navigator`、`@deepseek/plugin-git-review` 与 `@deepseek/plugin-context-compactor`。它们会投影到 help、palette、TUI summaries 与 extension diagnostics，但不会执行 plugin-private code。Context compactor 通过 `deepseek context ...` 与 `/context ...` 提供无损上下文 status、grep、describe、summarize、expand、budget 与 pin workflows。

---

## 🗺️ Roadmap / 路线图

```mermaid
graph LR
  R0["R0 Foundation"] --> R1["R1 MVP Agent"] --> R2["R2 Context & Safety"]
  R2 --> R3["R3 Extensibility"] --> R4["R4 IDE & Server"]
  R4 --> R5["R5 Multi-Agent"] --> R6["R6 Product UX"] --> R7["R7 Enterprise"]
```

| Phase | Outcome / 结果 |
| :--- | :--- |
| **R0** | Governed runtime: contracts, gateway, scheduling, policy, tests, lint |
| **R1** | `deepseek run` & `chat` inspect, edit, test repos through governed tools |
| **R2** | Context graph, memory, sandbox matrix, budgets, checkpoints, secret hardening |
| **R3** | Skills, hooks, MCP, plugins, commands, permission diff, lockfiles |
| **R4** | CLI + VSCode + daemon + SDK share one protocol and session model |
| **R5** | Subagents, task graphs, concurrency control, replayable orchestration |
| **R6** | Raw/full-screen TUI renderers over vi-inspired modes/actions/targets, governed plugin keymaps/render hints, notifications, voice/native, browser bridge |
| **R7** | Managed policy, audit export, signed plugins, team sync |

> 📖 [Product Roadmap](docs/product/product-roadmap.md) · [Competitive Matrix](docs/product/competitive-matrix.md) · [Roadmap To Architecture](docs/product/roadmap-to-architecture.md)

---

## 📚 Deep Dive / 深入了解

<details>
<summary>📋 Execution Envelope Fields / 执行信封字段</summary>

The execution envelope is the platform contract for every action:

| Field / 字段 | Purpose / 作用 |
| :--- | :--- |
| `agent`, `session`, `turn`, `trace` | Deterministic attribution, replay, debugging / 归因、replay、调试 |
| `scope`, `resources`, `sandboxRequirements` | Prevent boundary escape / 防止逃逸 |
| `secretExposure`, `credentialRef` | Keep secrets out of model & logs / 隔离秘钥 |
| `policy`, `approval`, `auditEvidence` | Explicit, reviewable safety decisions / 显式安全决策 |
| `timeout`, `retry`, `budget`, `priority` | Scheduler control inputs / 调度控制 |
| `host`, `platform`, `capability` | Separate rendering, OS, execution / 分离渲染与执行 |

</details>

<details>
<summary>⏱️ Scheduler Dimensions / 调度维度详解</summary>

| Dimension / 维度 | Behavior / 行为 |
| :--- | :--- |
| Concurrency | Independent work parallel; conflicting scopes serial / 独立并行，冲突串行 |
| Cancellation | Host, workflow, or policy can cancel with traceable reason / 可带原因取消 |
| Timeout | Every task has bounded runtime / 每个任务有上限 |
| Retry | Only safe/idempotent work; never blindly replay / 只重试幂等任务 |
| Backpressure | Reject overload with typed errors / 过载 typed reject |
| Policy gating | Denied work never reaches scheduler / 被拒绝任务不进调度 |
| Platform degradation | Missing capabilities → deterministic deny/degrade / 缺失能力确定性降级 |

</details>

<details>
<summary>⚔️ Competitive Comparison / 竞品对比</summary>

> Public references: [Claude Code](https://code.claude.com/docs) · [Codex CLI](https://developers.openai.com/codex/cli/features) · [Codex Cloud](https://developers.openai.com/codex/cloud)

| Dimension / 维度 | Claude Code / Codex | DeepSeek CLI |
| :--- | :--- | :--- |
| Runtime | Strong product runtimes, many surfaces | Headless kernel; all hosts consume same protocol |
| Extensibility | MCP, skills, hooks, plugins, subagents | All extension types → governed capabilities with shared manifest, policy, audit |
| Tool execution | File, shell, patch, MCP, browser tools | Every path uses same envelope, preflight, sandbox, retry, redaction |
| Multi-agent | Moving toward subagents, workflows, cloud tasks | `agent-management` + `workflow-orchestration` are core packages, not patches |
| Safety | Permissions, sandboxing, credentials | Fail-closed policy; unsafe work never reaches scheduler |
| Cross-platform | macOS/Linux/WSL/Windows docs | `platform-abstraction` — no upper-layer shell assumptions |
| Testing | Product behavior must be trusted | Deterministic layered gates: lint → contract → golden → matrix → e2e |
| Provider | Anthropic-native / OpenAI-native | DeepSeek-first, OpenAI-compatible, provider repair isolated behind gateway |

</details>

<details>
<summary>🏛️ Architecture Advantages / 架构优势</summary>

| Advantage / 优势 | Impact / 效果 |
| :--- | :--- |
| 📜 Contract-first monorepo | Boundaries are lintable & testable before scale |
| 📨 Shared execution envelope | No capability can bypass policy via alternate paths |
| 🔁 Replayable event model | All surfaces reason over the same evidence |
| 🌍 Platform capability matrix | OS differences become explicit inputs |
| 🔒 Safety as schema | Secrets, scopes, sandbox are typed, not comments |
| 🧪 Tests before scale | Regressions caught by deterministic tests & lint |

</details>

---

## 🔧 OpenSpec Workflow

Non-trivial architecture changes start as OpenSpec changes. Docs must be **bilingual**.

```bash
openspec list
openspec validate <change-id> --type change --strict
openspec validate --specs --strict
```

---

## 📏 Repository Rules / 仓库规则

- 🚫 Don't commit `参考/`, `.codex/`, `node_modules/`, caches, build output, `.env`
- 🧱 Keep `cli` and `vscode-extension` as separate host adapters
- 📜 `platform-contracts` must be implementation-free & host-agnostic
- 📦 Use `@deepseek/runtime` style imports, not cross-package relative paths
- 🔒 Enforce boundaries through lint & tests, not manual review alone

---

<div align="center">

**MIT License** · Copyright (c) 2026 ankye sheng

Built with ❤️ as a contract-first AI engineering platform.

[📚 Full Docs](docs/README.md) · [🗺️ Roadmap](docs/product/product-roadmap.md) · [⚔️ Competitive Matrix](docs/product/competitive-matrix.md)

</div>
