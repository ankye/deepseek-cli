## ADDED Requirements

### Requirement: Checkpoint Records / Checkpoint 记录

The platform SHALL create structured checkpoint records for applied workspace mutations, including checkpoint id, transaction id, session id, affected path, before/after hashes, restore eligibility, provenance, diagnostics, and redaction metadata.

平台必须为已应用的 workspace mutations 创建结构化 checkpoint records，包含 checkpoint id、transaction id、session id、affected path、before/after hashes、restore eligibility、provenance、diagnostics 和 redaction metadata。

#### Scenario: Applied mutation creates checkpoint / 已应用修改创建 checkpoint

- **WHEN** a file write or edit transaction is successfully applied
- **THEN** the workspace state manager records a checkpoint with before hash, after hash, restore eligibility, and replay-safe evidence
- **中文** 当 file write 或 edit transaction 成功应用时，workspace state manager 必须记录包含 before hash、after hash、restore eligibility 和 replay-safe evidence 的 checkpoint。

#### Scenario: Rejected mutation creates no restorable checkpoint / 被拒绝修改不创建可恢复 checkpoint

- **WHEN** a mutation is rejected before file changes are applied
- **THEN** no restorable checkpoint is recorded and failure evidence explains the rejection
- **中文** 当 mutation 在文件变更前被拒绝时，不得记录可恢复 checkpoint，并且 failure evidence 必须解释拒绝原因。

### Requirement: Restore By Checkpoint / 按 Checkpoint 恢复

The platform SHALL restore a workspace file from an eligible checkpoint only when the current file hash matches the checkpoint's expected post-mutation hash, unless a future force policy explicitly allows otherwise.

平台必须只在当前文件 hash 匹配 checkpoint 预期的修改后 hash 时，才允许从 eligible checkpoint 恢复 workspace file；除非未来 force policy 明确允许例外。

#### Scenario: Restore succeeds with matching hash / hash 匹配时恢复成功

- **WHEN** a checkpoint is eligible and the current file hash equals the checkpoint after hash
- **THEN** restore writes the checkpoint before content, marks the checkpoint restored, and emits redacted restore evidence
- **中文** 当 checkpoint eligible 且当前文件 hash 等于 checkpoint after hash 时，restore 必须写回 checkpoint before content、标记 checkpoint restored，并输出脱敏 restore evidence。

#### Scenario: Restore rejects stale current file / 当前文件过期时拒绝恢复

- **WHEN** the current file hash differs from the checkpoint after hash
- **THEN** restore is rejected without mutation and emits diagnostics explaining stale workspace state
- **中文** 当当前文件 hash 与 checkpoint after hash 不一致时，restore 必须拒绝且不修改文件，并输出解释 stale workspace state 的 diagnostics。

### Requirement: Undo Latest Mutation / 撤销最近修改

The platform SHALL support undoing the latest eligible applied checkpoint, optionally scoped by session id and path, using the same restore safety checks and evidence model.

平台必须支持撤销最近一个 eligible applied checkpoint，并可按 session id 与 path 限定，且使用同一套 restore safety checks 和 evidence model。

#### Scenario: Undo chooses latest eligible checkpoint / undo 选择最近 eligible checkpoint

- **WHEN** multiple applied checkpoints exist for a workspace
- **THEN** undo selects the latest not-yet-restored eligible checkpoint within the requested scope
- **中文** 当 workspace 中存在多个已应用 checkpoints 时，undo 必须在请求 scope 内选择最近一个尚未恢复且 eligible 的 checkpoint。

#### Scenario: Undo reports empty stack / undo 报告空栈

- **WHEN** no eligible checkpoint exists for the requested scope
- **THEN** undo returns a rejected result with typed diagnostics and no filesystem mutation
- **中文** 当请求 scope 内不存在 eligible checkpoint 时，undo 必须返回 typed diagnostics 的 rejected result，且不修改 filesystem。

### Requirement: Redacted Recovery Evidence / 脱敏恢复证据

Checkpoint and undo evidence SHALL expose content hashes, ids, status, diagnostics, and redaction metadata, but MUST NOT expose raw secret-like rollback content in tool results, runtime events, session events, golden traces, cache entries, or assertion messages.

checkpoint 与 undo evidence 必须暴露 content hashes、ids、status、diagnostics 和 redaction metadata，但绝不能在 tool results、runtime events、session events、golden traces、cache entries 或 assertion messages 中暴露 raw secret-like rollback content。

#### Scenario: Secret rollback content is private / secret rollback 内容保持私有

- **WHEN** a checkpoint captures content that looks like an API key, bearer token, private key, or env credential
- **THEN** externally visible evidence contains only redacted markers, hashes, and typed redaction fields
- **中文** 当 checkpoint 捕获看起来像 API key、bearer token、private key 或 env credential 的内容时，外部可见 evidence 只能包含 redacted markers、hashes 和 typed redaction fields。
