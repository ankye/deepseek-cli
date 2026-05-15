## ADDED Requirements

### Requirement: Agent Loop Supports Governed Self-Repair Phase / Agent Loop 支持受治理自修复阶段

The agent loop SHALL support a governed self-repair phase between repairable failure detection and terminal failure emission when request policy, safety gates, and budgets allow repair.

agent loop 必须在检测到可修复失败与发出 terminal failure 之间支持受治理 self-repair phase，前提是 request policy、safety gates 与 budgets 允许修复。

#### Scenario: Repairable failure enters repair phase / 可修复失败进入修复阶段
- **WHEN** a tool execution, model provider event, artifact checker, or verification command fails with a repairable classification
- **THEN** the agent loop emits self-repair classification and planning events before either attempting a governed repair or failing with a typed stop reason
- **中文** 当 tool execution、model provider event、artifact checker 或 verification command 以可修复分类失败时，agent loop 必须在尝试受治理修复或以 typed stop reason 失败之前，发出 self-repair classification 与 planning events。

#### Scenario: Non-repairable failure remains fail-closed / 不可修复失败保持安全失败
- **WHEN** a failure is classified as non-repairable, unsafe, missing approval, missing credential, or outside allowed tool projection
- **THEN** the agent loop emits terminal failure or escalation evidence without mutating the workspace or creating an extra model repair turn
- **中文** 当 failure 被分类为 non-repairable、unsafe、missing approval、missing credential 或 outside allowed tool projection 时，agent loop 必须发出 terminal failure 或 escalation evidence，且不得修改 workspace 或创建额外 model repair turn。

### Requirement: Agent Loop Summary Includes Repair Outcome / Agent Loop Summary 包含修复结果

The agent loop SHALL include repair-loop outcome summaries in terminal events whenever repair classification or repair attempts occur.

只要发生 repair classification 或 repair attempts，agent loop 必须在 terminal events 中包含 repair-loop outcome summaries。

#### Scenario: Completed turn includes repair success summary / 完成回合包含修复成功摘要
- **WHEN** a turn initially fails, performs a repair attempt, passes verification, and completes
- **THEN** `agent.loop.completed` includes repair activation count, successful attempt id, verification summary, touched-scope summary, and redaction metadata
- **中文** 当一个 turn 先失败、执行 repair attempt、通过 verification 并完成时，`agent.loop.completed` 必须包含 repair activation count、successful attempt id、verification summary、touched-scope summary 与 redaction metadata。

#### Scenario: Failed turn includes repair stop summary / 失败回合包含修复停止摘要
- **WHEN** a turn stops after repair attempts fail or are blocked
- **THEN** `agent.loop.failed` includes failure classification, attempt count, last verification summary, stop reason, escalation action when any, and redaction metadata
- **中文** 当一个 turn 在 repair attempts 失败或被阻止后停止时，`agent.loop.failed` 必须包含 failure classification、attempt count、last verification summary、stop reason、可能的 escalation action 与 redaction metadata。

### Requirement: Agent Loop Preserves Existing Tool Governance During Repair / Agent Loop 在修复中保留工具治理

The agent loop SHALL route repair tool calls through the same model-visible capability projection, tool-intent preflight, policy engine, runtime kernel, hooks, and tool-result evidence path as normal tool calls.

agent loop 必须让 repair tool calls 经过与普通 tool calls 相同的 model-visible capability projection、tool-intent preflight、policy engine、runtime kernel、hooks 与 tool-result evidence path。

#### Scenario: Repair tool call uses normal execution path / 修复工具调用使用普通执行路径
- **WHEN** a repair attempt requests a file read, file write, shell, artifact check, or other capability
- **THEN** the request is validated, preflighted, governed, executed, recorded, and fed back to the model using the existing runtime tool path
- **中文** 当 repair attempt 请求 file read、file write、shell、artifact check 或其他 capability 时，该请求必须通过现有 runtime tool path 完成 validate、preflight、govern、execute、record 与 model feedback。

#### Scenario: Repair cannot bypass rejected tool intent / 修复不得绕过被拒绝工具意图
- **WHEN** tool-intent preflight rejects or repairs a repair-mode tool request
- **THEN** the agent loop records the preflight decision as repair evidence and MUST NOT execute the original unsafe intent
- **中文** 当 tool-intent preflight 拒绝或修复 repair-mode tool request 时，agent loop 必须将 preflight decision 记录为 repair evidence，且不得执行原始 unsafe intent。
