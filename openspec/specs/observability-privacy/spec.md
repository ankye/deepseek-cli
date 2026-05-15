# observability-privacy Specification

## Purpose

Define DeepSeek-owned observability and privacy controls for deterministic local diagnostics, redacted diagnostic bundles, export policy decisions, and no-raw-secret trace evidence.

定义 DeepSeek 自有的 observability 与 privacy controls，用于 deterministic local diagnostics、脱敏 diagnostic bundles、export policy decisions 和 no-raw-secret trace evidence。
## Requirements
### Requirement: Canonical Observability Records / 标准观测记录

The platform SHALL normalize emitted observability events into versioned canonical records before storage, replay, diagnostic bundle generation, or host projection.

平台必须在 storage、replay、diagnostic bundle generation 或 host projection 之前，将 emitted observability events 归一化为版本化 canonical records。

#### Scenario: Event becomes canonical record / event 转为标准记录

- **WHEN** a runtime, bus, provider, policy, or diagnostic event is emitted
- **THEN** the stored record includes schema version, record id, event kind, timestamp, name, fields, data/privacy class, redaction metadata, trace metadata when available, persistence policy, compatibility metadata, and privacy decision metadata
- **中文** 当 runtime、bus、provider、policy 或 diagnostic event 被发出时，stored record 必须包含 schema version、record id、event kind、timestamp、name、fields、data/privacy class、redaction metadata、可用 trace metadata、persistence policy、compatibility metadata 和 privacy decision metadata。

### Requirement: Privacy Defaults / 隐私默认值

The observability system SHALL default to local deterministic diagnostics and SHALL deny external telemetry/export unless explicitly allowed.

observability system 必须默认使用 local deterministic diagnostics，并且除非显式允许，否则必须拒绝 external telemetry/export。

#### Scenario: Telemetry is disabled by default / 默认关闭遥测

- **WHEN** no privacy settings are provided
- **THEN** local diagnostic records can be retained, external telemetry is disabled, and export attempts are denied with an audit-safe privacy decision
- **中文** 当未提供 privacy settings 时，local diagnostic records 可以保留，external telemetry 关闭，export attempts 必须以 audit-safe privacy decision 被拒绝。

#### Scenario: Privacy opt-out keeps local diagnostics / 隐私退出保留本地诊断

- **WHEN** telemetry is disabled or external export is denied
- **THEN** deterministic local diagnostics remain available while external export is blocked and recorded as redacted metadata
- **中文** 当 telemetry 关闭或 external export 被拒绝时，deterministic local diagnostics 必须仍可用，同时 external export 被阻止并以脱敏 metadata 记录。

### Requirement: Diagnostic Bundle Generation / 诊断包生成

The observability system SHALL generate bounded diagnostic bundles containing redacted canonical records, redaction summaries, privacy decisions, and generation metadata.

observability system 必须生成有界 diagnostic bundles，包含脱敏 canonical records、redaction summaries、privacy decisions 和 generation metadata。

#### Scenario: Bundle contains redacted evidence / bundle 包含脱敏证据

- **WHEN** a diagnostic bundle is generated from observability records
- **THEN** the bundle includes schema version, bundle id, generated timestamp, selected record count, redaction summary, privacy decision, compatibility metadata, and records without raw secret values
- **中文** 当 diagnostic bundle 从 observability records 生成时，bundle 必须包含 schema version、bundle id、generated timestamp、selected record count、redaction summary、privacy decision、compatibility metadata 和不含 raw secret values 的 records。

#### Scenario: Bundle respects record limits / bundle 遵守记录上限

- **WHEN** more records exist than the requested bundle limit
- **THEN** the bundle includes only the bounded subset and records truncation metadata without leaking dropped record payloads
- **中文** 当 records 数量超过 requested bundle limit 时，bundle 只能包含有界子集，并记录 truncation metadata，且不得泄漏被丢弃 record payload。

