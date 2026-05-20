# DeepSeek CLI Product Roadmap / DeepSeek CLI 产品路线图

This roadmap defines DeepSeek-owned product milestones for a future-ready AI engineering runtime. Competitive products and local research material may inform capability discovery, but the roadmap, architecture ownership, and acceptance gates are DeepSeek-specific.

本路线图定义 DeepSeek 自有的产品里程碑，目标是打造面向未来的 AI 工程运行时。竞品和本地研究材料可以帮助发现能力面，但路线图、架构归属和验收门禁都按 DeepSeek 自身设计。

## CLI-First Product Route / CLI 优先产品路线

DeepSeek remains a contract-first, multi-host platform, but product execution now follows a CLI-first route: make the terminal CLI the first polished daily-use surface, then promote proven workflows to VSCode, server, SDK, browser/native, team, and enterprise hosts through shared protocol events.

DeepSeek 仍然是契约先行的多 host 平台，但产品执行改为 CLI-first 路线：先把终端 CLI 打磨成第一个成熟的日常使用界面，再通过共享协议事件把已验证的工作流推广到 VSCode、server、SDK、browser/native、team 和 enterprise hosts。

CLI-first rules / CLI-first 规则:

- CLI is the default near-term product surface for interaction, approvals, diagnostics, extension management, and release readiness. / CLI 是近期默认产品面，优先承载 interaction、approvals、diagnostics、extension management 和 release readiness。
- Non-CLI hosts stay as adapter skeletons, protocol fixtures, or landing zones until the corresponding CLI workflow passes acceptance gates. / 非 CLI host 在对应 CLI workflow 通过验收前保持为 adapter skeletons、protocol fixtures 或 landing zones。
- Promotion to another host requires CLI smoke evidence, protocol fixtures, policy/audit traces, deterministic tests, and documented CLI behavior. / 推广到其他 host 前必须具备 CLI smoke evidence、protocol fixtures、policy/audit traces、deterministic tests 和已记录的 CLI 行为。
- CLI polish must not bypass runtime ownership: CLI UX consumes shared runtime events, command results, readiness results, and policy decisions. / CLI 打磨不得绕过 runtime ownership：CLI UX 必须消费共享 runtime events、command results、readiness results 和 policy decisions。
- Large CLI-first changes must include a directory plan and avoid growing central files such as app entrypoints, package `index.ts` files, or one-size-fits-all tool/policy interfaces. / 大型 CLI-first 变更必须包含目录计划，并避免继续膨胀 app entrypoint、package `index.ts` 或一体化 tool/policy 接口。
- Large CLI-facing changes that affect input, rendering, navigation, recovery, or extension UX must declare terminal capability impact, vi-inspired composition impact, request/turn revert impact, and reference pit fixture coverage before implementation. / 影响 input、rendering、navigation、recovery 或 extension UX 的大型 CLI-facing 变更，必须在实现前声明 terminal capability impact、vi-inspired composition impact、request/turn revert impact 和 reference pit fixture coverage。

## CLI Mode Completion Matrix / CLI 模式完成度矩阵

The current CLI mode work is intentionally split into interaction modes and agent modes. Interaction modes describe the user/host surface; agent modes describe runtime work. `complete` means contract, CLI surface, session replay, and deterministic tests are present. `partial` means the runtime contract exists but rollout still needs governance or terminal evidence. `planned` means not a stable product surface yet. `disabled` means fail-closed until host capability evidence lands. `unsupported` is reserved for host/profile-specific rejection in diagnostics.

当前 CLI mode 工作刻意拆成 interaction modes 与 agent modes。Interaction modes 描述 user/host 表面；agent modes 描述 runtime 工作。`complete` 表示 contract、CLI surface、session replay 与确定性测试已具备。`partial` 表示 runtime contract 已有，但 rollout 仍需要治理或终端证据。`planned` 表示还不是稳定产品面。`disabled` 表示在 host capability evidence 落地前 fail-closed。`unsupported` 保留给 diagnostics 中的 host/profile-specific rejection。

Interaction mode status / Interaction mode 状态：

| Mode | Status | Product meaning / 产品含义 |
| --- | --- | --- |
| `one-shot` | complete | `deepseek run` JSON/JSONL and runtime mode events are covered. / `deepseek run` JSON/JSONL 与 runtime mode events 已覆盖。 |
| `chat` | complete | Local slash controls, session mode state, and resume/fork metadata are covered. / 本地 slash controls、session mode state 与 resume/fork metadata 已覆盖。 |
| `headless` | complete | CI/headless JSON and diagnostics paths are covered. / CI/headless JSON 与 diagnostics 路径已覆盖。 |
| `degraded` | complete | Unsupported resumed host/profile states emit typed degradation. / 不支持的恢复 host/profile 状态会发出 typed degradation。 |
| `result-list` | partial | Local semantics exist; terminal matrix acceptance is still required. / 本地语义已存在；仍需 terminal matrix 验收。 |
| `approval` | partial | Approval rendering exists; mode-aware matrix evidence remains required. / approval rendering 已存在；仍需 mode-aware matrix evidence。 |
| `command-palette` | partial | Palette/action records exist; richer raw-key/TUI behavior is not default. / palette/action records 已存在；更完整 raw-key/TUI 行为还不是默认。 |
| `review-diff` | planned | Future review surface gated by diff/revert acceptance. / 未来 review 表面，受 diff/revert 验收门禁控制。 |
| `interactive` | planned | Slash-driven controls are the baseline; raw interactive mode stays optional. / slash-driven controls 是基线；raw interactive mode 保持可选。 |
| `background-task` | planned | Future host capability after worker scheduling evidence. / worker scheduling evidence 后的未来 host capability。 |
| `remote` | disabled | Fail-closed until remote-safe command filtering and identity evidence land. / remote-safe command filtering 与 identity evidence 落地前 fail-closed。 |

Agent mode status / Agent mode 状态：

| Mode | Status | Product meaning / 产品含义 |
| --- | --- | --- |
| `default` | complete | Default single-agent path remains the stable baseline. / 默认 single-agent 路径仍是稳定基线。 |
| `evidence` | complete | Fact-sensitive evidence phase and diagnostics metrics are covered. / fact-sensitive evidence phase 与 diagnostics metrics 已覆盖。 |
| `planner` | complete | Phase planning and local `/plan` visibility are covered. / phase planning 与本地 `/plan` 可见性已覆盖。 |
| `verifier` | complete | Independent verdict events, command evidence checks, and reconciliation are covered. / independent verdict events、command evidence checks 与 reconciliation 已覆盖。 |
| `implementer` | partial | Execution role exists; write-capable rollout still needs checkpoint governance evidence. / execution role 已存在；write-capable rollout 仍需 checkpoint governance evidence。 |
| `coordinator` | partial | Delegation and reconciliation contracts exist; default enablement is gated by evaluation. / delegation 与 reconciliation contracts 已存在；默认启用受 evaluation 门禁控制。 |
| `worker` | partial | Worker lifecycle/result records exist; scratchpad/checkpoint governance remains the gate. / worker lifecycle/result records 已存在；scratchpad/checkpoint governance 仍是门禁。 |
| `repair` | partial | Repair-aware events exist; broader automatic repair remains policy-gated. / repair-aware events 已存在；更广泛自动修复仍受 policy 门禁。 |
| `synthesis` | planned | Future synthesis/reconciliation product mode after multi-agent acceptance. / multi-agent acceptance 后的未来 synthesis/reconciliation 产品模式。 |

