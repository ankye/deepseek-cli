## ADDED Requirements

### Requirement: Mode-Aware Turn Lifecycle / 感知模式的 Turn 生命周期

The agent loop SHALL emit mode-aware lifecycle events for classification, evidence, planning, execution, verification, repair, synthesis, and terminal completion when those phases are used or skipped by policy.

agent loop 必须在 classification、evidence、planning、execution、verification、repair、synthesis 与 terminal completion 阶段被使用或被 policy 跳过时，发出 mode-aware lifecycle events。

#### Scenario: Turn records phase plan / Turn 记录阶段计划
- **WHEN** an agent loop starts a task
- **THEN** it emits or records a phase plan that identifies required phases, skipped phases, skip reasons, budgets, active interaction mode, and active agent mode
- **中文** 当 agent loop 启动任务时，必须 emit 或记录 phase plan，标识 required phases、skipped phases、skip reasons、budgets、active interaction mode 与 active agent mode。

#### Scenario: Terminal event summarizes phases / 终止事件总结阶段
- **WHEN** a turn completes, fails, cancels, times out, or is rejected
- **THEN** the terminal event includes a bounded phase summary with evidence, delegation, verification, repair, and synthesis outcomes
- **中文** 当 turn completed、failed、cancelled、timed out 或 rejected 时，terminal event 必须包含有界 phase summary，说明 evidence、delegation、verification、repair 与 synthesis outcomes。

### Requirement: Evidence And Verification Are Product Phases / 证据与验证是产品阶段

The agent loop SHALL treat evidence and verification loops as product orchestration phases independent from model reasoning effort.

agent loop 必须将 evidence 与 verification loops 作为独立于模型 reasoning effort 的产品编排阶段。

#### Scenario: Evidence count is measured externally / 外部计量 Evidence 次数
- **WHEN** a turn searches repository, project, code, generated artifact, or evaluation evidence
- **THEN** the agent loop records evidence source count, selected evidence count, unsupported claim count, and evidence loop rounds separately from model usage
- **中文** 当 turn 搜索 repository、project、code、generated artifact 或 evaluation evidence 时，agent loop 必须将 evidence source count、selected evidence count、unsupported claim count 与 evidence loop rounds 与 model usage 分开记录。

#### Scenario: Verification count is measured externally / 外部计量 Verification 次数
- **WHEN** a turn verifies output through tests, typecheck, artifact checks, lint, browser checks, or manual inspection records
- **THEN** the agent loop records verification commands, results, failures, corrections, and final verdict separately from provider reasoning tokens
- **中文** 当 turn 通过 tests、typecheck、artifact checks、lint、browser checks 或 manual inspection records 验证输出时，agent loop 必须将 verification commands、results、failures、corrections 与 final verdict 与 provider reasoning tokens 分开记录。

### Requirement: Coordinator Turn Routing / Coordinator Turn 路由

The agent loop SHALL route coordinator, worker, and verifier work through runtime-owned events and governed capability paths.

agent loop 必须通过 runtime-owned events 与 governed capability paths 路由 coordinator、worker 与 verifier 工作。

#### Scenario: Worker launch is runtime-owned / Worker 启动由 Runtime 拥有
- **WHEN** an agent requests worker launch
- **THEN** the request is validated through agent-management, policy, session lineage, scope projection, and runtime events before the child loop starts
- **中文** 当 agent 请求 worker launch 时，该请求必须在 child loop 启动前通过 agent-management、policy、session lineage、scope projection 与 runtime events 验证。

#### Scenario: Worker result returns through event stream / Worker 结果通过事件流返回
- **WHEN** a child loop reaches terminal status
- **THEN** the parent receives a typed worker-result event instead of raw transcript text masquerading as a user prompt
- **中文** 当 child loop 到达 terminal status 时，parent 必须收到 typed worker-result event，而不是伪装成 user prompt 的 raw transcript text。

### Requirement: Safe Phase Skipping / 安全跳过阶段

The agent loop SHALL skip phases for simple or low-risk tasks only when it records a typed skip decision.

agent loop 必须只在记录类型化 skip decision 时，才能为简单或低风险任务跳过阶段。

#### Scenario: Simple casual prompt stays single phase / 简单随意 Prompt 保持单阶段
- **WHEN** a prompt does not reference project facts, code, files, tools, generated artifacts, or mutation
- **THEN** the agent loop may run a simple default path and records that evidence, planning, verification, delegation, and repair were not required
- **中文** 当 prompt 不引用 project facts、code、files、tools、generated artifacts 或 mutation 时，agent loop 可以运行 simple default path，并记录 evidence、planning、verification、delegation 与 repair 不需要执行。

#### Scenario: High-risk skip is rejected / 高风险跳过被拒绝
- **WHEN** policy marks a task as high risk and a required evidence or verification phase has no available budget or provider
- **THEN** the loop fails closed or asks for explicit user approval instead of silently skipping the phase
- **中文** 当 policy 将任务标记为 high risk，且必需 evidence 或 verification phase 没有可用 budget 或 provider 时，loop 必须安全失败或请求显式用户批准，而不是静默跳过阶段。
