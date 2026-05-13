## MODIFIED Requirements

### Requirement: Undo Latest Mutation / 撤销最近修改

The platform SHALL support undoing the latest eligible applied checkpoint, optionally scoped by session id and path, using the same restore safety checks and evidence model. The platform SHALL also support request/turn-scoped revert by resolving all eligible checkpoints produced by a request or turn and applying the same restore safety checks without deleting immutable session history.

平台必须支持撤销最近一个 eligible applied checkpoint，并可按 session id 与 path 限定，且使用同一套 restore safety checks 和 evidence model。平台还必须支持 request/turn-scoped revert：解析某个 request 或 turn 产生的所有 eligible checkpoints，并使用同一 restore safety checks，同时不得删除不可变 session history。

#### Scenario: Undo chooses latest eligible checkpoint / undo 选择最近 eligible checkpoint

- **WHEN** multiple applied checkpoints exist for a workspace
- **THEN** undo selects the latest not-yet-restored eligible checkpoint within the requested scope
- **中文** 当 workspace 中存在多个已应用 checkpoints 时，undo 必须在请求 scope 内选择最近一个尚未恢复且 eligible 的 checkpoint。

#### Scenario: Undo reports empty stack / undo 报告空栈

- **WHEN** no eligible checkpoint exists for the requested scope
- **THEN** undo returns a rejected result with typed diagnostics and no filesystem mutation
- **中文** 当请求 scope 内不存在 eligible checkpoint 时，undo 必须返回 typed diagnostics 的 rejected result，且不修改 filesystem。

#### Scenario: Request revert restores eligible checkpoints / 请求回退恢复 Eligible Checkpoints

- **WHEN** a request/turn-scoped revert targets a request or turn that produced one or more eligible workspace checkpoints
- **THEN** the platform restores each eligible checkpoint whose current file hash matches the checkpoint after hash, records per-checkpoint restore evidence, and emits a request revert result
- **中文** 当 request/turn-scoped revert 目标 request 或 turn 产生了一个或多个 eligible workspace checkpoints 时，平台必须恢复每个当前文件 hash 匹配 checkpoint after hash 的 eligible checkpoint，记录每个 checkpoint 的 restore evidence，并发出 request revert result。

#### Scenario: Request revert rejects stale files safely / 请求回退安全拒绝过期文件

- **WHEN** a targeted request checkpoint no longer matches current workspace state
- **THEN** the request revert result marks that checkpoint as stale and leaves the file unchanged unless a future explicit force policy allows otherwise
- **中文** 当目标 request checkpoint 不再匹配当前 workspace state 时，request revert result 必须将该 checkpoint 标记为 stale，并保持文件不变，除非未来显式 force policy 允许例外。

## ADDED Requirements

### Requirement: Request Revert Evidence / 请求回退证据

The platform SHALL record request/turn revert as compensating session evidence rather than destructive history rewriting.

平台必须将 request/turn revert 记录为补偿性 session evidence，而不是破坏性历史改写。

#### Scenario: Revert event preserves original history / Revert 事件保留原始历史

- **WHEN** a request/turn-scoped revert completes, partially completes, or is rejected
- **THEN** the original request, model output, tool evidence, approval decisions, audit records, and checkpoint records remain immutable and addressable
- **中文** 当 request/turn-scoped revert 完成、部分完成或被拒绝时，原始 request、model output、tool evidence、approval decisions、audit records 和 checkpoint records 必须保持不可变且可寻址。

#### Scenario: Revert evidence explains compensated effects / Revert 证据解释补偿效果

- **WHEN** a request/turn-scoped revert emits evidence
- **THEN** the evidence includes target request/turn ids, affected checkpoint ids, restored paths, stale or non-restorable paths, non-filesystem effects, redaction metadata, diagnostics, and replay-safe hashes
- **中文** 当 request/turn-scoped revert 发出 evidence 时，证据必须包含 target request/turn ids、affected checkpoint ids、restored paths、stale 或 non-restorable paths、non-filesystem effects、redaction metadata、diagnostics 和 replay-safe hashes。

#### Scenario: Context projection honors reverted turns / 上下文投影识别已回退 Turn

- **WHEN** future model context or CLI summaries include a session containing reverted requests
- **THEN** the context projection can identify the reverted turn and avoid presenting compensated workspace effects as current truth
- **中文** 当未来 model context 或 CLI summaries 包含有 reverted requests 的 session 时，context projection 必须能识别已回退 turn，并避免把已补偿的 workspace effects 当作当前事实呈现。

#### Scenario: Non-reversible effects are explicit / 不可回退效果显式化

- **WHEN** a targeted request produced external side effects, shell side effects without checkpoints, network effects, plugin side effects, or other non-restorable effects
- **THEN** the request revert evidence lists them as non-reversible or manually reviewable rather than claiming full rollback
- **中文** 当目标 request 产生 external side effects、无 checkpoint 的 shell side effects、network effects、plugin side effects 或其他 non-restorable effects 时，request revert evidence 必须将其列为 non-reversible 或 manually reviewable，而不得声称 full rollback。
