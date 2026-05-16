## ADDED Requirements

### Requirement: Release Diagnostics Cite Package Scorecard Evidence As Advisory / Release Diagnostics 将包级评分作为建议性证据
CLI release diagnostics SHALL cite package scorecard evidence as an advisory readiness signal when available, but package scorecards SHALL NOT block publish readiness in the first version.

当 package scorecard evidence 可用时，CLI release diagnostics 必须将其作为 advisory readiness signal 引用；但第一版 package scorecards 不得阻塞 publish readiness。

#### Scenario: Release output includes advisory package scorecard status / Release 输出包含建议性包评分状态
- **WHEN** `deepseek diagnostics release --output json` runs and package scorecard evidence exists
- **THEN** release diagnostics includes package scorecard evidence paths or summaries, platform package readiness aggregate, advisory status, and diagnostics for failing package hard gates without changing the existing release readiness status
- **中文** 当 `deepseek diagnostics release --output json` 运行且 package scorecard evidence 存在时，release diagnostics 必须包含 package scorecard evidence paths 或 summaries、platform package readiness aggregate、advisory status 与 failing package hard gates diagnostics，但不得改变现有 release readiness status。

#### Scenario: Missing package scorecard evidence warns only when explicitly requested / 缺失包评分证据仅在显式请求时警告
- **WHEN** release diagnostics runs without package scorecard evidence and package scorecard advisory mode was not requested
- **THEN** release diagnostics does not fail or warn solely because package scorecard evidence is missing
- **中文** 当 release diagnostics 在没有 package scorecard evidence 的情况下运行，且未显式请求 package scorecard advisory mode 时，release diagnostics 不得仅因为缺失 package scorecard evidence 而 fail 或 warn。

#### Scenario: Advisory mode preserves publish command guidance / 建议模式保留发布命令指导
- **WHEN** release diagnostics renders package scorecard advisory information
- **THEN** existing publish dry-run guidance, build artifact status, acceptance evidence status, and package surface status remain present
- **中文** 当 release diagnostics 渲染 package scorecard advisory information 时，现有 publish dry-run guidance、build artifact status、acceptance evidence status 与 package surface status 必须继续存在。