### Requirement: Secret-Safe Redaction / Secret 安全脱敏

Observability storage and diagnostic bundles SHALL classify and redact raw API keys, bearer tokens, env-style credentials, passwords, and private-key-like content before persistence.

observability storage 与 diagnostic bundles 必须在 persistence 前 classify 并 redact raw API keys、bearer tokens、env-style credentials、passwords 和 private-key-like content。

#### Scenario: Secret fixture does not persist / secret fixture 不持久化

- **WHEN** event fields contain secret-like strings
- **THEN** drained records, diagnostic bundles, replay traces, and assertion output contain redacted markers instead of raw values
- **中文** 当 event fields 包含 secret-like strings 时，drained records、diagnostic bundles、replay traces 和 assertion output 必须包含 redacted markers，而不是 raw values。

### Requirement: Export Policy Decisions / 导出策略决策

Diagnostic export SHALL be mediated by privacy settings and export policy before any external transfer is attempted.

diagnostic export 必须在任何 external transfer 尝试前由 privacy settings 与 export policy 介入决策。

#### Scenario: Export denied before transfer / 导出在传输前被拒绝

- **WHEN** a caller requests external export while telemetry or external export is disabled
- **THEN** the system returns a denied privacy decision and no transport/export payload is produced
- **中文** 当调用方在 telemetry 或 external export 关闭时请求 external export，系统必须返回 denied privacy decision，且不产生 transport/export payload。

### Requirement: Compatibility And Replay / 兼容性与回放

Observability records and diagnostic bundles SHALL be schema-versioned and replayable through the deterministic regression harness.

observability records 与 diagnostic bundles 必须带 schema version，并可通过 deterministic regression harness replay。

#### Scenario: Schema version is required / 必须包含 schema version

- **WHEN** versioning tests inspect observability records or diagnostic bundles
- **THEN** each persisted artifact declares a supported schema version or fails closed with a deterministic diagnostic
- **中文** 当 versioning tests 检查 observability records 或 diagnostic bundles 时，每个 persisted artifact 必须声明 supported schema version，否则以 deterministic diagnostic 安全失败。

### Requirement: Agent Loop Trace Correlation / Agent Loop Trace 关联

Observability SHALL correlate every agent loop event, model request, tool intent, tool execution, retry, error, cancellation, and terminal result with session id, turn id, trace id, and parent execution id when present.

observability 必须把每个 agent loop event、model request、tool intent、tool execution、retry、error、cancellation 和 terminal result 与 session id、turn id、trace id 以及存在时的 parent execution id 关联。

#### Scenario: Tool trace links to model intent / 工具 trace 关联模型意图

- **WHEN** a model-requested tool is executed
- **THEN** the tool execution trace includes the originating model request id, tool intent id, capability id, execution envelope id, and scheduler task id
- **中文** 当执行模型请求的工具时，tool execution trace 必须包含 originating model request id、tool intent id、capability id、execution envelope id 和 scheduler task id。

### Requirement: Agent Loop Redaction / Agent Loop 脱敏

Agent loop events SHALL redact credentials, authorization headers, exact secret values, provider raw request bodies containing secrets, and unsafe raw tool outputs before presentation, persistence, replay, or golden fixture generation.

agent loop events 必须在 presentation、persistence、replay 或 golden fixture generation 前脱敏 credentials、authorization headers、精确 secret values、包含 secrets 的 provider raw request bodies 和不安全 raw tool outputs。

#### Scenario: Credential does not appear in JSONL / 凭证不出现在 JSONL

- **WHEN** an agent command runs with live DeepSeek credentials and JSONL output
- **THEN** no emitted JSON line contains raw API keys, authorization headers, or credential environment values
- **中文** 当 agent command 使用 live DeepSeek credentials 与 JSONL output 运行时，输出的 JSON 行不得包含 raw API keys、authorization headers 或 credential environment values。

#### Scenario: Large tool output is bounded / 大工具输出有边界