Reasoning effort is separate from this matrix. Model/provider effort such as low/medium/high/max can be requested or mapped, but it never counts as proof of evidence search, verification, repair, or safe delegation.

推理强度与本矩阵分离。low/medium/high/max 等 model/provider effort 可以被请求或映射，但永远不算作 evidence search、verification、repair 或 safe delegation 的证明。

## Roadmap Metadata Required For Future OpenSpecs / 后续 OpenSpec 必需路线图元数据

Every future feature proposal should include the following metadata so product planning, ownership, tests, and acceptance remain aligned.

后续每个 feature proposal 都应包含以下元数据，确保产品规划、责任边界、测试和验收保持一致。

```text
Roadmap node / 路线图节点: R1 MVP Coding Agent
Launch gate / 发布门禁: internal-alpha | alpha | beta | stable | enterprise
Owner packages / 责任包: runtime, capability-registry, policy-sandbox
Dependencies / 依赖: R0 runtime kernel, provider gateway
Required tests / 必需测试: unit, contract, integration, golden, e2e, matrix, versioning, optional-live
Acceptance evidence / 验收证据: CLI smoke, VSCode smoke, trace replay, policy audit, docs
Risk class / 风险等级: low | medium | high | critical
Data/privacy class / 数据与隐私等级: none | local | sensitive | secret | regulated
Primary host surface / 主产品面: cli-first | host-promotion | multi-host
Host surfaces / Host 表面: cli | vscode | server | sdk | browser | native-host
Protocol impact / 协议影响: none | additive | breaking | persisted-schema
Feature flag / 功能开关: required | optional | none
Migration/rollback / 迁移与回滚: not-needed | required | incompatible-reject
Directory plan / 目录计划: owner packages, new folders, public exports, private modules, fixture/test locations, file-size split triggers
Terminal capability impact / 终端能力影响: affected terminal profiles, input strategies, renderer profiles, fallback behavior, fixtures, parity evidence
Vi-inspired composition impact / Vi 启发式组合影响: modes, actions/targets, reference sets, result lists, jump history, palette/keymaps, extension contributions
Request/turn revert impact / 请求/回合回退影响: applicable or not, restorable effects, stale/non-reversible reporting, immutable history evidence
Reference coverage / 参考覆盖: mapped capability areas from docs/product/cli-reference-extraction-implementation-plan.md
Reference pit fixtures / 参考坑位 fixtures: fixture ids from @deepseek/testing-regression reference-pits catalog, status, owner evidence ids, and intentional deferrals as applicable
```

Future CLI-facing OpenSpecs must cite concrete `pit.*` fixture ids when they touch policy, shell, paths, config precedence, MCP/plugins, remote identity, environment snapshots, diagnostics, recovery, input, rendering, navigation, or extension UX. Category names are planning hints; acceptance must point to executable fixture ids and owner evidence.

后续 CLI-facing OpenSpec 只要触及 policy、shell、path、config precedence、MCP/plugins、remote identity、environment snapshots、diagnostics、recovery、input、rendering、navigation 或 extension UX，就必须引用具体 `pit.*` fixture ids。类别名只是规划提示；验收必须指向可执行 fixture id 和 owner evidence。

## Product Capability Map / 产品能力映射

This map shows how product capability domains land in DeepSeek architecture packages.

本表说明各产品能力域在 DeepSeek 架构包中的落点。

| Capability area / 能力域 | Product domain / 产品领域 | DeepSeek architecture owner / DeepSeek 架构归属 |
| --- | --- | --- |
| Runtime loop / 运行时循环 | Agent turn lifecycle and model/tool loop / Agent 回合生命周期与模型/工具循环 | `runtime-execution-kernel`, `runtime-event-loop`, `workflow-orchestration` |
| Core tools / 核心工具 | File/search/edit/shell/web/agent/task tools / 文件、搜索、编辑、Shell、Web、Agent、任务工具 | `capability-registry`, `capability-execution-governance`, `platform-abstraction`, `policy-sandbox` |
| Commands / 命令 | Slash commands and product actions / 斜杠命令与产品动作 | `command-system`, `workflow-orchestration`, host adapters |
| Skills / Skills | Skills and dynamic knowledge packs / Skills 与动态知识包 | `skill-system`, `context-engine`, `extension-system` |
| Plugins / 插件 | Plugin packaging and installed contributions / 插件打包与安装贡献 | `plugin-system`, `extension-system`, `distribution-update-management` |
| MCP / MCP | External tool/resource bridge / 外部工具与资源桥接 | `mcp-gateway`, `capability-registry`, `policy-sandbox` |
| Hooks / Hooks | Runtime behavior hooks / 运行时行为 hook | `hook-system`, `runtime-message-bus`, `testing-regression` |
| Policy and sandbox / 策略与沙箱 | Policy, approvals, sandbox, path safety / 策略、审批、沙箱、路径安全 | `policy-sandbox`, `platform-abstraction`, `capability-execution-governance` |
| Context and memory / 上下文与记忆 | Context, memory, compact, session memory / 上下文、记忆、压缩、会话记忆 | `context-engine`, `memory-cache-management`, `session-store` |
| Subagents and tasks / 子 Agent 与任务 | Subagents, teams, task tracking / 子 Agent、团队、任务跟踪 | `agent-management`, `workflow-orchestration`, `concurrency-orchestration`, workspace state |
| Remote/server / 远程与服务端 | Daemon, server, remote control after CLI promotion gates / CLI 推广门禁后的守护进程、服务端、远程控制 | `remote-runtime-connectivity`, `communication-protocol`, `session-store` |
| Terminal UX / 终端体验 | Primary first product shell: CLI interaction, approvals, diagnostics, extension UX / 第一个主产品外壳：CLI 交互、审批、诊断、扩展体验 | `apps/cli`, protocol renderers |
| Advanced input / 高级输入 | CLI keybindings/history first, voice and other host inputs later / 先做 CLI 快捷键与历史搜索，voice 和其他 host input 后续推进 | future host input adapters over protocol |
| Collaboration / 协作 | Team memory sync and managed settings / team memory sync 与 managed settings | `memory-cache-management`, `config`, `credential-auth-management`, enterprise service layer |
| Distribution / 分发 | Update UX and release channels / 更新体验与发布通道 | `distribution-update-management`, `evolution-engine` |
| Auth / 认证 | Personal auth, provider credentials, OAuth / 个人认证、provider 凭证、OAuth | `credential-auth-management`, `model-gateway`, `mcp-gateway` |
| Config / 配置 | Config, settings, validation, managed overrides / 配置、设置、校验、受管覆盖 | `config`, `credential-auth-management`, `policy-sandbox`, `distribution-update-management` |
| Diagnostics / 诊断 | Doctor diagnostics and support bundles / doctor 诊断与支持包 | `platform-abstraction`, `runtime-message-bus`, `testing-regression`, observability boundary |
| Onboarding / 初始化 | Project initialization and first-run readiness / 项目初始化与首次使用就绪 | `command-system`, `workspace-state-management`, `session-store` |
| Privacy / 隐私 | Privacy controls, telemetry, analytics, tracing / 隐私控制、遥测、分析、追踪 | `runtime-message-bus`, `communication-protocol`, `testing-regression`, `policy-sandbox` |
| Code intelligence / 代码智能 | Diagnostics, symbols, language-aware evidence / 诊断、符号、语言感知证据 | `code-intelligence`, `context-engine`, `workspace-state-management` |
| SDK/API / SDK 与 API | Public SDK, schemas, control API after CLI-proven protocol semantics / CLI 已验证协议语义后的公共 SDK、schemas、control API | `communication-protocol`, `remote-runtime-connectivity`, `platform-contracts` |
| Model governance / 模型治理 | Model capability governance and migrations / 模型能力治理与迁移 | `model-gateway`, `evolution-engine`, `testing-regression` |
| Output UX / 输出体验 | Output styles, status line, theme, tips / 输出风格、状态栏、主题、提示 | host adapters, `command-system`, `future-capability-landings` |

