## Context

The current repository now has `@deepseek/plugin-api`, `@deepseek/plugin-system`, and `src/plugins/builtin`, but the API is intentionally narrow. That was the right first step for modularization, but the next product risk is API drift: if each plugin adds whatever API it needs, DeepSeek will become a collection of ad hoc extension paths rather than a coherent platform.

当前仓库已有 `@deepseek/plugin-api`、`@deepseek/plugin-system` 与 `src/plugins/builtin`，但 API 有意保持很窄。这对模块化是正确第一步，但下一个产品风险是 API 漂移：如果每个插件都按自身需要追加 API，DeepSeek 会变成一组临时 extension paths，而不是完整平台。

The plugin platform must therefore define what the platform provides before individual plugins consume it. File manager, jump navigator, repo navigator, git review, context compactor, future IDE integrations, and future third-party plugins should all use the same lifecycle, contribution catalog, hook points, permission model, event stream, and diagnostics.

因此 plugin platform 必须先定义平台提供什么，再让各插件消费。文件管理器、跳转导航、仓库导航、git review、上下文压缩、未来 IDE 集成与未来三方插件都必须使用同一套 lifecycle、contribution catalog、hook points、permission model、event stream 与 diagnostics。

## Goals / Non-Goals

**Goals:**
- Define the complete plugin lifecycle state machine and evidence model.
- Define API levels and imports plugins are allowed to use.
- Define the full contribution point catalog exposed by DeepSeek.
- Define plugin lifecycle hook points and how they compose with the canonical hook system.
- Define diagnostics, event/audit records, compatibility, dependencies, conflict handling, host projection, and test matrices.
- Keep execution authority with owner subsystems and governed execution.

**Non-Goals:**
- Do not ship a public marketplace immediately.
- Do not allow arbitrary third-party executable code without trust, policy, sandbox, and audit.
- Do not let plugins directly own terminal UI layout, runtime kernel state, credentials, filesystem/process primitives, or model SDKs.
- Do not implement every contribution owner in one change; define the complete contract first and implement in controlled slices.

## Decisions

### Decision: Platform Catalog First

DeepSeek exposes a platform-owned catalog. Plugins do not ask for new private APIs by feature. Instead, plugins choose from versioned contribution points and governed APIs already declared by the platform.

DeepSeek 暴露 platform-owned catalog。插件不能按功能索要私有 API；插件只能从平台已声明的版本化 contribution points 与 governed APIs 中选择。

```
Plugin Package
  |
  | manifest + contributions
  v
Plugin System
  | validates identity, trust, permissions, compatibility, dependencies
  | normalizes each contribution to owner subsystem
  v
Owner Subsystems
  command-system | hook-system | skill-system | mcp-gateway | runtime
  workspace-state | context-engine | memory-cache | model-gateway | host projection
```

### Decision: Five API Levels

| Level | Name | Purpose | Available When |
| --- | --- | --- | --- |
| L0 | Manifest API | identity, metadata, contributions, permissions | discovery/validation |
| L1 | Declarative Author API | builders for commands, hooks, tools, targets, TUI metadata | built-in and third-party authoring |
| L2 | Governed Runtime API | capability invocation, workspace/context/session refs through policy | only after trust/activation |
| L3 | Host Projection API | render hints and view descriptors, never direct layout mutation | projection only |
| L4 | Test Harness API | deterministic fakes, fixtures, replay, scorecards | tests and plugin certification |

Forbidden APIs remain explicit: direct imports of CLI internals, runtime internals, Node filesystem/process primitives, raw credential resolvers, model SDKs, and host-private callbacks.

禁止 API 必须显式列出：不得直接导入 CLI internals、runtime internals、Node filesystem/process primitives、raw credential resolvers、model SDKs 与 host-private callbacks。

### Decision: Lifecycle Is A State Machine

Plugin lifecycle must be modeled as a deterministic state machine with typed evidence for every transition.

plugin lifecycle 必须建模为确定性状态机，每次状态转换都有类型化 evidence。

```
discovered
  -> validated
  -> resolved
  -> installed
  -> enabled
  -> activated
  -> degraded
  -> disabled
  -> uninstalled

Any state -> quarantined
enabled/activated -> update-staged -> updated | rollback-ready -> rolled-back
installed/enabled/activated -> health-checked
```

Activation is not execution. Activation registers valid contribution descriptors with owner subsystems. Execution happens later through owner-governed routes.

