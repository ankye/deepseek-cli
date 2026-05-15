## ADDED Requirements

### Requirement: Evidence-First Regression Coverage / 证据优先回归覆盖

The regression suite SHALL cover evidence-first behavior for repository facts, product pages, command recommendations, code explanations, reports, and generated artifacts.

regression suite 必须覆盖 repository facts、product pages、command recommendations、code explanations、reports 与 generated artifacts 的 evidence-first behavior。

#### Scenario: Fact-sensitive task requires evidence events / 事实敏感任务要求证据事件
- **WHEN** a deterministic runtime test submits a fact-sensitive project prompt
- **THEN** tests assert evidence classification, evidence plan, selected evidence summary, prompt boundary preservation, and claim grounding evidence before terminal output
- **中文** 当 deterministic runtime test 提交 fact-sensitive project prompt 时，测试必须断言 terminal output 之前存在 evidence classification、evidence plan、selected evidence summary、prompt boundary preservation 与 claim grounding evidence。

#### Scenario: Speculative task labels assumptions / 推测任务标注假设
- **WHEN** a deterministic runtime test submits an explicitly speculative or brainstorming prompt
- **THEN** tests assert mandatory evidence is skipped or reduced only with task classification evidence and assumption labeling
- **中文** 当 deterministic runtime test 提交明确 speculative 或 brainstorming prompt 时，测试必须断言只有带 task classification evidence 与 assumption labeling 时，mandatory evidence 才可跳过或降低。

### Requirement: Unsupported Claim Regression Fixtures / 未支持声明回归 Fixtures

The regression suite SHALL include fixtures that fail when generated project/product output contains unsupported commands, package names, feature claims, release states, or evaluation conclusions.

regression suite 必须包含当生成项目/产品输出含 unsupported commands、package names、feature claims、release states 或 evaluation conclusions 时会失败的 fixtures。

#### Scenario: Hallucinated CLI command is rejected / 幻觉 CLI 命令被拒绝
- **WHEN** a generated webpage or report claims `npx deepseek-cli init` without direct evidence
- **THEN** tests assert the checker or evaluation runner reports unsupported-command and does not mark the task solved
- **中文** 当生成网页或报告在没有直接证据时声明 `npx deepseek-cli init`，测试必须断言 checker 或 evaluation runner 报告 unsupported-command，且不将任务标为 solved。

#### Scenario: Evidence manifest is required for product webpage / 产品网页需要证据清单
- **WHEN** a generated product webpage passes structural HTML/CSS/JS checks but lacks an evidence manifest
- **THEN** tests assert the webpage checker fails with a missing-evidence-manifest diagnostic
- **中文** 当生成产品网页通过结构性 HTML/CSS/JS 检查但缺少 evidence manifest 时，测试必须断言 webpage checker 以 missing-evidence-manifest diagnostic 失败。

### Requirement: Evidence Schema Versioning / 证据 Schema 版本化

Evidence-first DTOs, events, manifests, and evaluation metrics SHALL be covered by schema versioning tests.

evidence-first DTOs、events、manifests 与 evaluation metrics 必须被 schema versioning tests 覆盖。

#### Scenario: Evidence artifacts declare schema versions / 证据产物声明 Schema 版本
- **WHEN** tests serialize evidence plans, evidence items, claim groundings, manifests, or unsupported-claim diagnostics
- **THEN** every artifact includes a supported schema version, compatibility metadata, stable ids, and redaction metadata
- **中文** 当测试序列化 evidence plans、evidence items、claim groundings、manifests 或 unsupported-claim diagnostics 时，每个 artifact 必须包含 supported schema version、compatibility metadata、stable ids 与 redaction metadata。
