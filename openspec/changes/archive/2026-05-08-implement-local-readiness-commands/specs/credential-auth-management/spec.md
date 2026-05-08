## ADDED Requirements

### Requirement: R1 Local Credential Reference / R1 本地凭证引用

Credential auth management SHALL support R1 local credential presence checks for `DEEPSEEK_API_KEY` and `DEEPSEEK_TOKEN` as secret references without raw value output.

credential auth management 必须支持 R1 local credential presence checks，将 `DEEPSEEK_API_KEY` 和 `DEEPSEEK_TOKEN` 作为 secret references 处理，且不输出 raw value。

#### Scenario: Credential presence is redacted / 凭证存在性被脱敏

- **WHEN** readiness auth checks find a DeepSeek credential
- **THEN** the result includes credential reference id, source class, redaction class, and availability status without the raw credential value
- **中文** 当 readiness auth checks 找到 DeepSeek credential 时，结果必须包含 credential reference id、source class、redaction class 和 availability status，但不包含 raw credential value。

#### Scenario: Missing credential is actionable / 缺少凭证可操作

- **WHEN** readiness auth checks do not find a DeepSeek credential
- **THEN** the result reports a warning with setup instructions that do not require storing secrets in tracked files
- **中文** 当 readiness auth checks 未找到 DeepSeek credential 时，结果必须报告 warning，并提供不要求把 secrets 存入 tracked files 的 setup instructions。
