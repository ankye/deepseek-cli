# CLI Reference Extraction Implementation Plan / CLI 参考精华抽离与实施方案

This plan extracts product and architecture lessons from the local Claude Code reference snapshot at `参考/claude-code-2.1.88/src`. It is a capability ledger for DeepSeek, not a license to copy implementation details. Future OpenSpecs should use this document to avoid dropping important CLI product capabilities while still preserving DeepSeek's contract-first architecture.

本方案从本地 Claude Code 参考快照 `参考/claude-code-2.1.88/src` 中抽离产品与架构经验。它是 DeepSeek 的能力总账，不是复制实现细节的依据。后续 OpenSpec 应使用本文避免遗漏重要 CLI 产品能力，同时保持 DeepSeek 契约先行架构。

## Extraction Rules / 抽离规则

- Borrow product behavior and proven capability boundaries; do not copy source code, private naming, or coupled module structure. / 借鉴产品行为与已验证的能力边界；不复制源码、私有命名或耦合模块结构。
- Keep CLI first, but keep execution in shared runtime packages. / 产品面优先 CLI，但执行权仍保留在共享 runtime packages。
- Every user-visible CLI behavior should become structured events, policy decisions, command results, session records, and replayable traces. / 每个用户可见 CLI 行为都应沉淀为结构化事件、策略决策、命令结果、会话记录和可 replay trace。
- Promote only proven workflows to VSCode, server, SDK, native, team, or enterprise hosts. / 只把已在 CLI 验证的工作流推广到 VSCode、server、SDK、native、team 或 enterprise hosts。
- Prefer smaller orthogonal contracts over one large terminal-centric interface. / 优先使用小而正交的契约，而不是一个以终端为中心的大接口。
- Plan directories before adding code: every large capability must declare its package, subdirectories, public exports, test fixtures, and file-size guardrails before implementation. / 写代码前先规划目录：每个大型能力在实现前必须声明 package、子目录、公开导出、测试 fixture 和文件体量护栏。

## Reference Shape / 参考形态

Claude Code's reference implementation is valuable because it shows what a mature AI engineering CLI eventually accumulates:

Claude Code 的参考实现有价值，是因为它展示了一个成熟 AI 工程 CLI 最终会积累哪些能力：

- `main.tsx`: product entry, flags, commands, auth, config, MCP, plugins, remote, interactive and headless modes. / 产品入口、flags、commands、auth、config、MCP、plugins、remote、交互与 headless 模式。
- `QueryEngine.ts` and `query.ts`: conversation lifecycle, model streaming, tool loop, compaction, budget, and recovery. / conversation lifecycle、模型流式输出、tool loop、compaction、budget 和恢复。
- `Tool.ts`, `tools.ts`, `src/tools/*`: tool registry, tool semantics, permissions, rendering, result mapping, and tool-specific evidence. / tool registry、tool semantics、permissions、rendering、result mapping 和工具级证据。
- `utils/permissions`, `hooks/useCanUseTool.tsx`, `components/permissions`: permission rules, modes, approval bridge, and terminal approval UI. / permission rules、modes、approval bridge 和终端审批 UI。
- `commands.ts`, `src/commands/*`, `skills/*`: slash commands, skills, dynamic discovery, and command aggregation. / slash commands、skills、动态发现和命令聚合。
- `services/mcp`, `utils/plugins`, `services/tools`, `remote`, `server`, `bridge`: extension gateway, tool orchestration, remote control, and future host surfaces. / extension gateway、tool orchestration、remote control 和未来 host surfaces。

DeepSeek should treat this as a map of product pressure, then rebuild it as cleaner contracts.

DeepSeek 应把它视为产品压力图，再用更清晰的契约重新构建。

## Target Architecture / 目标架构

```text
CLI host
  input, flags, renderer, terminal approvals
        |
        v
Command + protocol edge
  command results, runtime requests, host capabilities
        |
        v
Runtime kernel
  agent loop, turn lifecycle, scheduler, cancellation
        |
        +--> Capability registry
        |      manifests, model schemas, tool semantics
        |
        +--> Tool execution governance
        |      executors, sandbox, hooks, result evidence
        |
        +--> Policy and approval
        |      PolicyEngine, ApprovalBroker, AuditLog, SecretGuard
        |
        +--> Context and memory
        |      ContextGraph, memory, compact, result store
        |
        +--> Extension gateways
        |      skills, commands, hooks, MCP, plugins
        |
        +--> Session and replay
               persistence, resume, fork, golden traces
```

Key architectural upgrades over the reference:

相对参考实现，DeepSeek 的关键架构升级：

| Reference pressure / 参考压力 | DeepSeek split / DeepSeek 拆法 |
| --- | --- |
| One large Tool interface mixes schema, execution, permission, rendering, prompt, and telemetry. / 单个 Tool 接口混合 schema、execution、permission、rendering、prompt 和 telemetry。 | Split `ToolManifest`, `ToolExecutor`, `ToolPolicyAdapter`, `ToolPromptSpec`, `ToolResultEvidence`, and host `ToolRenderer`. / 拆成 `ToolManifest`、`ToolExecutor`、`ToolPolicyAdapter`、`ToolPromptSpec`、`ToolResultEvidence` 和 host `ToolRenderer`。 |
| CLI entry gathers auth, config, plugin, MCP, remote, TUI, and headless behavior. / CLI 入口聚合 auth、config、plugin、MCP、remote、TUI 和 headless 行为。 | Keep CLI as host edge over command/protocol services; feature logic lives in packages. / CLI 只作为 command/protocol services 的 host edge；功能逻辑放在 packages。 |
| Permission UI, policy rules, classifier, hooks, and bridge callbacks are tightly coupled. / 权限 UI、policy rules、classifier、hooks 和 bridge callbacks 紧耦合。 | Split `PolicyEngine`, `ApprovalBroker`, `ApprovalRenderer`, `SandboxRuntime`, `AuditLog`, and optional classifiers. / 拆成 `PolicyEngine`、`ApprovalBroker`、`ApprovalRenderer`、`SandboxRuntime`、`AuditLog` 和可选 classifier。 |
| Commands, skills, plugin commands, MCP prompts, and workflows overlap. / commands、skills、plugin commands、MCP prompts 和 workflows 概念重叠。 | Normalize contributions through extension manifests and command capability contracts. / 通过 extension manifests 和 command capability contracts 统一贡献。 |
| Rich terminal UI is embedded near product logic. / Rich terminal UI 接近产品逻辑。 | Render only protocol events and command results at host edge. / host edge 只渲染 protocol events 与 command results。 |

## Directory Planning Guardrails / 目录规划护栏

