## ADDED Requirements

### Requirement: Agent Mode Taxonomy / Agent 模式分类

The system SHALL define agent modes as explicit runtime orchestration roles separate from CLI interaction modes.

系统必须将 agent modes 定义为显式 runtime orchestration roles，并与 CLI interaction modes 分离。

#### Scenario: Runtime records active agent mode / Runtime 记录 Active Agent Mode
- **WHEN** a turn starts
- **THEN** the runtime records whether it is running default, evidence, planner, implementer, verifier, coordinator, worker, repair, or synthesis mode
- **中文** 当 turn 启动时，runtime 必须记录其正在以 default、evidence、planner、implementer、verifier、coordinator、worker、repair 或 synthesis mode 运行。

#### Scenario: Interaction mode and agent mode are independent / Interaction Mode 与 Agent Mode 独立
- **WHEN** a headless command, chat prompt, or future host request runs a non-trivial task
- **THEN** it can use planner/implementer/verifier orchestration without changing the user-facing interaction mode
- **中文** 当 headless command、chat prompt 或未来 host request 运行非琐碎任务时，可以使用 planner/implementer/verifier orchestration，而不改变用户可见 interaction mode。

### Requirement: Multi-Round Operating Loop / 多轮运行闭环

The runtime SHALL support a task lifecycle that can classify intent, collect evidence, plan, implement, verify, repair, synthesize, and complete with typed events.

runtime 必须支持 task lifecycle，可通过 typed events 完成 classify intent、collect evidence、plan、implement、verify、repair、synthesize 与 complete。

#### Scenario: Fact-sensitive task enters evidence phase / 事实敏感任务进入证据阶段
- **WHEN** a task references current project facts, product claims, commands, package metadata, code structure, generated artifacts, or competitive evaluation
- **THEN** the runtime enters or records an evidence phase before model-visible factual output or mutation
- **中文** 当任务引用当前项目事实、产品声明、commands、package metadata、code structure、generated artifacts 或 competitive evaluation 时，runtime 必须在 model-visible factual output 或 mutation 前进入或记录 evidence phase。

#### Scenario: Non-trivial mutation requires verification / 非琐碎修改需要验证
- **WHEN** a task edits multiple files, changes package/runtime behavior, touches permissions, emits generated artifacts, or crosses architecture boundaries
- **THEN** the runtime requires an independent verification phase or records a typed reason why verification is skipped
- **中文** 当任务编辑多个文件、改变 package/runtime behavior、触及 permissions、输出 generated artifacts 或跨越架构边界时，runtime 必须要求 independent verification phase，或记录类型化原因说明为何跳过验证。

#### Scenario: Loop budget is explicit / 循环预算显式化
- **WHEN** the runtime executes evidence, verification, repair, or delegation loops
- **THEN** it records loop budgets, consumed rounds, stop reasons, and policy decisions independently from model reasoning effort
- **中文** 当 runtime 执行 evidence、verification、repair 或 delegation loops 时，必须记录 loop budgets、consumed rounds、stop reasons 与 policy decisions，并与模型 reasoning effort 分离。

### Requirement: Coordinator Mode / 协调器模式

Coordinator mode SHALL orchestrate research, implementation, verification, repair, and synthesis through scoped agents without hiding results from the user or runtime trace.

Coordinator mode 必须通过有边界 agents 编排 research、implementation、verification、repair 与 synthesis，且不得向用户或 runtime trace 隐藏结果。

#### Scenario: Coordinator delegates non-trivial parallel work / Coordinator 委派非琐碎并行工作
- **WHEN** independent research or verification subtasks can run without overlapping write scope
- **THEN** coordinator mode can delegate them in parallel and emit structured delegation events with task purpose, scope, and expected output
- **中文** 当独立 research 或 verification subtasks 可以在不重叠 write scope 的情况下运行时，coordinator mode 可以并行委派，并发出包含 task purpose、scope 与 expected output 的 structured delegation events。

#### Scenario: Coordinator does not fabricate worker results / Coordinator 不编造 Worker 结果
- **WHEN** a worker is running or has not returned a typed result
- **THEN** the coordinator may report that work is in progress but MUST NOT predict or fabricate worker findings, pass/fail status, or changed files
- **中文** 当 worker 正在运行或尚未返回 typed result 时，coordinator 可以报告工作进行中，但不得预测或编造 worker findings、pass/fail status 或 changed files。

#### Scenario: Coordinator synthesizes before follow-up / Coordinator 在后续前先综合
- **WHEN** worker research returns and follow-up implementation is needed
- **THEN** the coordinator synthesizes the findings into a concrete work order with specific evidence, files, targets, and done criteria before continuing or spawning a worker
- **中文** 当 worker research 返回且需要后续 implementation 时，coordinator 必须先把 findings 综合成包含具体 evidence、files、targets 与 done criteria 的 work order，再 continue 或 spawn worker。

