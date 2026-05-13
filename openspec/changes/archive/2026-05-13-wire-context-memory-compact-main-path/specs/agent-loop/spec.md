## ADDED Requirements

### Requirement: Agent Loop Emits Memory And Compact Evidence / Agent Loop 发出记忆与压缩证据

The agent loop SHALL publish host-neutral runtime events that describe memory candidate collection and compact boundary decisions without mutating the user prompt or requiring host-specific state.

Agent loop 必须发布 host-neutral runtime events，用于描述 memory candidate collection 与 compact boundary decisions，且不得修改用户 prompt 或依赖 host-specific state。

#### Scenario: Memory candidates are visible before model dispatch / 模型派发前可见记忆候选

- **WHEN** a turn collects eligible memory entries for context projection
- **THEN** the runtime event stream includes structured memory evidence with scope counts, selected candidate counts, redaction metadata, and replay fingerprints before `model.requested`
- **中文** 当某个回合为 context projection 收集 eligible memory entries 时，runtime event stream 必须在 `model.requested` 前包含结构化 memory evidence，含 scope counts、selected candidate counts、redaction metadata 与 replay fingerprints。

#### Scenario: Compact boundary is replayable / 压缩边界可 replay

- **WHEN** context projection crosses compact pressure thresholds
- **THEN** the agent loop emits a compact boundary event with projection fingerprint, budget pressure, selected/excluded counts, and no hidden prompt rewrite
- **中文** 当 context projection 跨过 compact pressure thresholds 时，agent loop 必须发出 compact boundary event，包含 projection fingerprint、budget pressure、selected/excluded counts，且不得隐藏改写 prompt。

### Requirement: Agent Loop Records Bounded Tool Result Evidence / Agent Loop 记录有界工具结果证据

The agent loop SHALL convert tool execution outcomes into bounded, redacted, replayable evidence records owned by runtime events rather than CLI-rendered text.

Agent loop 必须将工具执行结果转换为有界、脱敏、可 replay 的 evidence records，并由 runtime events 拥有，而不是由 CLI rendered text 拥有。

#### Scenario: Tool result evidence excludes raw output / 工具结果证据排除原始输出

- **WHEN** a tool execution completes with stdout, stderr, diagnostics, changed files, or model feedback
- **THEN** the runtime records stable ids, capability ids, status, bounded summaries, replay hashes, and redaction metadata without persisting raw unbounded stdout/stderr
- **中文** 当工具执行完成并包含 stdout、stderr、diagnostics、changed files 或 model feedback 时，runtime 必须记录 stable ids、capability ids、status、有界 summaries、replay hashes 与 redaction metadata，不得持久化 raw unbounded stdout/stderr。
