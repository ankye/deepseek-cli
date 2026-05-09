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
