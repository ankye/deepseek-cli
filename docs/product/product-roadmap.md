# DeepSeek CLI Product Roadmap / DeepSeek CLI 产品路线图

This roadmap defines DeepSeek-owned product milestones for a future-ready AI engineering runtime. Competitive products and local research material may inform capability discovery, but the roadmap, architecture ownership, and acceptance gates are DeepSeek-specific.

本路线图定义 DeepSeek 自有的产品里程碑，目标是打造面向未来的 AI 工程运行时。竞品和本地研究材料可以帮助发现能力面，但路线图、架构归属和验收门禁都按 DeepSeek 自身设计。

## Roadmap Metadata Required For Future OpenSpecs / 后续 OpenSpec 必需路线图元数据

Every future feature proposal should include the following metadata so product planning, ownership, tests, and acceptance remain aligned.

后续每个 feature proposal 都应包含以下元数据，确保产品规划、责任边界、测试和验收保持一致。

```text
Roadmap node / 路线图节点: R1 MVP Coding Agent
Launch gate / 发布门禁: internal-alpha | alpha | beta | stable | enterprise
Owner packages / 责任包: runtime, capability-registry, policy-sandbox
Dependencies / 依赖: R0 runtime kernel, provider gateway
Required tests / 必需测试: unit, contract, integration, golden, e2e, matrix, compatibility, optional-live
Acceptance evidence / 验收证据: CLI smoke, VSCode smoke, trace replay, policy audit, docs
Risk class / 风险等级: low | medium | high | critical
Data/privacy class / 数据与隐私等级: none | local | sensitive | secret | regulated
Host surfaces / Host 表面: cli | vscode | server | sdk | browser | native-host
Protocol impact / 协议影响: none | additive | breaking | persisted-schema
Feature flag / 功能开关: required | optional | none
Migration/rollback / 迁移与回滚: not-needed | required | incompatible-reject
```

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
| Remote/server / 远程与服务端 | Daemon, server, remote control / 守护进程、服务端、远程控制 | `remote-runtime-connectivity`, `communication-protocol`, `session-store` |
| Terminal UX / 终端体验 | Terminal UI and product shell / 终端 UI 与产品外壳 | `apps/cli`, protocol renderers |
| Advanced input / 高级输入 | Vim/keybindings/history search/voice / Vim、快捷键、历史搜索、语音 | future host input adapters over protocol |
| Collaboration / 协作 | Team memory sync and managed settings / team memory sync 与 managed settings | `memory-cache-management`, `config`, `credential-auth-management`, enterprise service layer |
| Distribution / 分发 | Update UX and release channels / 更新体验与发布通道 | `distribution-update-management`, `evolution-engine` |
| Auth / 认证 | Personal auth, provider credentials, OAuth / 个人认证、provider 凭证、OAuth | `credential-auth-management`, `model-gateway`, `mcp-gateway` |
| Config / 配置 | Config, settings, validation, managed overrides / 配置、设置、校验、受管覆盖 | `config`, `credential-auth-management`, `policy-sandbox`, `distribution-update-management` |
| Diagnostics / 诊断 | Doctor diagnostics and support bundles / doctor 诊断与支持包 | `platform-abstraction`, `runtime-message-bus`, `testing-regression`, observability boundary |
| Onboarding / 初始化 | Project initialization and first-run readiness / 项目初始化与首次使用就绪 | `command-system`, `workspace-state-management`, `session-store` |
| Privacy / 隐私 | Privacy controls, telemetry, analytics, tracing / 隐私控制、遥测、分析、追踪 | `runtime-message-bus`, `communication-protocol`, `testing-regression`, `policy-sandbox` |
| Code intelligence / 代码智能 | Diagnostics, symbols, language-aware evidence / 诊断、符号、语言感知证据 | `code-intelligence`, `context-engine`, `workspace-state-management` |
| SDK/API / SDK 与 API | Public SDK, schemas, control API / 公共 SDK、schemas、control API | `communication-protocol`, `remote-runtime-connectivity`, `platform-contracts` |
| Model governance / 模型治理 | Model capability governance and migrations / 模型能力治理与迁移 | `model-gateway`, `evolution-engine`, `testing-regression` |
| Output UX / 输出体验 | Output styles, status line, theme, tips / 输出风格、状态栏、主题、提示 | host adapters, `command-system`, `future-capability-landings` |

