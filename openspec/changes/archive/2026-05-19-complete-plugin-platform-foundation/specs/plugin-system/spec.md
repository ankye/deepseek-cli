## ADDED Requirements

### Requirement: Complete Plugin Lifecycle State Machine / 完整插件生命周期状态机

The plugin system SHALL model plugin lifecycle as a deterministic state machine covering discovered, validated, resolved, installed, enabled, activated, degraded, disabled, uninstalled, quarantined, update-staged, updated, rollback-ready, rolled-back, and health-checked states.

plugin system 必须将 plugin lifecycle 建模为确定性状态机，覆盖 discovered、validated、resolved、installed、enabled、activated、degraded、disabled、uninstalled、quarantined、update-staged、updated、rollback-ready、rolled-back 与 health-checked 状态。

#### Scenario: Transition requires evidence / 状态转换需要证据
- **WHEN** a plugin transitions between lifecycle states
- **THEN** the transition records previous state, next state, trigger, actor, policy decision, permission diff, auth diff, dependency decision, compatibility decision, diagnostics, audit metadata, and replay fingerprint
- **中文** 当 plugin 在 lifecycle states 之间转换时，transition 必须记录 previous state、next state、trigger、actor、policy decision、permission diff、auth diff、dependency decision、compatibility decision、diagnostics、audit metadata 与 replay fingerprint。

#### Scenario: Activation is not execution / 激活不是执行
- **WHEN** a plugin reaches activated state
- **THEN** activation only registers valid contribution descriptors with owner subsystems and does not invoke command handlers, hooks, tools, MCP calls, model calls, process execution, filesystem mutation, or host callbacks
- **中文** 当 plugin 达到 activated 状态时，activation 只能把有效 contribution descriptors 注册到 owner subsystems，不得调用 command handlers、hooks、tools、MCP calls、model calls、process execution、filesystem mutation 或 host callbacks。

#### Scenario: Quarantine preserves base runtime / 隔离不影响基础运行时
- **WHEN** validation, dependency resolution, compatibility, integrity, permission policy, credential readiness, or health checks fail
- **THEN** the plugin is quarantined or degraded with diagnostics while base runtime, built-in safe plugins, and host startup continue
- **中文** 当 validation、dependency resolution、compatibility、integrity、permission policy、credential readiness 或 health checks 失败时，该 plugin 必须被 quarantined 或 degraded 并带 diagnostics，同时 base runtime、built-in safe plugins 与 host startup 继续运行。

### Requirement: Plugin Dependency and Conflict Resolution / 插件依赖与冲突解析

The plugin system SHALL resolve plugin dependencies, optional dependencies, extension-point conflicts, command/keymap/palette conflicts, version ranges, host requirements, and capability requirements before activation.

plugin system 必须在 activation 前解析 plugin dependencies、optional dependencies、extension-point conflicts、command/keymap/palette conflicts、version ranges、host requirements 与 capability requirements。

#### Scenario: Dependency graph is deterministic / 依赖图确定
- **WHEN** multiple plugins declare dependencies and optional dependencies
- **THEN** resolution produces a sorted dependency graph, activation order, skipped optional edges, conflicts, and diagnostics with stable replay fingerprints
- **中文** 当多个 plugins 声明 dependencies 与 optional dependencies 时，解析必须产生排序后的 dependency graph、activation order、skipped optional edges、conflicts 与 diagnostics，并带稳定 replay fingerprints。

#### Scenario: Conflict never silently wins / 冲突不静默获胜
- **WHEN** plugins conflict on command ids, aliases, keymaps, palette titles, target resolvers, render hints, hook ordering, provider ids, or config fragments
- **THEN** validation returns winner, loser, precedence source, affected hosts/modes, suggested overrides, and whether the losing contribution is hidden, degraded, or rejected
- **中文** 当 plugins 在 command ids、aliases、keymaps、palette titles、target resolvers、render hints、hook ordering、provider ids 或 config fragments 上冲突时，validation 必须返回 winner、loser、precedence source、affected hosts/modes、suggested overrides，以及失败 contribution 是 hidden、degraded 还是 rejected。

### Requirement: Plugin Health and Rollback / 插件健康检查与回滚

The plugin system SHALL run startup and on-demand health checks and provide rollback evidence for updates, failed activations, and degraded plugins.

plugin system 必须运行 startup 与 on-demand health checks，并为 updates、failed activations 与 degraded plugins 提供 rollback evidence。

#### Scenario: Health check is bounded / 健康检查有边界
- **WHEN** a plugin health check runs
- **THEN** it uses declared probes, timeout, side-effect class, permissions, redaction, and policy; unknown probes are rejected or marked inactive
- **中文** 当 plugin health check 运行时，必须使用声明的 probes、timeout、side-effect class、permissions、redaction 与 policy；未知 probes 必须被拒绝或标记 inactive。

#### Scenario: Update can roll back / 更新可回滚
- **WHEN** a plugin update changes manifest, integrity, permissions, auth requirements, dependency graph, or contribution set
- **THEN** the previous lockfile entry and activation snapshot remain addressable until rollback retention expires
- **中文** 当 plugin update 改变 manifest、integrity、permissions、auth requirements、dependency graph 或 contribution set 时，旧 lockfile entry 与 activation snapshot 必须在 rollback retention 过期前保持可寻址。

### Requirement: Plugin Host Projection Contract / 插件 Host 投影契约

The plugin system SHALL project plugin state and contributions to CLI, TUI, JSON, JSONL, diagnostics, VSCode, and future hosts through host-neutral descriptors.

plugin system 必须通过 host-neutral descriptors 将 plugin state 与 contributions 投影到 CLI、TUI、JSON、JSONL、diagnostics、VSCode 与未来 hosts。

#### Scenario: Host owns layout / Host 拥有布局
- **WHEN** a plugin contributes render hints or host surface metadata
- **THEN** host adapters decide layout and interaction while preserving plugin provenance, permissions, side effects, diagnostics, and conflict state
- **中文** 当 plugin 贡献 render hints 或 host surface metadata 时，host adapters 决定 layout 与 interaction，同时保留 plugin provenance、permissions、side effects、diagnostics 与 conflict state。

#### Scenario: Plugin inspector is complete / 插件检查器完整
- **WHEN** a user inspects a plugin or contribution
- **THEN** the host renders lifecycle state, API levels used, source, trust, version, integrity, permissions, credentials, dependencies, contribution list, conflicts, health, audit links, and owner execution routes
- **中文** 当用户检查 plugin 或 contribution 时，host 必须渲染 lifecycle state、API levels used、source、trust、version、integrity、permissions、credentials、dependencies、contribution list、conflicts、health、audit links 与 owner execution routes。