## Roadmap Nodes / 路线图节点

CLI-first phase order / CLI-first 阶段顺序:

```text
R0 Foundation
  -> R1 CLI MVP Agent
  -> R2 CLI Context, Safety, and Diagnostics
  -> R3 CLI Extensibility and Release Hardening
  -> R4 Host Promotion: VSCode, Server, SDK
  -> R5 CLI-Proven Multi-Agent Engineering
  -> R6 Cross-Host UX and Collaboration
  -> R7 Enterprise and Ecosystem
```

This order changes product priority, not architecture boundaries. Shared contracts still define runtime behavior; CLI simply becomes the first surface where workflows are made excellent and accepted.

这个顺序调整的是产品优先级，不是架构边界。共享契约仍定义 runtime 行为；CLI 只是第一个把工作流打磨成熟并完成验收的 surface。

### R0 Foundation: Governed Runtime Platform / R0 基础：受治理的运行时平台

Product outcome: a deterministic, testable foundation that can run headless turns and provider/tool intent safely.

产品结果：建立确定性、可测试的基础平台，能够安全运行 headless 回合以及 provider/tool intent。

Current status: mostly underway or implemented through bootstrap, hardening, and provider work.

当前状态：主要能力已通过 bootstrap、hardening 和 provider 工作推进或实现。

Roadmap labels are governance labels, not marketing copy. A risk-bearing capability marked `implemented` or ready for promotion must cite accepted evidence. Capabilities backed by ghost aliases, placeholder adapters, deferred providers, skeleton hosts, or rollout gates must stay `placeholder`, `deferred`, `partial`, `rollout-gated`, or `disabled` until `deepseek diagnostics release` reports accepted evidence.

路线图标签是治理标签，不是营销描述。标记为 `implemented` 或 ready for promotion 的高风险能力必须引用已接受证据。由 ghost alias、placeholder adapter、deferred provider、skeleton host 或 rollout gate 支撑的能力，在 `deepseek diagnostics release` 报告已接受证据前，必须保持为 `placeholder`、`deferred`、`partial`、`rollout-gated` 或 `disabled`。

Platform scope / 平台范围:

- Runtime kernel owns execution. / Runtime kernel 负责执行。
- Model gateway normalizes provider streams. / Model gateway 归一化 provider stream。
- Model capability governance defines default model policy, capability flags, migration gates, and provider fallback rules. / 模型能力治理定义默认模型策略、能力标记、迁移门禁和 provider fallback 规则。
- Tool intent preflight repairs or rejects provider output before execution. / Tool intent preflight 在执行前修复或拒绝 provider 输出。
- Capability registry, policy, scheduler, workflow, bus, sessions, and observability are connected. / capability registry、policy、scheduler、workflow、bus、sessions 和 observability 已连接。
- Observability and privacy controls provide redacted traces, diagnostic logs, privacy opt-out, and local-only deterministic defaults. / observability 与 privacy controls 提供脱敏 traces、diagnostic logs、privacy opt-out 和默认本地确定性行为。
- Personal credential references are available for provider API keys without leaking raw secrets into traces. / personal credential references 可用于 provider API keys，且 raw secrets 不进入 traces。
- Architecture lint rejects boundary bypasses. / 架构 lint 拒绝绕过边界。
- Default tests are deterministic and do not require live providers. / 默认测试确定性运行，不依赖 live provider。

Acceptance gate / 验收门禁:

- `npm run lint`, `npm run typecheck`, and `npm test` pass. / `npm run lint`、`npm run typecheck` 和 `npm test` 通过。
- Kernel golden trace and provider/preflight golden or integration trace exist. / 存在 kernel golden trace 以及 provider/preflight golden 或 integration trace。
- Privacy, credential, and diagnostic traces contain only redacted values or secret references. / privacy、credential 和 diagnostic traces 只包含脱敏值或 secret references。
- Model capability fixtures cover at least default DeepSeek model metadata, unsupported capability rejection, and provider fallback decision recording. / model capability fixtures 至少覆盖默认 DeepSeek 模型元数据、不支持能力拒绝和 provider fallback 决策记录。
- OpenSpec validation passes. / OpenSpec 校验通过。

Next OpenSpecs / 后续 OpenSpec:

- Tool schema projection from capability registry to model gateway. / 从 capability registry 到 model gateway 的工具 schema 投影。
- Model capability governance and migration fixtures. / 模型能力治理与迁移 fixtures。

Implemented OpenSpecs / 已实现 OpenSpec:

- `add-deepseek-ai-provider`
- `add-live-deepseek-provider-smoke`
- `harden-runtime-kernel-semantics`

### R1 CLI MVP Coding Agent / R1 CLI 最小可用 Coding Agent

Product outcome: `deepseek run` and `deepseek chat` can inspect, edit, and test a local repository with safe tools.

