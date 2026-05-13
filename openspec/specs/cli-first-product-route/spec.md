# cli-first-product-route Specification

## Purpose
TBD - created by archiving change prioritize-cli-first-product-route. Update Purpose after archive.
## Requirements
### Requirement: CLI-First Product Route / CLI 优先产品路线

The product roadmap SHALL prioritize the terminal CLI as the first polished product surface before promoting equivalent product workflows to VSCode, local server, SDK, browser/native, team, or enterprise hosts.

产品路线图必须优先把终端 CLI 打磨为第一个成熟产品面，然后再把等价产品工作流推广到 VSCode、local server、SDK、browser/native、team 或 enterprise hosts。

#### Scenario: CLI is the primary near-term host / CLI 是近期主 host

- **WHEN** the team chooses the next product-facing OpenSpec after the foundation is in place
- **THEN** the roadmap identifies CLI reliability, CLI interaction, CLI permission UX, CLI diagnostics, CLI extension management, or CLI release readiness as the default near-term priority unless a blocking platform defect prevents it
- **中文** 当基础平台就绪后团队选择下一个面向产品的 OpenSpec 时，路线图默认优先 CLI reliability、CLI interaction、CLI permission UX、CLI diagnostics、CLI extension management 或 CLI release readiness，除非存在阻塞性平台缺陷。

#### Scenario: Non-CLI host is not the lead surface / 非 CLI host 不作为主导产品面

- **WHEN** a VSCode, server, SDK, browser/native, team, or enterprise feature is proposed before CLI gates pass
- **THEN** the proposal records it as a projection, skeleton, fixture, or landing-zone task rather than the leading product surface
- **中文** 当 CLI 门禁通过前提出 VSCode、server、SDK、browser/native、team 或 enterprise 功能时，proposal 必须将其记录为 projection、skeleton、fixture 或 landing-zone task，而不是主导产品面。

### Requirement: CLI Promotion Gates / CLI 推广门禁

A capability SHALL NOT become a product priority for another host until the CLI implementation has proven the shared runtime/protocol behavior, policy decisions, and user-facing workflow through acceptance evidence.

一个能力在 CLI 实现通过验收证据证明共享 runtime/protocol 行为、policy decisions 和用户工作流之前，不得成为其他 host 的产品优先级。

#### Scenario: Capability is promoted from CLI / 能力从 CLI 推广

- **WHEN** a capability is proposed for VSCode, server, SDK, browser/native, team, or enterprise after existing in CLI
- **THEN** the proposal cites CLI acceptance evidence, versioned protocol fixtures, policy/audit traces, deterministic tests, and documented CLI behavior
- **中文** 当一个已存在于 CLI 的能力被提议推广到 VSCode、server、SDK、browser/native、team 或 enterprise 时，proposal 必须引用 CLI 验收证据、版本化 protocol fixtures、policy/audit traces、确定性测试和已记录的 CLI 行为。

#### Scenario: Promotion gate blocks parallel scope / 推广门禁阻止并行扩张

- **WHEN** a proposed change tries to implement a new product workflow in CLI and another host at the same time
- **THEN** it must either split the non-CLI host work into a follow-up change or explain why a shared protocol/platform blocker requires multi-host implementation in one change
- **中文** 当 proposed change 试图同时在 CLI 和另一个 host 中实现新的产品工作流时，它必须拆出非 CLI host 后续变更，或说明为什么共享 protocol/platform 阻塞点要求单次变更多端实现。

### Requirement: CLI Polish Without Execution Bypass / CLI 打磨不得绕过执行边界

CLI-first product work SHALL improve rendering, input, approvals, diagnostics, command ergonomics, packaging, and local workflows while continuing to route executable behavior through shared runtime, command, capability, policy, session, and protocol contracts.

CLI-first 产品工作必须改进 rendering、input、approvals、diagnostics、command ergonomics、packaging 和 local workflows，同时继续通过共享 runtime、command、capability、policy、session 和 protocol contracts 路由可执行行为。

#### Scenario: CLI UX consumes shared events / CLI UX 消费共享事件

- **WHEN** CLI rich output, status line, command palette, keybindings, history search, onboarding, permission prompts, or diagnostics are added
- **THEN** they consume structured runtime events, command results, readiness results, or policy decisions and do not call model, tool, scheduler, sandbox, hook, MCP, plugin, or workflow execution primitives directly
- **中文** 当增加 CLI rich output、status line、command palette、keybindings、history search、onboarding、permission prompts 或 diagnostics 时，它们必须消费 structured runtime events、command results、readiness results 或 policy decisions，不得直接调用 model、tool、scheduler、sandbox、hook、MCP、plugin 或 workflow execution primitives。

