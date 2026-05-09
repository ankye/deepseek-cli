## ADDED Requirements

### Requirement: Projection Honors Secret Policy / Projection 遵守 Secret Policy

ContextGraph projection SHALL honor policy/sandbox secret decisions and SHALL NOT expose content that policy denies.

ContextGraph projection 必须遵守 policy/sandbox secret decisions，且不得暴露 policy deny 的内容。

#### Scenario: Policy-denied node stays excluded / Policy 拒绝节点保持排除

- **WHEN** a candidate context node is denied by secret or sandbox policy
- **THEN** projection excludes it with redacted reason metadata before model dispatch
- **中文** 当 candidate context node 被 secret 或 sandbox policy deny 时，projection 必须在 model dispatch 前排除它，并记录 redacted reason metadata。

#### Scenario: Projection redaction matches audit class / Projection 脱敏匹配审计等级

- **WHEN** projection emits selected/excluded summaries
- **THEN** redaction class and audit reason metadata match policy decisions for the same content
- **中文** 当 projection 发出 selected/excluded summaries 时，redaction class 与 audit reason metadata 必须匹配同一内容的 policy decisions。