产品结果：`deepseek run` 与 `deepseek chat` 能够通过安全工具检查、编辑并测试本地仓库。

CLI-first position: R1 is the first usable CLI product slice, not a multi-host launch. VSCode/server/SDK work at this stage should remain limited to adapter seams and protocol compatibility fixtures.

CLI-first 定位：R1 是第一个可用 CLI 产品切片，不是多端发布。此阶段 VSCode/server/SDK 工作应限制为 adapter seams 与 protocol compatibility fixtures。

Product scope / 产品范围:

- `deepseek run "<task>"` and JSON/JSONL output. / `deepseek run "<task>"` 与 JSON/JSONL 输出。
- `deepseek chat` terminal loop with minimal renderer. / 带最小 renderer 的 `deepseek chat` 终端循环。
- Read, write, edit, glob, grep/search, shell/process, git diff/status, todo/plan tools. / read、write、edit、glob、grep/search、shell/process、git diff/status、todo/plan 工具。
- Basic permissions: allow, ask, deny. / 基础权限：allow、ask、deny。
- Local readiness commands: login/API-key setup, logout, config/settings, init, doctor, privacy settings, and install verification. / 本地可用性命令：login/API-key setup、logout、config/settings、init、doctor、privacy settings 和 install verification。
- Session resume and fork-lite. / session resume 与轻量 fork。
- Usage and turn budget controls. / usage 与 turn budget 控制。

Platform scope / 平台范围:

- `runtime`, `command-system`, `capability-registry`, `workspace-state-management`, `policy-sandbox`, `platform-abstraction`, `session-store`, `credential-auth-management`, `testing-regression`.

Acceptance gate / 验收门禁:

- E2E covers summarizing a repo, reading files, proposing an edit, applying an edit, and running a test command through policy. / E2E 覆盖仓库总结、读取文件、提出编辑、应用编辑、通过 policy 执行测试命令。
- Local readiness smoke covers init, config validation, credential reference setup, doctor diagnostics, privacy setting, and install/package verification without live provider access by default. / local readiness smoke 覆盖 init、config validation、credential reference setup、doctor diagnostics、privacy setting 和 install/package verification，默认不访问 live provider。
- Golden trace covers a minimal coding turn with one read and one edit intent. / golden trace 覆盖包含一次 read 和一次 edit intent 的最小 coding turn。
- CLI text, JSON, and JSONL outputs consume the same runtime events. / CLI text、JSON 与 JSONL 输出消费同一套 runtime events。
- CLI run/chat behavior is documented enough that later hosts can project the same protocol events without redefining the workflow. / CLI run/chat 行为必须有足够文档，使后续 host 可以投影同一套 protocol events，而不重新定义 workflow。

Implemented OpenSpecs / 已实现 OpenSpec:

- `implement-core-coding-tools`
- `implement-local-readiness-commands`
- `deliver-first-usable-agent-loop`
- `implement-session-resume-and-fork`

Next OpenSpecs / 后续 OpenSpec:

No immediate R1 OpenSpec remains in the current roadmap. Future R1 work should be bug-driven or readiness-gap driven.

当前路线图中没有剩余的即时 R1 OpenSpec。后续 R1 工作应由 bug 或 readiness gap 驱动。

### R2 CLI Context, Safety, And Diagnostics / R2 CLI 上下文、安全与诊断

Product outcome: longer coding sessions remain accurate, safe, and budgeted.

产品结果：长时间 coding session 仍能保持准确、安全，并受预算控制。

CLI-first position: R2 hardens the CLI daily-use loop: context quality, diagnostics, redaction, undo, checkpointing, request/turn-level revert, budget visibility, and safe recovery must feel reliable in terminal workflows before broader host promotion.

CLI-first 定位：R2 打磨 CLI 日常使用循环：context quality、diagnostics、redaction、undo、checkpointing、request/turn 级 revert、budget visibility 和 safe recovery 必须先在终端工作流中可靠，再推广到更多 host。

Current status: active, with context projection, secret/sandbox hardening, checkpoint/undo v1, code intelligence v1, observability/privacy v1, CLI permission approval UX, and CLI diagnostics/release readiness implemented; remaining R2 work is now gap-driven.

当前状态：推进中，已实现 context projection、secret/sandbox hardening、checkpoint/undo v1、code intelligence v1、observability/privacy v1、CLI permission approval UX 与 CLI diagnostics/release readiness；剩余 R2 工作转为 gap-driven。

Product scope / 产品范围:

- ContextGraph projection. / ContextGraph 投影。
- Project/user/session memory. / project/user/session memory。
- Tool result storage with preview. / 带 preview 的工具结果存储。
- Auto compact and explicit compact. / 自动 compact 与显式 compact。
- Secret redaction. / secret 脱敏。
- Sandbox enforcement matrix v1. / sandbox enforcement matrix v1。
- Permission approval UX: headless fail-closed, approval evidence, protocol records, CLI text/JSONL rendering, typed approval targets, and audit-linked replay. / Permission approval UX：headless fail-closed、approval evidence、protocol records、CLI text/JSONL rendering、typed approval targets 和 audit-linked replay。
- Usage, cost, and time budgets. / usage、cost 与 time budget。
- File history, checkpoint, undo, and request/turn-level revert with immutable history evidence. / 文件历史、checkpoint、undo，以及带 immutable history evidence 的 request/turn 级 revert。
- Code intelligence v1: diagnostics, symbols, references, language-aware context, and pre/post-edit evidence. / code intelligence v1：diagnostics、symbols、references、language-aware context 和 pre/post-edit evidence。
- Diagnostic bundle export with redaction and privacy policy. / 带 redaction 与 privacy policy 的 diagnostic bundle export。

Platform scope / 平台范围:

- `context-engine`, `memory-cache-management`, `usage-budget-management`, `policy-sandbox`, `workspace-state-management`, `testing-regression`, `code-intelligence`, `runtime-message-bus`.

Acceptance gate / 验收门禁:

- Golden replay verifies context projection and compaction boundaries. / golden replay 验证 context projection 与 compaction 边界。
- Secret fixtures are blocked or redacted. / secret fixture 被阻止或脱敏。
- Sandbox denies shell/file bypasses that policy denies. / sandbox 拒绝 policy 已拒绝的 shell/file 绕过。
- Undo/checkpoint scenario restores workspace state, and request/turn revert evidence distinguishes restored, stale, and non-reversible effects without deleting original history. / undo/checkpoint 场景能恢复 workspace state，且 request/turn revert evidence 能区分 restored、stale 和 non-reversible effects，同时不删除原始历史。
- Code intelligence fixtures attach diagnostics and symbol evidence without requiring a live IDE. / code intelligence fixtures 在不依赖 live IDE 的情况下附加 diagnostics 与 symbol evidence。
- Diagnostic bundle tests prove privacy opt-out, redaction, and no raw secret persistence. / diagnostic bundle tests 证明 privacy opt-out、redaction 和无 raw secret persistence。
- Approval tests prove policy evidence, headless fail-closed, injected decisions, protocol compatibility, CLI structured output parity, terminal fallback, diagnostic redaction, and golden replay with pit fixture coverage. / Approval tests 证明 policy evidence、headless fail-closed、injected decisions、protocol compatibility、CLI structured output parity、terminal fallback、diagnostic redaction 和带 pit fixture 覆盖的 golden replay。
- CLI output exposes enough diagnostics, budget, and recovery information for a terminal user to understand and recover from failed turns. / CLI output 必须暴露足够的 diagnostics、budget 和 recovery 信息，使终端用户能够理解并恢复失败回合。