The reference CLI proves why directory planning must be explicit. Large terminal products naturally pull flags, commands, tools, permissions, MCP, plugins, diagnostics, and UI into a few central files unless the architecture resists that pressure.

参考 CLI 证明了目录规划必须显式化。大型终端产品会自然地把 flags、commands、tools、permissions、MCP、plugins、diagnostics 和 UI 吸进少数中心文件，除非架构主动抵抗这种压力。

### File And Module Rules / 文件与模块规则

- `src/apps/cli` owns process startup, argument parsing, terminal input, renderers, and host capability wiring only. It must not own model calls, tool execution, policy evaluation, MCP/plugin logic, or session semantics. / `src/apps/cli` 只负责进程启动、参数解析、终端输入、renderer 和 host capability wiring。它不得拥有模型调用、工具执行、policy evaluation、MCP/plugin 逻辑或 session semantics。
- `index.ts` files should be export surfaces, not implementation hubs. / `index.ts` 应是导出面，不是实现中心。
- A file that approaches 500 lines should be reviewed for extraction; a file that approaches 800 lines requires a split plan in the same OpenSpec. / 文件接近 500 行时应评估拆分；接近 800 行时同一 OpenSpec 必须给出拆分方案。
- New feature folders should separate `contracts`, `engine`, `adapters`, `renderers`, `persistence`, `fixtures`, and `tests` when those responsibilities exist. / 新功能目录在职责存在时应拆分 `contracts`、`engine`、`adapters`、`renderers`、`persistence`、`fixtures` 和 `tests`。
- Shared behavior belongs in `src/packages/*`; host rendering belongs in `src/apps/*`; test doubles and golden builders belong in `src/packages/testing-regression` or `tests/fixtures`. / 共享行为放在 `src/packages/*`；host rendering 放在 `src/apps/*`；测试替身与 golden builders 放在 `src/packages/testing-regression` 或 `tests/fixtures`。
- Cross-package APIs must enter through `@deepseek/platform-contracts` or the owning package public export. / 跨 package API 必须通过 `@deepseek/platform-contracts` 或 owner package 的 public export 进入。

### Preferred Package Shapes / 推荐包形态

Use these shapes as defaults. A future OpenSpec may adjust them, but it should explain why.

默认使用以下形态。后续 OpenSpec 可以调整，但必须说明原因。

```text
src/apps/cli/src/
  entry/                  # process startup and command registration
  commands/               # CLI command adapters only
  renderers/              # text/json/jsonl/tui renderers
  input/                  # terminal input, prompts, keybindings
  host/                   # host capability wiring
  diagnostics/            # CLI-facing doctor/support bundle adapters

src/packages/platform-contracts/src/
  approval.ts             # approval event/request/decision contracts
  capability.ts           # capability and tool contracts
  command.ts              # command contracts
  extension.ts            # extension contribution contracts
  policy.ts               # policy contracts only
  protocol.ts             # event envelope contracts

src/packages/policy-sandbox/src/
  engine/                 # PolicyEngine
  approvals/              # ApprovalBroker and decision lifecycle
  sandbox/                # enforcement adapters
  audit/                  # redacted audit records
  rules/                  # rule parsing and precedence
  path-safety/            # filesystem scope validation
  shell-safety/           # shell command analysis

src/packages/capability-registry/src/
  manifests/              # tool manifests and semantic flags
  projection/             # model schema projection
  permissions/            # capability permission declarations
  registry/               # lookup and composition

src/packages/core-coding-tools/src/
  tools/<tool-name>/      # executor, schema, evidence, tests per tool
  shared/                 # shared workspace/diff/process helpers

src/packages/command-system/src/
  manifests/
  handlers/
  composition/
  slash/

src/packages/mcp-gateway/src/
  config/
  client/
  auth/
  projection/
  resources/
  fixtures/

src/packages/plugin-system/src/
  manifest/
  lockfile/
  install/
  validation/
  permissions/
  registry/
```

### OpenSpec Directory Plan Requirement / OpenSpec 目录计划要求

Every implementation OpenSpec for a large capability must include a "Directory Plan / 目录计划" section with:

每个大型能力的 implementation OpenSpec 都必须包含 "Directory Plan / 目录计划" 小节，说明：

- owner package(s) and new folders; / owner package 与新增目录；
- public exports and private modules; / 公开导出与私有模块；
- files expected to remain host-specific; / 预期保持 host-specific 的文件；
- contracts that must stay implementation-free; / 必须保持 implementation-free 的契约；
- fixture and test locations; / fixture 与测试位置；
- split triggers for large files or central dispatchers. / 大文件或中心 dispatcher 的拆分触发条件。

### Vi-Inspired CLI Architecture Requirement / Vi 启发式 CLI 架构要求

DeepSeek should borrow vi's composition model, not full Vim emulation. Large CLI interaction OpenSpecs must describe how the feature uses modes, actions, targets, counts/repeats, command palette entries, keymaps, reference sets, quickfix-style result lists, jump history, request/turn revert targets, and declarative extension contributions.

DeepSeek 应借鉴 vi 的组合模型，而不是完整 Vim 模拟。大型 CLI 交互 OpenSpec 必须说明该功能如何使用 modes、actions、targets、counts/repeats、command palette entries、keymaps、reference sets、quickfix 风格 result lists、jump history、request/turn revert targets 和声明式 extension contributions。

- Multi-file context must be represented as structured reference sets with provenance, ordering, budget metadata, and switchable focus; it must not be only prompt text. / 多文件上下文必须表示为带 provenance、ordering、budget metadata 和可切换焦点的结构化 reference sets，不能只作为 prompt text。
- Search, diagnostics, tests, tool output, approval queues, and code-intelligence findings should produce quickfix-style result lists whose items can become typed action targets. / search、diagnostics、tests、tool output、approval queues 和 code-intelligence findings 应产出 quickfix 风格 result lists，其中每个 item 都可成为类型化 action target。
- Navigation between files, diffs, messages, result items, approvals, and sessions should update jump history so back/forward does not re-run tools or model turns by default. / files、diffs、messages、result items、approvals 和 sessions 之间的导航应更新 jump history，使 back/forward 默认不重新运行 tools 或 model turns。
- Request/turn-level revert must be a composable action over typed request, turn, result-list, or session-history targets, with dry-run summaries and immutable history evidence. / request/turn 级 revert 必须是作用于类型化 request、turn、result-list 或 session-history targets 的可组合 action，并具备 dry-run summaries 和 immutable history evidence。
- User and plugin extensions may contribute commands, actions, target resolvers, result-list providers, keymaps, palette entries, and render hints through manifests; they must not mutate CLI or runtime internals. / 用户和 plugin extension 可通过 manifest 贡献 commands、actions、target resolvers、result-list providers、keymaps、palette entries 和 render hints；它们不得修改 CLI 或 runtime internals。