- **WHEN** a tool produces output larger than configured presentation limits
- **THEN** the displayed event contains preview, byte counts, truncation metadata, digest, and redaction metadata rather than unbounded raw output
- **中文** 当工具输出超过配置的 presentation limits 时，展示 event 必须包含 preview、byte counts、truncation metadata、digest 和 redaction metadata，而不是无边界 raw output。

### Requirement: Agent Loop Audit Evidence / Agent Loop 审计证据

Observability SHALL record replay-safe audit evidence for agent loop decisions, including model profile, policy decision, repair decision, scheduler admission, tool result summary, and terminal status.

observability 必须为 agent loop decisions 记录 replay-safe audit evidence，包括 model profile、policy decision、repair decision、scheduler admission、tool result summary 和 terminal status。

#### Scenario: Repair decision is auditable / 修复决策可审计

- **WHEN** runtime repairs a provider tool-call intent
- **THEN** observability records the repair type, before/after structural metadata, validation evidence, and redacted diagnostics without storing secret or unsafe raw content
- **中文** 当 runtime 修复 provider tool-call intent 时，observability 必须记录 repair type、before/after structural metadata、validation evidence 和 redacted diagnostics，且不存储 secret 或 unsafe raw content。

### Requirement: Diagnostic Redaction Pit Fixtures / 诊断脱敏坑位 Fixtures

Observability and diagnostic bundle behavior SHALL include deterministic fixtures for env, proxy, auth header, MCP credential, plugin metadata, file path, and trace payload redaction.

observability 与 diagnostic bundle behavior 必须包含针对 env、proxy、auth header、MCP credential、plugin metadata、file path 和 trace payload redaction 的确定性 fixtures。

#### Scenario: Support bundle does not leak secrets / 支持包不泄漏 Secrets

- **WHEN** diagnostic records contain API keys, bearer tokens, env-style credentials, credential-like fields, plugin metadata, or MCP credential material
- **THEN** local diagnostic bundles and external export denial evidence contain only redacted values and redaction summaries
- **中文** 当 diagnostic records 包含 API keys、bearer tokens、env-style credentials、credential-like fields、plugin metadata 或 MCP credential material 时，local diagnostic bundles 与 external export denial evidence 只能包含脱敏值和 redaction summaries。

#### Scenario: Redaction evidence is reviewable / 脱敏证据可审查

- **WHEN** redaction occurs in an observability record or bundle
- **THEN** the output includes redacted field paths, secret-like field paths, value counts, and highest privacy class without exposing raw secret material
- **中文** 当 observability record 或 bundle 发生脱敏时，输出必须包含 redacted field paths、secret-like field paths、value counts 和 highest privacy class，且不暴露 raw secret material。

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

### Requirement: CLI Support Bundle Projection / CLI 支持包投影

Observability diagnostic bundles SHALL be safe for CLI support-bundle projection in text, JSON, and JSONL output modes.

observability diagnostic bundles 必须可安全投影到 CLI support-bundle 的 text、JSON 和 JSONL output modes。

#### Scenario: CLI bundle projection is redacted / CLI Bundle 投影被脱敏

- **WHEN** CLI diagnostics renders a diagnostic bundle
- **THEN** the rendered artifact contains schema version, bundle id, privacy decision, redaction summary, selected counts, compatibility metadata, and records without raw env values, auth headers, credentials, private file contents, plugin tokens, or copied reference implementation details
- **中文** 当 CLI diagnostics 渲染 diagnostic bundle 时，rendered artifact 必须包含 schema version、bundle id、privacy decision、redaction summary、selected counts、compatibility metadata 和不含 raw env values、auth headers、credentials、private file contents、plugin tokens 或复制参考实现细节的 records。

#### Scenario: External support upload is denied by default / 外部支持上传默认拒绝

