# visible-reasoning-surface Specification

## Purpose
Define visible reasoning surface requirements for exposing bounded reasoning, thought summaries, status, and redacted model process evidence.

定义 visible reasoning surface 对 bounded reasoning、thought summaries、status 与脱敏 model process evidence 展示的要求。

## Requirements
### Requirement: Visible Reasoning Records / 可见推理记录

The platform SHALL define provider-neutral visible reasoning records that explain agent intent, assumptions, decisions, evidence, actions, verification, and outcome without exposing raw provider/internal reasoning.

平台必须定义 provider-neutral 的可见推理记录，用于解释 agent intent、assumptions、decisions、evidence、actions、verification 与 outcome，且不得暴露 raw provider/internal reasoning。

#### Scenario: Record is serializable and traceable / 记录可序列化且可追踪

- **WHEN** runtime, prompt assembly, CLI host, or a plugin emits a visible reasoning record
- **THEN** the record includes schema version, record id, session id, turn id when available, trace metadata, actor, step kind, status, bounded summary, redaction metadata, privacy class, compatibility metadata, and deterministic ordering metadata
- **中文** 当 runtime、prompt assembly、CLI host 或 plugin 发出 visible reasoning record 时，记录必须包含 schema version、record id、session id、可用的 turn id、trace metadata、actor、step kind、status、有界 summary、redaction metadata、privacy class、compatibility metadata 与 deterministic ordering metadata。

#### Scenario: Raw internal reasoning is excluded / 原始内部推理被排除

- **WHEN** a model provider exposes raw reasoning payloads, hidden chain-of-thought, private prompt internals, or provider-specific reasoning diagnostics
- **THEN** visible reasoning records exclude those raw values and can only store bounded user-visible summaries, structural decision metadata, evidence links, and redaction summaries
- **中文** 当模型供应商暴露 raw reasoning payloads、hidden chain-of-thought、private prompt internals 或 provider-specific reasoning diagnostics 时，visible reasoning records 必须排除这些原始值，只能存储有界的用户可见 summaries、结构化 decision metadata、evidence links 与 redaction summaries。

### Requirement: User-Visible Reasoning Summary / 用户可见推理摘要

The agent workflow SHALL produce concise visible reasoning summaries for non-trivial coding turns, including what it is trying to do, what it assumes, why it selects major actions, and how verification affected the result.

agent workflow 必须为非平凡 coding turns 产出简洁的可见推理摘要，说明它尝试做什么、假设了什么、为什么选择主要动作，以及验证如何影响结果。

#### Scenario: Planning summary appears before major work / 主要工作前展示计划摘要

- **WHEN** a turn begins a repository-sensitive task, code edit, product design, release check, plugin workflow, or multi-step investigation
- **THEN** the visible reasoning projection includes an intent step, known assumptions, required evidence classes, and planned action groups before or alongside the first major execution step
- **中文** 当一个 turn 开始 repository-sensitive task、code edit、product design、release check、plugin workflow 或 multi-step investigation 时，visible reasoning projection 必须在第一个主要执行步骤之前或同时包含 intent step、known assumptions、required evidence classes 与 planned action groups。

#### Scenario: Verification updates reasoning / 验证更新推理

- **WHEN** typecheck, lint, tests, build, git review, diagnostics, or another verifier changes confidence or uncovers a problem
- **THEN** the visible reasoning projection records the verification result, the affected decision, the revised status, and any remaining risk or follow-up
- **中文** 当 typecheck、lint、tests、build、git review、diagnostics 或其他 verifier 改变置信度或发现问题时，visible reasoning projection 必须记录 verification result、受影响 decision、更新后的 status，以及剩余 risk 或 follow-up。

### Requirement: Evidence-Linked Reasoning / 证据链接推理

Visible reasoning steps SHALL link decisions to supporting or contradicting evidence through typed target references instead of unsupported narration.

可见推理步骤必须通过类型化 target references 将决策连接到支持或反驳证据，而不是只提供无依据叙述。

#### Scenario: Decision links to source evidence / 决策链接源证据

- **WHEN** a reasoning step makes a factual claim about repository state, command availability, code behavior, release readiness, context budget, git changes, or plugin capabilities
- **THEN** it links to one or more relevant context nodes, tool evidence records, command results, diagnostics, result-list items, file/diff references, or plugin contribution records, or marks the claim as assumption or unsupported
- **中文** 当 reasoning step 对 repository state、command availability、code behavior、release readiness、context budget、git changes 或 plugin capabilities 作出事实声明时，必须链接到一个或多个相关 context nodes、tool evidence records、command results、diagnostics、result-list items、file/diff references 或 plugin contribution records，或者将声明标记为 assumption 或 unsupported。

#### Scenario: Evidence navigation works in TUI / TUI 中证据可导航

- **WHEN** the user focuses a visible reasoning step in the interactive TUI
- **THEN** the inspector can show linked evidence metadata and navigate to the corresponding context item, result list item, command output, diff summary, diagnostic, or plugin contribution without requiring a new model call
- **中文** 当用户在 interactive TUI 中聚焦 visible reasoning step 时，inspector 必须展示链接证据 metadata，并可导航到对应 context item、result list item、command output、diff summary、diagnostic 或 plugin contribution，且不需要新的模型调用。

