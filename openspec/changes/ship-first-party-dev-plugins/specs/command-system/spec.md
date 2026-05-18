## ADDED Requirements

### Requirement: First-Party Plugin Commands / 一方插件命令

The command system SHALL register first-party plugin commands as structured command records with stable ids, owner subsystem metadata, input schemas, output schemas, permissions, side effects, host support, compatibility, and projection visibility.

command system 必须将一方 plugin commands 注册为 structured command records，包含 stable ids、owner subsystem metadata、input schemas、output schemas、permissions、side effects、host support、compatibility 与 projection visibility。

#### Scenario: Plugin command routes through owner / 插件命令通过 Owner 路由

- **WHEN** a user invokes a first-party plugin command from CLI, chat slash commands, palette action, or future host protocol
- **THEN** the command system dispatches to the owning subsystem through platform contracts and returns a structured command result
- **AND** the plugin manifest itself does not own a private execution state machine
- **中文** 当用户从 CLI、chat slash commands、palette action 或未来 host protocol 调用一方 plugin command 时，command system 必须通过 platform contracts 分发到 owning subsystem，并返回 structured command result；plugin manifest 本身不得拥有 private execution state machine。

#### Scenario: Command output is host-agnostic / 命令输出与 Host 无关

- **WHEN** a first-party plugin command completes, fails, is skipped, or is denied
- **THEN** the result includes status, diagnostics, suggested actions, redaction metadata, provenance, and optional result-list/reference targets without embedding terminal-only objects
- **中文** 当一方 plugin command completed、failed、skipped 或 denied 时，结果必须包含 status、diagnostics、suggested actions、redaction metadata、provenance 与可选 result-list/reference targets，且不得嵌入 terminal-only objects。

### Requirement: Context Slash Commands / Context Slash 命令

The command system SHALL expose `/context` chat controls for the context compactor plugin using the same structured command routing as scriptable CLI commands.

command system 必须为 context compactor plugin 暴露 `/context` chat controls，并使用与可脚本化 CLI commands 相同的 structured command routing。

#### Scenario: Context status is local and bounded / Context Status 本地且有界

- **WHEN** a user invokes `/context status`
- **THEN** the command returns bounded metadata for lossless context availability, node counts, summary counts, fresh-tail policy, budget state, diagnostics, and redaction state without dumping raw transcript content
- **中文** 当用户调用 `/context status` 时，命令必须返回 lossless context availability、node counts、summary counts、fresh-tail policy、budget state、diagnostics 与 redaction state 的有界 metadata，且不得 dump raw transcript content。

#### Scenario: Context unknown subcommand is typed / Context 未知子命令类型化

- **WHEN** a user invokes `/context <unknown>` or omits a required argument
- **THEN** the command system returns a typed command error with deterministic diagnostics and does not submit the slash text to the model
- **中文** 当用户调用 `/context <unknown>` 或遗漏必要参数时，command system 必须返回带确定性 diagnostics 的 typed command error，且不得将 slash text 提交给模型。

### Requirement: Developer Check Commands / 开发检查命令

The command system SHALL expose first-party developer checks as predeclared governed commands rather than arbitrary shell execution.

command system 必须将一方 developer checks 暴露为预声明 governed commands，而不是 arbitrary shell execution。

#### Scenario: Check command is fixed / Check 命令固定

- **WHEN** a user invokes a dev-check command contributed by `@deepseek/plugin-dev-checks`
- **THEN** the resolved command descriptor uses a known command id and fixed arguments for a supported check such as OpenSpec validation, typecheck, lint, tests, boundary checks, or CLI build
- **AND** user-provided free-form shell fragments are rejected with typed diagnostics
- **中文** 当用户调用 `@deepseek/plugin-dev-checks` 贡献的 dev-check command 时，解析出的 command descriptor 必须使用已知 command id 与固定 arguments，覆盖 OpenSpec validation、typecheck、lint、tests、boundary checks 或 CLI build 等受支持检查；用户提供的 free-form shell fragments 必须以 typed diagnostics 拒绝。
