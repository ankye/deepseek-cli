# plugin-platform-foundation Specification

## Purpose
TBD - created by archiving change complete-plugin-platform-foundation. Update Purpose after archive.
## Requirements
### Requirement: Platform-Owned Plugin Catalog / 平台拥有的插件能力目录

The platform SHALL define a complete versioned plugin capability catalog before plugins can depend on platform extension APIs.

平台必须先定义完整、版本化的 plugin capability catalog，插件才能依赖平台 extension APIs。

#### Scenario: Plugin uses catalog contribution points / 插件使用目录贡献点
- **WHEN** a built-in, workspace, user, enterprise, registry, or marketplace plugin declares functionality
- **THEN** every declared contribution maps to a catalog entry with owner subsystem, schema, permissions, side-effect class, compatibility, activation condition, and projection visibility
- **中文** 当 built-in、workspace、user、enterprise、registry 或 marketplace plugin 声明功能时，每个 contribution 必须映射到 catalog entry，包含 owner subsystem、schema、permissions、side-effect class、compatibility、activation condition 与 projection visibility。

#### Scenario: Private extension path is rejected / 私有扩展路径被拒绝
- **WHEN** a plugin declares a contribution kind, runtime API, host callback, or lifecycle callback outside the platform catalog
- **THEN** validation fails with deterministic diagnostics and the contribution is not projected or activated
- **中文** 当 plugin 声明 platform catalog 之外的 contribution kind、runtime API、host callback 或 lifecycle callback 时，validation 必须以确定性 diagnostics 失败，且该 contribution 不得被投影或激活。

### Requirement: Plugin API Levels / 插件 API 分层

The platform SHALL expose plugin APIs in explicit levels: manifest API, declarative author API, governed runtime API, host projection API, and test harness API.

平台必须以显式层级暴露 plugin APIs：manifest API、declarative author API、governed runtime API、host projection API 与 test harness API。

#### Scenario: API level is visible in diagnostics / API 层级在诊断中可见
- **WHEN** a plugin is validated, enabled, activated, inspected, or scored
- **THEN** diagnostics report which API levels it uses and whether each level is allowed for its source, trust, host, and compatibility range
- **中文** 当 plugin 被 validate、enable、activate、inspect 或 score 时，diagnostics 必须报告它使用了哪些 API level，以及每个 level 对其 source、trust、host 与 compatibility range 是否允许。

#### Scenario: Forbidden API import is rejected / 禁止 API 导入被拒绝
- **WHEN** plugin-authored code imports CLI internals, runtime internals, Node filesystem/process primitives, raw credential resolvers, model SDKs, or host-private callbacks
- **THEN** validation, lint, or activation fails before the plugin becomes active
- **中文** 当 plugin-authored code 导入 CLI internals、runtime internals、Node filesystem/process primitives、raw credential resolvers、model SDKs 或 host-private callbacks 时，validation、lint 或 activation 必须在 plugin active 前失败。

### Requirement: Plugin Platform Events / 插件平台事件

The plugin platform SHALL emit structured lifecycle, activation, projection, invocation, diagnostic, health, audit, and rollback events that can be consumed by CLI, TUI, JSON, JSONL, VSCode, tests, and future server modes.

plugin platform 必须发出结构化 lifecycle、activation、projection、invocation、diagnostic、health、audit 与 rollback events，可被 CLI、TUI、JSON、JSONL、VSCode、tests 与未来 server modes 消费。

#### Scenario: Lifecycle transition emits event / 生命周期转换发事件
- **WHEN** a plugin lifecycle state changes
- **THEN** the platform emits one structured event with plugin id, version, source, trust, previous state, next state, reason, policy decision, diagnostics, audit id, and replay fingerprint
- **中文** 当 plugin lifecycle state 发生变化时，平台必须发出一条结构化 event，包含 plugin id、version、source、trust、previous state、next state、reason、policy decision、diagnostics、audit id 与 replay fingerprint。

#### Scenario: Projection event is inert / 投影事件惰性
- **WHEN** plugin contributions are projected to command palette, TUI, JSON, JSONL, diagnostics, or future hosts
- **THEN** projection events include metadata only and do not execute plugin handlers or owner subsystem actions
- **中文** 当 plugin contributions 被投影到 command palette、TUI、JSON、JSONL、diagnostics 或未来 hosts 时，projection events 只能包含 metadata，不得执行 plugin handlers 或 owner subsystem actions。

### Requirement: Complete Contribution Catalog / 完整贡献点目录

The platform SHALL define canonical contribution descriptors for commands, actions, targets, result lists, keymaps, palette entries, render hints, hooks, skills, tools, MCP connectors, agents, context providers, memory/cache providers, workflow templates, model profiles, config fragments, diagnostics providers, and resource bundles.

平台必须为 commands、actions、targets、result lists、keymaps、palette entries、render hints、hooks、skills、tools、MCP connectors、agents、context providers、memory/cache providers、workflow templates、model profiles、config fragments、diagnostics providers 与 resource bundles 定义规范 contribution descriptors。

#### Scenario: Contribution descriptor has required metadata / 贡献描述符包含必要元数据
- **WHEN** a contribution is declared
- **THEN** it includes stable id, contribution kind, owner subsystem, input/output schema where applicable, permissions, side-effect class, source/provenance, compatibility, activation condition, projection visibility, diagnostics, and replay metadata
- **中文** 当 contribution 被声明时，必须包含 stable id、contribution kind、owner subsystem、适用时的 input/output schema、permissions、side-effect class、source/provenance、compatibility、activation condition、projection visibility、diagnostics 与 replay metadata。

#### Scenario: Unsupported catalog entry is inactive / 未支持目录项保持非活动
- **WHEN** the platform catalog defines a contribution kind whose owner subsystem is not implemented yet
- **THEN** plugin validation can report the contribution as recognized but inactive, and activation must not register it until the owner subsystem supports it
- **中文** 当 platform catalog 定义了 owner subsystem 尚未实现的 contribution kind 时，plugin validation 可以将该 contribution 报告为 recognized but inactive，activation 在 owner subsystem 支持前不得注册它。