## Roadmap Nodes / 路线图节点

### R0 Foundation: Governed Runtime Platform / R0 基础：受治理的运行时平台

Product outcome: a deterministic, testable foundation that can run headless turns and provider/tool intent safely.

产品结果：建立确定性、可测试的基础平台，能够安全运行 headless 回合以及 provider/tool intent。

Current status: mostly underway or implemented through bootstrap, hardening, and provider work.

当前状态：主要能力已通过 bootstrap、hardening 和 provider 工作推进或实现。

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

### R1 MVP Coding Agent / R1 最小可用 Coding Agent

Product outcome: `deepseek -p` and a basic interactive CLI can inspect, edit, and test a local repository with safe tools.

产品结果：`deepseek -p` 和基础交互式 CLI 能够通过安全工具检查、编辑并测试本地仓库。

Product scope / 产品范围:

- Headless prompt and stream-json output. / headless prompt 与 stream-json 输出。
- Interactive terminal loop with minimal renderer. / 带最小 renderer 的交互式终端循环。
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
- CLI and stream-json outputs consume the same runtime events. / CLI 与 stream-json 输出消费同一套 runtime events。

Implemented OpenSpecs / 已实现 OpenSpec:

- `implement-core-coding-tools`
- `implement-local-readiness-commands`
- `implement-minimal-interactive-cli`
- `implement-session-resume-and-fork`

Next OpenSpecs / 后续 OpenSpec:

No immediate R1 OpenSpec remains in the current roadmap. Future R1 work should be bug-driven or readiness-gap driven.

当前路线图中没有剩余的即时 R1 OpenSpec。后续 R1 工作应由 bug 或 readiness gap 驱动。

### R2 Context And Safety / R2 上下文与安全

Product outcome: longer coding sessions remain accurate, safe, and budgeted.

产品结果：长时间 coding session 仍能保持准确、安全，并受预算控制。

Current status: active, with context projection, secret/sandbox hardening, checkpoint/undo v1, code intelligence v1, and observability/privacy v1 implemented.

当前状态：推进中，已实现 context projection、secret/sandbox hardening、checkpoint/undo v1、code intelligence v1 与 observability/privacy v1。

Product scope / 产品范围:

- ContextGraph projection. / ContextGraph 投影。
- Project/user/session memory. / project/user/session memory。
- Tool result storage with preview. / 带 preview 的工具结果存储。
- Auto compact and explicit compact. / 自动 compact 与显式 compact。
- Secret redaction. / secret 脱敏。
- Sandbox enforcement matrix v1. / sandbox enforcement matrix v1。
- Usage, cost, and time budgets. / usage、cost 与 time budget。
- File history, checkpoint, and undo. / 文件历史、checkpoint 与 undo。
- Code intelligence v1: diagnostics, symbols, references, language-aware context, and pre/post-edit evidence. / code intelligence v1：diagnostics、symbols、references、language-aware context 和 pre/post-edit evidence。
- Diagnostic bundle export with redaction and privacy policy. / 带 redaction 与 privacy policy 的 diagnostic bundle export。

Platform scope / 平台范围:

- `context-engine`, `memory-cache-management`, `usage-budget-management`, `policy-sandbox`, `workspace-state-management`, `testing-regression`, `code-intelligence`, `runtime-message-bus`.

Acceptance gate / 验收门禁:

- Golden replay verifies context projection and compaction boundaries. / golden replay 验证 context projection 与 compaction 边界。
- Secret fixtures are blocked or redacted. / secret fixture 被阻止或脱敏。
- Sandbox denies shell/file bypasses that policy denies. / sandbox 拒绝 policy 已拒绝的 shell/file 绕过。
- Undo/checkpoint scenario restores workspace state. / undo/checkpoint 场景能恢复 workspace state。
- Code intelligence fixtures attach diagnostics and symbol evidence without requiring a live IDE. / code intelligence fixtures 在不依赖 live IDE 的情况下附加 diagnostics 与 symbol evidence。
- Diagnostic bundle tests prove privacy opt-out, redaction, and no raw secret persistence. / diagnostic bundle tests 证明 privacy opt-out、redaction 和无 raw secret persistence。