激活不是执行。Activation 只把有效 contribution descriptors 注册到 owner subsystems。真正执行发生在之后的 owner-governed routes。

### Decision: Hooks Use Canonical Hook System

Plugins can contribute hooks, but plugin lifecycle callbacks are not a separate callback system. Plugin hook contribution is normalized into `hook-system`; lifecycle points are canonical strings with schemas, ordering, timeout, failure policy, and replay fingerprints.

插件可以贡献 hooks，但 plugin lifecycle callbacks 不能成为另一套 callback system。Plugin hook contribution 必须归一化到 `hook-system`；lifecycle points 是带 schema、ordering、timeout、failure policy 与 replay fingerprints 的规范字符串。

Core plugin lifecycle hook families:
- `plugin.discovery.before|after`
- `plugin.validation.before|after`
- `plugin.install.before|after`
- `plugin.enable.before|after`
- `plugin.activation.before|after`
- `plugin.update.before|after`
- `plugin.rollback.before|after`
- `plugin.disable.before|after`
- `plugin.uninstall.before|after`
- `plugin.health.before|after`

### Decision: Contribution Point Catalog Is Complete

The catalog must include all known extension categories now, even if some are inert or disabled until later phases:

- commands and slash commands
- palette entries and actions
- keymaps and vi mappings
- targets, target resolvers, references, jump entries
- result-list providers
- TUI/host render hints
- hooks
- skills
- tools and tool families
- MCP connectors
- agents and worker profiles
- context providers
- memory/cache providers
- workflow templates
- model profiles
- config fragments
- diagnostics providers
- resource bundles and static assets

Each contribution has a stable id, owner subsystem, input/output schema, permissions, side-effect class, compatibility, projection visibility, activation condition, diagnostics, provenance, and replay metadata.

### Decision: Phased Implementation

This foundation should be implemented in slices:

1. Contracts and types: lifecycle states, events, API levels, contribution catalog.
2. Plugin manager core: discovery, validation, install, enable, activation, disable, health, snapshot.
3. Hook integration: plugin lifecycle hooks through canonical hook-system.
4. Host projection: CLI/TUI/JSON/JSONL diagnostics and plugin inspector.
5. Built-in plugin migration to complete catalog.
6. Third-party preview: local/workspace manifest-only plugins, then governed executable plugins.

## Risks / Trade-offs

- [Risk] Designing too broad a catalog can delay implementation. -> Mitigation: define the complete contract now, but mark unsupported phases as inactive until their owner subsystem implements them.
- [风险] catalog 设计过宽可能拖慢实现。-> 缓解：现在定义完整契约，但未实现阶段标为 inactive，直到 owner subsystem 落地。
- [Risk] Plugin runtime APIs can become a privilege bypass. -> Mitigation: L2 APIs must route through governed capability owners and produce policy/audit evidence.
- [风险] plugin runtime APIs 可能变成特权绕过。-> 缓解：L2 APIs 必须通过 governed capability owners，并产出 policy/audit evidence。
- [Risk] Host-specific plugins can fragment product experience. -> Mitigation: host-specific contributions remain render hints/descriptors; host adapters own layout and interaction.
- [风险] host-specific plugins 可能切碎产品体验。-> 缓解：host-specific contributions 只保留 render hints/descriptors；host adapters 拥有 layout 与 interaction。

## Migration Plan

1. Add platform contract DTOs for plugin lifecycle states, events, API levels, contribution kinds, activation records, and diagnostics.
2. Expand `plugin-api` builders to cover the complete contribution catalog without adding execution handles.
3. Expand `plugin-system` manager implementation with lifecycle state transitions and deterministic event/audit records.
4. Normalize plugin-contributed hooks into `hook-system`.
5. Add CLI/TUI diagnostics and plugin inspector projections for lifecycle and API capability metadata.
6. Add deterministic tests and scorecard requirements for lifecycle, hooks, permission diff, conflicts, dependency resolution, rollback, and host projection.

## Open Questions

- Should governed runtime APIs be exposed from `@deepseek/plugin-api/runtime` or a separate `@deepseek/plugin-runtime-api` package?
- 受治理 runtime APIs 应放在 `@deepseek/plugin-api/runtime`，还是独立为 `@deepseek/plugin-runtime-api` package？
- Should registry plugins be allowed before local/workspace plugins reach product maturity?
- 在 local/workspace plugins 达到产品成熟前，是否允许 registry plugins？
