# local-readiness Specification

## Purpose
TBD - created by archiving change implement-local-readiness-commands. Update Purpose after archive.
## Requirements
### Requirement: R1 Local Readiness Commands / R1 本地可用性命令

The CLI SHALL provide `init`, `config`, `auth`, `doctor`, `privacy`, and `verify-install` commands as the R1 local readiness surface.

CLI 必须提供 `init`、`config`、`auth`、`doctor`、`privacy` 和 `verify-install` commands，作为 R1 local readiness surface。

#### Scenario: Readiness commands are discoverable / 可发现 readiness commands

- **WHEN** a user invokes CLI help or command discovery
- **THEN** the readiness commands are listed with stable names, structured command metadata, and host support metadata
- **中文** 当用户调用 CLI help 或 command discovery 时，readiness commands 必须以稳定名称、structured command metadata 和 host support metadata 展示。

#### Scenario: Readiness commands render structured output / readiness commands 渲染结构化输出

- **WHEN** a readiness command runs with text or JSON output
- **THEN** it returns command status, checks, warnings, redacted metadata, and suggested next actions without owning runtime execution state
- **中文** 当 readiness command 以 text 或 JSON 输出运行时，必须返回 command status、checks、warnings、redacted metadata 和 suggested next actions，且不拥有 runtime execution state。

### Requirement: Init And Config Readiness / Init 与 Config 可用性

The local readiness layer SHALL initialize project metadata and validate local configuration without overwriting user files unless explicitly requested.

local readiness layer 必须初始化 project metadata 并校验 local configuration，除非用户明确要求，否则不得覆盖用户文件。

#### Scenario: Init is idempotent / init 是幂等的

- **WHEN** `deepseek init` runs multiple times in the same workspace
- **THEN** it reports existing readiness state and does not rewrite user-owned files without an explicit force option
- **中文** 当 `deepseek init` 在同一 workspace 多次运行时，必须报告 existing readiness state，且没有显式 force option 时不得重写用户文件。

#### Scenario: Config validates known keys / config 校验已知键

- **WHEN** `deepseek config` validates local settings
- **THEN** it reports valid keys, unknown keys, invalid values, source location, and redacted sensitive values
- **中文** 当 `deepseek config` 校验 local settings 时，必须报告 valid keys、unknown keys、invalid values、source location 和 redacted sensitive values。

### Requirement: Auth And Privacy Readiness / Auth 与 Privacy 可用性

The local readiness layer SHALL verify DeepSeek credential presence and privacy settings without printing raw secrets or exporting telemetry by default.

local readiness layer 必须验证 DeepSeek credential presence 和 privacy settings，且不得打印 raw secrets 或默认导出 telemetry。

#### Scenario: Auth reports redacted credential reference / auth 报告脱敏凭证引用

- **WHEN** `deepseek auth` finds `DEEPSEEK_API_KEY` or `DEEPSEEK_TOKEN`
- **THEN** it reports a scoped credential reference, source class, and redaction class without printing the raw value
- **中文** 当 `deepseek auth` 找到 `DEEPSEEK_API_KEY` 或 `DEEPSEEK_TOKEN` 时，必须报告 scoped credential reference、source class 和 redaction class，不得打印 raw value。

#### Scenario: Privacy reports local policy / privacy 报告本地策略

- **WHEN** `deepseek privacy` runs
- **THEN** it reports local telemetry/export policy, diagnostic persistence policy, and opt-out state as structured metadata
- **中文** 当 `deepseek privacy` 运行时，必须以 structured metadata 报告 local telemetry/export policy、diagnostic persistence policy 和 opt-out state。

### Requirement: Doctor And Install Verification / Doctor 与安装验证

The local readiness layer SHALL provide deterministic diagnostics for platform, Node version, package metadata, workspace access, command availability, config validity, credential presence, and ignored local secret/reference paths.

local readiness layer 必须为 platform、Node version、package metadata、workspace access、command availability、config validity、credential presence 和 ignored local secret/reference paths 提供 deterministic diagnostics。

#### Scenario: Doctor emits checks / doctor 输出检查项

- **WHEN** `deepseek doctor` runs
- **THEN** it emits pass/warn/fail checks with stable ids, redacted metadata, and suggested next actions
- **中文** 当 `deepseek doctor` 运行时，必须输出带 stable ids、redacted metadata 和 suggested next actions 的 pass/warn/fail checks。

#### Scenario: Verify install checks package surface / verify install 检查包表面

- **WHEN** `deepseek verify-install` runs
- **THEN** it verifies CLI package metadata, executable availability, workspace package versions, and expected ignored local files without requiring network access
- **中文** 当 `deepseek verify-install` 运行时，必须验证 CLI package metadata、executable availability、workspace package versions 和 expected ignored local files，且不要求 network access。

