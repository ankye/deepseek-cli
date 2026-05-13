## ADDED Requirements

### Requirement: Renderable Approval Evidence / 可渲染审批证据

The policy and sandbox layer SHALL produce redacted, renderable approval evidence for every ask, deny, rewrite, require-sandbox, timeout, and cancelled approval decision.

policy 与 sandbox layer 必须为每个 ask、deny、rewrite、require-sandbox、timeout 和 cancelled approval decision 产出脱敏、可渲染的 approval evidence。

#### Scenario: Policy ask includes risk summary / Policy Ask 包含风险摘要

- **WHEN** policy returns an ask decision for a governed invocation
- **THEN** the decision includes a stable approval id, decision options, capability summary, resource summary, risk summaries, redaction metadata, audit reference, and applicable reference pit fixture ids
- **中文** 当 policy 为 governed invocation 返回 ask decision 时，该 decision 必须包含 stable approval id、decision options、capability summary、resource summary、risk summaries、redaction metadata、audit reference 和适用的 reference pit fixture ids。

#### Scenario: Deny includes user-visible reason / Deny 包含用户可见原因

- **WHEN** policy denies, rewrites, or requires sandbox for an invocation
- **THEN** the decision includes a redacted user-visible reason and machine-readable reason codes suitable for text, JSON, JSONL, replay, and diagnostics
- **中文** 当 policy 对 invocation 执行 deny、rewrite 或 require sandbox 时，该 decision 必须包含脱敏的用户可见原因和 machine-readable reason codes，适用于 text、JSON、JSONL、replay 和 diagnostics。

### Requirement: Headless Broker Denies By Default / Headless Broker 默认拒绝

The approval broker SHALL deny approval-required work by default in headless or non-interactive modes unless an explicit decision provider is configured.

approval broker 在 headless 或 non-interactive modes 中必须默认拒绝需要审批的 work，除非配置了显式 decision provider。

#### Scenario: No decision provider fails closed / 无 Decision Provider 安全失败

- **WHEN** a headless broker receives an approval request and no explicit decision provider is configured
- **THEN** it returns a deny decision with reason `headless.fail_closed`, cites `pit.headless-trust.fail-closed`, and performs no workspace mutation
- **中文** 当 headless broker 收到 approval request 且没有配置显式 decision provider 时，它必须返回 reason 为 `headless.fail_closed` 的 deny decision，引用 `pit.headless-trust.fail-closed`，且不得修改 workspace。

### Requirement: Bypass Hard Safety Approval Evidence / Bypass 硬安全审批证据

Bypass or break-glass modes SHALL keep hard safety checks active and expose non-allow decisions as approval or denial evidence.

bypass 或 break-glass modes 必须保持 hard safety checks 生效，并把 non-allow decisions 暴露为 approval 或 denial evidence。

#### Scenario: Bypass denial cites pit fixture / Bypass 拒绝引用坑位 Fixture

- **WHEN** bypass metadata is present but raw secret exposure, unsafe path scope, missing sandbox enforcement, or unavailable platform capability is detected
- **THEN** policy returns a non-allow decision with redacted denial evidence and cites `pit.permission-bypass.hard-safety`
- **中文** 当存在 bypass metadata，但检测到 raw secret exposure、unsafe path scope、missing sandbox enforcement 或 unavailable platform capability 时，policy 必须返回带脱敏 denial evidence 的 non-allow decision，并引用 `pit.permission-bypass.hard-safety`。

### Requirement: Shell Risk Approval Classification / Shell 风险审批分类

Shell parser fallback, wrapper, compound command, PowerShell, parser-unavailable, and degraded shell analysis statuses SHALL be classified for approval UX before scheduler submission.

shell parser fallback、wrapper、compound command、PowerShell、parser-unavailable 和 degraded shell analysis statuses 必须在 scheduler submission 前被分类为 approval UX 可消费的信息。

#### Scenario: Shell fallback cannot silently allow / Shell Fallback 不能静默放行

- **WHEN** shell analysis is unavailable, degraded, manually reviewable, or detects compound/wrapped syntax
- **THEN** policy returns reject, ask, require-sandbox, or another non-silent decision with shell risk evidence citing `pit.shell-parser.fallback-risk`
- **中文** 当 shell analysis 不可用、降级、需要人工复核，或检测到 compound/wrapped syntax 时，policy 必须返回 reject、ask、require-sandbox 或其他非静默 decision，并带引用 `pit.shell-parser.fallback-risk` 的 shell risk evidence。