### Requirement: Renderer Projection Modes / 渲染器投影模式

The CLI SHALL project visible reasoning through terminal-capability-aware renderers for interactive TUI, plain text, JSON, and JSONL.

CLI 必须通过感知 terminal capability 的渲染器，将 visible reasoning 投影到 interactive TUI、plain text、JSON 与 JSONL。

#### Scenario: Interactive TUI shows a reasoning panel / 交互 TUI 展示推理面板

- **WHEN** the terminal profile supports the interactive renderer
- **THEN** the TUI exposes a reasoning panel with ordered steps, status markers, compact/full detail levels, evidence counts, and inspector navigation
- **中文** 当 terminal profile 支持 interactive renderer 时，TUI 必须提供 reasoning panel，包含有序步骤、状态标记、compact/full detail levels、evidence counts 与 inspector navigation。

#### Scenario: Structured output is deterministic / 结构化输出确定

- **WHEN** output mode is JSON or JSONL
- **THEN** visible reasoning is emitted as deterministic schema-versioned records without ANSI styling, cursor controls, spinners, alternate-screen state, or terminal-only layout metadata
- **中文** 当 output mode 为 JSON 或 JSONL 时，visible reasoning 必须作为确定性的 schema-versioned records 输出，不包含 ANSI styling、cursor controls、spinners、alternate-screen state 或 terminal-only layout metadata。

#### Scenario: Plain output remains compact / Plain 输出保持紧凑

- **WHEN** output mode is text or the terminal cannot support interactive rendering
- **THEN** the CLI renders a compact reasoning block with intent, major decisions, verification result, and remaining risks while preserving access to ids for detailed follow-up commands
- **中文** 当 output mode 为 text 或终端无法支持 interactive rendering 时，CLI 必须渲染紧凑 reasoning block，包含 intent、major decisions、verification result 与 remaining risks，同时保留 ids 供后续详细命令使用。

### Requirement: Plugin Reasoning Contributions / 插件推理贡献

Plugin contributions SHALL explain their visible decisions through bounded reasoning records validated by host-level contracts before rendering.

插件贡献必须通过有界 reasoning records 解释其可见决策，并在渲染前由 host-level contracts 校验。

#### Scenario: First-party plugin contributes native reasoning / 第一方插件贡献原生推理

- **WHEN** a first-party dev plugin contributes context compaction, repo navigation, git review, or dev checks output
- **THEN** it can provide visible reasoning records using shared step kinds, evidence links, statuses, redaction metadata, and plugin ids so the TUI renders the explanation inside the same reasoning panel
- **中文** 当第一方 dev plugin 贡献 context compaction、repo navigation、git review 或 dev checks output 时，它可以使用共享 step kinds、evidence links、statuses、redaction metadata 与 plugin ids 提供 visible reasoning records，使 TUI 在同一个 reasoning panel 中渲染解释。

#### Scenario: Invalid plugin reasoning is rejected / 无效插件推理被拒绝

- **WHEN** a plugin reasoning contribution lacks required ids, exceeds size limits, references stale evidence, declares an unsupported privacy class, or omits redaction metadata for sensitive content
- **THEN** the host rejects or degrades that contribution with a structured diagnostic and does not render unsafe content
- **中文** 当 plugin reasoning contribution 缺少必需 ids、超过大小限制、引用过期 evidence、声明不支持的 privacy class，或对敏感内容遗漏 redaction metadata 时，host 必须用结构化 diagnostic 拒绝或降级该 contribution，且不得渲染不安全内容。

### Requirement: Reasoning Privacy And Replay / 推理隐私与回放

Visible reasoning SHALL be redacted, bounded, locally replayable, and safe for diagnostic bundles by default.

可见推理必须默认脱敏、有界、本地可回放，并且对 diagnostic bundles 安全。

#### Scenario: Reasoning does not leak secrets / 推理不泄漏 Secrets

- **WHEN** visible reasoning records include file paths, command previews, model summaries, tool outputs, plugin metadata, environment facts, or diagnostics
- **THEN** records and projections contain no raw API keys, authorization headers, env-style credentials, private-key-like content, unbounded private file content, or raw provider reasoning
- **中文** 当 visible reasoning records 包含 file paths、command previews、model summaries、tool outputs、plugin metadata、environment facts 或 diagnostics 时，records 与 projections 不得包含 raw API keys、authorization headers、env-style credentials、private-key-like content、无边界私有文件内容或 raw provider reasoning。

#### Scenario: Replay identifies reasoning drift / Replay 识别推理漂移

- **WHEN** a regression harness replays a captured turn with visible reasoning evidence
- **THEN** it can compare record order, step kinds, statuses, evidence fingerprints, redaction summaries, and projection fingerprints to identify structural drift without requiring raw private content
- **中文** 当 regression harness 使用 visible reasoning evidence 回放已捕获 turn 时，它必须能比较 record order、step kinds、statuses、evidence fingerprints、redaction summaries 与 projection fingerprints，以识别结构漂移，且不要求 raw private content。