Next OpenSpecs / 后续 OpenSpec:

Future R2 work should be driven by CLI readiness gaps discovered while hardening terminal workflows, especially diagnostics/release readiness, code-intelligence evidence, and memory/cache main-path consumption. Permission approval UX now has its first accepted implementation slice.

后续 R2 工作应由打磨终端工作流时发现的 CLI readiness gaps 驱动，尤其是 diagnostics/release readiness、code-intelligence evidence 和 memory/cache 主路径消费。Permission approval UX 已具备第一条可验收实现切片。

Implemented OpenSpecs / 已实现 OpenSpec:

- `implement-context-graph-projection`
- `harden-secret-and-sandbox-policy`
- `implement-checkpoint-undo`
- `implement-code-intelligence-v1`
- `implement-observability-privacy-v1`
- `wire-memory-cache-into-runtime` (context-engine now consumes the shared `CacheManager`; `deps.memory` / `deps.cache` are present on `RuntimeDependencies` but not yet consumed outside context projection — follow-up packs will land runtime-main-path memory consumers)
- `harden-cli-permissions-and-approval-ux` — approval DTOs, policy evidence, headless fail-closed broker, runtime lifecycle events, protocol records/control messages, CLI rendering, typed approval actions, redaction, terminal matrix, and golden replay are implemented. / approval DTO、policy evidence、headless fail-closed broker、runtime lifecycle events、protocol records/control messages、CLI rendering、typed approval actions、redaction、terminal matrix 和 golden replay 已实现。

Active OpenSpecs / 进行中 OpenSpec:

- `stabilize-command-skill-hook-composition` — command, skill, hook, MCP, plugin, extension, renderer hint, and workflow contributions are being normalized into inert composition records before heavier CLI command palette or host promotion work. / 正在通过 `stabilize-command-skill-hook-composition` 将 command、skill、hook、MCP、plugin、extension、renderer hint 和 workflow contributions 归一为惰性 composition records，再推进更重的 CLI command palette 或 host promotion。

`memory-cache-management` status note / `memory-cache-management` 现状说明:

- Library-authoritative projection cache key (`projectionCacheKey` / `createProjectionCacheEntry`) is the only supported key; `context-engine` re-exports `CONTEXT_PROJECTION_CACHE_NAMESPACE` as a compatibility alias. / 库内统一的 projection cache key 是唯一支持路径；`context-engine` 仅再导出命名空间常量以兼容。
- `InMemoryContextEngine` accepts an optional `cache: CacheManager`; without it the engine falls back to a process-local `Map` identical to prior behavior. / `InMemoryContextEngine` 接受可选 `cache`；未注入时回退到进程内 `Map`，行为与以往逐字节一致。
- Runtime main path beyond context projection (agents/models/sessions) does not yet consume `deps.memory` or `deps.cache`; earlier roadmap copy over-stated this. / 除 context projection 外，runtime 主路径（agents/models/sessions）尚未消费 `deps.memory` 或 `deps.cache`；此前路线图的表述过于乐观。

`code-intelligence` status note / `code-intelligence` 现状说明:

- `wire-code-intelligence-into-runtime` 已把 `code-intelligence` 接入 runtime 主路径：`InMemoryContextEngine` 在构造 options bag 里接受可选 `codeIntelligence: CodeIntelligenceService`，`projectGraph` 在 selection 前调用 `contextNodes({ includeDiagnostics: true, includeSymbols: true })` 自动富化 candidate nodes（按 id 去重、调用方节点优先；富化失败静默回退、不降级 projection）。/ `wire-code-intelligence-into-runtime` wires `code-intelligence` into the runtime main path: `InMemoryContextEngine` accepts an optional `codeIntelligence: CodeIntelligenceService` in the same options bag as `cache`, and `projectGraph` auto-enriches candidates via `contextNodes` (id-dedup with caller precedence; failure falls back silently without downgrading the projection).
- 写路径 invalidate 已挂：`core-coding-tools` 的 `file.write` / `file.edit` 在成功写入后非阻塞地调用 `deps.codeIntelligence?.invalidate(path).catch(() => undefined)`，下一次 `diagnostics`/`symbols` 查询会重新索引受影响文件。/ Write-path invalidation is wired: `core-coding-tools` `file.write` / `file.edit` call `deps.codeIntelligence?.invalidate(path).catch(() => undefined)` after a successful write so the next `diagnostics`/`symbols` query re-indexes the affected file.
- 未接入部分：`references` / `definitions` 的自动富化与 policy-channel pre-edit evidence 仍是占位实现，留到后续 pack；此前路线图关于「v1 完整接入 runtime」的表述过于乐观，已按本条现状纠正。/ Not yet wired: automatic enrichment of `references` / `definitions` and policy-channel pre-edit evidence are still placeholders and left to follow-up packs; earlier roadmap copy overstated v1 runtime integration and has been corrected here.

### R3 CLI Extensibility And Release Hardening / R3 CLI 扩展与发布打磨

Product outcome: users can extend DeepSeek with skills, commands, hooks, MCP, and plugins under policy control.

产品结果：用户可以在 policy 控制下通过 skills、commands、hooks、MCP 和 plugins 扩展 DeepSeek。

Current status: active, with canonical skills v1, hooks v1, MCP gateway v1, plugin lockfile v1, CLI extension/auth management implemented, and command/skill/hook composition stabilization underway before host promotion.

当前状态：推进中，canonical skills v1、hooks v1、MCP gateway v1、plugin lockfile v1 与 CLI extension/auth management 已实现，正在 host promotion 前推进 command/skill/hook composition stabilization。

CLI-first position: R3 should make extension management trustworthy and usable from CLI first: list, activate, install/apply lockfile, permission diff, MCP test, credential scope diagnostics, and audit output. VSCode/server extension UX waits until the CLI semantics are accepted.

CLI-first 定位：R3 应先让扩展管理在 CLI 中可信且可用：list、activate、install/apply lockfile、permission diff、MCP test、credential scope diagnostics 和 audit output。VSCode/server extension UX 等 CLI 语义验收后再推进。

