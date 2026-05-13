# checkpoint-undo Specification

## Purpose
TBD - created by archiving change implement-checkpoint-undo. Update Purpose after archive.
## Requirements
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

### Requirement: Redacted Recovery Evidence / 脱敏恢复证据

Checkpoint and undo evidence SHALL expose content hashes, ids, status, diagnostics, and redaction metadata, but MUST NOT expose raw secret-like rollback content in tool results, runtime events, session events, golden traces, cache entries, or assertion messages.

checkpoint 与 undo evidence 必须暴露 content hashes、ids、status、diagnostics 和 redaction metadata，但绝不能在 tool results、runtime events、session events、golden traces、cache entries 或 assertion messages 中暴露 raw secret-like rollback content。

#### Scenario: Secret rollback content is private / secret rollback 内容保持私有

- **WHEN** a checkpoint captures content that looks like an API key, bearer token, private key, or env credential
- **THEN** externally visible evidence contains only redacted markers, hashes, and typed redaction fields
- **中文** 当 checkpoint 捕获看起来像 API key、bearer token、private key 或 env credential 的内容时，外部可见 evidence 只能包含 redacted markers、hashes 和 typed redaction fields。

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

### Requirement: CLI Revert Preview Controls / CLI 回退预览控制

The CLI SHALL expose request/turn/session-scoped revert preview controls that use checkpoint/session contracts in dry-run mode without mutating workspace files, sessions, or checkpoint records.

CLI 必须暴露 request/turn/session-scoped revert preview controls，使用 checkpoint/session contracts 的 dry-run mode，且不修改 workspace files、sessions 或 checkpoint records。

#### Scenario: Scriptable revert preview renders dry-run result / 可脚本化回退预览渲染 Dry-run 结果
- **WHEN** a user runs `deepseek revert preview --request <request-id> --output json`
- **THEN** the CLI returns a structured request revert preview result with `dryRun=true`, target metadata, affected checkpoint ids, affected paths, diagnostics, and redaction metadata
- **中文** 当用户运行 `deepseek revert preview --request <request-id> --output json` 时，CLI 必须返回结构化 request revert preview result，包含 `dryRun=true`、target metadata、affected checkpoint ids、affected paths、diagnostics 和 redaction metadata。

#### Scenario: Empty revert preview is typed / 空回退预览类型化
- **WHEN** no checkpoint matches the requested revert target
- **THEN** the CLI returns a typed `CHECKPOINT_REVERT_EMPTY` failure result without throwing an unstructured host exception
- **中文** 当没有 checkpoint 匹配请求的 revert target 时，CLI 必须返回类型化 `CHECKPOINT_REVERT_EMPTY` failure result，且不得抛出非结构化 host exception。

#### Scenario: Revert preview is non-mutating / 回退预览不修改状态
- **WHEN** a user runs revert preview
- **THEN** workspace file content, checkpoint statuses, and session history remain unchanged
- **中文** 当用户运行 revert preview 时，workspace file content、checkpoint statuses 和 session history 必须保持不变。

### Requirement: Revert Preview Current Target Resolution / 回退预览 Current Target 解析

Chat revert preview SHALL resolve `current` to an explicit turn/session target before invoking checkpoint dry-run preview.

Chat revert preview 必须先将 `current` 解析为显式 turn/session target，再调用 checkpoint dry-run preview。

#### Scenario: Current target is explicit in preview result / Current Target 在预览结果中显式
- **WHEN** `/revert preview current` is invoked with a selected history turn
- **THEN** the preview result target contains the selected turn id and session id rather than the opaque token `current`
- **中文** 当 `/revert preview current` 在有 selected history turn 时被调用，preview result target 必须包含 selected turn id 与 session id，而不是不透明 token `current`。

### Requirement: CLI Revert Apply Controls / CLI 回退执行控制

The CLI SHALL expose request/turn/session-scoped revert apply controls that use checkpoint restore safety checks with `dryRun=false`, emit typed compensation evidence, and never rewrite immutable session history.

CLI 必须暴露 request/turn/session-scoped revert apply controls，使用 `dryRun=false` 的 checkpoint restore safety checks，发出类型化 compensation evidence，并且绝不重写 immutable session history。

