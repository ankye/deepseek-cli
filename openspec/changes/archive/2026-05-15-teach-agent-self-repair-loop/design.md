## Context

DeepSeek CLI currently has a runtime-owned agent loop, governed tool execution, tool-intent preflight repair, checkpoint/revert mechanics, PageIndex recall, prompt assembly work, and CLI task evaluation. These pieces prove the CLI can call a model, use tools, modify files, validate artifacts, and compare runs. What is missing is the default engineering behavior that makes an agent feel reliable: when something fails, it must inspect evidence, classify the failure, choose a bounded repair strategy, rerun the right check, and stop with useful evidence if the repair path is no longer justified.

DeepSeek CLI 当前已经有 runtime-owned agent loop、受治理工具执行、tool-intent preflight repair、checkpoint/revert、PageIndex 回溯、prompt assembly 工作和 CLI task evaluation。这些模块证明 CLI 可以调用模型、使用工具、修改文件、验证产物并对比运行结果。缺口在于默认工程行为：当失败出现时，agent 必须检查证据、分类失败、选择有界修复策略、复跑正确检查，并在修复路径不再合理时带着有用证据停止。

This capability must be implemented as a runtime product mechanism, not a single system prompt paragraph. The model can help diagnose and propose repairs, but runtime policy must own the state machine, retry budget, safety gates, verification plan, and redacted evidence.

该能力必须作为 runtime 产品机制实现，而不是一段 system prompt。模型可以辅助诊断和提出修复，但 runtime policy 必须拥有状态机、重试预算、安全门禁、验证计划和脱敏证据。

## Goals / Non-Goals

**Goals:**

- Define a stable self-repair decision system for CLI-first coding tasks.
- Make failures actionable by classifying source, scope, repairability, safety, and verification needs.
- Add a bounded repair state machine that can run before terminal failure when policy allows it.
- Preserve the exact user prompt and use prompt assembly sections for diagnostic/repair guidance.
- Record replayable evidence for every diagnosis, repair plan, attempted action, verification command, and stop reason.
- Feed repair-loop metrics into DeepSeek/Codex/Claude comparison reports.
- Keep all repair actions under existing tool governance, checkpoint/revert safety, redaction, and architecture boundaries.

- 为 CLI-first coding tasks 定义稳定的自修复决策系统。
- 通过分类 source、scope、repairability、safety 和 verification needs，让失败可行动。
- 增加有界 repair state machine，在 policy 允许时可于终态失败前运行。
- 保留用户原始 prompt，通过 prompt assembly sections 注入诊断/修复指导。
- 为每次诊断、修复计划、尝试动作、验证命令和停止原因记录可回放证据。
- 将 repair-loop 指标纳入 DeepSeek/Codex/Claude 对比报告。
- 所有修复动作必须受现有 tool governance、checkpoint/revert safety、redaction 和架构边界约束。

**Non-Goals:**

- Do not build an unconstrained autonomous infinite retry loop.
- Do not allow the model to bypass policy, sandbox, approval, checkpoint, revert, or host boundaries.
- Do not make external telemetry or raw transcript export required.
- Do not require live provider calls in default tests.
- Do not replace existing tool-intent preflight repair; this change builds a broader task-level repair loop above it.
- Do not claim public benchmark parity; evaluation must use DeepSeek-owned replayable evidence for product claims.

- 不构建无约束的自主无限重试循环。
- 不允许模型绕过 policy、sandbox、approval、checkpoint、revert 或 host boundaries。
- 不要求外部遥测或原始 transcript 导出。
- 默认测试不要求 live provider calls。
- 不替代已有 tool-intent preflight repair；本变更是在其上方构建更广义的任务级 repair loop。
- 不用公开榜单直接宣称产品能力；产品声明必须基于 DeepSeek 自有可回放证据。

## Decisions

### 1. Model the capability as a runtime-owned repair state machine

The repair loop will be represented as a small state machine owned by runtime:

1. `observe_failure`: collect terminal/tool/model/check evidence.
2. `classify_failure`: deterministic classifier assigns source, repairability, scope, severity, and safety class.
3. `plan_repair`: decide whether to ask the model for a repair hypothesis, apply deterministic repair, rerun a check, revert, or escalate.
4. `prepare_checkpoint`: create or reference a mutation checkpoint before write-capable repair actions.
5. `attempt_repair`: execute governed tools or submit a repair prompt turn.
6. `verify_repair`: run minimal checks first, then optional broader checks.
7. `decide_next`: complete, retry with updated evidence, revert, escalate, or fail closed.

