## ADDED Requirements

### Requirement: Live Smoke Credential Loading / Live Smoke 凭证加载

Credential handling for live smoke SHALL load DeepSeek credentials from process environment or a local `.env` file as scoped secret references without adding `.env` contents to traces, test fixtures, or committed files.

live smoke 的 credential handling 必须从 process environment 或本地 `.env` 文件加载 DeepSeek credentials，并作为 scoped secret references 使用，不得把 `.env` 内容加入 traces、test fixtures 或 committed files。

#### Scenario: Environment credential is preferred / 优先使用环境凭证

- **WHEN** both process environment and `.env` contain a DeepSeek credential
- **THEN** the process environment value is used and represented as a secret credential reference
- **中文** 当 process environment 和 `.env` 都包含 DeepSeek credential 时，必须使用 process environment 值，并表示为 secret credential reference。

#### Scenario: Missing credential skips live smoke / 缺少凭证时跳过 live smoke

- **WHEN** live smoke is enabled but no DeepSeek credential is available
- **THEN** the smoke exits as skipped or unavailable without failing default deterministic tests
- **中文** 当 live smoke 已启用但没有 DeepSeek credential 时，smoke 必须以 skipped 或 unavailable 退出，且不影响默认 deterministic tests。
