## ADDED Requirements

### Requirement: Distribution Roadmap Sequencing / 分发与更新路线图排序

Distribution and update management SHALL align release channels, auto-update UI, plugin distribution, signed artifacts, rollback, and enterprise deployment with roadmap launch gates.

distribution and update management 必须让 release channels、auto-update UI、plugin distribution、signed artifacts、rollback 和 enterprise deployment 与 roadmap launch gates 对齐。

#### Scenario: Release channel requires roadmap gate / 发布通道需要路线图门禁

- **WHEN** a feature moves to alpha, beta, stable, or enterprise-managed release
- **THEN** distribution metadata references roadmap node readiness, rollback plan, compatibility status, and update policy
- **中文** 当功能进入 alpha、beta、stable 或 enterprise-managed release 时，distribution metadata 必须引用路线图节点就绪状态、回滚方案、兼容性状态和更新策略。