- **WHEN** CLI diagnostics evaluates support upload or external telemetry without explicit privacy settings that allow it
- **THEN** observability returns a denied privacy decision before any external payload is produced
- **中文** 当 CLI diagnostics 在没有显式允许的 privacy settings 时评估 support upload 或 external telemetry，observability 必须在产生任何 external payload 前返回 denied privacy decision。

### Requirement: Diagnostics Pit Evidence / 诊断坑位证据

Diagnostic bundle outputs SHALL preserve reference pit fixture ids used for redaction and environment snapshot coverage.

diagnostic bundle outputs 必须保留用于 redaction 与 environment snapshot coverage 的 reference pit fixture ids。

#### Scenario: Support bundle cites diagnostic pit / 支持包引用诊断坑位

- **WHEN** support-bundle tests cover redaction of support material
- **THEN** evidence includes `pit.diagnostic-redaction.support-bundle` and serializes safely without raw secret material
- **中文** 当 support-bundle tests 覆盖支持材料脱敏时，evidence 必须包含 `pit.diagnostic-redaction.support-bundle`，并且序列化后不包含 raw secret material。

#### Scenario: Environment snapshot pit is visible / 环境快照坑位可见

- **WHEN** diagnostics include startup environment or credential-presence metadata
- **THEN** evidence includes `pit.env-snapshot.immutable-startup` or an explicit deferral, and never reads mutable env values after the diagnostics snapshot is assembled
- **中文** 当 diagnostics 包含 startup environment 或 credential-presence metadata 时，evidence 必须包含 `pit.env-snapshot.immutable-startup` 或明确 deferred，且在 diagnostics snapshot 组装后不得读取 mutable env values。

### Requirement: Evidence-First Records Are Redacted And Replayable / 证据优先记录脱敏且可回放

Observability SHALL normalize evidence-first workflow events into redacted canonical records suitable for replay, diagnostics, and local support bundles.

observability 必须将 evidence-first workflow events 归一化为脱敏 canonical records，适用于 replay、diagnostics 与 local support bundles。

#### Scenario: Evidence plan is observable / 证据计划可观测
- **WHEN** a fact-sensitive task creates an evidence plan
- **THEN** observability records plan id, task classification, required fact classes, source groups, source coverage, stop conditions, trace metadata, schema version, and redaction metadata
- **中文** 当 fact-sensitive task 创建 evidence plan 时，observability 必须记录 plan id、task classification、required fact classes、source groups、source coverage、stop conditions、trace metadata、schema version 与 redaction metadata。

#### Scenario: Evidence manifest excludes raw secrets / 证据清单排除原始 Secrets
- **WHEN** evidence items or claim groundings are stored, rendered, or exported
- **THEN** records contain bounded previews, fingerprints, source references, fact classes, and redaction summaries without raw secrets, unbounded private file content, provider raw reasoning, or authorization material
- **中文** 当 evidence items 或 claim groundings 被存储、展示或导出时，records 必须包含 bounded previews、fingerprints、source references、fact classes 与 redaction summaries，不得包含 raw secrets、无界私有文件内容、provider raw reasoning 或 authorization material。

### Requirement: Unsupported Claim Diagnostics Are Safe / 未支持声明诊断安全

Observability SHALL record unsupported-claim diagnostics without leaking unsafe source content or overstating unverified conclusions.

observability 必须记录 unsupported-claim diagnostics，同时不泄漏 unsafe source content，也不夸大未经验证的结论。

#### Scenario: Unsupported command diagnostic is bounded / 未支持命令诊断有界
- **WHEN** generated output includes an unsupported command or package claim
- **THEN** observability records the claim fingerprint, bounded claim preview, missing evidence class, output artifact id, and remediation hint without persisting full generated artifact content by default
- **中文** 当生成输出包含 unsupported command 或 package claim 时，observability 必须记录 claim fingerprint、有界 claim preview、missing evidence class、output artifact id 与 remediation hint，默认不持久化完整生成产物内容。

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