## Architecture Fitness Assessment / 现有架构适配度评估

Current verdict: the architecture direction is strong enough to keep. It is not yet the final shape for the full CLI product. We should not restart the repository, but we should add an architecture-hardening pack before heavy CLI feature expansion.

当前判断：架构方向足够好，应继续保留。它还不是完整 CLI 产品的最终形态。无需推倒重来，但在重型 CLI 功能扩张前应增加一个架构加固包。

What is already good:

已有优势：

- The monorepo already separates host adapters from platform packages: `src/apps/cli`, `src/apps/vscode-extension`, and `src/packages/*`. / monorepo 已经把 host adapters 与 platform packages 分开。
- The package map already has the right long-term owners: `runtime`, `platform-contracts`, `communication-protocol`, `policy-sandbox`, `capability-registry`, `command-system`, `context-engine`, `mcp-gateway`, `plugin-system`, `session-store`, and `testing-regression`. / package map 已经具备长期 owner。
- `platform-contracts` is already split into domain files instead of one giant contract file. / `platform-contracts` 已经按领域拆分，而不是一个巨大 contract 文件。
- Architecture lint and package boundary rules are already part of the repository culture. / 架构 lint 与 package boundary rules 已经是仓库约束。

What must be adjusted before the full CLI plan:

完整 CLI 计划前必须调整的点：

- `src/apps/cli/src/index.ts` is already a large host entry file. It should be split before adding rich approvals, diagnostics, plugin management, and TUI screens. / `src/apps/cli/src/index.ts` 已经是大型 host 入口文件。在加入 rich approvals、diagnostics、plugin management 和 TUI screens 前应先拆分。
- Several package `index.ts` files are becoming implementation hubs. `index.ts` should be reduced to exports and small composition functions. / 多个 package 的 `index.ts` 正在变成实现中心。`index.ts` 应收敛为导出面和少量组合函数。
- `policy-sandbox` needs submodules for policy engine, approval lifecycle, audit, sandbox enforcement, path safety, and shell safety before advanced permission UX lands. / `policy-sandbox` 在高级权限 UX 落地前需要拆出 policy engine、approval lifecycle、audit、sandbox enforcement、path safety 和 shell safety。
- `command-system` needs command manifests, handlers, composition, slash parsing, and host rendering boundaries before command/skill/plugin/MCP flows converge. / `command-system` 在 command/skill/plugin/MCP flow 汇聚前需要拆出 command manifests、handlers、composition、slash parsing 和 host rendering boundaries。
- `mcp-gateway` and `plugin-system` should avoid becoming marketplace/auth/config/client monoliths. / `mcp-gateway` 与 `plugin-system` 应避免变成 marketplace/auth/config/client 大杂烩。
- Approval and tool-result evidence contracts should be explicit in `platform-contracts` before the CLI renderer grows. / 在 CLI renderer 变复杂前，应先在 `platform-contracts` 中显式定义 approval 与 tool-result evidence contracts。

Recommended enabling pack:

推荐先行包：

`split-cli-host-and-architecture-scale-guardrails`

Scope:

范围：

- Split CLI host code into `entry`, `commands`, `renderers`, `input`, `host`, and `diagnostics` folders without changing behavior. / 将 CLI host code 拆入 `entry`、`commands`、`renderers`、`input`、`host` 和 `diagnostics`，不改变行为。
- Split implementation-heavy package `index.ts` files into private modules while preserving public exports. / 将实现过重的 package `index.ts` 拆到私有模块，同时保持 public exports。
- Add or extend lint rules for maximum central-file size, package `index.ts` responsibilities, and host-to-runtime import boundaries. / 增加或扩展 lint 规则，覆盖中心文件体量、package `index.ts` 职责和 host-to-runtime import boundaries。
- Add a required OpenSpec "Directory Plan / 目录计划" template section for all large implementation changes. / 为所有大型实现变更增加必需的 OpenSpec "Directory Plan / 目录计划" 模板小节。
- Produce no product behavior changes; this is an enabling refactor with snapshot/golden parity. / 不产生产品行为变化；这是带 snapshot/golden parity 的先行重构。

This pack should run before `harden-cli-permissions-and-approval-ux` or be the first task inside it. The safer route is a separate pack because permission UX will otherwise deepen the exact files that already need splitting.

该包应在 `harden-cli-permissions-and-approval-ux` 之前执行，或作为其中第一个任务。更稳妥的是单独成包，因为 permission UX 否则会继续加深当前已经需要拆分的文件。

## Anti-Hack Guardrails From Reference / 从参考实现反向提炼的防 Hack 护栏

The reference contains many pragmatic workarounds that are understandable in a mature shipped product. DeepSeek should treat them as early warning signals. We should preserve the user-facing capability while designing away the workaround class.

参考实现中有很多成熟产品在长期演进后产生的务实 workaround。DeepSeek 应把它们视为预警信号：保留用户可感知能力，但在架构上提前消除这类 workaround。

