## ADDED Requirements

### Requirement: Governed Module Boundary / 受治理模块边界

Plugins, extensions, MCP bridges, skills, and hooks SHALL behave as governed modules that interact through manifests, contribution records, public contracts, policy decisions, and runtime events.

Plugins、extensions、MCP bridges、skills 与 hooks 必须作为受治理 modules 运行，并通过 manifests、contribution records、public contracts、policy decisions 与 runtime events 交互。

#### Scenario: Module cannot access private runtime objects / Module 不能访问私有 Runtime Objects

- **WHEN** a plugin or extension contributes commands, tools, render hints, result-list providers, keymaps, hooks, skills, or MCP routes
- **THEN** it receives only public contract inputs and governed execution routes, never private runtime objects, internal mutable state, or app-specific host objects
- **中文** 当 plugin 或 extension 贡献 commands、tools、render hints、result-list providers、keymaps、hooks、skills 或 MCP routes 时，它只能接收公共契约输入与受治理执行路由，不能接收 private runtime objects、内部 mutable state 或 app-specific host objects。

#### Scenario: Module has disable and audit semantics / Module 具备禁用与审计语义

- **WHEN** a plugin, extension, skill, hook, or MCP server is installed, enabled, disabled, or removed
- **THEN** the platform records manifest identity, version, permissions, dependency summary, policy/audit evidence, and disable/unload state
- **中文** 当 plugin、extension、skill、hook 或 MCP server 被安装、启用、禁用或移除时，平台必须记录 manifest identity、version、permissions、dependency summary、policy/audit evidence 与 disable/unload state。

### Requirement: Module Contribution Projection Is Inert / 模块贡献投影惰性

Module contribution projection SHALL remain inert and SHALL NOT execute module owner code during help, diagnostics, command palette, result-list, or future host projection.

Module contribution projection 必须保持惰性，并且在 help、diagnostics、command palette、result-list 或未来 host projection 期间不得执行 module owner code。

#### Scenario: Command palette projection is inert / Command Palette 投影惰性

- **WHEN** the platform projects plugin or extension contributions to command palette or diagnostics
- **THEN** it emits metadata records with provenance and permissions without invoking handlers, lifecycle code, MCP calls, hooks, or workflow execution
- **中文** 当平台将 plugin 或 extension contributions 投影到 command palette 或 diagnostics 时，必须输出带 provenance 与 permissions 的 metadata records，且不得调用 handlers、lifecycle code、MCP calls、hooks 或 workflow execution。