Product scope / 产品范围:

- Skills with progressive loading. / 支持渐进加载的 skills。
- Slash commands, workflow commands, and shared inert composition records for commands, skills, hooks, MCP, plugins, extensions, renderer hints, and result-list targets. / slash commands、workflow commands，以及 command、skill、hook、MCP、plugin、extension、renderer hint 和 result-list targets 的共享惰性 composition records。
- Hooks with ordering, timeout, isolation, and failure policy. / 带 ordering、timeout、isolation 和 failure policy 的 hooks。
- MCP tools/resources/prompts behind a deterministic governed gateway. / 受 deterministic governed gateway 管控的 MCP tools/resources/prompts。
- MCP and plugin auth flows use scoped credential references and host-mediated OAuth/device-code UI. / MCP 与 plugin auth flows 使用 scoped credential references 和 host-mediated OAuth/device-code UI。
- Plugin manifest, lockfile, permission diff, enable/disable. / plugin manifest、lockfile、permission diff、enable/disable。

Platform scope / 平台范围:

- `skill-system`, `command-system`, `hook-system`, `mcp-gateway`, `plugin-system`, `extension-system`, `distribution-update-management`.

Acceptance gate / 验收门禁:

- CLI plugin install/apply-lockfile shows permission diff and writes lock metadata. / CLI plugin install/apply-lockfile 展示 permission diff 并写入 lock metadata。
- MCP fake server exposes one tool/resource and runs through policy. / MCP fake server 暴露一个 tool/resource，并通过 policy 运行。
- Hook failure behavior is deterministic and replayed. / hook failure 行为确定且可 replay。
- Skill projection respects context budget. / skill projection 遵守 context budget。
- MCP/plugin credential access is denied outside declared scope and recorded in audit traces. / MCP/plugin credential access 超出声明 scope 时被拒绝，并记录到 audit traces。
- CLI extension commands produce text and JSON/JSONL evidence suitable for later host projection. / CLI extension commands 必须产生适合后续 host 投影的 text 与 JSON/JSONL 证据。
- Composition projection rejects duplicate names/aliases, excludes unsafe model-visible records, preserves pit fixture ids, and does not execute owners during projection. / Composition projection 必须拒绝重复 names/aliases，排除不安全的 model-visible records，保留坑位 fixture ids，且 projection 期间不执行 owner。

Next OpenSpecs / 后续 OpenSpec:

- `implement-mcp-and-plugin-auth-boundaries`
- `implement-command-palette-and-vi-result-actions`

Implemented OpenSpecs / 已实现 OpenSpec:

- `implement-skills-v1`
- `implement-hooks-v1`
- `implement-mcp-gateway-v1`
- `implement-plugin-lockfile-v1` — `PluginManager` 已具备 `install` lock metadata、`snapshot`、`applyLockfile`、`verify` 四项契约；remote marketplace fetch 与 signed packages 留到后续 pack. / `PluginManager` now ships the `install` lock metadata, `snapshot`, `applyLockfile`, and `verify` contracts; remote marketplace fetch and signed packages remain deferred to follow-up packs.
- `implement-cli-extension-auth-and-management` — CLI extension list, plugin install/apply/verify/snapshot, permission diff evidence, skill list/activate, MCP test projection, credential scope diagnostics, and extension pit fixtures are implemented. / CLI extension list、plugin install/apply/verify/snapshot、permission diff evidence、skill list/activate、MCP test projection、credential scope diagnostics 和 extension pit fixtures 已实现。

### R4 IDE And Server / R4 IDE 与 Server

Product outcome: CLI-proven workflows are promoted to VSCode, local server, and SDK surfaces through the same runtime protocol and session model.

产品结果：CLI 已验证的工作流通过同一套 runtime protocol 与 session model 推广到 VSCode、本地 server 和 SDK surface。

CLI-first position: R4 is a host-promotion phase, not the next immediate product priority. It should start after CLI interaction, permissions, diagnostics, extension management, and release-readiness gates are accepted.

CLI-first 定位：R4 是 host-promotion 阶段，不是下一个即时产品优先级。它应在 CLI interaction、permissions、diagnostics、extension management 和 release-readiness 门禁验收后启动。

Product scope / 产品范围:

- VSCode extension projects CLI-proven runtime events. / VSCode extension 投影 CLI 已验证 runtime events。
- IDE approvals and diff views reuse CLI-proven policy and edit semantics. / IDE approvals 与 diff views 复用 CLI 已验证 policy 与 edit semantics。
- Local daemon/server transport exposes behaviors already proven through CLI protocol fixtures. / 本地 daemon/server transport 暴露已通过 CLI protocol fixtures 证明的行为。
- Remote runtime connectivity v1 remains gated by protocol, auth, session, and audit evidence. / remote runtime connectivity v1 受 protocol、auth、session 和 audit evidence 门禁控制。
- Public runtime SDK and control API with versioned schemas follow stable CLI semantics. / 带版本化 schemas 的公共 runtime SDK 与 control API 跟随稳定 CLI 语义。
- Protocol versioning and fail-closed version tests. / protocol versioning 与 fail-closed version tests。

Platform scope / 平台范围:

- `vscode-extension-adapter`, `remote-runtime-connectivity`, `communication-protocol`, `runtime-message-bus`, `session-store`, `platform-contracts`, `testing-regression`.

Acceptance gate / 验收门禁:

- Each promoted workflow cites CLI smoke, golden replay, protocol fixture, and policy/audit evidence. / 每个被推广 workflow 必须引用 CLI smoke、golden replay、protocol fixture 和 policy/audit evidence。
- VSCode smoke runs without importing CLI rendering. / VSCode smoke 不导入 CLI rendering 即可运行。
- Server/daemon e2e uses protocol fixtures, not stdout parsing. / server/daemon e2e 使用 protocol fixtures，而不是解析 stdout。
- Protocol versioning test covers persisted session and event schemas. / protocol versioning test 覆盖持久化 session 与 event schemas。
- SDK/control API fixtures cover request, event, control, cancellation, replay, and backward-compatible additive schema changes. / SDK/control API fixtures 覆盖 request、event、control、cancellation、replay 和 backward-compatible additive schema changes。

Next OpenSpecs / 后续 OpenSpec:

- `implement-vscode-event-projection`
- `implement-local-runtime-server`
- `stabilize-runtime-protocol-v1`
- `implement-public-runtime-sdk-and-control-api`

### R5 CLI-Proven Multi-Agent Engineering / R5 CLI 已验证多 Agent 工程协作

Product outcome: DeepSeek can split engineering work into bounded tasks and merge evidence safely.

产品结果：DeepSeek 能把工程工作拆成有边界的任务，并安全合并证据。

