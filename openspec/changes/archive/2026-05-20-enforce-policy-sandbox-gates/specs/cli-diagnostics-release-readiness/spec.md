## ADDED Requirements

### Requirement: Policy Gate Readiness / Policy Gate 就绪

CLI diagnostics and release readiness SHALL report policy gate coverage and bypass risk.

CLI diagnostics 与 release readiness 必须报告 policy gate coverage 与 bypass risk。

#### Scenario: Diagnostics summarizes policy health / Diagnostics 汇总 Policy Health

- **WHEN** readiness evaluates risky capabilities
- **THEN** it reports policy-covered operations, missing handoffs, bypass attempts, and release-gate severity
- **中文** 当 readiness 评估风险能力时，必须报告 policy-covered operations、missing handoffs、bypass attempts 与 release-gate severity。
