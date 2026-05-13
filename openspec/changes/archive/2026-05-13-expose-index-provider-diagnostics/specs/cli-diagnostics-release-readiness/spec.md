## ADDED Requirements

### Requirement: CLI Doctor Shows Index Provider Diagnostics / CLI Doctor 显示 Index Provider 诊断

CLI diagnostics and readiness doctor SHALL surface index provider status from shared provider diagnostics without direct SDK imports, live model calls, vector database calls, or raw credential reads.

CLI diagnostics 与 readiness doctor 必须从 shared provider diagnostics 暴露 index provider status，不得直接导入 SDK、发起 live model calls、调用 vector database 或读取 raw credentials。

#### Scenario: Doctor includes provider summary / Doctor 包含 Provider Summary
- **WHEN** a user runs `deepseek diagnostics doctor` or `deepseek readiness doctor`
- **THEN** the result includes PageIndex, ZVec, and code-index status checks plus bounded provider summary metadata
- **中文** 当用户运行 `deepseek diagnostics doctor` 或 `deepseek readiness doctor` 时，结果必须包含 PageIndex、ZVec 与 code-index status checks，以及有界 provider summary metadata。

#### Scenario: Structured provider diagnostics stay terminal-safe / 结构化 Provider 诊断保持终端安全
- **WHEN** diagnostics doctor is rendered as JSON or JSONL
- **THEN** index provider diagnostics are valid JSON objects with stable `kind` or check ids, redaction metadata, and no ANSI, cursor state, raw secrets, SDK instances, or host UI objects
- **中文** 当 diagnostics doctor 以 JSON 或 JSONL 渲染时，index provider diagnostics 必须是有效 JSON objects，包含稳定 `kind` 或 check ids、redaction metadata，且不包含 ANSI、cursor state、raw secrets、SDK instances 或 host UI objects。