Repair loop 将表示为 runtime 拥有的小状态机：

1. `observe_failure`：收集 terminal/tool/model/check evidence。
2. `classify_failure`：确定性 classifier 标记 source、repairability、scope、severity 与 safety class。
3. `plan_repair`：决定是否请求模型生成 repair hypothesis、应用确定性修复、复跑检查、revert 或升级。
4. `prepare_checkpoint`：在 write-capable repair actions 前创建或引用 mutation checkpoint。
5. `attempt_repair`：执行受治理工具，或提交 repair prompt turn。
6. `verify_repair`：先跑最小检查，再按需跑更广验证。
7. `decide_next`：完成、带更新证据重试、revert、升级或 fail closed。

**Rationale:** The runtime already owns the agent loop, tool execution, event stream, and terminal semantics. Keeping the repair state machine in runtime avoids hiding control flow inside prompts.

**Alternatives considered:** A prompt-only approach is easier but non-deterministic and hard to evaluate. A separate workflow engine is powerful but premature; the first version can be a runtime subsystem with contracts that can later move behind workflow orchestration.

**理由：** runtime 已经拥有 agent loop、tool execution、event stream 和 terminal semantics。把 repair state machine 放在 runtime，可以避免控制流隐藏在 prompt 中。

**备选方案：** 纯 prompt 方案更简单，但不可预测且难评估。独立 workflow engine 更强，但 v1 过早；第一版可以是 runtime subsystem，后续再迁移到 workflow orchestration 背后。

### 2. Use deterministic classification before model-assisted diagnosis

The first classifier pass must be deterministic. It will map evidence to categories such as:

- `provider-error`: credential, transport, rate limit, model incompatibility, reasoning/tool continuation.
- `tool-error`: preflight rejected, policy denied, schema invalid, missing tool, tool execution failed.
- `workspace-error`: file missing, invalid path, stale checkpoint, dirty conflicting state.
- `build-test-error`: typecheck, lint, test, smoke, artifact checker, syntax validation.
- `task-output-error`: missing required artifact, incomplete HTML, remote dependency violation, invalid product requirement.
- `agent-strategy-error`: repeated no-op, broad edit drift, wrong file target, insufficient context, hallucinated API.

第一轮 classifier 必须是确定性的。它会将 evidence 映射为如下分类：

- `provider-error`：credential、transport、rate limit、model incompatibility、reasoning/tool continuation。
- `tool-error`：preflight rejected、policy denied、schema invalid、missing tool、tool execution failed。
- `workspace-error`：file missing、invalid path、stale checkpoint、dirty conflicting state。
- `build-test-error`：typecheck、lint、test、smoke、artifact checker、syntax validation。
- `task-output-error`：缺少必要产物、不完整 HTML、remote dependency violation、产品要求无效。
- `agent-strategy-error`：重复 no-op、过宽编辑漂移、目标文件错误、上下文不足、幻觉 API。

Model-assisted diagnosis is allowed only after classification, with bounded evidence and explicit output shape. The model may propose suspected root cause, candidate files, and a minimal repair plan, but runtime validates every tool call and decides whether to execute.

模型辅助诊断只能在分类之后发生，并且使用有界证据和明确输出形状。模型可以提出疑似根因、候选文件和最小修复计划，但 runtime 校验每个工具调用并决定是否执行。

**Rationale:** Deterministic classification makes repair behavior measurable and prevents provider prose from becoming the only source of truth.

**Alternatives considered:** Letting the model diagnose first may work on easy cases but makes retry policy, safety, and metrics unstable.

### 3. Separate repair policy from repair content

Repair policy answers whether a repair attempt is allowed:

- Is the failure repairable?
- Is the requested action within tool projection and policy?
- Is a checkpoint required and available?
- Has the turn exceeded repair attempts, model iterations, tool calls, time, or cost budget?
- Is the prior attempt materially different, or is the agent repeating itself?
- Does the repair require user approval or escalation?

Repair content answers what to change or rerun. It can come from deterministic rules, model-assisted repair prompts, or future extensions.

Repair policy 回答是否允许修复尝试：