Next OpenSpecs / 后续 OpenSpec:

No immediate R2 OpenSpec remains in the current roadmap. Future R2 work should be driven by regression gaps discovered while building R3/R4.

当前路线图中没有剩余的即时 R2 OpenSpec。后续 R2 工作应由推进 R3/R4 时发现的 regression gaps 驱动。

Implemented OpenSpecs / 已实现 OpenSpec:

- `implement-context-graph-projection`
- `harden-secret-and-sandbox-policy`
- `implement-checkpoint-undo`
- `implement-code-intelligence-v1`
- `implement-observability-privacy-v1`

### R3 Extensibility Platform / R3 可扩展平台

Product outcome: users can extend DeepSeek with skills, commands, hooks, MCP, and plugins under policy control.

产品结果：用户可以在 policy 控制下通过 skills、commands、hooks、MCP 和 plugins 扩展 DeepSeek。

Current status: started, with canonical skills v1, hooks v1, and MCP gateway v1 implemented as the first governed extension units.

当前状态：已启动，canonical skills v1、hooks v1 与 MCP gateway v1 已作为第一批受治理扩展单元实现。

Product scope / 产品范围:

- Skills with progressive loading. / 支持渐进加载的 skills。
- Slash commands and workflow commands. / slash commands 与 workflow commands。
- Hooks with ordering, timeout, isolation, and failure policy. / 带 ordering、timeout、isolation 和 failure policy 的 hooks。
- MCP tools/resources/prompts behind a deterministic governed gateway. / 受 deterministic governed gateway 管控的 MCP tools/resources/prompts。
- MCP and plugin auth flows use scoped credential references and host-mediated OAuth/device-code UI. / MCP 与 plugin auth flows 使用 scoped credential references 和 host-mediated OAuth/device-code UI。
- Plugin manifest, lockfile, permission diff, enable/disable. / plugin manifest、lockfile、permission diff、enable/disable。

Platform scope / 平台范围:

- `skill-system`, `command-system`, `hook-system`, `mcp-gateway`, `plugin-system`, `extension-system`, `distribution-update-management`.

Acceptance gate / 验收门禁:

- Plugin install shows permission diff and writes lock metadata. / 插件安装展示 permission diff 并写入 lock metadata。
- MCP fake server exposes one tool/resource and runs through policy. / MCP fake server 暴露一个 tool/resource，并通过 policy 运行。
- Hook failure behavior is deterministic and replayed. / hook failure 行为确定且可 replay。
- Skill projection respects context budget. / skill projection 遵守 context budget。
- MCP/plugin credential access is denied outside declared scope and recorded in audit traces. / MCP/plugin credential access 超出声明 scope 时被拒绝，并记录到 audit traces。

Next OpenSpecs / 后续 OpenSpec:

- `implement-plugin-lockfile-v1`
- `implement-mcp-and-plugin-auth-boundaries`

Implemented OpenSpecs / 已实现 OpenSpec:

- `implement-skills-v1`
- `implement-hooks-v1`
- `implement-mcp-gateway-v1`

### R4 IDE And Server / R4 IDE 与 Server

Product outcome: CLI, VSCode, and local server share one runtime protocol and session model.

产品结果：CLI、VSCode 和本地 server 共享同一套 runtime protocol 与 session model。

Product scope / 产品范围:

- VSCode extension projects runtime events. / VSCode extension 投影 runtime events。
- IDE approvals and diff views. / IDE approvals 与 diff views。
- Local daemon/server transport. / 本地 daemon/server transport。
- Remote runtime connectivity v1. / remote runtime connectivity v1。
- Public runtime SDK and control API with versioned schemas. / 带版本化 schemas 的公共 runtime SDK 与 control API。
- Protocol versioning and compatibility tests. / protocol versioning 与 compatibility tests。

Platform scope / 平台范围:

- `vscode-extension-adapter`, `remote-runtime-connectivity`, `communication-protocol`, `runtime-message-bus`, `session-store`, `platform-contracts`, `testing-regression`.

Acceptance gate / 验收门禁:

