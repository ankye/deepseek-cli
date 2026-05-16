## ADDED Requirements

### Requirement: Chat Mode Controls / Chat 模式控制

The chat CLI SHALL expose local mode and agent controls without sending control text to the model.

chat CLI 必须暴露本地 mode 与 agent controls，且不得把 control text 发送给 model。

#### Scenario: Chat renders mode status locally / Chat 本地渲染 Mode 状态
- **WHEN** a user enters `/mode` in chat
- **THEN** the shell renders current interaction mode, current agent mode, available transitions, active budgets, and degradation reasons without model dispatch
- **中文** 当用户在 chat 中输入 `/mode` 时，shell 必须渲染 current interaction mode、current agent mode、available transitions、active budgets 与 degradation reasons，且不得触发 model dispatch。

#### Scenario: Chat agent status is local / Chat Agent 状态保持本地
- **WHEN** a user enters `/agent` or `/workers` in chat
- **THEN** the shell renders agent definitions, active worker instances, lifecycle status, and result ids through local command/action results
- **中文** 当用户在 chat 中输入 `/agent` 或 `/workers` 时，shell 必须通过 local command/action results 渲染 agent definitions、active worker instances、lifecycle status 与 result ids。

### Requirement: Chat Multi-Round Status Rendering / Chat 多轮状态渲染

Chat rendering SHALL show bounded progress for evidence, planning, delegation, verification, and repair phases while preserving structured JSONL parity.

Chat rendering 必须为 evidence、planning、delegation、verification 与 repair phases 显示有界进度，同时保持 structured JSONL parity。

#### Scenario: Text mode shows concise phase markers / Text Mode 显示简洁阶段标记
- **WHEN** a chat turn enters evidence, plan, worker, verify, or repair phase
- **THEN** text rendering shows concise phase markers without dumping raw evidence, worker transcripts, private reasoning, or unbounded command output
- **中文** 当 chat turn 进入 evidence、plan、worker、verify 或 repair phase 时，text rendering 必须显示简洁 phase markers，不得倾倒 raw evidence、worker transcripts、private reasoning 或无界 command output。

#### Scenario: JSONL keeps complete structured events / JSONL 保留完整结构化事件
- **WHEN** chat output is JSONL
- **THEN** all mode, phase, delegation, verification, repair, and terminal events are emitted as structured JSONL records suitable for replay
- **中文** 当 chat output 是 JSONL 时，所有 mode、phase、delegation、verification、repair 与 terminal events 必须作为适合 replay 的 structured JSONL records 发出。

### Requirement: Chat Reasoning Controls / Chat 推理控制

Chat SHALL expose reasoning effort status separately from evidence and verification loop status.

Chat 必须将 reasoning effort status 与 evidence 和 verification loop status 分开暴露。

#### Scenario: Model status includes reasoning effort / Model 状态包含推理强度
- **WHEN** a user enters `/model`
- **THEN** the shell renders active model, provider, provider reasoning/thinking support, requested reasoning effort, mapped provider effort when any, and reasoning disabled reason when any
- **中文** 当用户输入 `/model` 时，shell 必须渲染 active model、provider、provider reasoning/thinking support、requested reasoning effort、实际映射的 provider effort（如有）与 reasoning disabled reason（如有）。

#### Scenario: Reasoning effort does not claim verification / 推理强度不声称验证
- **WHEN** the model status shows high or max reasoning effort
- **THEN** chat still reports evidence and verification loop counts separately and does not imply they ran
- **中文** 当 model status 显示 high 或 max reasoning effort 时，chat 仍必须单独报告 evidence 与 verification loop counts，不得暗示它们已运行。
