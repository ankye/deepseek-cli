## ADDED Requirements

### Requirement: Path Canonicalization Pit Fixtures / 路径规范化坑位 Fixtures

Platform path resolution SHALL include deterministic negative fixtures for cross-platform path canonicalization bypass classes.

platform path resolution 必须包含针对跨平台 path canonicalization 绕过类别的确定性负向 fixtures。

#### Scenario: Unsafe path syntaxes are rejected / 不安全路径语法被拒绝

- **WHEN** workspace path resolution receives home expansion, null bytes, drive-relative paths, UNC paths, trailing dot or space variants, shell expansion syntax, or glob-like write targets
- **THEN** the platform rejects the path with a typed redacted error before filesystem mutation
- **中文** 当 workspace path resolution 收到 home expansion、null bytes、drive-relative paths、UNC paths、trailing dot 或 space 变体、shell expansion syntax 或 glob-like write targets 时，platform 必须在 filesystem mutation 前用类型化脱敏错误拒绝该路径。

#### Scenario: Safe relative paths remain accepted / 安全相对路径保持可用

- **WHEN** workspace path resolution receives a normal relative path inside the governed workspace root
- **THEN** the platform returns a safe resolved path with root, relative path, diagnostics, and redaction metadata
- **中文** 当 workspace path resolution 收到位于 governed workspace root 内的正常相对路径时，platform 必须返回包含 root、relative path、diagnostics 和 redaction metadata 的 safe resolved path。
