## ADDED Requirements

### Requirement: Evidence-Gated Promotion / 证据门禁推广

Platform governance SHALL prevent capability promotion when required evidence is missing from the evidence matrix.

当 evidence matrix 缺少必需证据时，平台治理必须阻止 capability promotion。

#### Scenario: Missing evidence blocks promotion / 缺失证据阻止推广

- **WHEN** a capability is marked implemented but lacks required evidence for its risk tier
- **THEN** governance records missing evidence, owner, promotion blocker, severity, and suggested next action
- **中文** 当 capability 被标记为 implemented 但缺少其风险等级所需证据时，治理必须记录 missing evidence、owner、promotion blocker、severity 与 suggested next action。