| Reference hack pressure / 参考中的 hack 压力 | DeepSeek prevention / DeepSeek 预防策略 |
| --- | --- |
| A large CLI entrypoint accumulates public flags, hidden flags, internal flags, remote rewrites, feature gates, auth, plugins, MCP, and telemetry. / 大型 CLI 入口聚合公开 flags、隐藏 flags、内部 flags、remote rewrite、feature gates、auth、plugins、MCP 和 telemetry。 | Split CLI into command registration, request building, host capabilities, renderers, and diagnostics. Hidden/internal flags require a manifest owner and tests, not ad hoc entrypoint branches. / 拆分 CLI command registration、request building、host capabilities、renderers 和 diagnostics。隐藏/内部 flags 必须有 manifest owner 和测试，不能临时写进入口分支。 |
| `dangerously-skip-permissions` and bypass modes need later killswitches, stripping, and special-case safety checks. / `dangerously-skip-permissions` 与 bypass modes 后续需要 killswitch、stripping 和特殊安全检查。 | Treat bypass as a break-glass policy state, not a normal CLI shortcut: managed policy can disable it, hard safety checks remain bypass-immune, and every use is audited. / 将 bypass 作为 break-glass policy state，而不是普通 CLI 快捷方式：managed policy 可禁用，硬安全检查不受 bypass 影响，每次使用都写 audit。 |
| Headless/print mode may skip trust UI and then must compensate through warnings and environment restrictions. / headless/print mode 可能跳过 trust UI，之后必须靠警告和环境限制补偿。 | Headless must have equivalent policy semantics: explicit trust context, fail-closed defaults, JSON/JSONL approval events, and no silent trust downgrade. / headless 必须具备等价 policy semantics：显式 trust context、fail-closed defaults、JSON/JSONL approval events，不能静默降级 trust。 |
| Shell allow/deny rules depend on legacy parsers, wrapper stripping, regex exceptions, command caps, and fallback gates. / shell allow/deny rules 依赖 legacy parser、wrapper stripping、regex exceptions、命令数量上限和 fallback gates。 | Shell policy uses a single shell analysis service with AST-first parsing, normalized command forms, explicit unsupported states, and fail-closed behavior. Regex matching is only a secondary matcher over normalized evidence. / shell policy 使用单一 shell analysis service，AST 优先、规范化 command forms、显式 unsupported states 和 fail-closed。regex 只能作为 normalized evidence 上的二级 matcher。 |
| Classifier/auto mode can accidentally bypass broad allow rules unless dangerous rules are stripped. / classifier/auto mode 如果不剥离危险规则，可能被宽泛 allow rule 绕过。 | Classifiers are advisory and never override hard policy. Broad shell/interpreter/task rules are rejected or downgraded at config-load time with visible diagnostics. / classifier 仅作 advisory，永不覆盖 hard policy。宽泛 shell/interpreter/task rules 在 config-load 时拒绝或降级，并提供可见诊断。 |
| Path safety needs many platform-specific patches: case-insensitive paths, `..`, symlinks, UNC, Windows short names, trailing dots/spaces, tilde variants, shell expansion, and globs. / path safety 需要大量平台补丁：大小写不敏感路径、`..`、symlink、UNC、Windows 短名、尾随点/空格、tilde 变体、shell expansion 和 glob。 | Build `PathSafetyService` as a first-class platform abstraction with original path, resolved path, canonical path, platform facts, and bypass fixture suites. No write path accepts shell-expanded or globbed targets. / 将 `PathSafetyService` 作为一等 platform abstraction，记录 original/resolved/canonical path、platform facts 和 bypass fixture suites。写路径不接受 shell-expanded 或 globbed targets。 |
| MCP config loaded from CLI/files/enterprise can create precedence bypasses. / MCP config 来自 CLI/files/enterprise 时可能产生 precedence bypass。 | Config precedence is a contract with provenance. Every source goes through the same policy validator, and enterprise deny rules apply after all local additions. / config precedence 是带 provenance 的契约。所有来源走同一 policy validator，enterprise deny rules 在所有 local additions 后仍生效。 |
| Feature-gated `require()` calls and internal-only code paths spread through hot files. / feature-gated `require()` 与 internal-only 路径散落在热点文件。 | Use a typed feature registry and contribution manifests. Feature code registers through package-owned modules; hot paths consume declared capabilities. / 使用 typed feature registry 和 contribution manifests。功能代码通过 package-owned modules 注册；热点路径只消费声明能力。 |
| Commands, skills, plugin commands, MCP prompts, and legacy command folders require compatibility filters. / commands、skills、plugin commands、MCP prompts 和 legacy command folders 需要兼容过滤。 | Normalize all contributions into versioned command/skill manifests with migration adapters at the edge. Do not let legacy source labels leak into runtime routing. / 将所有贡献归一为版本化 command/skill manifests，迁移适配只在边缘层处理。不要让 legacy source labels 泄漏到 runtime routing。 |
| Bridge/remote systems require session-id retagging and compat maps between API layers. / bridge/remote 系统需要 session-id retagging 和 API 层之间的 compat maps。 | Version protocol IDs explicitly. Session identity, transport identity, and display identity are distinct contract fields, with adapters isolated in `remote-runtime-connectivity`. / 显式版本化 protocol IDs。session identity、transport identity 和 display identity 是不同契约字段，adapter 隔离在 `remote-runtime-connectivity`。 |
| Runtime logic backfills legacy/derived tool input fields for hooks, permissions, SDK streams, or transcripts. / runtime 为 hooks、permissions、SDK streams 或 transcripts 回填 legacy/derived tool input fields。 | Use versioned envelopes and explicit projection adapters. Runtime should not mutate model input to satisfy legacy observers. / 使用 versioned envelopes 和显式 projection adapters。runtime 不应为了兼容旧 observer 而修改模型输入。 |
| Environment variables mutate global process behavior after bootstrap. / 环境变量在 bootstrap 后继续改变全局进程行为。 | Read env once into immutable session config with provenance. Later code consumes config objects, not `process.env`, except inside platform adapters. / 启动时一次性读取 env 到带 provenance 的 immutable session config。后续代码消费 config objects，而不是 `process.env`，platform adapters 除外。 |
| Local UI commands can become command behavior. / 本地 UI 命令可能变成命令行为本身。 | Command handlers produce command results; host renderers project UI. No shared command handler may depend on terminal UI components. / command handler 产出 command results；host renderer 投影 UI。共享 command handler 不得依赖 terminal UI components。 |
| Telemetry/debug/support output can accidentally include raw env, proxy, auth, or path material. / telemetry/debug/support output 可能意外包含 raw env、proxy、auth 或路径材料。 | Redaction is contract-driven and tested through support-bundle fixtures. Diagnostics cite secret references and trace ids, not raw values. / redaction 由契约驱动，并通过 support-bundle fixtures 测试。diagnostics 引用 secret references 和 trace ids，不输出 raw values。 |

Anti-hack implementation stance:

反 hack 实施立场：

- If a feature needs a hidden flag, first add a manifest and test its allowed audience, stability, and removal path. / 如果功能需要隐藏 flag，先加 manifest，并测试 allowed audience、stability 和 removal path。
- If a feature needs compatibility behavior, isolate it in an adapter and add a versioned migration test. / 如果功能需要兼容行为，将其隔离在 adapter，并添加版本化 migration test。
- If a feature touches policy, shell, path, auth, credential, MCP, plugin, or remote transport, add negative bypass fixtures before happy-path polish. / 如果功能触及 policy、shell、path、auth、credential、MCP、plugin 或 remote transport，先加负向 bypass fixtures，再做 happy path polish。
- If a feature requires a shortcut around the normal runtime/protocol path, it is probably an architecture smell and needs design review. / 如果功能需要绕开正常 runtime/protocol path，那通常是架构异味，需要设计评审。

### Pit-To-Fixture Backlog / 坑位到 Fixture 的回填清单

These are not optional polish tests. They are the places where mature CLI agents tend to break under real usage.

这些不是可选的打磨测试。它们是成熟 CLI agent 在真实使用中最容易出问题的位置。

The executable catalog lives in `@deepseek/testing-regression` at `src/packages/testing-regression/src/reference-pits`. Future owner tests and OpenSpecs should cite the fixture id plus the owner evidence id, not just the prose pit family.