#### Scenario: CLI acceptance gate is concrete / CLI 验收门禁具体化

- **WHEN** a CLI-first milestone is marked complete
- **THEN** evidence covers install or build, init/config/auth/doctor/privacy, run/chat, safe read/edit/test, permissions, session resume/fork, diagnostics redaction, extension or MCP/plugin management when in scope, and text/JSON/JSONL rendering parity where applicable
- **中文** 当 CLI-first milestone 标记完成时，证据必须覆盖 install 或 build、init/config/auth/doctor/privacy、run/chat、安全 read/edit/test、permissions、session resume/fork、diagnostics redaction、范围内的 extension 或 MCP/plugin management，以及适用时的 text/JSON/JSONL rendering parity。

### Requirement: Reference Pitfalls Become Regression Fixtures / 参考坑位必须转成回归 Fixtures

CLI-first product work SHALL convert known pitfalls from the local CLI reference analysis into negative fixtures, guardrails, or explicit non-goals before building polished happy paths on top of the same area.

CLI-first 产品工作必须先把本地 CLI 参考分析中的已知坑位转成负向 fixtures、护栏或明确非目标，然后再在同一领域上构建 polished happy paths。

#### Scenario: Security-sensitive feature covers reference pits / 安全敏感功能覆盖参考坑位

- **WHEN** a change touches policy, approvals, shell execution, file paths, credentials, MCP, plugins, remote transport, diagnostics, or headless mode
- **THEN** it declares which reference pit fixtures it adds or relies on, including bypass mode, headless trust, shell parser mismatch, path canonicalization, MCP/plugin precedence, remote session identity, environment snapshotting, and redaction where applicable
- **中文** 当变更触及 policy、approvals、shell execution、file paths、credentials、MCP、plugins、remote transport、diagnostics 或 headless mode 时，必须声明它新增或依赖哪些参考坑位 fixtures，包括适用时的 bypass mode、headless trust、shell parser mismatch、path canonicalization、MCP/plugin precedence、remote session identity、environment snapshotting 和 redaction。

#### Scenario: Happy path waits for negative fixtures / Happy path 等待负向 fixtures

- **WHEN** a proposed CLI-first implementation expands a security-sensitive workflow
- **THEN** negative bypass fixtures are added in the same change or in a prerequisite change before the workflow is marked accepted
- **中文** 当 proposed CLI-first implementation 扩展安全敏感 workflow 时，必须在同一变更或前置变更中增加负向 bypass fixtures，然后该 workflow 才能标记为 accepted。

### Requirement: CLI-First Extension Auth Evidence / CLI 优先扩展认证证据

CLI-first extension/auth work SHALL produce CLI acceptance evidence for MCP/plugin scoped credential behavior before the same workflow is promoted to VSCode, server, SDK, marketplace, team, or enterprise hosts.

CLI-first extension/auth 工作必须先为 MCP/plugin scoped credential behavior 产出 CLI acceptance evidence，然后才能把同一 workflow 推广到 VSCode、server、SDK、marketplace、team 或 enterprise hosts。

#### Scenario: Extension auth change cites pits / 扩展认证变更引用坑位

- **WHEN** a CLI-facing change touches MCP/plugin credentials, grants, permission diffs, real transport opt-in, or auth diagnostics
- **THEN** it cites concrete reference pit fixture ids for credential scope denial, permission expansion, environment snapshotting, diagnostic redaction, and MCP/plugin precedence where applicable
- **中文** 当 CLI-facing change 触及 MCP/plugin credentials、grants、permission diffs、real transport opt-in 或 auth diagnostics 时，必须按需引用 credential scope denial、permission expansion、environment snapshotting、diagnostic redaction 与 MCP/plugin precedence 的具体 reference pit fixture ids。

#### Scenario: Host promotion waits for CLI auth proof / Host 推广等待 CLI 认证证明

- **WHEN** an MCP/plugin auth workflow is proposed for a non-CLI host
- **THEN** the proposal references CLI text/JSONL evidence, deterministic denial tests, redacted audit replay, and shared protocol-compatible DTOs
- **中文** 当 MCP/plugin auth workflow 被提议进入非 CLI host 时，proposal 必须引用 CLI text/JSONL evidence、deterministic denial tests、redacted audit replay 与 shared protocol-compatible DTOs。

### Requirement: CLI Completion Requires Executable Release Evidence / CLI 完成需要可执行发布证据

The CLI-first product route SHALL treat release evidence gates as part of CLI completion before promoting workflows to other host surfaces.

CLI-first 产品路线必须将 release evidence gates 视为 CLI 完成条件的一部分，然后才能把 workflow 推广到其他 host surfaces。

