## ADDED Requirements

### Requirement: Config And Credential Path Semantics / 配置与凭证路径语义

The platform abstraction layer SHALL expose cross-platform user config paths, workspace metadata paths, path normalization, file permission metadata, and atomic write behavior for config and credential-adjacent persistence.

platform abstraction layer 必须为 config 和 credential-adjacent persistence 暴露跨平台 user config paths、workspace metadata paths、path normalization、file permission metadata 和 atomic write behavior。

#### Scenario: User config path is platform-aware / 用户配置路径感知平台

- **WHEN** config requests the user-level DeepSeek config location
- **THEN** platform-abstraction returns a normalized path appropriate for Windows, macOS, Linux, or fake test adapters and includes source metadata for diagnostics
- **中文** 当 config 请求 user-level DeepSeek config location 时，platform-abstraction 必须返回适用于 Windows、macOS、Linux 或 fake test adapters 的 normalized path，并包含用于 diagnostics 的 source metadata。

#### Scenario: Workspace metadata path stays inside workspace / workspace 元数据路径留在 workspace 内

- **WHEN** readiness or config requests the workspace metadata path
- **THEN** platform-abstraction resolves it inside the active workspace root and rejects traversal, ambiguous drive-relative paths, home-relative expansion, or paths outside the workspace
- **中文** 当 readiness 或 config 请求 workspace metadata path 时，platform-abstraction 必须把它解析到 active workspace root 内，并拒绝 traversal、ambiguous drive-relative paths、home-relative expansion 或 workspace 外路径。

### Requirement: Atomic Local Persistence / 原子本地持久化

The platform abstraction layer SHALL provide atomic local persistence primitives for non-secret config and metadata files with deterministic fake behavior for tests.

platform abstraction layer 必须为 non-secret config 和 metadata files 提供 atomic local persistence primitives，并为 tests 提供 deterministic fake behavior。

#### Scenario: Atomic write avoids partial documents / 原子写避免部分文档

- **WHEN** a config or metadata write fails midway
- **THEN** platform-abstraction preserves the previous valid document or returns a structured failure without leaving a partially written target
- **中文** 当 config 或 metadata write 中途失败时，platform-abstraction 必须保留之前的 valid document，或返回 structured failure，且不得留下 partially written target。

#### Scenario: Permission diagnostics are structured / 权限诊断结构化

- **WHEN** platform-abstraction detects unsupported permission hardening, read-only files, inaccessible directories, or insecure local fallback storage
- **THEN** it returns structured diagnostics with platform id, path metadata, severity, redaction metadata, and suggested actions
- **中文** 当 platform-abstraction 检测到 unsupported permission hardening、read-only files、inaccessible directories 或 insecure local fallback storage 时，必须返回包含 platform id、path metadata、severity、redaction metadata 和 suggested actions 的 structured diagnostics。
