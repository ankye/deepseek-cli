## Purpose

Define DeepSeek session resume and fork-lite behavior as a governed, event-sourced product capability shared by CLI, VSCode, tests, and future server hosts.

定义 DeepSeek session resume 与 fork-lite 行为，使其成为 CLI、VSCode、tests 与未来 server hosts 共享的、受治理的 event-sourced 产品能力。
## Requirements
### Requirement: Session Resume And Fork-Lite Product Contract / Session Resume 与 Fork-Lite 产品契约

DeepSeek SHALL provide R1 session resume and fork-lite behavior that is event-sourced, replayable, and host-agnostic.

DeepSeek 必须提供 R1 session resume 与 fork-lite 行为，并且这些行为必须是 event-sourced、replayable 和 host-agnostic。

#### Scenario: Resume known session / 恢复已知 session

- **WHEN** a user or host requests resume for a known session id
- **THEN** the system returns reconstructed session metadata, event count, latest sequence, lineage, and redacted preview without requiring terminal UI state
- **中文** 当用户或 host 请求恢复已知 session id 时，系统必须返回 reconstructed session metadata、event count、latest sequence、lineage 和 redacted preview，且不依赖 terminal UI state。

#### Scenario: Fork known session / 分叉已知 session

- **WHEN** a user or host requests fork-lite from a known session id
- **THEN** the system creates a new session id linked to the parent session and records fork point metadata
- **中文** 当用户或 host 请求从已知 session id 进行 fork-lite 时，系统必须创建关联 parent session 的新 session id，并记录 fork point metadata。

#### Scenario: Unknown session fails closed / 未知 session 安全失败

- **WHEN** resume or fork-lite is requested for an unknown session id
- **THEN** the system returns a typed failure and does not create an ambiguous or partial session
- **中文** 当针对未知 session id 请求 resume 或 fork-lite 时，系统必须返回 typed failure，且不得创建 ambiguous 或 partial session。

### Requirement: Fork-Lite Scope Boundary / Fork-Lite 范围边界

Fork-lite SHALL branch session history and lineage only, and SHALL NOT claim workspace file isolation.

fork-lite 必须只分叉 session history 与 lineage，不得声称隔离 workspace files。

#### Scenario: Fork does not copy workspace / Fork 不复制 workspace

- **WHEN** a session is forked in R1
- **THEN** the fork result declares inherited session history metadata and does not report workspace copy, worktree, checkpoint restore, or filesystem isolation unless those references are explicitly present
- **中文** 当 R1 中 session 被 fork 时，fork result 必须声明 inherited session history metadata，且不得报告 workspace copy、worktree、checkpoint restore 或 filesystem isolation，除非这些 references 明确存在。

#### Scenario: Fork lineage is replayable / Fork lineage 可 replay

- **WHEN** a forked session is replayed
- **THEN** regression can identify parent session id, fork point sequence, fork event, child session id, and subsequent child events
- **中文** 当 forked session 被 replay 时，regression 必须能够识别 parent session id、fork point sequence、fork event、child session id 和后续 child events。

### Requirement: Session Resume/Fork Acceptance Evidence / Session Resume/Fork 验收证据

The implementation SHALL provide deterministic acceptance evidence before archive.

实现必须在 archive 前提供确定性验收证据。

#### Scenario: Acceptance covers resume and fork / 验收覆盖 resume 与 fork

- **WHEN** acceptance checks run
- **THEN** unit, contract, integration, golden, compatibility, and e2e tests cover successful resume, successful fork-lite, unknown session failure, lineage preservation, and no live-provider requirement
- **中文** 当 acceptance checks 运行时，unit、contract、integration、golden、compatibility 和 e2e tests 必须覆盖 successful resume、successful fork-lite、unknown session failure、lineage preservation 和 no live-provider requirement。

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

