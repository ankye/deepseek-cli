## ADDED Requirements

### Requirement: Resume Restores Mode State / Resume 恢复 Mode 状态

Session resume SHALL restore interaction mode, agent mode, phase summaries, and delegation lineage from persisted session metadata rather than process environment or terminal-local state.

Session resume 必须从持久化 session metadata 恢复 interaction mode、agent mode、phase summaries 与 delegation lineage，而不是依赖 process environment 或 terminal-local state。

#### Scenario: Resume mode matches session metadata / Resume Mode 匹配 Session 元数据
- **WHEN** a session is resumed
- **THEN** the restored mode state is derived from session events and metadata, and any host-specific renderer adapts to that state without mutating global process flags
- **中文** 当 session 被 resumed 时，恢复的 mode state 必须来自 session events 与 metadata，任何 host-specific renderer 都必须适配该 state，而不得修改全局 process flags。

#### Scenario: Mode mismatch is explicit / Mode 不匹配显式化
- **WHEN** the current host cannot support the session's last interaction mode
- **THEN** resume emits a typed degradation event and selects a safe supported interaction mode while preserving the original mode in metadata
- **中文** 当当前 host 不支持 session 的 last interaction mode 时，resume 必须发出 typed degradation event，并选择安全支持的 interaction mode，同时在 metadata 中保留原 mode。

### Requirement: Fork Preserves Delegation Lineage / Fork 保留委派链路

Session fork SHALL preserve parent-child lineage for agent modes, worker tasks, and verification state without claiming workspace isolation unless explicitly provided.

Session fork 必须保留 agent modes、worker tasks 与 verification state 的 parent-child lineage，且除非显式提供，不得声称 workspace isolation。

#### Scenario: Fork records mode fork point / Fork 记录 Mode 分叉点
- **WHEN** a session is forked while a mode-aware task history exists
- **THEN** fork metadata includes parent session id, child session id, fork point sequence, active interaction mode, active agent mode, and last phase summary
- **中文** 当存在 mode-aware task history 的 session 被 fork 时，fork metadata 必须包含 parent session id、child session id、fork point sequence、active interaction mode、active agent mode 与 last phase summary。

#### Scenario: Fork does not inherit running workers silently / Fork 不静默继承运行中的 Worker
- **WHEN** a session with active workers is forked
- **THEN** the fork result declares whether active workers are detached, copied as historical lineage only, or explicitly reattached by policy
- **中文** 当包含 active workers 的 session 被 fork 时，fork result 必须声明 active workers 是 detached、仅作为 historical lineage copied，还是由 policy 显式 reattached。

### Requirement: Replay Explains Multi-Round Decisions / Replay 解释多轮决策

Session replay SHALL reconstruct why phases, modes, delegation, verification, repair, and reasoning effort choices occurred.

Session replay 必须重建 phases、modes、delegation、verification、repair 与 reasoning effort choices 发生的原因。

#### Scenario: Replay exposes loop budgets / Replay 暴露循环预算
- **WHEN** a session replay is generated for a turn
- **THEN** it includes requested and consumed evidence loops, verification loops, repair attempts, delegation fan-out, and model reasoning effort as separate fields
- **中文** 当为 turn 生成 session replay 时，必须以独立字段包含 requested 与 consumed evidence loops、verification loops、repair attempts、delegation fan-out 与 model reasoning effort。
