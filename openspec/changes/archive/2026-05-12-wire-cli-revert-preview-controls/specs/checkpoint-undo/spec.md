## ADDED Requirements

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
