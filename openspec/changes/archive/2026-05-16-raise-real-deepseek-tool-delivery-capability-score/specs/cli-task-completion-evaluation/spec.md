## ADDED Requirements

### Requirement: Evaluation Gates Real Tool Delivery Claims / 评估门禁真实工具交付声明

CLI task-completion evaluation SHALL require real DeepSeek live family evidence before claiming that the 64-family tool platform has reached production delivery readiness.

CLI task-completion evaluation 必须要求真实 DeepSeek live family evidence，才能声明 64-family 工具平台达到生产交付就绪。

#### Scenario: Current baseline remains below target / 当前基线保持低于目标

- **WHEN** only the current 20-tool live coverage evidence is present
- **THEN** diagnostics reports the real score below `0.9` and does not treat implemented manifests or fake/replay fixtures as final delivery proof
- **中文** 当只存在当前 20-tool live coverage evidence 时，diagnostics 必须报告真实分低于 `0.9`，且不得把 implemented manifests 或 fake/replay fixtures 当作最终交付证明。

#### Scenario: Acceptance evidence records successful target / 验收证据记录成功目标

- **WHEN** the real family coverage runner reaches the target
- **THEN** acceptance evidence records the command, timestamp, model, passed family count, total family count, delivery capability score, failing family ids, and redaction metadata
- **中文** 当真实 family coverage runner 达到目标时，acceptance evidence 必须记录 command、timestamp、model、passed family count、total family count、delivery capability score、failing family ids 与 redaction metadata。

#### Scenario: Overall delivery remains blocked by incomplete modes / 整体交付因未完成模式保持阻塞

- **WHEN** all 64 tool families pass but the mode matrix still has non-complete entries
- **THEN** diagnostics reports the tool-family delivery capability score separately from the overall delivery capability score
- **AND** the overall delivery capability score deducts `0.1` for each unfinished target
- **AND** the overall delivery capability score is below `0.9` when more than one target remains unfinished
- **AND** diagnostics lists blocking mode ids
- **中文** 当 64 个工具 family 全部通过但 mode matrix 仍存在 non-complete entry 时，diagnostics 必须将工具 family 交付能力分与整体交付能力分分开报告；整体交付能力分必须对每个 unfinished target 扣 `0.1`；当超过一个 target 未完成时，整体交付能力分必须低于 `0.9`；并列出阻塞的 mode id。

#### Scenario: Package delivery blockers reduce overall score / Package 交付阻塞降低整体分

- **WHEN** tool families and modes pass but package scorecards have packages below the `0.9` delivery target
- **THEN** diagnostics reports package delivery capability separately
- **AND** diagnostics includes `package:<id>` entries in `overallDeliveryCapability.unfinishedTargetIds`
- **AND** diagnostics deducts `0.1` for each unfinished package target
- **中文** 当工具 family 与 mode 已通过，但 package scorecard 中仍有 package 低于 `0.9` 交付门槛时，diagnostics 必须单独报告 package 交付能力分；必须在 `overallDeliveryCapability.unfinishedTargetIds` 中包含 `package:<id>`；并对每个 unfinished package target 扣 `0.1`。

#### Scenario: Evaluation task blockers reduce overall score / Evaluation task 阻塞降低整体分

- **WHEN** tool families, modes, and packages pass but selected DeepSeek task runs are planned, deferred, failed, invalid, missing, or replay-only
- **THEN** diagnostics reports evaluation task delivery capability separately
- **AND** diagnostics includes `evaluation-task:<id>` entries in `overallDeliveryCapability.unfinishedTargetIds`
- **AND** diagnostics deducts `0.1` for each unfinished evaluation task target
- **中文** 当工具 family、mode 与 package 已通过，但选中的 DeepSeek task run 为 planned、deferred、failed、invalid、缺失或仅 replay 时，diagnostics 必须单独报告 evaluation task 交付能力分；必须在 `overallDeliveryCapability.unfinishedTargetIds` 中包含 `evaluation-task:<id>`；并对每个 unfinished evaluation task target 扣 `0.1`。

#### Scenario: Overall delivery passes when all dimensions complete / 全部维度完成时整体交付通过

- **WHEN** all 64 tool families pass, every mode matrix target is complete, every package delivery score reaches the target, and all 9 selected DeepSeek task runs are solved
- **THEN** diagnostics reports `overallDeliveryCapability.score = 1`
- **AND** diagnostics reports `overallDeliveryCapability.unfinishedTargetCount = 0`
- **AND** diagnostics reports `evaluationTaskScore = 1` and `evaluationTaskSolvedCount = 9`
- **AND** diagnostics status is `pass`
- **中文** 当 64 个工具 family 全部通过、每个 mode matrix target 都为 complete、每个 package delivery score 都达到目标，且全部 9 个选中的 DeepSeek task run 都为 solved 时，diagnostics 必须报告 `overallDeliveryCapability.score = 1`、`overallDeliveryCapability.unfinishedTargetCount = 0`、`evaluationTaskScore = 1` 与 `evaluationTaskSolvedCount = 9`，并且 diagnostics status 为 `pass`。

#### Scenario: Provider response cache supports replay-only regression / Provider response cache 支持仅 replay 回归

- **WHEN** the live DeepSeek family coverage runner receives provider streaming chunks
- **THEN** it saves a redacted replay-only provider response cache
- **AND** `--replay` can use the cache without sending DeepSeek requests
- **AND** replay output does not overwrite live delivery score evidence
- **中文** 当真实 DeepSeek family coverage runner 收到 provider streaming chunks 时，必须保存脱敏且仅用于 replay 的 provider response cache；`--replay` 必须能使用该缓存且不发送 DeepSeek 请求；replay 输出不得覆盖真实 live 交付分证据。

#### Scenario: Live CLI uses workspace env credentials / Live CLI 使用 Workspace 环境凭证

- **WHEN** `deepseek run --live` is executed from a workspace containing `.env` credentials and no process-level DeepSeek credential
- **THEN** the CLI runtime hydrates the same credential service used by the model gateway from the workspace `.env`
- **AND** the model request is not blocked by `PROVIDER_CREDENTIAL_MISSING`
- **AND** saved live smoke evidence redacts the raw token and authorization header
- **中文** 当 `deepseek run --live` 在包含 `.env` 凭证且进程级 DeepSeek 凭证为空的 workspace 中执行时，CLI runtime 必须用 workspace `.env` 填充 model gateway 使用的同一个 credential service；模型请求不得被 `PROVIDER_CREDENTIAL_MISSING` 阻断；保存的 live smoke evidence 必须脱敏 raw token 与 authorization header。