可执行 catalog 位于 `@deepseek/testing-regression` 的 `src/packages/testing-regression/src/reference-pits`。后续 owner tests 与 OpenSpec 应引用 fixture id 和 owner evidence id，而不只写文字型坑位类别。

| Pit / 坑位 | Executable fixture id / 可执行 fixture id | Required fixture or gate / 必需 fixture 或门禁 | Owner evidence / 归属证据 |
| --- | --- | --- | --- |
| Bypass permission mode silently weakens safety. / bypass permission mode 静默削弱安全。 | `pit.permission-bypass.hard-safety` | Bypass mode still blocks hard safety checks; managed policy can disable bypass; audit records every bypass decision. / bypass mode 仍阻止硬安全检查；managed policy 可禁用 bypass；audit 记录每次 bypass decision。 | `policy:bypass-hard-safety`; `policy-sandbox`, `testing-regression` |
| Headless mode skips interactive trust. / headless mode 跳过交互式 trust。 | `pit.headless-trust.fail-closed` | Headless emits structured approval/trust events and fails closed when approval cannot be obtained. / headless 发出结构化 approval/trust events，并在无法审批时 fail closed。 | `policy:headless-fail-closed`; `apps/cli`, `communication-protocol`, `policy-sandbox` |
| Shell parser mismatch allows wrapped or compound commands through. / shell parser 不一致导致 wrapper 或 compound command 放行。 | `pit.shell-parser.fallback-risk` | Fixture set for wrappers, env prefixes, pipes, heredocs, newlines, quotes, `cd &&`, nested shells, PowerShell, and parser-unavailable fallback. / 覆盖 wrappers、env prefixes、pipes、heredocs、newlines、quotes、`cd &&`、nested shells、PowerShell 和 parser-unavailable fallback。 | `policy:shell-fallback-risk`; `policy-sandbox`, `core-coding-tools` |
| Path canonicalization bypasses file policy. / path canonicalization 绕过文件策略。 | `pit.path-canonicalization.unsafe-syntax` | Cross-platform fixtures for case differences, `..`, symlinks, UNC, Windows short names, trailing dots/spaces, tilde variants, shell expansion, and globs. / 跨平台 fixtures 覆盖大小写差异、`..`、symlinks、UNC、Windows 短名、尾随点/空格、tilde 变体、shell expansion 和 globs。 | `platform:path-unsafe-syntax`; `platform-abstraction`, `policy-sandbox` |
| MCP or plugin config source overrides managed policy. / MCP 或 plugin config source 覆盖 managed policy。 | `pit.mcp-plugin-precedence.enterprise-deny` | Provenance fixtures for user/project/local/CLI/enterprise sources; enterprise deny wins after merge. / user/project/local/CLI/enterprise 来源 provenance fixtures；enterprise deny 在 merge 后仍获胜。 | planned owner evidence / 计划中的 owner evidence; `config`, `mcp-gateway`, `plugin-system`, `policy-sandbox` |
| Extension installs hide permission expansion. / extension install 隐藏权限扩张。 | `pit.extension-permission-expansion.permission-diff` | Lockfile and install fixtures show permission diff, credential scopes, tool/resource additions, and rollback metadata. / lockfile 与 install fixtures 展示 permission diff、credential scopes、tool/resource additions 和 rollback metadata。 | `plugin:permission-expansion`; `plugin-system`, `extension-system` |
| Legacy command or skill source leaks into runtime routing. / legacy command 或 skill source 泄漏到 runtime routing。 | `pit.legacy-contribution-normalization.manifest-boundary` | Contribution normalization fixture proves all sources become versioned manifests before runtime consumption. / contribution normalization fixture 证明所有来源在 runtime 消费前都变成版本化 manifest。 | `composition:contribution-validation`; `command-system`, `skill-system`, `extension-system` |
| Remote session ID compatibility corrupts resume/fork/audit. / remote session ID 兼容转换破坏 resume/fork/audit。 | `pit.remote-identity.separate-domains` | Protocol versioning fixtures separate session identity, transport identity, display identity, and audit correlation ids. / protocol versioning fixtures 分离 session identity、transport identity、display identity 和 audit correlation ids。 | `remote:identity-separation`; `remote-runtime-connectivity`, `session-store` |
| Env variables continue mutating runtime behavior after startup. / env variables 在启动后继续改变 runtime 行为。 | `pit.env-snapshot.immutable-startup` | Bootstrap config fixture proves env is snapshotted with provenance and downstream code consumes immutable config. / bootstrap config fixture 证明 env 被带 provenance 快照化，下游代码消费 immutable config。 | `config:immutable-env-snapshot`; `config`, `apps/cli`, `platform-abstraction` |
| Diagnostics or support bundles leak secrets. / diagnostics 或 support bundles 泄漏 secrets。 | `pit.diagnostic-redaction.support-bundle` | Redaction fixtures include env, proxy, auth headers, file paths, MCP credentials, plugin metadata, and trace payloads. / redaction fixtures 覆盖 env、proxy、auth headers、file paths、MCP credentials、plugin metadata 和 trace payloads。 | `observability:diagnostic-redaction`; `observability`, `credential-auth-management`, `testing-regression` |

## Capability Ledger / 能力总账

### 1. CLI Entry, Modes, And Invocation / CLI 入口、模式与调用

Reference capabilities:

参考能力：

- Interactive REPL, headless single-run mode, stdin/piped input, JSON and streaming JSON output. / 交互式 REPL、headless 单次运行、stdin/piped input、JSON 与 streaming JSON 输出。
- Session continuation, explicit resume, fork/branch-like flows, model selection, permission mode, allowed/denied tools, MCP config, plugin directories. / session continuation、显式 resume、轻量 fork/branch、model selection、permission mode、allowed/denied tools、MCP config、plugin directories。
- Install/update/doctor/completion/auth/plugin/MCP/server subcommands. / install/update/doctor/completion/auth/plugin/MCP/server 子命令。

DeepSeek target:

DeepSeek 目标：

- `deepseek run` and `deepseek chat` remain the primary polished surfaces. / `deepseek run` 与 `deepseek chat` 保持为首要成熟产品面。
- All output modes consume the same runtime event stream. / 所有输出模式消费同一 runtime event stream。
- CLI flags mutate structured request envelopes, not runtime internals. / CLI flags 修改结构化 request envelopes，而不是 runtime internals。

Roadmap landing: R1 for run/chat/headless/session basics; R2 for diagnostics and recovery; R3 for extension flags; R4 for server/SDK projection.

路线落点：R1 承接 run/chat/headless/session 基础；R2 承接 diagnostics 与 recovery；R3 承接 extension flags；R4 承接 server/SDK 投影。

### 2. Input Pipeline And Command Ergonomics / 输入管线与命令易用性

