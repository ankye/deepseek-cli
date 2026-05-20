# agent-self-repair-loop Specification

## Purpose
Define self-repair loop requirements for detecting failed work, producing repair plans, applying bounded fixes, and recording evidence.

定义 self-repair loop 对失败检测、repair plan、受限修复与证据记录的要求。

## Requirements
### Requirement: Deterministic Failure Classification / 确定性失败分类

The system SHALL classify repair-loop candidate failures with deterministic, replayable metadata before any model-assisted diagnosis or repair attempt is requested.

系统必须在请求任何模型辅助诊断或修复尝试之前，使用确定性、可回放 metadata 对 repair-loop candidate failures 进行分类。

#### Scenario: Failure is classified before repair planning / 修复规划前完成失败分类
- **WHEN** a model request, tool execution, check command, artifact validation, or agent strategy failure becomes repair-loop eligible
- **THEN** the repair loop records failure source, failure code, repairability, safety class, affected scope, evidence fingerprints, and redaction metadata before creating a repair plan
- **中文** 当 model request、tool execution、check command、artifact validation 或 agent strategy failure 变成 repair-loop eligible 时，repair loop 必须在创建 repair plan 前记录 failure source、failure code、repairability、safety class、affected scope、evidence fingerprints 与 redaction metadata。

#### Scenario: Model diagnosis is not the source of truth / 模型诊断不是唯一事实来源
- **WHEN** the model proposes a root cause that conflicts with deterministic failure evidence
- **THEN** the repair loop preserves the deterministic classification, records the model diagnosis as a hypothesis, and blocks any action that is not justified by policy and evidence
- **中文** 当模型提出的根因与确定性 failure evidence 冲突时，repair loop 必须保留确定性分类，将模型诊断记录为 hypothesis，并阻止任何没有被 policy 与 evidence 证明合理的动作。

### Requirement: Bounded Repair State Machine / 有界修复状态机

The system SHALL execute self-repair through a bounded runtime-owned state machine that separates observation, classification, planning, checkpoint preparation, repair attempt, verification, and stop decision.

系统必须通过 runtime-owned 的有界状态机执行自修复，并区分 observation、classification、planning、checkpoint preparation、repair attempt、verification 与 stop decision。

#### Scenario: Repair attempt follows required states / 修复尝试遵循必要状态
- **WHEN** a repairable failure is encountered and repair policy allows an attempt
- **THEN** the repair loop emits ordered evidence for repair start, classification, plan creation, checkpoint decision, attempt start, attempt completion, verification, and final stop decision
- **中文** 当遇到可修复失败且 repair policy 允许尝试时，repair loop 必须按顺序发出 repair start、classification、plan creation、checkpoint decision、attempt start、attempt completion、verification 与 final stop decision 的证据。

#### Scenario: Retry budget stops ineffective repair / 重试预算阻止无效修复
- **WHEN** repair attempts exceed configured attempt, model iteration, tool call, time, cost, or repeated-no-op budgets
- **THEN** the repair loop stops with a typed stop reason and emits a terminal failure or escalation result without starting another repair attempt
- **中文** 当 repair attempts 超过配置的 attempt、model iteration、tool call、time、cost 或 repeated-no-op budgets 时，repair loop 必须以 typed stop reason 停止，并发出 terminal failure 或 escalation result，不得再启动新的 repair attempt。

### Requirement: Repair Policy Gates Mutations / 修复策略管控变更

The system SHALL gate every write-capable repair action through existing policy, sandbox, tool projection, approval, checkpoint, and revert governance.

系统必须通过现有 policy、sandbox、tool projection、approval、checkpoint 与 revert governance 管控每个 write-capable repair action。

#### Scenario: Write repair requires governed checkpoint / 写入修复需要受治理 Checkpoint
- **WHEN** a repair plan includes a write-capable action against the workspace
- **THEN** the repair loop creates or references an eligible checkpoint before execution, records the checkpoint decision, and refuses the action if checkpoint policy fails
- **中文** 当 repair plan 包含针对 workspace 的 write-capable action 时，repair loop 必须在执行前创建或引用 eligible checkpoint，记录 checkpoint decision，并在 checkpoint policy 失败时拒绝该动作。

#### Scenario: Policy denial is not repaired by bypass / 策略拒绝不得通过绕过修复
- **WHEN** a repair attempt is denied by policy, sandbox, approval, or tool projection
- **THEN** the repair loop records the denial as a stop or escalation reason and MUST NOT retry through a lower-level filesystem, process, app-to-app import, or ungoverned tool path
- **中文** 当 repair attempt 被 policy、sandbox、approval 或 tool projection 拒绝时，repair loop 必须将 denial 记录为 stop 或 escalation reason，且不得通过 lower-level filesystem、process、app-to-app import 或未治理 tool path 重试。

### Requirement: Repair Plans Are Evidence-Bound / 修复计划受证据约束

The system SHALL require every repair plan to cite bounded failure evidence, proposed action type, target scope, expected verification, and stop criteria.

系统必须要求每个 repair plan 引用有界 failure evidence、proposed action type、target scope、expected verification 与 stop criteria。

