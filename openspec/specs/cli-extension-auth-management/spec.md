# cli-extension-auth-management Specification

## Purpose
Define CLI extension authentication and management requirements for trusted extension workflows, credentials, and governed enablement.

定义 CLI extension authentication and management 对可信 extension workflows、credentials 与受治理启用流程的要求。

## Requirements
### Requirement: CLI Extension Management Command Surface / CLI 扩展管理命令表面

The CLI SHALL expose `deepseek extension` subcommands for extension listing, plugin install/apply-lockfile/snapshot/verify, skill list/activate, credential scope diagnostics, and MCP test projection while delegating behavior to shared package contracts.

CLI 必须暴露 `deepseek extension` 子命令，覆盖 extension listing、plugin install/apply-lockfile/snapshot/verify、skill list/activate、credential scope diagnostics 和 MCP test projection，同时把行为委托给共享 package contracts。

#### Scenario: Help includes extension commands / Help 包含扩展命令
- **WHEN** a user runs `deepseek --help`
- **THEN** the usage output lists `deepseek extension ...` commands and does not describe marketplace, signed distribution, or non-CLI host UX as available in this pack
- **中文** 当用户运行 `deepseek --help` 时，usage output 必须列出 `deepseek extension ...` 命令，且不得把 marketplace、signed distribution 或非 CLI host UX 描述成本包可用能力。

#### Scenario: Extension command delegates to shared packages / 扩展命令委托共享包
- **WHEN** a CLI extension command needs plugin, skill, MCP, credential, or extension data
- **THEN** it obtains the data through public package exports or implementation-free contracts and never directly executes model, scheduler, sandbox, plugin-private, MCP-private, or runtime primitives
- **中文** 当 CLI extension command 需要 plugin、skill、MCP、credential 或 extension data 时，必须通过 public package exports 或无实现契约获取，绝不能直接执行 model、scheduler、sandbox、plugin-private、MCP-private 或 runtime primitives。

### Requirement: Structured Extension Management Evidence / 结构化扩展管理证据

Extension management commands SHALL return structured records with schema version, command kind, status, target ids, diagnostics, permission diffs, credential scope metadata, audit metadata, redaction metadata, and reference pit fixture ids.

Extension management commands 必须返回 structured records，包含 schema version、command kind、status、target ids、diagnostics、permission diffs、credential scope metadata、audit metadata、redaction metadata 和 reference pit fixture ids。

#### Scenario: JSON output is a single record / JSON 输出为单条记录
- **WHEN** a user runs an extension command with `--output json`
- **THEN** stdout contains exactly one serialized extension management record with no terminal control sequences
- **中文** 当用户以 `--output json` 运行 extension command 时，stdout 必须只包含一条序列化 extension management record，且不包含 terminal control sequences。

#### Scenario: JSONL output is line-oriented / JSONL 输出按行组织
- **WHEN** a user runs an extension command with `--output jsonl`
- **THEN** each stdout line is one JSON record describing the command summary, one result-list item, one permission diff, one credential diagnostic, or one lifecycle step
- **中文** 当用户以 `--output jsonl` 运行 extension command 时，每行 stdout 必须是一条 JSON record，描述 command summary、result-list item、permission diff、credential diagnostic 或 lifecycle step。

#### Scenario: Text output is a projection / Text 输出是投影
- **WHEN** a user runs an extension command with text output
- **THEN** CLI renders concise line-oriented summaries from the structured record and preserves the same target ids, permission diff counts, diagnostics, and pit fixture ids visible in structured modes
- **中文** 当用户以 text output 运行 extension command 时，CLI 必须从 structured record 渲染简洁 line-oriented summaries，并保留 structured modes 中可见的 target ids、permission diff counts、diagnostics 和 pit fixture ids。

### Requirement: Plugin Permission Diff Before Acceptance / 接受前展示插件权限 Diff

Plugin install and apply-lockfile extension commands SHALL surface permission diffs before reporting the plugin or lockfile as accepted, and SHALL cite `pit.extension-permission-expansion.permission-diff` whenever permissions are added or removed.

Plugin install 与 apply-lockfile extension commands 必须在报告 plugin 或 lockfile 已接受前展示 permission diffs；只要权限新增或移除，就必须引用 `pit.extension-permission-expansion.permission-diff`。

#### Scenario: Install shows added permissions / 安装展示新增权限
- **WHEN** `deepseek extension plugin install <manifest.json>` installs a plugin whose permissions are not already present in the lockfile baseline
- **THEN** the output includes the exact added permissions, removed permissions, lock entry metadata, and `pit.extension-permission-expansion.permission-diff`
- **中文** 当 `deepseek extension plugin install <manifest.json>` 安装的 plugin 权限不在 lockfile baseline 中时，输出必须包含精确 added permissions、removed permissions、lock entry metadata 和 `pit.extension-permission-expansion.permission-diff`。

