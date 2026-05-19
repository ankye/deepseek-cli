## ADDED Requirements

### Requirement: Built-In Development Plugin Pack / 内置开发插件包

The platform SHALL ship a built-in first-party development plugin pack with stable plugin identities, versions, integrity metadata, compatibility metadata, permissions, side-effect metadata, contribution declarations, and release readiness diagnostics.

平台必须交付 built-in first-party development plugin pack，包含稳定的 plugin identities、versions、integrity metadata、compatibility metadata、permissions、side-effect metadata、contribution declarations 与 release readiness diagnostics。

#### Scenario: Release profile lists first-party plugins / Release Profile 列出一方插件

- **WHEN** the CLI release profile enumerates built-in plugins
- **THEN** it includes `@deepseek/plugin-dev-checks`, `@deepseek/plugin-repo-navigator`, `@deepseek/plugin-git-review`, and `@deepseek/plugin-context-compactor` in deterministic plugin id order
- **AND** each manifest declares `source=built-in`, a stable integrity value, compatibility range, permissions, and contribution metadata
- **中文** 当 CLI release profile 枚举 built-in plugins 时，必须按确定性 plugin id 顺序包含 `@deepseek/plugin-dev-checks`、`@deepseek/plugin-repo-navigator`、`@deepseek/plugin-git-review` 与 `@deepseek/plugin-context-compactor`，并且每个 manifest 必须声明 `source=built-in`、稳定 integrity、compatibility range、permissions 与 contribution metadata。

#### Scenario: Built-in plugin pack is diagnosable / 内置插件包可诊断

- **WHEN** release readiness or doctor diagnostics run
- **THEN** diagnostics report enabled, disabled, incompatible, or degraded state for each first-party plugin without importing or executing plugin-private code
- **中文** 当 release readiness 或 doctor diagnostics 运行时，diagnostics 必须报告每个一方插件的 enabled、disabled、incompatible 或 degraded 状态，且不得 import 或执行 plugin-private code。

### Requirement: First-Party Plugin Scope / 一方插件范围

The first release SHALL limit first-party plugin functionality to bounded developer checks, repository navigation, git review, and lossless context compaction.

第一版必须将一方插件功能限制在有界 developer checks、repository navigation、git review 与 lossless context compaction。

#### Scenario: Unsupported plugin families are absent / 不支持的插件族缺席

- **WHEN** the first-party plugin pack is projected to help, palette, TUI, JSON, JSONL, or extension management
- **THEN** it does not expose browser automation, arbitrary shell execution, marketplace installation, remote plugin registry, cloud sync, or automatic update contributions
- **中文** 当一方插件包投影到 help、palette、TUI、JSON、JSONL 或 extension management 时，不得暴露 browser automation、arbitrary shell execution、marketplace installation、remote plugin registry、cloud sync 或 automatic update contributions。

#### Scenario: Dev checks are predeclared / 开发检查预声明

- **WHEN** `@deepseek/plugin-dev-checks` contributes executable checks
- **THEN** every check has a stable command id, fixed argument set, fixed workspace policy, timeout metadata, output redaction metadata, and side-effect classification
- **AND** the plugin does not accept free-form shell fragments from the user or model
- **中文** 当 `@deepseek/plugin-dev-checks` 贡献可执行 checks 时，每个 check 必须具备 stable command id、固定 argument set、固定 workspace policy、timeout metadata、output redaction metadata 与 side-effect classification；该插件不得接收来自用户或模型的 free-form shell fragments。

### Requirement: Context Compactor Plugin / 上下文压缩插件

The first-party plugin pack SHALL include `@deepseek/plugin-context-compactor` as the canonical first-release interface for lossless context status, grep, describe, summarize, expand, budget, and pin/reference workflows.

一方插件包必须包含 `@deepseek/plugin-context-compactor`，作为第一版 lossless context status、grep、describe、summarize、expand、budget 与 pin/reference workflows 的标准入口。

#### Scenario: Context commands are structured / Context 命令结构化

- **WHEN** the context compactor contributes `/context` commands or palette entries
- **THEN** each contribution declares stable ids, input schemas, output schemas, permissions, side effects, host support, redaction metadata, and owner subsystem metadata
- **中文** 当 context compactor 贡献 `/context` commands 或 palette entries 时，每个 contribution 必须声明 stable ids、input schemas、output schemas、permissions、side effects、host support、redaction metadata 与 owner subsystem metadata。

#### Scenario: Context pin feeds references / Context Pin 进入引用

- **WHEN** a user pins a context result from grep, describe, expand, or summarize output
- **THEN** the plugin produces a typed reference target that can be added to the active palette reference set with provenance and redaction metadata
- **中文** 当用户从 grep、describe、expand 或 summarize 输出中 pin 一个 context result 时，插件必须生成 typed reference target，可带 provenance 与 redaction metadata 加入 active palette reference set。
