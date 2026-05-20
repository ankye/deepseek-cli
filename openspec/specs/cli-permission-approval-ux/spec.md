# cli-permission-approval-ux Specification

## Purpose
Define CLI permission and approval UX requirements for surfacing risky actions, collecting decisions, and preserving audit evidence.

定义 CLI permission and approval UX 对风险动作展示、decision 收集与 audit evidence 保存的要求。

## Requirements
### Requirement: CLI Approval Lifecycle Rendering / CLI 审批生命周期渲染

The CLI SHALL render approval-required, approval-decided, approval-denied, approval-timeout, approval-cancelled, and audit-linked lifecycle records from shared approval evidence.

CLI 必须从共享 approval evidence 渲染 approval-required、approval-decided、approval-denied、approval-timeout、approval-cancelled 和 audit-linked 生命周期记录。

#### Scenario: Approval required renders from evidence / 需要审批时从证据渲染

- **WHEN** runtime emits an approval-required record for a governed invocation
- **THEN** CLI text output renders a redacted summary with stable approval id, capability, risk summary, target summary, allowed decisions, and audit reference
- **中文** 当 runtime 为 governed invocation 发出 approval-required record 时，CLI text output 必须渲染脱敏 summary，包含 stable approval id、capability、risk summary、target summary、allowed decisions 和 audit reference。

#### Scenario: Approval decision renders consistently / 审批决策一致渲染

- **WHEN** a user, host, or injected broker returns allow, deny, timeout, or cancel
- **THEN** CLI output renders the decision from the approval decision record and does not inspect private policy or runtime state
- **中文** 当 user、host 或 injected broker 返回 allow、deny、timeout 或 cancel 时，CLI output 必须从 approval decision record 渲染该 decision，且不得检查 private policy 或 runtime state。

### Requirement: Structured Approval Output Parity / 结构化审批输出一致性

The CLI SHALL emit approval records in JSON and JSONL modes using the same lifecycle semantics as text mode and without terminal control sequences.

CLI 在 JSON 与 JSONL modes 中必须使用与 text mode 相同的生命周期语义输出 approval records，且不得包含 terminal control sequences。

#### Scenario: JSONL approval event is deterministic / JSONL 审批事件确定性

- **WHEN** an approval-required record is emitted while CLI output mode is JSONL
- **THEN** the CLI emits one structured record with schema version, event kind, approval id, decision options, redacted summary, trace metadata, and reference pit fixture ids when applicable
- **中文** 当 CLI output mode 为 JSONL 且发出 approval-required record 时，CLI 必须输出一条结构化 record，包含 schema version、event kind、approval id、decision options、redacted summary、trace metadata，以及适用的 reference pit fixture ids。

#### Scenario: Structured modes exclude prompts / 结构化模式排除提示符

- **WHEN** CLI output mode is JSON or JSONL
- **THEN** approval output contains no ANSI decoration, spinner state, prompt glyphs, alternate-screen state, cursor control, or interactive-only instructions
- **中文** 当 CLI output mode 是 JSON 或 JSONL 时，approval output 不得包含 ANSI decoration、spinner state、prompt glyphs、alternate-screen state、cursor control 或 interactive-only instructions。

### Requirement: Headless Approval Fail Closed / Headless 审批安全失败

The CLI SHALL fail closed for approval-required work in headless, scripted, CI, or non-interactive modes unless an explicit approval broker decision is injected.

CLI 在 headless、scripted、CI 或 non-interactive modes 中遇到需要审批的 work 时，除非显式注入 approval broker decision，否则必须 fail closed。

#### Scenario: Headless denial avoids mutation / Headless 拒绝避免修改

- **WHEN** headless CLI execution reaches an approval-required side-effecting invocation without an injected broker decision
- **THEN** the invocation is denied before scheduler execution, workspace state is not mutated, and output cites `pit.headless-trust.fail-closed`
- **中文** 当 headless CLI execution 在没有注入 broker decision 的情况下遇到需要审批的 side-effecting invocation 时，该 invocation 必须在 scheduler execution 前被拒绝，workspace state 不得修改，output 必须引用 `pit.headless-trust.fail-closed`。

#### Scenario: Injected broker decision is auditable / 注入的 Broker 决策可审计

- **WHEN** a test or automation host injects an explicit approval broker decision
- **THEN** CLI output records the decision source, decision reason, approval id, trace metadata, and audit reference without treating the mode as interactive
- **中文** 当 test 或 automation host 注入显式 approval broker decision 时，CLI output 必须记录 decision source、decision reason、approval id、trace metadata 和 audit reference，且不得把该模式视为 interactive。

### Requirement: Approval Risk Summaries / 审批风险摘要

The CLI SHALL render file, shell, capability, extension, degraded-platform, and redaction risk summaries from approval evidence.

CLI 必须从 approval evidence 渲染 file、shell、capability、extension、degraded-platform 和 redaction risk summaries。

#### Scenario: Shell fallback summary is visible / Shell Fallback 摘要可见

- **WHEN** approval evidence includes shell parser fallback, wrapped command, compound command, PowerShell syntax, or parser-unavailable status
- **THEN** CLI output shows a redacted shell risk summary and cites `pit.shell-parser.fallback-risk`
- **中文** 当 approval evidence 包含 shell parser fallback、wrapped command、compound command、PowerShell syntax 或 parser-unavailable status 时，CLI output 必须显示脱敏 shell risk summary，并引用 `pit.shell-parser.fallback-risk`。

#### Scenario: Path risk summary is visible / Path 风险摘要可见

- **WHEN** approval evidence includes filesystem write scope, unsafe path syntax rejection, stale restore risk, or rollback evidence availability
- **THEN** CLI output shows a redacted file risk summary and cites `pit.path-canonicalization.unsafe-syntax` when the rejection class matches that pit
- **中文** 当 approval evidence 包含 filesystem write scope、unsafe path syntax rejection、stale restore risk 或 rollback evidence availability 时，CLI output 必须显示脱敏 file risk summary，并在 rejection class 匹配时引用 `pit.path-canonicalization.unsafe-syntax`。

### Requirement: Approval Actions Are Typed Targets / 审批操作是类型化 Target

The CLI SHALL model approval requests as typed action targets with stable ids for inspect, accept, deny, and cancel actions.

CLI 必须把 approval requests 建模为带稳定 id 的 typed action targets，用于 inspect、accept、deny 和 cancel actions。

#### Scenario: Approval target does not execute directly / 审批 Target 不直接执行

- **WHEN** a CLI approval action resolves an approval target
- **THEN** it submits an approval decision through the approval broker or protocol control path and never directly executes model, tool, scheduler, sandbox, MCP, plugin, or runtime primitives
- **中文** 当 CLI approval action 解析 approval target 时，它必须通过 approval broker 或 protocol control path 提交 approval decision，绝不能直接执行 model、tool、scheduler、sandbox、MCP、plugin 或 runtime primitives。

#### Scenario: Approval history remains immutable / 审批历史保持不可变

- **WHEN** an approval decision is later inspected, replayed, or used by request/turn revert
- **THEN** the original approval request, decision, denial reason, audit reference, and trace metadata remain addressable as immutable history evidence
- **中文** 当 approval decision 后续被查看、replay 或被 request/turn revert 使用时，原始 approval request、decision、denial reason、audit reference 和 trace metadata 必须保持可寻址的 immutable history evidence。
