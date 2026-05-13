## ADDED Requirements

### Requirement: Approval Evidence Redaction / 审批证据脱敏

Observability and diagnostics SHALL store and export approval evidence only as redacted summaries, stable ids, trace metadata, reason codes, and audit references.

observability 与 diagnostics 必须只以 redacted summaries、stable ids、trace metadata、reason codes 和 audit references 的形式存储和导出 approval evidence。

#### Scenario: Approval diagnostics omit secrets / 审批诊断不包含 Secrets

- **WHEN** diagnostic bundles include approval requests, approval decisions, denial summaries, shell risk summaries, file risk summaries, extension permission diffs, or broker metadata
- **THEN** bundles contain no raw env values, auth headers, credential material, private file contents, unredacted paths beyond policy, plugin tokens, or copied reference implementation details
- **中文** 当 diagnostic bundles 包含 approval requests、approval decisions、denial summaries、shell risk summaries、file risk summaries、extension permission diffs 或 broker metadata 时，bundles 不得包含 raw env values、auth headers、credential material、private file contents、超出 policy 的未脱敏 paths、plugin tokens 或复制的参考实现细节。

#### Scenario: Approval redaction cites pit fixture / 审批脱敏引用坑位 Fixture

- **WHEN** approval redaction tests cover support bundle material
- **THEN** evidence cites `pit.diagnostic-redaction.support-bundle` and remains replayable without raw secret material
- **中文** 当 approval redaction tests 覆盖 support bundle material 时，evidence 必须引用 `pit.diagnostic-redaction.support-bundle`，并在不包含 raw secret material 的情况下可 replay。
