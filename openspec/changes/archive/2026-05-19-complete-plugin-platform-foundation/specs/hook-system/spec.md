## ADDED Requirements

### Requirement: Plugin Lifecycle Hooks Use Canonical Hook System / 插件生命周期 Hook 使用规范 Hook 系统

Plugin lifecycle hooks SHALL be contributed as canonical hook-system manifests, not plugin-private callbacks.

plugin lifecycle hooks 必须作为规范 hook-system manifests 贡献，而不是 plugin-private callbacks。

#### Scenario: Plugin lifecycle hook normalizes to hook-system / 插件生命周期 Hook 归一化到 Hook System
- **WHEN** a plugin contributes a hook for plugin discovery, validation, install, enable, activation, update, rollback, disable, uninstall, or health lifecycle points
- **THEN** the plugin system converts the contribution into a hook-system registration request with plugin provenance, ordering, timeout, failure policy, permissions, schemas, and replay metadata
- **中文** 当 plugin 为 discovery、validation、install、enable、activation、update、rollback、disable、uninstall 或 health lifecycle points 贡献 hook 时，plugin system 必须将 contribution 转换为 hook-system registration request，包含 plugin provenance、ordering、timeout、failure policy、permissions、schemas 与 replay metadata。

#### Scenario: Private callback lifecycle hook is rejected / 私有回调生命周期 Hook 被拒绝
- **WHEN** a plugin manifest declares lifecycle callbacks as executable functions, host callbacks, or private runtime handlers
- **THEN** validation rejects the callbacks and reports the canonical hook-system contribution format
- **中文** 当 plugin manifest 将 lifecycle callbacks 声明为 executable functions、host callbacks 或 private runtime handlers 时，validation 必须拒绝这些 callbacks，并报告规范 hook-system contribution 格式。

### Requirement: Plugin Hook Lifecycle Point Catalog / 插件 Hook 生命周期点目录

The hook system SHALL define a stable catalog of plugin lifecycle hook points for before/after discovery, validation, install, enable, activation, update, rollback, disable, uninstall, and health checks.

hook system 必须定义稳定的 plugin lifecycle hook point catalog，覆盖 discovery、validation、install、enable、activation、update、rollback、disable、uninstall 与 health checks 的 before/after。

#### Scenario: Lifecycle hook point has schema / 生命周期 Hook 点有 Schema
- **WHEN** a plugin lifecycle hook point is declared
- **THEN** it includes input schema, output schema, allowed output types, default timeout, default failure policy, ordering keys, and whether blocking is allowed
- **中文** 当 plugin lifecycle hook point 被声明时，必须包含 input schema、output schema、allowed output types、default timeout、default failure policy、ordering keys 与是否允许 blocking。

#### Scenario: Blocking hook uses policy / 阻塞 Hook 使用 Policy
- **WHEN** a plugin lifecycle hook can block install, enable, activation, update, rollback, disable, uninstall, or health status
- **THEN** the hook invocation carries policy, audit, trace, redaction, and replay metadata, and the plugin system records the owner decision
- **中文** 当 plugin lifecycle hook 可以阻塞 install、enable、activation、update、rollback、disable、uninstall 或 health status 时，hook invocation 必须携带 policy、audit、trace、redaction 与 replay metadata，plugin system 必须记录 owner decision。

### Requirement: Plugin Hook Output Types / 插件 Hook 输出类型

Plugin hook outputs SHALL be limited to observe records, diagnostics, policy suggestions, activation suggestions, health suggestions, config suggestions, and governed capability requests.

plugin hook outputs 必须限制为 observe records、diagnostics、policy suggestions、activation suggestions、health suggestions、config suggestions 与 governed capability requests。

#### Scenario: Hook output cannot directly mutate plugin state / Hook 输出不能直接修改插件状态
- **WHEN** a plugin hook returns an output that implies lifecycle mutation, filesystem/process/network work, credential access, host layout mutation, or runtime mutation
- **THEN** the hook system rejects it or converts it into a governed request for the owning subsystem to decide
- **中文** 当 plugin hook 返回暗示 lifecycle mutation、filesystem/process/network work、credential access、host layout mutation 或 runtime mutation 的输出时，hook system 必须拒绝它，或转换为受治理 request 交由 owner subsystem 决策。

#### Scenario: Hook diagnostics attach to lifecycle evidence / Hook 诊断附加到生命周期证据
- **WHEN** a plugin lifecycle hook emits diagnostics
- **THEN** those diagnostics are attached to the lifecycle transition evidence and remain visible in plugin inspector, JSON, JSONL, and regression replay
- **中文** 当 plugin lifecycle hook 发出 diagnostics 时，这些 diagnostics 必须附加到 lifecycle transition evidence，并在 plugin inspector、JSON、JSONL 与 regression replay 中可见。
