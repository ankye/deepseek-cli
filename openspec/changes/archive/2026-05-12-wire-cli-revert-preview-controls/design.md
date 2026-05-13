## Context

Workspace state already supports checkpoint records, latest undo, and request/turn-scoped `revertRequest` with `dryRun`. The command composition layer already returns a `cli.revert.preview` descriptor for typed revert actions. The missing piece is a CLI host surface that users can call directly and safely.

Workspace state 已支持 checkpoint records、latest undo，以及带 `dryRun` 的 request/turn-scoped `revertRequest`。Command composition layer 也已为 typed revert actions 返回 `cli.revert.preview` descriptor。缺口是 CLI host 还没有一个用户可直接安全调用的 surface。

## Goals / Non-Goals

**Goals:**

- Add scriptable `deepseek revert preview` with deterministic text, JSON, and JSONL output. / 增加可脚本化 `deepseek revert preview`，支持确定性的 text、JSON 与 JSONL output。
- Add chat-local `/revert preview` with the same target semantics and no model submission. / 增加 chat-local `/revert preview`，使用同一 target semantics，且不提交 model。
- Keep preview dry-run only and expose typed empty results when no checkpoints match. / 保持 preview 仅 dry-run，并在没有 matching checkpoints 时暴露类型化 empty results。
- Keep original session/history/checkpoint evidence immutable. / 保持原始 session/history/checkpoint evidence 不可变。

**Non-Goals:**

- No `revert apply`, `undo latest`, or filesystem restore CLI command. / 不做 `revert apply`、`undo latest` 或 filesystem restore CLI command。
- No force restore policy. / 不做 force restore policy。
- No transcript deletion. / 不删除 transcript。
- No reconstruction of checkpoints from historical session events when the current injected workspace state has none. / 当前注入 workspace state 没有 checkpoints 时，不从 historical session events 重建 checkpoints。

## Decisions

### Decision: Revert target parser is shared by scriptable and chat controls

Both `deepseek revert preview ...` and `/revert preview ...` will use a small parser that accepts explicit flags: `--request <id>`, `--turn <id>`, `--session <id>`, and `--path <path>`. At least one target selector is required.

`deepseek revert preview ...` 与 `/revert preview ...` 都使用同一个小 parser，接受显式 flags：`--request <id>`、`--turn <id>`、`--session <id>` 与 `--path <path>`。至少需要一个 target selector。

Alternative considered: infer target from natural language or the current prompt. Rejected because revert must be explicit and audit-friendly.

备选方案：从自然语言或当前 prompt 推断 target。拒绝原因是 revert 必须显式且便于审计。

### Decision: CLI command uses workspace-state dry-run

The preview command calls `deps.workspaceState.revertRequest({ target, dryRun: true, reason })`. This keeps checkpoint matching and redaction in the owning package and avoids duplicating restore semantics in the CLI host.

Preview command 调用 `deps.workspaceState.revertRequest({ target, dryRun: true, reason })`。这样 checkpoint matching 与 redaction 仍由所属 package 负责，避免在 CLI host 复制 restore semantics。

### Decision: Empty preview is a typed result, not an exception

When no checkpoints match, CLI renders the `CHECKPOINT_REVERT_EMPTY` result as a local structured failure. Chat treats it as local output and keeps the REPL alive.

当没有 checkpoints 匹配时，CLI 将 `CHECKPOINT_REVERT_EMPTY` result 渲染为本地结构化失败。Chat 将其视为本地输出并保持 REPL 可用。

## Risks / Trade-offs

- [Risk] Users may expect preview to restore files. -> Mitigation: command name and output explicitly say `preview` and `dryRun=true`. / [风险] 用户可能以为 preview 会恢复文件。-> 缓解：command name 与 output 明确显示 `preview` 和 `dryRun=true`。
- [Risk] Empty previews are common until runtime-generated checkpoints are present. -> Mitigation: typed empty diagnostics explain the target did not match checkpoints. / [风险] 在 runtime-generated checkpoints 存在前，empty previews 会很常见。-> 缓解：类型化 empty diagnostics 解释 target 未匹配 checkpoints。
- [Risk] CLI host could grow too much. -> Mitigation: isolate parsing/rendering in a dedicated revert command module. / [风险] CLI host 可能继续膨胀。-> 缓解：将 parsing/rendering 隔离到专门的 revert command module。

## Migration Plan

1. Add CLI option parsing for `revert preview` and target flags. / 增加 `revert preview` 与 target flags 的 CLI option parsing。
2. Add revert command module using workspace-state dry-run. / 增加使用 workspace-state dry-run 的 revert command module。
3. Wire scriptable command and chat slash command. / 接入可脚本化 command 与 chat slash command。
4. Add tests for JSON/JSONL/text output, chat locality, and typed empty failures. / 增加 JSON/JSONL/text output、chat locality 与类型化 empty failures 测试。
5. Run validation and archive. / 运行验证并归档。

Rollback: remove the new CLI/chat routing and command module; existing workspace-state contracts remain unchanged.

回滚：移除新增 CLI/chat routing 与 command module；现有 workspace-state contracts 保持不变。