#### Scenario: Apply-lockfile reports each entry / Apply-lockfile 报告每个条目
- **WHEN** `deepseek extension plugin apply-lockfile <lockfile.json>` applies multiple lock entries
- **THEN** the output contains one deterministic lifecycle record per entry, sorted by lockfile order, with permission diff and integrity status
- **中文** 当 `deepseek extension plugin apply-lockfile <lockfile.json>` 应用多个 lock entries 时，输出必须按 lockfile order 为每个 entry 包含一条 deterministic lifecycle record，并带 permission diff 与 integrity status。

### Requirement: Extension Credential Scope Diagnostics / 扩展凭证作用域诊断

The CLI SHALL provide credential scope diagnostics for extension, plugin, MCP, and provider references using metadata-only records that never resolve or print raw secrets.

CLI 必须为 extension、plugin、MCP 和 provider references 提供 credential scope diagnostics，且只能使用 metadata-only records，绝不解析或打印 raw secrets。

#### Scenario: Credential diagnostics omit raw secret / 凭证诊断不包含原始密钥
- **WHEN** `deepseek extension auth scopes --output json` runs with environment credentials present
- **THEN** the output reports credential reference id, provider, profile, optional workspace, source class, availability, audit metadata, redaction metadata, and `pit.env-snapshot.immutable-startup` without raw environment values
- **中文** 当环境凭证存在且运行 `deepseek extension auth scopes --output json` 时，输出必须报告 credential reference id、provider、profile、可选 workspace、source class、availability、audit metadata、redaction metadata 和 `pit.env-snapshot.immutable-startup`，且不包含原始环境值。

#### Scenario: Plugin credential scope is denied outside declaration / 插件越权凭证作用域被拒
- **WHEN** a plugin or MCP manifest references a credential outside its declared permission scope
- **THEN** the diagnostic record reports a typed denied scope result and audit metadata without resolving the credential value
- **中文** 当 plugin 或 MCP manifest 引用超出声明 permission scope 的 credential 时，diagnostic record 必须报告 typed denied scope result 和 audit metadata，且不解析 credential value。

### Requirement: Result-List Targets For Vi-Style Composition / 面向 Vi 组合的结果列表 Target

Extension management records SHALL expose typed result-list targets for plugins, skills, MCP servers, MCP tools/resources, credential scopes, and lockfile entries so later vi-style navigation can act on structured targets rather than parsing prose.

Extension management records 必须为 plugins、skills、MCP servers、MCP tools/resources、credential scopes 和 lockfile entries 暴露 typed result-list targets，使后续 vi-style navigation 可以操作 structured targets，而不是解析自然语言。

#### Scenario: Targets are stable / Target 稳定
- **WHEN** extension management output contains plugin, skill, MCP, credential, or lockfile items
- **THEN** each item includes `targetKind`, `targetId`, provenance, and action hints such as inspect, activate, install, verify, test, or diagnose
- **中文** 当 extension management output 包含 plugin、skill、MCP、credential 或 lockfile items 时，每个 item 必须包含 `targetKind`、`targetId`、provenance 和 inspect、activate、install、verify、test、diagnose 等 action hints。

#### Scenario: Navigation does not rerun tools / 导航不重新运行工具
- **WHEN** a later CLI navigation feature inspects an extension result-list target
- **THEN** it can use the stored record target id and evidence without rerunning model turns, plugin lifecycle actions, or MCP calls by default
- **中文** 当后续 CLI navigation 功能检查 extension result-list target 时，默认必须能够使用已存储 record target id 与 evidence，而不重新运行 model turns、plugin lifecycle actions 或 MCP calls。

### Requirement: Extension Management Redaction And Pit Evidence / 扩展管理脱敏与坑位证据

Extension management outputs SHALL be safe to serialize and SHALL cite relevant reference pit fixture ids when commands touch permissions, MCP/plugin precedence, environment snapshots, diagnostics redaction, or contribution normalization.

Extension management outputs 必须可安全序列化；当 commands 触及 permissions、MCP/plugin precedence、environment snapshots、diagnostics redaction 或 contribution normalization 时，必须引用相关 reference pit fixture ids。

#### Scenario: Serialized output is secret-safe / 序列化输出密钥安全
- **WHEN** tests serialize text, JSON, and JSONL extension management outputs containing synthetic secret-like plugin, MCP, credential, env, trace, and path values
- **THEN** the serialized output excludes raw secret-like values and includes `pit.diagnostic-redaction.support-bundle`
- **中文** 当测试序列化包含合成 secret-like plugin、MCP、credential、env、trace 和 path values 的 text、JSON、JSONL extension management outputs 时，序列化结果必须排除 raw secret-like values，并包含 `pit.diagnostic-redaction.support-bundle`。

#### Scenario: Contribution normalization pit is visible / 贡献归一化坑位可见
- **WHEN** extension list output combines plugin, skill, MCP, command, hook, or renderer contribution summaries
- **THEN** the output cites `pit.legacy-contribution-normalization.manifest-boundary` and treats contributions as manifest metadata rather than execution authority
- **中文** 当 extension list output 组合 plugin、skill、MCP、command、hook 或 renderer contribution summaries 时，输出必须引用 `pit.legacy-contribution-normalization.manifest-boundary`，并将 contributions 视作 manifest metadata，而不是 execution authority。