- VSCode smoke runs without importing CLI rendering. / VSCode smoke 不导入 CLI rendering 即可运行。
- Server/daemon e2e uses protocol fixtures, not stdout parsing. / server/daemon e2e 使用 protocol fixtures，而不是解析 stdout。
- Protocol compatibility test covers persisted session and event schemas. / protocol compatibility test 覆盖持久化 session 与 event schemas。
- SDK/control API fixtures cover request, event, control, cancellation, replay, and backward-compatible additive schema changes. / SDK/control API fixtures 覆盖 request、event、control、cancellation、replay 和 backward-compatible additive schema changes。

Next OpenSpecs / 后续 OpenSpec:

- `implement-vscode-event-projection`
- `implement-local-runtime-server`
- `stabilize-runtime-protocol-v1`
- `implement-public-runtime-sdk-and-control-api`

### R5 Multi-Agent Engineering / R5 多 Agent 工程协作

Product outcome: DeepSeek can split engineering work into bounded tasks and merge evidence safely.

产品结果：DeepSeek 能把工程工作拆成有边界的任务，并安全合并证据。

Product scope / 产品范围:

- TaskGraph and subagent manager. / TaskGraph 与 subagent manager。
- Worker scopes: paths, tools, budgets, deadlines. / worker scopes：paths、tools、budgets、deadlines。
- Worktree or overlay execution. / worktree 或 overlay execution。
- Patch/evidence collection. / patch/evidence collection。
- Merge, review, and test aggregation. / merge、review 与 test aggregation。

Platform scope / 平台范围:

- `agent-management`, `workflow-orchestration`, `concurrency-orchestration`, `workspace-state-management`, `policy-sandbox`, `testing-regression`.

Acceptance gate / 验收门禁:

- Multi-agent scenario runs two disjoint workers with separate write scopes. / multi-agent 场景运行两个互不重叠写入范围的 worker。
- Conflict scenario rejects or escalates instead of silently overwriting. / conflict 场景拒绝或升级处理，而不是静默覆盖。
- Evidence includes tests, changed files, policy decisions, and trace replay. / evidence 包含 tests、changed files、policy decisions 和 trace replay。

Next OpenSpecs / 后续 OpenSpec:

- `implement-taskgraph-v1`
- `implement-subagent-scoped-execution`
- `implement-worktree-overlay-execution`

### R6 Product UX And Collaboration / R6 产品体验与协作

Product outcome: the platform becomes a polished daily tool across terminal and collaboration surfaces.

产品结果：平台成为跨终端与协作场景的成熟日常工具。

Product scope / 产品范围:

- Rich TUI, virtualized transcript, banners/tips/notifications. / rich TUI、virtualized transcript、banners/tips/notifications。
- Vim/keybindings/history search. / vim/keybindings/history search。
- Output styles, theme picker, status line, terminal title, and command palette. / output styles、theme picker、status line、terminal title 和 command palette。
- First-run onboarding, feature tips, and recommendation dismissal state. / first-run onboarding、feature tips 和 recommendation dismissal state。
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
- Release channel metadata declares compatibility and rollback plan. / release channel metadata 声明 compatibility 与 rollback plan。

Next OpenSpecs / 后续 OpenSpec:

- `implement-managed-policy-v1`
- `implement-signed-plugin-distribution`
- `implement-enterprise-audit-export`
- `implement-release-channels`

## Immediate Recommended Sequence / 近期推荐顺序

1. Add `implement-plugin-lockfile-v1`. / 增加 `implement-plugin-lockfile-v1`。
2. Add `implement-mcp-and-plugin-auth-boundaries`. / 增加 `implement-mcp-and-plugin-auth-boundaries`。
3. Then revisit R4 with `implement-vscode-event-projection`. / 然后回到 R4 推进 `implement-vscode-event-projection`。

Rationale: R1/R2 foundations now cover the first usable local product surface, context/safety, checkpoints, code intelligence, and observability/privacy. R3 has established canonical skills/hooks/MCP gateway v1 before moving to plugin packaging and extension credential boundaries.

理由：R1/R2 基础现在已经覆盖首个可用本地产品面、context/safety、checkpoints、code intelligence 和 observability/privacy。R3 已先建立 canonical skills/hooks/MCP gateway v1，然后再推进 plugin packaging 与 extension credential boundaries。