### Requirement: Worker Work Orders / Worker 工作单

Every worker or subagent invocation SHALL use a self-contained structured work order.

每个 worker 或 subagent invocation 必须使用自包含结构化 work order。

#### Scenario: Worker prompt contains required context / Worker Prompt 包含必要上下文
- **WHEN** a worker is spawned or continued
- **THEN** its request includes original user goal, task purpose, evidence ids, relevant file paths or typed targets, allowed tools, permission scope, done criteria, verification expectations, parent session id, and redaction metadata
- **中文** 当 worker 被 spawn 或 continued 时，请求必须包含 original user goal、task purpose、evidence ids、relevant file paths 或 typed targets、allowed tools、permission scope、done criteria、verification expectations、parent session id 与 redaction metadata。

#### Scenario: Lazy delegation is rejected / 惰性委派被拒绝
- **WHEN** a worker request only says to continue from prior findings, fix what was discussed, or inspect unspecified recent changes
- **THEN** orchestration rejects the request with a typed diagnostic requiring a synthesized work order
- **中文** 当 worker request 只说基于之前发现继续、修复刚才讨论的问题或检查未指定的最近变更时，orchestration 必须以 typed diagnostic 拒绝，并要求 synthesized work order。

### Requirement: Continue Or Spawn Decision / 继续或新建决策

The orchestrator SHALL record whether it continues an existing worker or spawns a new worker, including context-overlap evidence and reason codes.

orchestrator 必须记录是继续 existing worker 还是 spawn new worker，并包含 context-overlap evidence 与 reason codes。

#### Scenario: High-overlap correction continues worker / 高重叠纠错继续 Worker
- **WHEN** a worker has just produced a failure or implementation in the same files and needs a targeted correction
- **THEN** the orchestrator may continue that worker and records the overlap reason
- **中文** 当 worker 刚在相同 files 中产生 failure 或 implementation，且需要目标纠正时，orchestrator 可以继续该 worker，并记录 overlap reason。

#### Scenario: Independent verification spawns fresh worker / 独立验证新建 Worker
- **WHEN** verification is needed for work performed by another agent
- **THEN** the orchestrator spawns or selects a verifier without implementation-context anchoring and records the independence reason
- **中文** 当需要验证另一个 agent 完成的工作时，orchestrator 必须 spawn 或选择一个不携带 implementation-context anchoring 的 verifier，并记录 independence reason。

### Requirement: Stop And Resume Workers / 停止与恢复 Worker

Worker lifecycle SHALL support stop, cancel, interrupted, completed, failed, and resumed states as typed events.

Worker lifecycle 必须支持 stop、cancel、interrupted、completed、failed 与 resumed states，并以 typed events 表示。

#### Scenario: User change stops wrong-direction worker / 用户变更停止错误方向 Worker
- **WHEN** the user changes requirements after a worker is launched
- **THEN** the coordinator can stop the worker, record the reason, and optionally continue it with corrected instructions
- **中文** 当 worker 启动后用户改变需求时，coordinator 可以停止 worker、记录原因，并可选地用修正后的指令继续它。

#### Scenario: Stopped worker can be continued safely / 停止的 Worker 可安全继续
- **WHEN** a stopped worker is continued
- **THEN** the continuation includes a new structured work order and the prior stopped state remains visible in lineage
- **中文** 当 stopped worker 被 continued 时，continuation 必须包含新的 structured work order，且之前的 stopped state 必须在线路中可见。

### Requirement: Independent Verifier Mode / 独立验证器模式

Verifier mode SHALL prove task completion using evidence and checks rather than confirming implementation claims.

Verifier mode 必须使用 evidence 与 checks 证明任务完成，而不是确认 implementation claims。

#### Scenario: Verifier cites proof / Verifier 引用证明
- **WHEN** verifier mode returns pass, fail, or partial
- **THEN** it includes command/evidence ids, checked files or artifacts, observed output summaries, unverified areas, and redaction metadata
- **中文** 当 verifier mode 返回 pass、fail 或 partial 时，必须包含 command/evidence ids、checked files 或 artifacts、observed output summaries、unverified areas 与 redaction metadata。

#### Scenario: Self-check is not independent verification / 自检不是独立验证
- **WHEN** an implementer reports that its own checks passed
- **THEN** non-trivial task completion still requires verifier evidence unless policy explicitly records a skip reason
- **中文** 当 implementer 报告自己的 checks 通过时，非琐碎任务 completion 仍然需要 verifier evidence，除非 policy 显式记录 skip reason。