#### Scenario: Scriptable revert apply restores eligible checkpoints / 可脚本化回退执行恢复 Eligible Checkpoints

- **WHEN** a user runs `deepseek revert apply --request <request-id> --output json`
- **THEN** the CLI invokes request-scoped revert with `dryRun=false`, restores eligible matching checkpoints, marks restored checkpoints as restored, and returns a structured `revert.apply` result with target metadata, restored path counts, diagnostics, and redaction metadata
- **中文** 当用户运行 `deepseek revert apply --request <request-id> --output json` 时，CLI 必须以 `dryRun=false` 调用 request-scoped revert，恢复匹配的 eligible checkpoints，将已恢复 checkpoints 标记为 restored，并返回结构化 `revert.apply` result，包含 target metadata、restored path counts、diagnostics 和 redaction metadata。

#### Scenario: Scriptable revert apply rejects stale files / 可脚本化回退执行拒绝过期文件

- **WHEN** a targeted checkpoint current file hash differs from the checkpoint after hash
- **THEN** the CLI returns typed stale diagnostics, leaves the file unchanged, and does not mark the checkpoint restored
- **中文** 当目标 checkpoint 的当前文件 hash 与 checkpoint after hash 不一致时，CLI 必须返回类型化 stale diagnostics，保持文件不变，并且不得把 checkpoint 标记为 restored。

#### Scenario: Apply and preview remain distinct / 执行与预览保持区分

- **WHEN** a user runs revert preview and revert apply against equivalent targets
- **THEN** preview results use `kind="revert.preview"` and `dryRun=true` without mutation, while apply results use `kind="revert.apply"` and `dryRun=false` and may mutate only through checkpoint restore safety checks
- **中文** 当用户对等价 target 运行 revert preview 与 revert apply 时，preview result 必须使用 `kind="revert.preview"` 和 `dryRun=true` 且不修改状态；apply result 必须使用 `kind="revert.apply"` 和 `dryRun=false`，并且只能通过 checkpoint restore safety checks 修改。

#### Scenario: Empty apply target is typed / 空执行目标类型化

- **WHEN** no checkpoint matches the requested revert apply target
- **THEN** the CLI returns a typed `CHECKPOINT_REVERT_EMPTY` failure result without throwing an unstructured host exception
- **中文** 当没有 checkpoint 匹配请求的 revert apply target 时，CLI 必须返回类型化 `CHECKPOINT_REVERT_EMPTY` failure result，且不得抛出非结构化 host exception。

### Requirement: Interactive Revert Review Confirmation / 交互式回退审阅确认

Interactive chat revert apply flows SHALL support a review-before-confirm path that stores only redacted dry-run impact metadata and applies only the reviewed explicit target.

交互式 chat revert apply flows 必须支持 review-before-confirm 路径，该路径只保存脱敏 dry-run impact metadata，并且只对已审阅的显式 target 执行 apply。

#### Scenario: Review stores redacted impact / 审阅保存脱敏影响信息

- **WHEN** chat creates a revert review from a selected turn
- **THEN** the pending review stores review id, explicit target ids, preview status, affected checkpoint/path counts, diagnostics, and redaction metadata without raw rollback content
- **中文** 当 chat 从 selected turn 创建 revert review 时，pending review 必须保存 review id、显式 target ids、preview status、affected checkpoint/path counts、diagnostics 和 redaction metadata，且不包含 raw rollback content。

#### Scenario: Confirm revalidates workspace state / 确认重新验证工作区状态

- **WHEN** a pending review is confirmed after workspace files changed
- **THEN** the apply step reuses checkpoint restore safety checks, rejects stale files with typed diagnostics, and leaves stale files unchanged
- **中文** 当 workspace files 在 pending review 后发生变化并确认执行时，apply step 必须复用 checkpoint restore safety checks，以 typed diagnostics 拒绝 stale files，并保持 stale files 不变。

#### Scenario: Scriptable apply remains available / 可脚本化执行保持可用

- **WHEN** a user invokes scriptable `deepseek revert apply ...`
- **THEN** the CLI continues to execute the explicit apply command without requiring a chat-local pending review id
- **中文** 当用户调用可脚本化 `deepseek revert apply ...` 时，CLI 必须继续执行显式 apply command，而不要求 chat-local pending review id。
