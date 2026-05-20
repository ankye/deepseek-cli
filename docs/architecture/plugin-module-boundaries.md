# Plugin Module Boundaries / 插件模块边界

This document defines the governed module boundary for plugins, extensions, MCP bridges, skills, hooks, and future UI contributions. The rule is simple: modules may contribute manifests and public contract descriptors, but they must not receive private runtime objects or build private execution paths.

本文定义 plugins、extensions、MCP bridges、skills、hooks 与未来 UI contributions 的受治理模块边界。核心规则很简单：模块可以贡献 manifest 与公共契约描述符，但不得拿到 runtime 私有对象，也不得构建私有执行路径。

## Kernel Principle / 内核原则

The runtime kernel behaves like an operating-system kernel: extension code is user space. A module can request capabilities through declared public APIs, but it cannot import kernel internals, mutate host layout directly, resolve raw credentials, or execute callbacks hidden inside manifest metadata.

runtime kernel 像操作系统内核一样工作：扩展代码属于用户态。模块可以通过声明式公共 API 请求能力，但不能 import kernel internals、直接修改 host layout、解析 raw credentials，或在 manifest metadata 里藏执行 callback。

## Governed Module Shape / 受治理模块形态

Every governed module is projected into `GovernedModuleManifest` under `@deepseek/platform-contracts`.

每个受治理模块都会投影为 `@deepseek/platform-contracts` 中的 `GovernedModuleManifest`。

| Field / 字段 | Purpose / 用途 |
| --- | --- |
| `moduleId`, `moduleKind`, `version`, `source` | Stable identity for diagnostics, lockfiles, and replay. / 用于 diagnostics、lockfile 与 replay 的稳定身份。 |
| `permissions` | Declared permissions with risk labels such as read, write, network, process, credential, or private-runtime. / 带风险标签的声明权限，例如 read、write、network、process、credential 或 private-runtime。 |
| `contributions` | Public contribution descriptors for commands, hooks, tools, MCP bridges, UI, diagnostics, and capability APIs. / commands、hooks、tools、MCP bridges、UI、diagnostics 与 capability APIs 的公共贡献描述符。 |
| `contractPaths` | The public API path and owner package that owns execution. / 公共 API 路径以及拥有执行的责任包。 |
| `compatibility` | Module API version and fail-closed reader requirement. / 模块 API 版本与 fail-closed reader 要求。 |
| `lifecycle` | Required disable, unload, and cleanup semantics. / 必需的 disable、unload 与 cleanup 语义。 |
| `diagnostics` | Redacted release diagnostics for missing data, private access, permission mismatch, and lifecycle failures. / 针对缺失数据、私有访问、权限不匹配与生命周期失败的脱敏发布诊断。 |

## Public Contract Paths / 公共契约路径

Modules do not call implementation packages directly. They declare one of these public paths, and the owning package decides how execution is registered, projected, and scheduled.

模块不直接调用实现包。它们声明下列公共路径之一，由责任包决定如何注册、投影与调度执行。

| Path / 路径 | Owner / 责任包 | Examples / 示例 |
| --- | --- | --- |
| `module.command` | `command-system` | commands, actions / 命令、动作 |
| `module.hook` | `hook-system` | lifecycle hooks, observe-only hooks / 生命周期 hook、观察型 hook |
| `module.tool` | `tool-system` / `capability-registry` | tool descriptors / 工具描述符 |
| `module.mcp-bridge` | `mcp-gateway` | MCP connectors and calls / MCP connector 与调用 |
| `module.ui` | host projection packages | TUI hints, keymaps, palette entries / TUI hint、keymap、palette entry |
| `module.capability-api` | `capability-registry` | future capability APIs / 未来能力 API |
| `module.diagnostics` | `diagnostics` | readiness and inspector surfaces / readiness 与 inspector 面 |
| `module.lifecycle` | `plugin-system` | enable, disable, unload, cleanup / 启用、禁用、卸载、清理 |
| `module.policy` | `policy-sandbox` | permission and sandbox handoff / 权限与沙箱交接 |

## Forbidden Access / 禁止访问

The plugin validation layer rejects private APIs before activation or projection.

plugin 校验层会在 activation 或 projection 前拒绝私有 API。

- No private runtime handles. / 不允许 runtime 私有句柄。
- No host callbacks or direct layout mutation. / 不允许 host callback 或直接 layout mutation。
- No raw credential access. / 不允许 raw credential access。
- No Node filesystem, process, network, or model SDK imports from manifest metadata. / manifest metadata 不允许 Node filesystem、process、network 或 model SDK import。
- No lifecycle callback functions hidden inside contributions. / contribution 中不允许隐藏 lifecycle callback function。
- No undeclared owner routes. / 不允许未声明 owner route。

## Policy Handoff / Policy 交接

Risk-bearing contributions produce `GovernedModulePolicyEvaluation` and a `PolicyRequest`. Missing permissions deny before execution; write, network, process, mixed, credential, and model side effects are routed through `policy-sandbox` before the scheduler can see them.

带风险的 contribution 会产生 `GovernedModulePolicyEvaluation` 与 `PolicyRequest`。缺失权限会在执行前拒绝；write、network、process、mixed、credential 与 model 副作用必须先通过 `policy-sandbox`，scheduler 才能看到它们。

## Disable And Unload / 禁用与卸载

Disable and unload are first-class lifecycle records, not best-effort cleanup.

disable 与 unload 是一等 lifecycle records，不是尽力而为的清理。

- `disable` stops new activation and records a reason. / `disable` 停止新的 activation 并记录原因。
- `unload` detaches registered contributions and requires cleanup evidence. / `unload` 解除已注册 contribution，并要求 cleanup evidence。
- `cleanup-completed` proves resources were released or explicitly diagnosed. / `cleanup-completed` 证明资源已释放，或已显式诊断失败。
- Lifecycle failures are release-diagnostic material. / 生命周期失败属于 release diagnostic 材料。

## Readiness Evidence / Readiness 证据

`deepseek diagnostics release` now includes `governance.plugin-module-boundaries`.

`deepseek diagnostics release` 现在包含 `governance.plugin-module-boundaries`。

Required fixture scenarios:

必需 fixture 场景：

- valid module / 合法模块
- missing permission / 缺失权限
- private object access / 私有对象访问
- disabled module / 禁用模块
- unloaded module / 卸载模块

Readiness passes when these scenarios exist, public contract paths are covered, negative fixtures demonstrate fail-closed behavior, and disable/unload records are replay-safe and redacted.

当这些场景存在、公共契约路径已覆盖、负向 fixture 证明 fail-closed 行为、disable/unload 记录可回放且已脱敏时，readiness 通过。
