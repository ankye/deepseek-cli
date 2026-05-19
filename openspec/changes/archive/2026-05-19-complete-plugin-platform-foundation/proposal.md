## Why

The plugin work must become a complete platform contract, not a sequence of feature-specific helper additions. Built-in and third-party plugins need a clear answer to "what does DeepSeek expose?" across lifecycle, hooks, APIs, permissions, events, and host surfaces before file manager, jump navigation, and future extensions depend on it.

插件工作必须成为完整的平台契约，而不是按功能临时追加 helper。内置插件与三方插件在依赖文件管理器、跳转导航和未来扩展前，需要明确回答 DeepSeek 到底暴露哪些 lifecycle、hooks、APIs、permissions、events 与 host surfaces。

## What Changes

- Define a complete plugin lifecycle state machine from discovery through quarantine, install, enable, activation, update, rollback, disable, uninstall, health check, and audit replay.
- 定义完整 plugin lifecycle 状态机，覆盖 discovery、quarantine、install、enable、activation、update、rollback、disable、uninstall、health check 与 audit replay。
- Define plugin API levels: declarative author API, governed runtime API, host projection API, test harness API, and forbidden internal APIs.
- 定义 plugin API 分层：declarative author API、governed runtime API、host projection API、test harness API 与 forbidden internal APIs。
- Define the platform-owned contribution point catalog plugins can use: commands, actions, targets, result lists, keymaps, palette, render hints, hooks, skills, tools, MCP, agents, context providers, memory/cache providers, workflows, model profiles, config fragments, diagnostics, and package resources.
- 定义平台拥有的 contribution point catalog：commands、actions、targets、result lists、keymaps、palette、render hints、hooks、skills、tools、MCP、agents、context providers、memory/cache providers、workflows、model profiles、config fragments、diagnostics 与 package resources。
- Define plugin lifecycle hooks and hook events as stable extension points with deterministic ordering, permission policy, timeout, failure policy, replay fingerprints, and governance boundaries.
- 定义 plugin lifecycle hooks 与 hook events，作为稳定 extension points，包含 deterministic ordering、permission policy、timeout、failure policy、replay fingerprints 与 governance boundaries。
- Define plugin event/audit model, diagnostics, capability negotiation, compatibility ranges, dependency resolution, conflict handling, and host-specific projection rules.
- 定义 plugin event/audit model、diagnostics、capability negotiation、compatibility ranges、dependency resolution、conflict handling 与 host-specific projection rules。
- Keep plugin execution behind owner subsystems and governed execution. Plugins consume platform APIs; plugins do not own private runtime state machines or host internals.
- 保持 plugin execution 通过 owner subsystems 与 governed execution。插件消费平台 APIs；插件不拥有私有 runtime state machines 或 host internals。

## Capabilities

### New Capabilities
- `plugin-platform-foundation`: Complete product and architecture contract for plugin lifecycle, API levels, extension points, hooks, diagnostics, events, and governance.

### Modified Capabilities
- `plugin-system`: Expand requirements from manifest/install basics to complete lifecycle, activation, dependency, conflict, event, audit, projection, and health behavior.
- `hook-system`: Add plugin-owned hook contribution and lifecycle hook requirements so plugin hooks use the canonical hook system rather than a separate plugin callback path.
- `plugin-author-api`: Expand from declarative builders to a stable API map describing what plugins can import and what remains forbidden.
- `capability-execution-governance`: Clarify that executable plugin APIs are owned by governed platform capability routes rather than plugin-private execution.
- `testing-regression`: Require deterministic lifecycle, hook, permission, conflict, compatibility, rollback, and host projection test matrices for plugin changes.

## Impact

- Affected specs: plugin-system, hook-system, plugin-author-api, capability-execution-governance, testing-regression.
- Affected code in later implementation: `src/packages/plugin-api`, `src/packages/plugin-system`, `src/packages/hook-system`, `src/packages/platform-contracts`, `src/plugins/builtin`, command/TUI projection, diagnostics, package scorecards, and plugin test fixtures.
- Affected product surfaces: CLI extension commands, TUI plugin inspector, command palette, diagnostics, JSON/JSONL management output, future VSCode adapter, and future registry/marketplace.
- This proposal is a foundation contract. It does not require shipping registry marketplace execution immediately, but it must define the complete boundaries now.
