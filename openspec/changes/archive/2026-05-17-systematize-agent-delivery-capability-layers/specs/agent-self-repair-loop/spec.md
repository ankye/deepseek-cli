## ADDED Requirements

### Requirement: Output Contract Failures Enter Self-Repair / 输出契约失败进入自修复

The self-repair loop SHALL treat failed output contract verification as repairable when policy, safety, and budgets allow.

self-repair loop 必须在 policy、safety 与 budgets 允许时，将 failed output contract verification 视为可修复失败。

#### Scenario: Schema failure repairs through normal loop / Schema 失败通过正常 Loop 修复

- **WHEN** final verification fails because a JSON artifact is missing, malformed, schema-invalid, or semantically inconsistent
- **THEN** self-repair receives bounded contract diagnostics and reruns the normal model/tool loop
- **AND** successful completion requires the relevant checker to pass after repair
- **中文** 当最终验证因 JSON artifact 缺失、格式错误、schema-invalid 或语义不一致而失败时，self-repair 必须接收有界 contract diagnostics 并重跑正常 model/tool loop；成功完成必须要求相关 checker 在修复后通过。

#### Scenario: Exhausted contract repair fails closed / 契约修复耗尽后安全失败

- **WHEN** required output contracts remain unsatisfied after repair budgets are exhausted or repair is unsafe
- **THEN** the turn fails with typed diagnostics instead of reporting partial generated text as complete
- **中文** 当 required output contracts 在 repair budgets 耗尽或修复不安全后仍未满足时，turn 必须带 typed diagnostics 失败，而不是把部分生成文本报告为完成。

### Requirement: Repair Evidence Preserves Layer Attribution / 修复证据保留层级归因

Repair classification and verification records SHALL preserve whether the failure came from project rules, tools, task loop, output contracts, verification, regression, or context/memory.

repair classification 与 verification records 必须保留 failure 来源是 project rules、tools、task loop、output contracts、verification、regression 还是 context/memory。

#### Scenario: Repair plan cites owning layer / 修复计划引用负责层

- **WHEN** the repair planner creates a repair plan for a delivery failure
- **THEN** the plan cites the owning layer, failure evidence ids, affected contract or capability id, expected verification, and stop criteria
- **中文** 当 repair planner 为交付失败创建 repair plan 时，计划必须引用 owning layer、failure evidence ids、affected contract 或 capability id、expected verification 与 stop criteria。
