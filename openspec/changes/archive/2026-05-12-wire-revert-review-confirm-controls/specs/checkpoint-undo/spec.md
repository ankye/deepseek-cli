## ADDED Requirements

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
