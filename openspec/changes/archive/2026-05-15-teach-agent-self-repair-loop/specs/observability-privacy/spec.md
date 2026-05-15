## ADDED Requirements

### Requirement: Self-Repair Evidence Is Canonical And Redacted / 自修复证据标准化且脱敏

Observability SHALL normalize self-repair loop events into canonical redacted records before storage, replay, diagnostics, or host projection.

observability 必须在 storage、replay、diagnostics 或 host projection 之前，将 self-repair loop events 归一化为标准脱敏记录。

#### Scenario: Repair evidence becomes canonical record / 修复证据成为标准记录
- **WHEN** the repair loop emits classification, plan, attempt, verification, stop, revert, or escalation evidence
- **THEN** observability records schema version, record id, event kind, session id, turn id, trace id, repair attempt id, evidence fingerprints, redaction metadata, privacy class, and compatibility metadata
- **中文** 当 repair loop 发出 classification、plan、attempt、verification、stop、revert 或 escalation evidence 时，observability 必须记录 schema version、record id、event kind、session id、turn id、trace id、repair attempt id、evidence fingerprints、redaction metadata、privacy class 与 compatibility metadata。

#### Scenario: Repair evidence excludes raw unsafe content / 修复证据排除不安全原文
- **WHEN** repair evidence contains command output, model diagnosis, file snippets, provider errors, or verification logs
- **THEN** stored and rendered records include bounded redacted previews, byte counts, digests, and redaction summaries without raw secrets, unbounded stdout/stderr, private file contents beyond policy, or raw provider reasoning
- **中文** 当 repair evidence 包含 command output、model diagnosis、file snippets、provider errors 或 verification logs 时，存储和展示的 records 必须包含有界脱敏 previews、byte counts、digests 与 redaction summaries，不得包含 raw secrets、无界 stdout/stderr、超出 policy 的私有文件内容或 raw provider reasoning。

### Requirement: Self-Repair Diagnostic Bundles Are Replayable / 自修复诊断包可回放

Diagnostic bundles SHALL include enough redacted self-repair evidence to replay repair decisions and explain why the loop completed, retried, reverted, escalated, or failed.

diagnostic bundles 必须包含足够的脱敏 self-repair evidence，以回放 repair decisions 并解释 loop 为何 completed、retried、reverted、escalated 或 failed。

#### Scenario: Bundle explains repair stop reason / 诊断包解释修复停止原因
- **WHEN** a diagnostic bundle is generated for a turn that entered self-repair
- **THEN** the bundle includes failure classification, repair policy decisions, attempt summaries, verification summaries, stop reason, replay fingerprints, and redaction summaries
- **中文** 当为进入 self-repair 的 turn 生成 diagnostic bundle 时，bundle 必须包含 failure classification、repair policy decisions、attempt summaries、verification summaries、stop reason、replay fingerprints 与 redaction summaries。

#### Scenario: Bundle remains local and safe by default / 诊断包默认本地安全
- **WHEN** self-repair diagnostic evidence is generated without explicit external export settings
- **THEN** it remains local, external upload is denied by default, and export-denial evidence contains no raw repair artifacts or secrets
- **中文** 当生成 self-repair diagnostic evidence 且没有显式 external export settings 时，它必须保持本地，默认拒绝 external upload，且 export-denial evidence 不包含 raw repair artifacts 或 secrets。
