## ADDED Requirements

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