Reference capabilities:

参考能力：

- Prompt input modes, slash command parsing, command chaining, queued commands, hook-added context, attachments, image metadata, IDE selection, bash/shell-oriented input modes. / prompt input modes、slash command parsing、command chaining、queued commands、hook-added context、attachments、image metadata、IDE selection、面向 bash/shell 的输入模式。
- Command classes include prompt commands, local commands, and local UI commands. / command classes 包括 prompt commands、local commands 和 local UI commands。

DeepSeek target:

DeepSeek 目标：

- Define `CommandManifest`, `CommandHandler`, and `CommandRenderer` separately. / 分离 `CommandManifest`、`CommandHandler` 和 `CommandRenderer`。
- Treat attachments, IDE selections, and hook-added context as typed context events. / 将 attachments、IDE selections 和 hook-added context 视为 typed context events。
- Keep local UI commands host-only; model-visible command effects must become protocol messages. / local UI commands 只属于 host；模型可见命令效果必须成为 protocol messages。

Roadmap landing: R1 minimal commands; R2 hook/context safety; R3 command/skill/plugin unification; R6 advanced keybindings/history/command palette.

路线落点：R1 最小命令；R2 hook/context safety；R3 command/skill/plugin 统一；R6 高级 keybindings/history/command palette。

### 3. Agent Loop And Streaming Lifecycle / Agent 循环与流式生命周期

Reference capabilities:

参考能力：

- Async streaming conversation lifecycle, model stream events, tool-use detection, tool-result injection, compact boundaries, stop hooks, recovery paths, usage and task budget tracking. / async streaming conversation lifecycle、model stream events、tool-use detection、tool-result injection、compact boundaries、stop hooks、recovery paths、usage 与 task budget tracking。
- Streaming tool execution and scheduling distinguish safe concurrent work from side-effecting work. / streaming tool execution 与 scheduling 区分安全并发工作和有副作用工作。

DeepSeek target:

DeepSeek 目标：

- Runtime owns a typed turn state machine: `accepted -> context_ready -> model_streaming -> tool_planning -> approval_waiting -> executing -> recording -> completed|failed|cancelled`. / runtime 拥有 typed turn state machine。
- Tool scheduling decisions are deterministic and replayable. / tool scheduling decisions 必须确定且可 replay。
- Compaction and budget state must be visible in CLI and traces. / compaction 与 budget state 必须在 CLI 和 traces 中可见。

Roadmap landing: R0/R1 kernel and loop; R2 compaction, usage, diagnostics; R5 multi-agent scheduling.

路线落点：R0/R1 kernel 与 loop；R2 compaction、usage、diagnostics；R5 multi-agent scheduling。

### 4. Tool System And Evidence / 工具体系与证据

Reference capabilities:

参考能力：

- File read/write/edit, glob/grep, shell/PowerShell, web fetch/search, todo/plan, MCP, skills, LSP, task/subagent, remote-trigger, sleep/cron-like tools. / file read/write/edit、glob/grep、shell/PowerShell、web fetch/search、todo/plan、MCP、skills、LSP、task/subagent、remote-trigger、sleep/cron-like tools。
- Tool-level validation, activity descriptions, diff output, result mapping, concurrency flags, destructive/read-only semantics. / tool-level validation、activity descriptions、diff output、result mapping、concurrency flags、destructive/read-only semantics。

DeepSeek target:

DeepSeek 目标：

- `CapabilityRegistry` is the source of tool names, schema projections, semantic flags, permissions, and model-visible descriptions. / `CapabilityRegistry` 是 tool names、schema projections、semantic flags、permissions 和模型可见描述的来源。
- Executors return `ToolResultEvidence` with redacted stdout/stderr, changed files, diffs, diagnostics, audit references, and replay hashes. / executor 返回含 redacted stdout/stderr、changed files、diffs、diagnostics、audit references 和 replay hashes 的 `ToolResultEvidence`。
- Host renderers never execute tools; they render evidence. / host renderers 不执行工具，只渲染 evidence。

Roadmap landing: R1 core coding tools; R2 evidence/diagnostics/code intelligence; R3 MCP/plugin tool projection; R5 subagent/task tools.

路线落点：R1 core coding tools；R2 evidence/diagnostics/code intelligence；R3 MCP/plugin tool projection；R5 subagent/task tools。

### 5. Permissions, Policy, And Approval UX / 权限、策略与审批体验

Reference capabilities:

参考能力：

- Permission modes, allow/deny/ask rules, rule sources, additional working directories, dangerous rule stripping, bypass availability checks, path safety, shell command parsing, tool-specific permission summaries. / permission modes、allow/deny/ask rules、rule sources、additional working directories、dangerous rule stripping、bypass availability checks、path safety、shell command parsing、工具级 permission summaries。
- Approval UI bridges interactive TUI, headless behavior, hooks, classifiers, remote permission callbacks, and background-agent auto-deny. / approval UI 桥接 interactive TUI、headless behavior、hooks、classifiers、remote permission callbacks 和 background-agent auto-deny。

DeepSeek target:

DeepSeek 目标：

- `PolicyEngine`: evaluates rules, scopes, paths, tool semantics, config precedence, and managed policy. / `PolicyEngine` 评估 rules、scopes、paths、tool semantics、config precedence 和 managed policy。
- `ApprovalBroker`: emits approval requests, accepts decisions, handles timeout/cancel/deny, and records every decision. / `ApprovalBroker` 发出 approval requests，接收 decisions，处理 timeout/cancel/deny，并记录所有决策。
- `ApprovalRenderer`: CLI-only rendering for text/JSON/JSONL, with later VSCode/server renderers consuming the same event. / `ApprovalRenderer` 是 CLI-only 渲染，后续 VSCode/server renderer 消费同一事件。
- `SandboxRuntime`: enforces the policy decision independently from the UI. / `SandboxRuntime` 独立于 UI 执行 policy decision。
- `AuditLog`: stores redacted decision evidence and replayable policy inputs. / `AuditLog` 存储脱敏决策证据和可 replay policy inputs。

First implementation pack:

第一实施包：