CLI-first position: multi-agent work should first be visible and controllable from CLI with scoped workers, evidence summaries, conflict handling, and test aggregation before becoming IDE/server orchestration UX.

CLI-first 定位：多 Agent 工作应先在 CLI 中可见、可控，具备 scoped workers、evidence summaries、conflict handling 和 test aggregation，然后再成为 IDE/server orchestration UX。

Current status: mode-aware contracts, local `/agent`/`/workers`/`/verify`/`/plan` controls, structured work orders, worker lifecycle/result events, verifier verdicts, repair/reconciliation events, diagnostics metrics, golden replay, adversarial fixtures, and terminal matrix coverage are implemented. Coordinator, worker write execution, and automatic repair remain rollout-gated rather than default.

当前状态：mode-aware contracts、本地 `/agent`/`/workers`/`/verify`/`/plan` controls、结构化 work orders、worker lifecycle/result events、verifier verdicts、repair/reconciliation events、diagnostics metrics、golden replay、adversarial fixtures 与 terminal matrix coverage 已实现。Coordinator、worker 写执行与 automatic repair 仍受 rollout 门禁控制，不作为默认行为。

Product scope / 产品范围:

- Interaction/agent mode contracts and completion matrix. / interaction/agent mode contracts 与 completion matrix。
- TaskGraph and subagent manager. / TaskGraph 与 subagent manager。
- Worker scopes: paths, tools, budgets, deadlines, lineage, scratchpad, and checkpoint policy. / worker scopes：paths、tools、budgets、deadlines、lineage、scratchpad 与 checkpoint policy。
- Worktree or overlay execution. / worktree 或 overlay execution。
- Patch/evidence collection. / patch/evidence collection。
- Independent verifier mode with command evidence and partial/fail/pass reconciliation. / 带 command evidence 与 partial/fail/pass reconciliation 的独立 verifier mode。
- Safe repair loop with bounded reruns and terminal reconciliation. / 带有界 rerun 与 terminal reconciliation 的安全 repair loop。
- Merge, review, and test aggregation. / merge、review 与 test aggregation。

Platform scope / 平台范围:

- `agent-management`, `workflow-orchestration`, `concurrency-orchestration`, `workspace-state-management`, `policy-sandbox`, `testing-regression`.

Acceptance gate / 验收门禁:

- `diagnostics evaluate` reports interaction/agent completion matrix, phase usage, loop budgets, verifier quality, repair quality, worker fan-out, over-delegation flags, and baseline unavailable/inferred metrics. / `diagnostics evaluate` 报告 interaction/agent completion matrix、phase usage、loop budgets、verifier quality、repair quality、worker fan-out、over-delegation flags 与 baseline unavailable/inferred metrics。
- Golden replay proves mode ordering: evidence before model dispatch, implementation before verification, verifier before final success, and typed worker result events. / Golden replay 证明 mode ordering：evidence 先于 model dispatch、implementation 先于 verification、verifier 先于 final success，并包含 typed worker result events。
- Adversarial fixtures cover mode mismatch, lazy delegation, over-delegation, missing verification, unsafe scratchpad, worker raw-output-as-user-prompt, and unsupported reasoning effort. / adversarial fixtures 覆盖 mode mismatch、lazy delegation、over-delegation、missing verification、unsafe scratchpad、worker raw-output-as-user-prompt 与 unsupported reasoning effort。
- Terminal matrix covers CI, redirected JSONL, no-color, Windows PowerShell-like, macOS Terminal-like, and Linux Terminal-like profiles. / terminal matrix 覆盖 CI、redirected JSONL、no-color、Windows PowerShell-like、macOS Terminal-like 与 Linux Terminal-like profiles。
- Scratchpad/checkpoint governance records fingerprints, scopes, and lineage without raw secrets or unbounded content. / scratchpad/checkpoint governance 记录 fingerprints、scopes 与 lineage，且不包含 raw secrets 或 unbounded content。
- Multi-agent scenario runs two disjoint workers with separate write scopes. / multi-agent 场景运行两个互不重叠写入范围的 worker。
- Conflict scenario rejects or escalates instead of silently overwriting. / conflict 场景拒绝或升级处理，而不是静默覆盖。
- Evidence includes tests, changed files, policy decisions, and trace replay. / evidence 包含 tests、changed files、policy decisions 和 trace replay。

Rollout criteria for default enablement / 默认启用门槛:

- Keep `default` single-agent mode as the baseline until evaluation shows coordinator/verifier orchestration reduces correction cost or failed completions on non-trivial CLI tasks. / 在 evaluation 证明 coordinator/verifier orchestration 能降低非琐碎 CLI tasks 的 correction cost 或失败完成率前，保持 `default` single-agent mode 为基线。
- Enable verifier by default only for risk classes where command evidence is available and the verifier can produce pass/fail/partial without overstating unsupported areas. / 只有在 command evidence 可用且 verifier 能产出不夸大 unsupported areas 的 pass/fail/partial 时，才对对应风险等级默认启用 verifier。
- Enable coordinator by default only after worker fan-out stays bounded, over-delegation rate is below the release threshold, and reconciliation quality beats direct single-agent repair in deterministic suites. / 只有在 worker fan-out 有界、over-delegation rate 低于发布阈值，并且 reconciliation quality 在确定性套件中优于直接 single-agent repair 后，才默认启用 coordinator。
- Keep worker write scopes behind checkpoint policy, stale workspace checks, and disjoint path ownership. / worker 写范围必须受 checkpoint policy、stale workspace checks 与 disjoint path ownership 约束。
- Preserve local CLI controls as the semantic baseline before raw-key/TUI or remote orchestration is promoted. / 在推广 raw-key/TUI 或 remote orchestration 前，保留本地 CLI controls 作为语义基线。

Next OpenSpecs / 后续 OpenSpec:

- `implement-taskgraph-v1`
- `implement-subagent-scoped-execution`
- `implement-worktree-overlay-execution`

### R6 Cross-Host Product UX And Collaboration / R6 跨端产品体验与协作

Product outcome: the platform becomes a polished daily tool across terminal and collaboration surfaces.

产品结果：平台成为跨终端与协作场景的成熟日常工具。

CLI-first position: CLI UX needed for daily terminal use can move earlier into R2/R3. R6 is reserved for cross-host UX, collaboration, voice, browser/native, recommendations, sync, and update UI after CLI semantics are stable.

CLI-first 定位：CLI 日常使用所需 UX 可以前移到 R2/R3。R6 保留给 CLI 语义稳定后的跨端 UX、协作、voice、browser/native、recommendations、sync 和 update UI。

Product scope / 产品范围:

