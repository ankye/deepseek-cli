## ADDED Requirements

### Requirement: Persistent Readiness State / 持久化可用性状态

The local readiness layer SHALL consume injected persistent config, workspace metadata, credential references, privacy settings, and platform diagnostics instead of relying on hardcoded readiness defaults.

local readiness layer 必须消费注入的 persistent config、workspace metadata、credential references、privacy settings 和 platform diagnostics，而不是依赖 hardcoded readiness defaults。

#### Scenario: Init creates metadata idempotently / init 幂等创建元数据

- **WHEN** `deepseek init` runs in a workspace without DeepSeek metadata
- **THEN** it creates the workspace metadata directory and initial non-secret config document through platform/config services and reports created paths as redacted metadata
- **中文** 当 `deepseek init` 在没有 DeepSeek metadata 的 workspace 中运行时，必须通过 platform/config services 创建 workspace metadata directory 和初始 non-secret config document，并以 redacted metadata 报告 created paths。

#### Scenario: Init preserves existing user state / init 保留已有用户状态

- **WHEN** `deepseek init` runs in an already initialized workspace without an explicit force input
- **THEN** it reports the existing metadata and does not overwrite config, credential references, session data, or user-authored files
- **中文** 当 `deepseek init` 在已初始化 workspace 中运行且没有显式 force input 时，必须报告 existing metadata，且不得覆盖 config、credential references、session data 或用户编写的文件。

### Requirement: Readiness Uses Resolved Config / 可用性使用解析后配置

Readiness commands SHALL report resolved config state with source metadata, schema diagnostics, profile metadata, and redacted values.

readiness commands 必须报告带 source metadata、schema diagnostics、profile metadata 和 redacted values 的 resolved config state。

#### Scenario: Config readiness shows precedence / config 可用性展示优先级

- **WHEN** `deepseek config` runs after user and workspace config values are persisted
- **THEN** it reports the effective resolved value, the winning source, shadowed lower-precedence sources, validation diagnostics, and suggested actions
- **中文** 当 `deepseek config` 在 user 和 workspace config values 已持久化后运行时，必须报告 effective resolved value、winning source、被更高优先级覆盖的 lower-precedence sources、validation diagnostics 和 suggested actions。

#### Scenario: Privacy readiness uses persisted policy / privacy 可用性使用持久化策略

- **WHEN** `deepseek privacy` runs
- **THEN** it reports persisted privacy and telemetry settings through structured metadata and does not export telemetry as part of the command
- **中文** 当 `deepseek privacy` 运行时，必须通过 structured metadata 报告 persisted privacy 和 telemetry settings，且 command 本身不得导出 telemetry。

### Requirement: Explicit Live Doctor / 显式 Live Doctor

The local readiness layer SHALL support explicit live DeepSeek connectivity verification while keeping default `doctor` deterministic and offline.

local readiness layer 必须支持显式 DeepSeek live connectivity verification，同时保持默认 `doctor` deterministic 和 offline。

#### Scenario: Default doctor is offline / 默认 doctor 离线运行

- **WHEN** `deepseek doctor` runs without a live flag or live command input
- **THEN** it validates config, credentials, platform, install, privacy, and workspace metadata without calling the DeepSeek API
- **中文** 当 `deepseek doctor` 在没有 live flag 或 live command input 的情况下运行时，必须校验 config、credentials、platform、install、privacy 和 workspace metadata，且不得调用 DeepSeek API。

#### Scenario: Live doctor verifies provider through gateway / live doctor 通过 gateway 验证 provider

- **WHEN** `deepseek doctor --live` runs with an available DeepSeek credential reference
- **THEN** it calls model-gateway through injected credential resolution and returns provider reachability, model id, terminal status, latency metadata, and redacted diagnostics without exact model-text snapshots
- **中文** 当 `deepseek doctor --live` 在存在 DeepSeek credential reference 时运行时，必须通过 injected credential resolution 调用 model-gateway，并返回 provider reachability、model id、terminal status、latency metadata 和 redacted diagnostics，且不包含精确模型文本快照。