- `harden-cli-permissions-and-approval-ux`.
- Unified approval events, file diff summaries, shell risk summaries, deny/timeout/cancel parity, audit trace, text/JSON/JSONL parity, golden/e2e tests. / 统一审批事件、文件 diff 摘要、shell 风险摘要、deny/timeout/cancel 对齐、audit trace、text/JSON/JSONL 对齐、golden/e2e 测试。
- Implementation evidence now covers platform-contract approval DTOs, policy-sandbox redacted approval evidence, headless fail-closed broker behavior, runtime approval lifecycle events before scheduler submission, communication-protocol approval records/control messages, CLI text/JSONL rendering, typed approval targets, diagnostic redaction, terminal matrix, and golden replay. / 当前实现证据已覆盖 platform-contract approval DTO、policy-sandbox 脱敏审批证据、headless fail-closed broker 行为、scheduler submission 前的 runtime approval lifecycle events、communication-protocol approval records/control messages、CLI text/JSONL 渲染、typed approval targets、诊断脱敏、终端矩阵和 golden replay。
- Required fixture ids are `pit.headless-trust.fail-closed`, `pit.permission-bypass.hard-safety`, `pit.shell-parser.fallback-risk`, `pit.path-canonicalization.unsafe-syntax`, and `pit.diagnostic-redaction.support-bundle`; extension permission expansion remains deferred to the extension-management pack. / 必需 fixture ids 为 `pit.headless-trust.fail-closed`、`pit.permission-bypass.hard-safety`、`pit.shell-parser.fallback-risk`、`pit.path-canonicalization.unsafe-syntax` 和 `pit.diagnostic-redaction.support-bundle`；extension permission expansion 留到 extension-management 包。

Roadmap landing: R2 first, then R3 for extension permissions, R4 for host promotion, R7 for managed policy.

路线落点：先 R2，再 R3 扩展权限，R4 host promotion，R7 managed policy。

### 6. Context, Memory, Compact, And Result Storage / 上下文、记忆、压缩与结果存储

Reference capabilities:

参考能力：

- System prompt parts, project/user/session memory, nested memory files, MCP resources, skill context, hook-added context, image metadata, LSP/IDE signals, transcript history, microcompact, auto compact, explicit compact, tool-result budgeting. / system prompt parts、project/user/session memory、nested memory files、MCP resources、skill context、hook-added context、image metadata、LSP/IDE signals、transcript history、microcompact、auto compact、explicit compact、tool-result budgeting。

DeepSeek target:

DeepSeek 目标：

- `ContextGraph` should be the only projection boundary for model context. / `ContextGraph` 应成为模型上下文的唯一投影边界。
- Memory, skills, MCP resources, hook outputs, and code intelligence all produce typed context nodes with budgets and provenance. / memory、skills、MCP resources、hook outputs 和 code intelligence 都产出带 budget 与 provenance 的 typed context nodes。
- Compact outputs are session events and replay boundaries, not invisible prompt rewrites. / compact output 是 session events 与 replay boundaries，不是不可见 prompt rewrite。

Roadmap landing: R2 main path; R3 extension context sources; R5 task-scoped memory; R6/R7 sync and enterprise boundaries.

路线落点：R2 主路径；R3 扩展上下文来源；R5 task-scoped memory；R6/R7 sync 与企业边界。

### 7. Skills, Commands, Hooks, MCP, And Plugins / Skills、命令、Hooks、MCP 与插件

Reference capabilities:

参考能力：

- Skills from directories, bundled skills, plugin skills, MCP prompts, dynamic skill discovery. / directory skills、bundled skills、plugin skills、MCP prompts、dynamic skill discovery。
- Hooks around user prompt submit, pre/post tool, post sampling, stop, compact, and session lifecycle. / user prompt submit、pre/post tool、post sampling、stop、compact 和 session lifecycle hooks。
- MCP config, connection management, auth/OAuth, tools/resources/prompts projection, official registries. / MCP config、connection management、auth/OAuth、tools/resources/prompts projection、official registries。
- Plugin validation, install, enable/disable, marketplace, lockfile, versioning, blocklist, startup checks. / plugin validation、install、enable/disable、marketplace、lockfile、versioning、blocklist、startup checks。

DeepSeek target:

DeepSeek 目标：

- Normalize all extension contributions through declared manifests and permission diffs. / 所有扩展贡献都通过 manifest 与 permission diff 归一化。
- MCP and plugin auth use scoped credential references and host-mediated auth UI. / MCP 与 plugin auth 使用 scoped credential references 和 host-mediated auth UI。
- Hooks run through ordered, timeout-limited, isolated execution with deterministic replay policy. / hooks 通过有序、限时、隔离执行，并具备 deterministic replay policy。

Roadmap landing: R3 for trusted CLI extension management; R4 for projection; R7 for signed distribution and managed governance.

路线落点：R3 承接可信 CLI extension management；R4 投影；R7 signed distribution 与 managed governance。

### 8. Sessions, Recovery, Diagnostics, And Release Readiness / 会话、恢复、诊断与发布就绪

Reference capabilities:

参考能力：

- Resume, continue, fork/branch, rewind, export/share, logs, usage/cost/stats, doctor, privacy settings, updater, shell completion, install verification. / resume、continue、fork/branch、rewind、export/share、logs、usage/cost/stats、doctor、privacy settings、updater、shell completion、install verification。

DeepSeek target:

DeepSeek 目标：

- Session store records event streams, decisions, compact boundaries, workspace changes, and replay metadata. / session store 记录 event streams、decisions、compact boundaries、workspace changes 和 replay metadata。
- Request/turn-level revert is a first-class recovery action: it resolves the target request or turn, restores eligible checkpoints through safety checks, emits compensating revert evidence, and preserves the original transcript and audit history. / request/turn 级 revert 是一等 recovery action：它解析目标 request 或 turn，通过 safety checks 恢复 eligible checkpoints，发出补偿性 revert evidence，并保留原始 transcript 与 audit history。
- Revert summaries must distinguish restored files, stale files, non-restorable filesystem changes, and external side effects that require manual review. / revert summary 必须区分已恢复文件、stale 文件、不可恢复的 filesystem changes，以及需要人工复核的 external side effects。
- Diagnostics bundles are redacted by construction and cite trace ids instead of raw secrets. / diagnostics bundles 默认脱敏，并引用 trace ids 而不是 raw secrets。
- Release readiness includes CLI packaging, tarball contents, completion, doctor, privacy, config validation, and smoke evidence. / release readiness 包括 CLI packaging、tarball contents、completion、doctor、privacy、config validation 和 smoke evidence。

Roadmap landing: R2 diagnostics and request/turn revert; R3 release hardening; R4 protocol versioning; R7 enterprise audit/export.

路线落点：R2 diagnostics 与 request/turn revert；R3 release hardening；R4 protocol versioning；R7 enterprise audit/export。

### 9. Rich Terminal UX And Later Host Projection / Rich Terminal UX 与后续 Host 投影

Reference capabilities:

参考能力：

- Permission dialogs, structured diffs, help/settings screens, themes, output styles, status line, terminal setup, keybindings, vim mode, voice, onboarding, recommendations. / permission dialogs、structured diffs、help/settings screens、themes、output styles、status line、terminal setup、keybindings、vim mode、voice、onboarding、recommendations。

DeepSeek target:

DeepSeek 目标：

- Build terminal UX only after the underlying event and evidence contracts are stable. / 在底层 event 与 evidence contracts 稳定后再构建 terminal UX。
- Keep advanced input as host adapters, not runtime features. / 高级输入属于 host adapters，不属于 runtime features。
- Every screen can be projected from command results and runtime events. / 每个 screen 都能从 command results 与 runtime events 投影。

Roadmap landing: minimal in R1/R2/R3; advanced UX in R6; host promotion in R4/R6 depending on gate evidence.

路线落点：R1/R2/R3 最小化；R6 高级 UX；根据门禁证据在 R4/R6 推广 host。

### 10. Remote, Server, SDK, Multi-Agent, And Enterprise / 远程、服务端、SDK、多 Agent 与企业

Reference capabilities:

参考能力：

- Server/remote control, SSH/open/assistant bridge, remote permission bridge, SDK message adapter. / server/remote control、SSH/open/assistant bridge、remote permission bridge、SDK message adapter。
- Agent tools, task tools, team tools, worktree/tmux-oriented flows. / agent tools、task tools、team tools、worktree/tmux-oriented flows。
- Managed settings, plugin marketplace governance, blocklists, auth status, sync-oriented services. / managed settings、plugin marketplace governance、blocklists、auth status、sync-oriented services。

DeepSeek target:

DeepSeek 目标：

- Remote/server/SDK expose CLI-proven protocol semantics, not terminal stdout parsing. / remote/server/SDK 暴露 CLI 已验证的 protocol semantics，而不是解析 terminal stdout。
- Multi-agent work uses scoped execution, disjoint write ownership, evidence merge, and conflict policy. / multi-agent 使用 scoped execution、disjoint write ownership、evidence merge 和 conflict policy。
- Enterprise work adds managed policy, signed plugins, release channels, audit export, and organization credential boundaries. / enterprise 增加 managed policy、signed plugins、release channels、audit export 和组织 credential boundaries。

Roadmap landing: R4 host promotion; R5 multi-agent; R7 enterprise/ecosystem.

路线落点：R4 host promotion；R5 multi-agent；R7 enterprise/ecosystem。

## Implementation Packs / 实施包

| Order / 顺序 | Pack / 实施包 | Roadmap / 路线 | Purpose / 目的 |
| --- | --- | --- | --- |
| 0 | `cli-reference-capability-ledger` | Planning / 规划 | Keep this extraction plan current and require future OpenSpecs to classify borrowed reference capabilities. / 维护本抽离方案，并要求后续 OpenSpec 对参考能力做归类。 |
| 1 | `split-cli-host-and-architecture-scale-guardrails` | R1/R2 enabling / R1/R2 先行 | Split central files, add directory plans, and add scale lint before heavy CLI features. / 拆分中心文件、增加目录计划，并在重型 CLI 功能前加入规模 lint。 |
| 2 | `backfill-reference-pit-fixtures` | R2/R3 enabling / R2/R3 先行 | Turn reference pitfalls into negative fixtures for policy, shell, paths, MCP/plugin config, remote ids, env, and diagnostics. / 将参考坑位转成 policy、shell、path、MCP/plugin config、remote ids、env 和 diagnostics 的负向 fixtures。 |
| 3 | `harden-cli-permissions-and-approval-ux` | R2 | Trust-critical approval events, policy/audit trace, CLI renderer parity, shell/file evidence. / 信任核心审批事件、policy/audit trace、CLI renderer parity、shell/file evidence。 |
| 4 | `polish-cli-diagnostics-and-release-readiness` | R2/R3 | Doctor, diagnostics bundle, privacy evidence, package surface checks, local support-bundle policy, and release verification evidence. / doctor、diagnostics bundle、privacy evidence、package surface checks、local support-bundle policy 和 release verification evidence。 |
| 5 | `implement-cli-extension-auth-and-management` | R3 | MCP/plugin/skill management, credential scopes, permission diff, lock/apply/test flows. / MCP/plugin/skill management、credential scopes、permission diff、lock/apply/test flows。 |
| 6 | `stabilize-command-skill-hook-composition` | R3 | Normalize slash commands, skills, hooks, workflows, and dynamic contributions. / 归一化 slash commands、skills、hooks、workflows 和动态贡献。 |
| 7 | `wire-context-memory-compact-main-path` | R2/R3 | Make context, memory, compact, tool result storage, and code-intelligence evidence first-class in daily CLI turns. / 让 context、memory、compact、tool result storage 和 code-intelligence evidence 成为 CLI 日常回合主路径。 |
| 8 | `implement-rich-cli-tui` | R6, after gates / R6，门禁后 | Add status line, diff screens, settings/help surfaces, keybindings, history, and onboarding over protocol events. / 基于 protocol events 增加 status line、diff screens、settings/help、keybindings、history 和 onboarding。 |
| 9 | `stabilize-runtime-protocol-v1` | R4 | Freeze CLI-proven event/request/session schemas for VSCode/server/SDK promotion. / 固化 CLI 已验证的 event/request/session schemas，供 VSCode/server/SDK 推广。 |
| 10 | `implement-vscode-event-projection` and `implement-local-runtime-server` | R4 | Project proven workflows to non-CLI hosts. / 将已验证工作流投影到非 CLI hosts。 |
| 11 | `implement-taskgraph-v1` and `implement-subagent-scoped-execution` | R5 | Multi-agent task graph, worker scopes, evidence merge, conflict handling. / 多 Agent task graph、worker scopes、evidence merge、conflict handling。 |
| 12 | `implement-managed-policy-v1` and `implement-signed-plugin-distribution` | R7 | Enterprise governance, signed ecosystem, audit export, release channels. / 企业治理、签名生态、audit export、release channels。 |

## OpenSpec Checklist / OpenSpec 检查清单

Every future product-facing OpenSpec should answer:

后续每个面向产品的 OpenSpec 都应回答：

- Which reference capability area does this cover? / 它覆盖哪个参考能力域？
- Which DeepSeek package owns the contract? / 哪个 DeepSeek package 拥有契约？
- Does CLI consume shared events, or is it trying to own execution? / CLI 是消费共享事件，还是试图拥有执行？
- What text/JSON/JSONL evidence is produced? / 产出哪些 text/JSON/JSONL 证据？
- What policy/audit trace is produced? / 产出哪些 policy/audit trace？
- What deterministic golden or replay fixture proves the behavior? / 哪个 deterministic golden 或 replay fixture 证明行为？
- Which reference pit fixtures does this add or rely on? / 它新增或依赖哪些参考坑位 fixtures？
- What is intentionally deferred to R4/R5/R6/R7? / 哪些内容有意延后到 R4/R5/R6/R7？