#### Scenario: CLI release gate blocks host promotion / CLI 发布门禁阻止 Host 推广

- **WHEN** a workflow is proposed for VSCode, server, SDK, browser/native, team, or enterprise surfaces
- **THEN** the proposal references passing CLI release diagnostics evidence, including build artifact evidence, acceptance evidence file status, package surface safety, and publish dry-run command guidance
- **中文** 当 workflow 被提议推广到 VSCode、server、SDK、browser/native、team 或 enterprise surfaces 时，proposal 必须引用通过的 CLI release diagnostics evidence，包括 build artifact evidence、acceptance evidence file status、package surface safety 与 publish dry-run command guidance。

#### Scenario: CLI done status includes release diagnostics / CLI 完成状态包含发布诊断

- **WHEN** the roadmap marks the CLI daily-use surface as complete or release-ready
- **THEN** `diagnostics release` evidence is present in acceptance artifacts and reports no failing release package, build artifact, or package-surface checks
- **中文** 当 roadmap 将 CLI daily-use surface 标记为 complete 或 release-ready 时，acceptance artifacts 中必须存在 `diagnostics release` evidence，且 release package、build artifact 或 package-surface checks 不得失败。

### Requirement: CLI Completion Has A Local Verify Entry Point / CLI 完成具备本地 Verify 入口

The CLI-first product route SHALL treat a passing `diagnostics verify` summary as the local pre-publish evidence entry point before marking CLI workflows release-ready or promoting them to other hosts.

CLI-first 产品路线必须将通过的 `diagnostics verify` summary 视为本地发布前证据入口，然后才能把 CLI workflows 标记为 release-ready 或推广到其他 hosts。

#### Scenario: CLI release-ready status references verify / CLI Release-Ready 状态引用 Verify

- **WHEN** roadmap, docs, or proposals claim a CLI workflow is release-ready or ready for host promotion
- **THEN** they reference `deepseek diagnostics verify` evidence or an equivalent recorded acceptance artifact that includes build artifact status, package surface status, acceptance evidence status, and publish dry-run guidance
- **中文** 当 roadmap、docs 或 proposals 声称某个 CLI workflow 已 release-ready 或可进行 host promotion 时，必须引用 `deepseek diagnostics verify` evidence，或等价的 recorded acceptance artifact，其中包含 build artifact status、package surface status、acceptance evidence status 与 publish dry-run guidance。

### Requirement: CLI Completion Has A Repeatable Evidence Refresh Path / CLI 完成具备可重复证据刷新路径

The CLI-first product route SHALL require a repeatable local evidence refresh path before declaring CLI release readiness complete.

CLI-first 产品路线必须要求具备可重复的本地 evidence refresh 路径，然后才能声明 CLI release readiness 完成。

#### Scenario: Release-ready claim references refresh and verify / Release-Ready 声明引用 Refresh 与 Verify

- **WHEN** CLI docs, roadmap, or proposals claim the CLI is release-ready
- **THEN** they reference both `deepseek diagnostics refresh` for regenerating acceptance evidence and `deepseek diagnostics verify` for checking whether that evidence is publish-dry-run ready
- **中文** 当 CLI docs、roadmap 或 proposals 声称 CLI release-ready 时，必须同时引用 `deepseek diagnostics refresh` 用于重新生成 acceptance evidence，以及 `deepseek diagnostics verify` 用于检查这些 evidence 是否 publish-dry-run ready。

### Requirement: CLI Competitive Claims Require Task Completion Evidence / CLI 竞争力声明需要任务完成证据

The CLI-first product route SHALL require repeatable task-completion evaluation evidence before claiming the CLI matches or exceeds named competitors such as Claude Code or Codex.

CLI-first 产品路线必须要求具备可重复的 task-completion evaluation evidence，然后才能声明 CLI 匹配或超过 Claude Code、Codex 等具名竞品。

#### Scenario: Roadmap comparison cites evaluation evidence / 路线图对比引用评估证据

- **WHEN** roadmap, docs, proposals, or release notes compare DeepSeek CLI task-completion ability against Claude Code, Codex, or another named competitor
- **THEN** they reference the latest internal evaluation report, task catalog version, evidence ids, run timestamp, baseline availability, and any public benchmark references separately from product acceptance evidence
- **中文** 当 roadmap、docs、proposals 或 release notes 将 DeepSeek CLI task-completion ability 与 Claude Code、Codex 或其他具名竞品比较时，必须引用最近一次内部 evaluation report、task catalog version、evidence ids、run timestamp、baseline availability，并将 public benchmark references 与 product acceptance evidence 分开呈现。