#### Scenario: Plan cites evidence and verification / 计划引用证据与验证
- **WHEN** the repair planner creates a plan
- **THEN** the plan includes evidence ids or fingerprints, suspected root cause or deterministic rule id, targeted files or tools when known, expected command or artifact checks, and conditions for success, retry, revert, escalation, or failure
- **中文** 当 repair planner 创建计划时，计划必须包含 evidence ids 或 fingerprints、疑似根因或 deterministic rule id、已知 targeted files 或 tools、预期 command 或 artifact checks，以及 success、retry、revert、escalation 或 failure 条件。

#### Scenario: Broad repair is rejected without evidence / 缺少证据时拒绝宽泛修复
- **WHEN** a proposed repair asks to rewrite unrelated modules, change architecture boundaries, remove tests, weaken checks, or edit secrets without evidence
- **THEN** the repair policy rejects the plan and records a broad-repair denial with redacted rationale
- **中文** 当 proposed repair 要求重写无关模块、改变架构边界、移除测试、削弱检查或无证据编辑 secrets 时，repair policy 必须拒绝计划，并记录 broad-repair denial 与脱敏理由。

### Requirement: Verification Ladder / 验证阶梯

The system SHALL verify repair attempts through a ladder that runs the smallest relevant checks first and broadens verification based on blast radius, task catalog, and repository policy.

系统必须通过验证阶梯验证 repair attempts：先运行最小相关检查，再根据影响范围、task catalog 与 repository policy 扩大验证。

#### Scenario: Minimal check runs before broad checks / 最小检查先于广域检查
- **WHEN** a repair attempt changes a file or generated artifact
- **THEN** the verification planner selects targeted syntax, artifact, unit, or contract checks before package-wide lint/typecheck/integration checks unless the task explicitly requires a broader command first
- **中文** 当 repair attempt 修改文件或生成产物时，verification planner 必须优先选择 targeted syntax、artifact、unit 或 contract checks，再运行 package-wide lint/typecheck/integration checks，除非任务明确要求先运行更广命令。

#### Scenario: Verification result drives next decision / 验证结果驱动下一步决策
- **WHEN** a verification command or artifact checker completes
- **THEN** the repair loop records command identity, bounded output summary, exit status, fingerprints, and maps the result to complete, retry, revert, escalate, or fail
- **中文** 当 verification command 或 artifact checker 完成时，repair loop 必须记录 command identity、有界 output summary、exit status、fingerprints，并将结果映射为 complete、retry、revert、escalate 或 fail。

### Requirement: Repair Prompt Assembly Boundary / 修复 Prompt 组装边界

The system SHALL project repair guidance as runtime-owned prompt assembly sections while preserving the original user prompt as the exact user message.

系统必须将 repair guidance 作为 runtime-owned prompt assembly sections 投影，同时保持原始用户 prompt 作为精确 user message。

#### Scenario: Repair guidance does not mutate user prompt / 修复指导不修改用户 Prompt
- **WHEN** a repair turn is sent to the model
- **THEN** the user message remains the exact submitted task prompt, and repair evidence, prior attempts, verification ladder, and allowed action policy are supplied as separate runtime-owned context sections
- **中文** 当 repair turn 发送给模型时，user message 必须保持用户提交的确切 task prompt，repair evidence、prior attempts、verification ladder 与 allowed action policy 必须作为独立 runtime-owned context sections 提供。

#### Scenario: Repair section exclusion is explainable / 修复 Section 排除可解释
- **WHEN** repair evidence or prior attempt context cannot fit within budget or is excluded by policy
- **THEN** the assembly evidence records section id, exclusion reason, token estimate, redaction class, and the resulting repair-plan impact
- **中文** 当 repair evidence 或 prior attempt context 因预算或 policy 被排除时，assembly evidence 必须记录 section id、exclusion reason、token estimate、redaction class 与 resulting repair-plan impact。

### Requirement: Repair Stop And Escalation Semantics / 修复停止与升级语义

The system SHALL stop repair attempts with typed reasons and actionable evidence when failures are non-repairable, unsafe, stale, over budget, repetitive, or require user approval.

系统必须在 failures 不可修复、不安全、过期、超预算、重复无效或需要用户审批时，以 typed reasons 与可行动证据停止 repair attempts。

#### Scenario: Non-repairable failure escalates with evidence / 不可修复失败带证据升级
- **WHEN** the classifier marks a failure as non-repairable by the agent because credentials, permissions, user approval, external service availability, or ambiguous product requirements are missing
- **THEN** the repair loop stops without mutating the workspace and emits an escalation record with required user action and redacted evidence
- **中文** 当 classifier 将 failure 标记为 agent 不可修复，因为缺少 credentials、permissions、user approval、external service availability 或产品需求不明确时，repair loop 必须在不变更 workspace 的情况下停止，并发出包含 required user action 与脱敏证据的 escalation record。

#### Scenario: Stale repair reverts or stops safely / 过期修复安全 Revert 或停止
- **WHEN** workspace state changes after the checkpoint or verification baseline used by a repair attempt
- **THEN** the repair loop refuses stale apply, records the stale watermark or conflict evidence, and either reverts eligible changes or stops without overwriting newer workspace state
- **中文** 当 workspace state 在 repair attempt 使用的 checkpoint 或 verification baseline 之后发生变化时，repair loop 必须拒绝 stale apply，记录 stale watermark 或 conflict evidence，并 revert eligible changes 或在不覆盖更新 workspace state 的情况下停止。

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