- failure 是否可修复？
- 请求动作是否在 tool projection 与 policy 范围内？
- 是否需要且已有 checkpoint？
- turn 是否超过 repair attempts、model iterations、tool calls、time 或 cost budget？
- 上一次尝试是否有实质差异，还是 agent 在重复？
- 修复是否需要用户审批或升级？

Repair content 回答要改什么或复跑什么。它可以来自确定性规则、模型辅助 repair prompts 或未来扩展。

**Rationale:** This separation keeps the “decision system” deterministic while still allowing model creativity inside bounded repair content.

**Alternatives considered:** A single `repair()` function would be faster to implement but would mix policy, planning, prompt content, and execution.

### 4. Verification uses a ladder, not one giant command

The verification planner must choose the smallest relevant check first, then broaden only after local checks pass:

1. Syntax or artifact existence checks.
2. Targeted unit/contract test.
3. Package-level typecheck/lint.
4. Integration/golden/e2e checks when the blast radius justifies it.
5. Optional live checks only behind explicit flags.

验证计划器必须先选择最小相关检查，本地通过后再扩大范围：

1. 语法或产物存在检查。
2. 目标 unit/contract test。
3. package-level typecheck/lint。
4. 当影响范围足够大时运行 integration/golden/e2e checks。
5. optional live checks 必须显式开关。

**Rationale:** This mirrors effective engineering behavior and makes repair faster. It also improves evaluation: a run that only edits files without verification is not equivalent to a run that repairs and proves the fix.

**Alternatives considered:** Always run all checks is safer but slow and noisy. Only rerun the failed command misses regressions.

### 5. Repair evidence is first-class and redacted

Every repair cycle emits canonical events and optional observability records:

- `agent.repair.started`
- `agent.repair.classified`
- `agent.repair.plan.created`
- `agent.repair.attempt.started`
- `agent.repair.attempt.completed`
- `agent.repair.verification.started`
- `agent.repair.verification.completed`
- `agent.repair.stopped`

每个 repair cycle 发出 canonical events，并可记录 observability records：

- `agent.repair.started`
- `agent.repair.classified`
- `agent.repair.plan.created`
- `agent.repair.attempt.started`
- `agent.repair.attempt.completed`
- `agent.repair.verification.started`
- `agent.repair.verification.completed`
- `agent.repair.stopped`

Evidence includes stable ids, schema version, failure classification, redacted previews, touched file summaries, tool ids, check commands, exit statuses, fingerprints, and stop reasons. It must not persist raw secrets, unbounded stdout/stderr, private file contents beyond policy, or provider raw reasoning.

证据包含 stable ids、schema version、failure classification、redacted previews、touched file summaries、tool ids、check commands、exit statuses、fingerprints 与 stop reasons。不得持久化 raw secrets、无界 stdout/stderr、超出 policy 的私有文件内容或 provider raw reasoning。

**Rationale:** Evaluation and future learning need machine-readable evidence. Redaction keeps the feature compatible with local-first privacy.

### 6. Prompt assembly receives dedicated repair sections

Repair prompts must be assembled through the prompt assembly package once that active change is applied. The sections should be explicit:

- operating rules for self-repair behavior
- failure evidence summary
- prior attempts and stop reasons
- verification ladder
- allowed tool/action policy
- exact user task boundary

在 prompt assembly package 变更应用后，repair prompts 必须通过 prompt assembly 组装。sections 应显式表达：

- 自修复行为规则
- failure evidence summary
- prior attempts 与 stop reasons
- verification ladder
- allowed tool/action policy
- 精确用户任务边界

The original user prompt remains unchanged as a user message. Repair sections are runtime-owned context, not appended user text.

用户原始 prompt 必须保持为 user message。repair sections 是 runtime-owned context，不追加到用户文本。

**Rationale:** This prevents prompt patch drift and makes repair guidance replayable.

### 7. Evaluation compares repair quality, not only final output

CLI evaluation must record:

- run success rate
- first-pass success rate
- repair activation rate
- repair success rate
- correction rate after failed checks
- repeated ineffective attempt count
- verification command pass/fail
- final code/artifact structure score
- user-intervention count
- time/tool/model iteration budget usage

CLI evaluation 必须记录：

