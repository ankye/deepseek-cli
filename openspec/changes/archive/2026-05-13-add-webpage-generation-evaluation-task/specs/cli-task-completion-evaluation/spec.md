## ADDED Requirements

### Requirement: CLI Evaluation Includes Webpage Generation Task / CLI 评估包含网页生成任务

CLI task-completion evaluation SHALL include a deterministic webpage-generation task with local artifact validation.

CLI task-completion evaluation 必须包含带本地产物校验的 deterministic webpage-generation task。

#### Scenario: Webpage generation task is planned in full mode / 网页生成任务在 Full 模式规划

- **WHEN** `deepseek diagnostics evaluate --full --dry-run --output json` runs
- **THEN** the task catalog includes a webpage-generation task with prompt summary, fixture id, snapshot id, capability profile, time budget, check command, scoring rubric id, and `mode: "full"`
- **中文** 当 `deepseek diagnostics evaluate --full --dry-run --output json` 运行时，task catalog 必须包含 webpage-generation task，并带有 prompt summary、fixture id、snapshot id、capability profile、time budget、check command、scoring rubric id 与 `mode: "full"`。

#### Scenario: Webpage artifact checker validates generated output / 网页产物检查器校验生成输出

- **WHEN** the webpage artifact checker runs against a generated webpage directory
- **THEN** it verifies a local HTML entry, viewport metadata, stylesheet or inline style, JavaScript interaction hook, accessible label or heading, and absence of remote CDN/script dependencies
- **中文** 当 webpage artifact checker 对生成网页目录运行时，它必须验证 local HTML entry、viewport metadata、stylesheet 或 inline style、JavaScript interaction hook、accessible label 或 heading，以及不存在 remote CDN/script dependencies。
