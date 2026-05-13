## Context

The CLI now has local file discovery through `/palette files <pattern>`, quickfix-style result-list navigation, file references, and runtime-owned prompt-time projection. Text search should reuse the same interaction model instead of introducing a separate grep UI.

CLI 目前已经具备 `/palette files <pattern>` 本地文件发现、quickfix-style result-list navigation、file references 和 runtime-owned prompt-time projection。文本搜索应复用同一 interaction model，而不是引入单独的 grep UI。

`PlatformRuntime.searchText(pattern, root)` already abstracts the search provider and returns path, line, text preview, engine, and provider metadata. The CLI host can call this local platform service, but it must not become the owner of model-visible context construction.

`PlatformRuntime.searchText(pattern, root)` 已经抽象 search provider，并返回 path、line、text preview、engine 和 provider metadata。CLI host 可以调用这个本地 platform service，但不得成为 model-visible context construction 的 owner。

## Goals / Non-Goals

**Goals:**

- Add `/palette grep <text>` as a chat-local command.
- Create a deterministic `CliResultList` from text matches with file targets, line metadata, bounded preview, and provider metadata.
- Reuse existing `next`, `previous`, `first`, `last`, `back`, `forward`, and `/palette refs add current` behavior.
- Keep slash-command output bounded and model-hidden.
- Preserve prompt boundaries: full content is only materialized by runtime projection after a normal prompt submits active references.

**Non-Goals:**

- No regex language design, glob filtering, replace mode, or full ripgrep flag compatibility in this slice.
- No fragment-level runtime projection or line-range content injection yet.
- No raw-mode Vim search bindings yet.
- No new platform contract; reuse `PlatformRuntime.searchText`.

## Decisions

1. **Use `sourceCommand=palette.grep` and `kind=search`.**

   Text search results become the active result list using the same result-list mechanics as file search. This keeps vi-style navigation and jump history uniform.

   文本搜索结果成为 active result list，并使用与文件搜索相同的 result-list mechanics。这保持 vi-style navigation 与 jump history 一致。

2. **Keep result targets as `file` targets with line metadata.**

   Each item target uses `kind=file`, `path=<relative path>`, and metadata containing `line`, `matchText`, `engine`, and provider status. This lets `/palette refs add current` create an existing file reference that runtime projection already understands, while retaining line provenance for later fragment projection.

   每个 item target 使用 `kind=file`、`path=<relative path>`，metadata 包含 `line`、`matchText`、`engine` 和 provider status。这样 `/palette refs add current` 可以创建 runtime projection 已理解的现有 file reference，同时保留 line provenance 供后续 fragment projection 使用。

   Alternative considered: add a new `search-result` target kind projection path immediately. Rejected because it would widen runtime contracts before the file-reference path is fully hardened.

3. **Bound previews and item count.**

   The CLI renders at most a deterministic first page of matches and trims match text previews. This avoids dumping large files into local JSONL output and keeps tests stable.

   CLI 只渲染确定性的第一页 matches，并裁剪 match text previews。这避免把大文件内容倒入 local JSONL output，并保持测试稳定。

4. **Require a non-empty search text.**

   `/palette grep` without text returns a typed local failure. Empty full-workspace grep is too noisy for the initial UX.

   没有 text 的 `/palette grep` 返回 typed local failure。空 full-workspace grep 对初始 UX 过于嘈杂。

## Risks / Trade-offs

- [Risk] Preview text can contain sensitive snippets. → Mitigation: previews are bounded, full file content is not rendered, and raw secret projection remains governed by runtime redaction/exclusion.
- [Risk] Adding current from a line match currently projects the whole file, not only the matching line. → Mitigation: preserve line metadata and document fragment projection as a follow-up.
- [Risk] Search provider output order may vary. → Mitigation: sort by normalized path, then line, then preview text before creating result-list items.
- [Risk] Large match sets can flood structured output. → Mitigation: cap stored/rendered matches and expose total matched count in summary metadata.
