## ADDED Requirements

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