- 运行成功率
- 首轮成功率
- repair activation rate
- repair success rate
- failed checks 后的 correction rate
- 重复无效尝试次数
- verification command pass/fail
- 最终代码/产物结构评分
- 用户介入次数
- time/tool/model iteration budget usage

**Rationale:** A competitor comparison that only says “generated files exist” will miss the key gap: whether the agent can recover when reality pushes back.

## Risks / Trade-offs

- [Risk] Repair loops can hide real failures by continuing too long. -> Mitigation: strict attempt/time/tool/model budgets, stop reasons, and terminal evidence.
- [风险] repair loops 可能通过长时间继续掩盖真实失败。-> 缓解：严格 attempt/time/tool/model budgets、stop reasons 与 terminal evidence。

- [Risk] Model-assisted diagnosis may hallucinate root causes. -> Mitigation: deterministic classification first, bounded evidence, required verification, and no direct execution without tool governance.
- [风险] 模型辅助诊断可能幻觉根因。-> 缓解：先做确定性分类、限制证据、强制验证，并且所有执行都走 tool governance。

- [Risk] Repair prompts may mutate the user task boundary. -> Mitigation: keep user prompt exact and inject repair guidance only through runtime-owned prompt assembly sections.
- [风险] repair prompts 可能改变用户任务边界。-> 缓解：保持用户 prompt 精确不变，只通过 runtime-owned prompt assembly sections 注入 repair guidance。

- [Risk] Verification commands can be expensive. -> Mitigation: verification ladder starts targeted and broadens based on blast radius and explicit mode.
- [风险] verification commands 可能成本高。-> 缓解：verification ladder 从目标检查开始，并根据影响范围和显式模式扩大。

- [Risk] Evidence can leak sensitive content. -> Mitigation: reuse observability redaction, bounded previews, digests, and no raw provider reasoning persistence.
- [风险] evidence 可能泄漏敏感内容。-> 缓解：复用 observability redaction、有界 previews、digests，并禁止持久化 raw provider reasoning。

- [Risk] Decision logic grows into a monolith. -> Mitigation: split classifier, policy, planner, executor, verifier, and recorder modules with contract tests.
- [风险] 决策逻辑可能膨胀成单体。-> 缓解：拆分 classifier、policy、planner、executor、verifier 与 recorder modules，并用 contract tests 约束。

## Migration Plan

1. Add repair-loop DTOs and event kinds in `platform-contracts` with schema versioning.
2. Implement runtime repair classifier and policy as deterministic helpers without changing default behavior.
3. Add repair evidence events for classified but non-activated failures in tests.
4. Wire repair activation behind a request/config flag, then make it default for CLI task execution when bounded policy is available.
5. Add prompt assembly repair sections after the prompt assembly package change is ready.
6. Extend CLI evaluation metrics and deterministic scenarios.
7. Archive the OpenSpec change only after strict validation, regression coverage, and acceptance evidence are updated.

1. 在 `platform-contracts` 中新增 repair-loop DTOs 与 event kinds，并带 schema version。
2. 以不改变默认行为的方式实现 runtime repair classifier 与 policy 确定性 helpers。
3. 在测试中为已分类但未激活的 failures 增加 repair evidence events。
4. 先通过 request/config flag 接入 repair activation，再在 bounded policy 可用时设为 CLI task execution 默认行为。
5. prompt assembly package 变更就绪后，增加 repair sections。
6. 扩展 CLI evaluation metrics 和确定性场景。
7. 完成 strict validation、回归覆盖和 acceptance evidence 后归档 OpenSpec change。

## Open Questions

- Should the first implementation enable self-repair by default for `deepseek run`, or only for `deepseek diagnostics evaluate --live-deepseek` until enough evidence is collected?
- 第一版应该默认在 `deepseek run` 启用 self-repair，还是先只在 `deepseek diagnostics evaluate --live-deepseek` 中启用，直到收集足够证据？

- Should repair attempts be persisted in session store snapshots, observability records, or both?
- repair attempts 应该持久化到 session store snapshots、observability records，还是两者都写？

- Should verification planner use repository scripts only, task-catalog check commands only, or a ranked combination?
- verification planner 应该只用 repository scripts、只用 task-catalog check commands，还是使用排序后的组合？

- How much model-generated diagnosis should be shown to users in text mode versus retained as internal evidence?
- text mode 应该向用户展示多少模型生成的诊断，多少只保留为内部 evidence？
