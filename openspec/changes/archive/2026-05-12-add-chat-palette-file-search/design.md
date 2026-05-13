## Context

The CLI already has a local palette state, result-list navigation, jump traversal, reference sets, `/palette refs add-file <path>`, and runtime-owned reference projection. The missing product workflow is discovery: users need a local command that turns workspace file matches into the same quickfix-style list used by vi-inspired navigation.

CLI 现有实现已经具备本地 palette state、result-list navigation、jump traversal、reference sets、`/palette refs add-file <path>` 和 runtime-owned reference projection。当前缺失的是 discovery：用户需要一个本地命令，把 workspace file matches 转成同一套 vi-inspired quickfix-style list。

The implementation must keep the CLI host thin. File discovery can call `deps.platform.findFiles(pattern, workspaceRoot)` because this is host/platform discovery, but file content must not be read in the slash command. Content materialization remains owned by runtime context projection on the next normal prompt.

实现必须保持 CLI host 轻薄。文件发现可以调用 `deps.platform.findFiles(pattern, workspaceRoot)`，因为这是 host/platform discovery；但 slash command 不得读取文件内容。文件内容 materialization 仍由下一条普通 prompt 触发的 runtime context projection 负责。

## Goals / Non-Goals

**Goals:**

- Add `/palette files <pattern>` as a chat-local command that creates a navigable file result list.
- Preserve vi-inspired navigation semantics: `next`, `previous`, `first`, `last`, `back`, `forward`, and `refs add current` operate on file results through the existing action model.
- Normalize displayed and referenced file paths to workspace-relative paths when possible, while retaining governed path resolution in runtime.
- Keep all slash commands model-hidden and runtime-hidden until a non-slash prompt is submitted.
- Add deterministic CLI tests proving local file search, selected-file reference creation, and prompt-time projection.

**Non-Goals:**

- No raw-mode Vim buffer, marks, registers, macros, or text-object behavior.
- No file content preview, inline search-text result expansion, symbol picker, or directory tree UI in this slice.
- No new runtime API, model gateway behavior, or external dependency.
- No cross-app import from VSCode or other host adapters.

## Decisions

1. **Represent file matches as a standard `CliResultList`.**

   `/palette files <pattern>` will replace the active result list with `id=result-list:files`, `kind=search`, `sourceCommand=palette.files`, and items whose `target.kind` is `file`. This reuses the existing action resolver instead of creating a second navigation system.

   `/palette files <pattern>` 会把 active result list 替换为 `id=result-list:files`、`kind=search`、`sourceCommand=palette.files`，其中 item 的 `target.kind` 为 `file`。这复用现有 action resolver，而不是另建一套 navigation system。

   Alternative considered: create a custom file-reference command that skips result lists. Rejected because it would bypass jump history and the vi-inspired composition model.

2. **Use workspace-relative paths for result targets when possible.**

   Platform adapters may return absolute paths with host-specific separators. The CLI will derive a stable workspace-relative path for labels, ids, and `target.path` when the match is inside the workspace root. Absolute paths that cannot be relativized remain as returned and are still later governed by runtime path resolution.

   Platform adapters 可能返回带 host-specific separators 的绝对路径。CLI 会在 match 位于 workspace root 内时，为 label、id 和 `target.path` 派生稳定的 workspace-relative path。无法相对化的 absolute path 保持原样，后续仍由 runtime path resolution 治理。

   Alternative considered: store absolute paths for perfect host fidelity. Rejected because JSONL and metadata become less portable and harder to compare across Windows/Linux tests.

3. **Keep content reads out of `/palette files`.**

   The slash command only records file target metadata. The next non-slash prompt carries `referenceContext`, and runtime projection decides whether content is selected, excluded, or redacted.

   Slash command 只记录 file target metadata。下一条非 slash prompt 携带 `referenceContext`，由 runtime projection 决定 content 是否 selected、excluded 或 redacted。

   Alternative considered: preview matched file content in the list. Rejected for privacy, performance, and prompt-boundary reasons.

4. **Render deterministic local records.**

   JSONL output should include a file-search summary and item records wrapped by the existing `chat.command.*` local record envelope. Text output should remain concise and useful for manual testing.

   JSONL output 应包含 file-search summary 和 item records，并继续使用现有 `chat.command.*` local record envelope。Text output 保持简洁，便于手工测试。

## Risks / Trade-offs

- [Risk] Large repositories may return many files and produce noisy output. → Mitigation: cap rendered and stored matches to a deterministic first page in the CLI helper, and record total matched count in metadata.
- [Risk] Path normalization may differ across platforms. → Mitigation: normalize separators to `/` in CLI metadata and rely on runtime `resolveWorkspacePath` for final host-specific resolution.
- [Risk] Empty or malformed patterns could unexpectedly enumerate a full repo. → Mitigation: require a non-empty pattern for this slice and return a typed local failure when missing.
- [Risk] File result list replacement could discard the default command palette focus. → Mitigation: this is intentional quickfix behavior; `/palette` recreates the command palette list when needed.