### Requirement: Mode-Aware Tool And Context Scopes / 感知模式的工具与上下文范围

Agent mode SHALL constrain tools, context, commands, skills, hooks, MCP, model profiles, memory, and host capabilities before execution.

Agent mode 必须在执行前约束 tools、context、commands、skills、hooks、MCP、model profiles、memory 与 host capabilities。

#### Scenario: Planner and research are read-only / Planner 与 Research 只读
- **WHEN** a planner or evidence/research agent mode is active
- **THEN** model-visible tools and runtime execution are restricted to read-only or explicitly safe capabilities by default
- **中文** 当 planner 或 evidence/research agent mode 激活时，model-visible tools 与 runtime execution 默认必须限制为 read-only 或显式安全 capabilities。

#### Scenario: Implementer write scope is bounded / Implementer 写范围有边界
- **WHEN** implementer mode receives write-capable tools
- **THEN** the request declares allowed write scope, checkpoint requirement, stale-workspace policy, and verification expectation
- **中文** 当 implementer mode 获得 write-capable tools 时，请求必须声明 allowed write scope、checkpoint requirement、stale-workspace policy 与 verification expectation。

### Requirement: Scratchpad And Checkpoint Governance / Scratchpad 与 Checkpoint 治理

Worker scratchpad and checkpoints SHALL be governed, scoped, and replayable.

Worker scratchpad 与 checkpoints 必须受治理、有 scope 且可回放。

#### Scenario: Scratchpad cannot bypass audit / Scratchpad 不能绕过审计
- **WHEN** a worker reads or writes scratchpad content
- **THEN** the operation is recorded with scope, purpose, fingerprint, redaction, and session lineage metadata
- **中文** 当 worker 读取或写入 scratchpad content 时，operation 必须记录 scope、purpose、fingerprint、redaction 与 session lineage metadata。

#### Scenario: Write-capable worker requires checkpoint policy / 可写 Worker 需要 Checkpoint 策略
- **WHEN** a worker can mutate workspace files
- **THEN** orchestration requires checkpoint or explicit policy evidence before mutation and records stop evidence if checkpoint policy fails
- **中文** 当 worker 可以修改 workspace files 时，orchestration 必须在 mutation 前要求 checkpoint 或显式 policy evidence，并在 checkpoint policy 失败时记录 stop evidence。

### Requirement: Agent Reasoning Effort And Loop Budgets / Agent 推理强度与循环预算

Agent orchestration SHALL report model reasoning effort separately from external evidence, verification, repair, and delegation loop budgets.

Agent orchestration 必须将模型 reasoning effort 与外部 evidence、verification、repair 和 delegation loop budgets 分开报告。

#### Scenario: High reasoning does not imply more evidence / 高推理不代表更多证据
- **WHEN** an agent turn uses high or extra-high model reasoning effort
- **THEN** the turn still records actual evidence items, verification commands, repair attempts, and delegation events independently
- **中文** 当 agent turn 使用 high 或 extra-high model reasoning effort 时，该 turn 仍必须独立记录实际 evidence items、verification commands、repair attempts 与 delegation events。

#### Scenario: Loop budget can increase without changing model effort / 循环预算可独立增加
- **WHEN** runtime policy raises evidence or verification rounds for high-risk tasks
- **THEN** the change is recorded as orchestration budget policy and does not require changing provider reasoning effort
- **中文** 当 runtime policy 为高风险任务提高 evidence 或 verification rounds 时，该变化必须记录为 orchestration budget policy，且不要求改变 provider reasoning effort。

#### Scenario: Provider effort capabilities are normalized / Provider 推理强度能力被归一化
- **WHEN** a model provider supports provider-specific effort values such as DeepSeek `high` and `max`
- **THEN** the model gateway maps user-facing effort levels through provider capability metadata and records the provider value actually sent
- **中文** 当 model provider 支持 DeepSeek `high` 与 `max` 等 provider-specific effort values 时，model gateway 必须通过 provider capability metadata 映射用户可见 effort levels，并记录实际发送给 provider 的值。

#### Scenario: Unsupported effort is explicit / 不支持的推理强度显式化
- **WHEN** a user or policy requests a reasoning effort not supported by the active model/provider
- **THEN** the runtime either maps it through declared compatibility rules or emits a typed diagnostic without pretending the requested effort was honored
- **中文** 当 user 或 policy 请求 active model/provider 不支持的 reasoning effort 时，runtime 必须通过声明的 compatibility rules 映射，或发出 typed diagnostic，不得假装请求的 effort 已被执行。