- Cross-host rich UX and advanced terminal polish not required by CLI-first gates. / CLI-first 门禁不必需的跨端 rich UX 和高级终端打磨。
- Vim/keybindings/history search beyond the minimal CLI daily-use path. / 超出最小 CLI 日常使用路径的 vim/keybindings/history search。
- Output styles, theme picker, status line, terminal title, and command palette after CLI behavior is accepted. / CLI 行为验收后的 output styles、theme picker、status line、terminal title 和 command palette。
- First-run onboarding, feature tips, and recommendation dismissal state beyond CLI release readiness. / 超出 CLI release readiness 的 first-run onboarding、feature tips 和 recommendation dismissal state。
- Voice input as host adapter. / 作为 host adapter 的 voice input。
- Browser/native host adapter. / browser/native host adapter。
- Team memory sync and settings sync. / team memory sync 与 settings sync。
- Plugin recommendations and onboarding. / plugin recommendations 与 onboarding。
- Update UI. / update UI。

Platform scope / 平台范围:

- Host adapters over `communication-protocol`, `runtime-message-bus`, `memory-cache-management`, `config`, `distribution-update-management`, `extension-system`.

Acceptance gate / 验收门禁:

- UX features consume protocol events and never call execution primitives directly. / UX features 消费 protocol events，不直接调用 execution primitives。
- Keybindings and voice are host-input adapters, not runtime features. / keybindings 与 voice 是 host-input adapters，不是 runtime features。
- Output style, theme, status line, tips, and onboarding state are host-rendered over command/protocol events. / output style、theme、status line、tips 和 onboarding state 通过 command/protocol events 由 host 渲染。
- Sync has redaction, credential, and conflict policy tests. / sync 具备 redaction、credential 和 conflict policy tests。

Next OpenSpecs / 后续 OpenSpec:

- `implement-rich-cli-tui`
- `implement-output-style-theme-and-statusline`
- `implement-keybindings-and-vim-mode`
- `implement-onboarding-tips-and-recommendations`
- `implement-team-memory-sync-v1`
- `implement-update-ui-v1`

### R7 Enterprise And Ecosystem / R7 企业与生态

Product outcome: DeepSeek is deployable in managed organizations and supports a governed ecosystem.

产品结果：DeepSeek 可在受管组织中部署，并支持有治理的生态。

Product scope / 产品范围:

- Managed policy and remote managed settings. / managed policy 与 remote managed settings。
- Signed plugins and marketplace governance. / signed plugins 与 marketplace governance。
- Enterprise audit export. / enterprise audit export。
- Release channels and rollback. / release channels 与 rollback。
- Live eval/lab suites. / live eval/lab suites。
- Team/organization credentials and memory boundaries. / team/organization credentials 与 memory boundaries。

Platform scope / 平台范围:

- `credential-auth-management`, `policy-sandbox`, `distribution-update-management`, `plugin-system`, `extension-system`, `evolution-engine`, `testing-regression`.

Acceptance gate / 验收门禁:

- Managed policy cannot be bypassed by local config. / managed policy 不能被 local config 绕过。
- Signed plugin verification and blocklist tests pass. / signed plugin verification 与 blocklist tests 通过。
- Audit export is redacted and replay-consistent. / audit export 脱敏且 replay-consistent。
- Release channel metadata declares versioning status and rollback plan. / release channel metadata 声明 versioning 状态与 rollback plan。

Next OpenSpecs / 后续 OpenSpec:

- `implement-managed-policy-v1`
- `implement-signed-plugin-distribution`
- `implement-enterprise-audit-export`
- `implement-release-channels`

## Immediate Recommended Sequence / 近期推荐顺序

1. Finish and archive `formalize-cli-interaction-agent-modes`. / 完成并归档 `formalize-cli-interaction-agent-modes`。
2. Add `implement-taskgraph-v1` for CLI-visible task graph records, worker ownership, and conflict handling. / 增加 `implement-taskgraph-v1`，覆盖 CLI 可见 task graph records、worker ownership 与 conflict handling。
3. Add `implement-subagent-scoped-execution` for checkpoint-gated write workers and bounded scratchpads. / 增加 `implement-subagent-scoped-execution`，覆盖受 checkpoint 门禁控制的写 worker 与有界 scratchpad。
4. Add `stabilize-command-skill-hook-composition`. / 增加 `stabilize-command-skill-hook-composition`。
5. Then promote proven workflows with `implement-vscode-event-projection` and `implement-local-runtime-server`. / 然后通过 `implement-vscode-event-projection` 和 `implement-local-runtime-server` 推广已验证 workflow。

Rationale: R1/R2 foundations now cover the first usable local product surface, context/safety, checkpoints, code intelligence, and observability/privacy, but the CLI should become the first polished daily-use product before IDE/server expansion. Before adding heavy CLI UX, the host entrypoint and implementation-heavy package `index.ts` files need scale guardrails, request/turn-level revert must be modeled as structured recovery rather than transcript deletion, and reference pitfalls should be converted into negative fixtures so permissions, diagnostics, extension/auth management, and release readiness do not recreate the reference CLI's central-file or security-bypass pressure.

理由：R1/R2 基础现在已经覆盖首个可用本地产品面、context/safety、checkpoints、code intelligence 和 observability/privacy，但在 IDE/server 扩展之前，CLI 应先成为第一个打磨成熟的日常产品。在加入重型 CLI UX 前，需要先给 host entrypoint 和实现过重的 package `index.ts` 建立规模护栏，将 request/turn 级 revert 建模为结构化 recovery 而不是 transcript deletion，并把参考实现踩过的坑转成负向 fixtures，避免 permissions、diagnostics、extension/auth management 和 release readiness 重演参考 CLI 的中心文件或安全绕过压力。

The immediate sequence now favors finishing the mode-aware agent loop before host promotion. The product has enough contracts to show planner, verifier, worker, repair, and reconciliation surfaces, but it should not make coordinator/worker orchestration the default until taskgraph ownership, checkpoint-gated worker writes, and deterministic evaluation thresholds are in place.

近期顺序现在优先完成 mode-aware agent loop，再做 host promotion。产品已有足够契约展示 planner、verifier、worker、repair 与 reconciliation 表面，但在 taskgraph ownership、checkpoint-gated worker writes 与确定性 evaluation thresholds 到位前，不应把 coordinator/worker orchestration 设为默认。

Near-term non-goals / 近期非目标:

- Do not make VSCode a parallel product surface before CLI gates pass. / CLI 门禁通过前，不把 VSCode 作为并行产品面。
- Do not expose local server or public SDK as stable product surfaces before CLI-proven protocol semantics exist. / CLI 已验证协议语义形成前，不把 local server 或 public SDK 暴露为稳定产品面。
- Do not build cross-host collaboration or enterprise UX before one local CLI workflow is polished end to end. / 在一个本地 CLI workflow 端到端打磨成熟前，不做跨端协作或企业 UX。
