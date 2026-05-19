## Context

The file-manager and jump-navigator plugins already expose host-owned adapters, owner-route dispatch, workbench execution records, and top-level CLI commands. Chat currently supports local slash commands such as `/context`, `/palette`, `/history`, and `/revert`, but `/file` and `/jump` are still absent from that local layer.

File-manager 与 jump-navigator plugins 已经具备 host-owned adapters、owner-route dispatch、workbench execution records 与顶层 CLI commands。Chat 目前已经支持 `/context`、`/palette`、`/history` 与 `/revert` 等 local slash commands，但 `/file` 与 `/jump` 仍未进入本地命令层。

## Goals / Non-Goals

**Goals:**
- Reuse `resolveFileManager` and `resolveJumpNavigator` for chat slash execution.
- Keep `/file` and `/jump` local: no agent/model turn should be submitted for these commands.
- Render text, JSON, and JSONL using the existing file/jump renderers.
- Attach result lists to chat palette state so TUI result-list navigation works after local navigation slash commands.
- Preserve missing-query diagnostics and deferred symbol jump behavior.

**目标：**
- 复用 `resolveFileManager` 与 `resolveJumpNavigator` 执行 chat slash。
- 保持 `/file` 与 `/jump` 本地化：这些命令不得提交 agent/model turn。
- 复用现有 file/jump renderers 输出 text、JSON 与 JSONL。
- 将 result lists 附加到 chat palette state，让 TUI 在本地导航 slash 命令后可进入 result-list navigation。
- 保留 missing-query diagnostics 与 symbol jump deferred 行为。

**Non-Goals:**
- Do not implement write, rename, delete, or open-in-editor file operations.
- Do not implement semantic symbol search in this change.
- Do not add plugin-private execution callbacks or a second plugin UI runtime.
- Do not replace existing `/palette files` or `/palette grep` flows.

**非目标：**
- 本变更不实现 write、rename、delete 或 open-in-editor file operations。
- 本变更不实现 semantic symbol search。
- 不增加 plugin-private execution callbacks 或第二套 plugin UI runtime。
- 不替换现有 `/palette files` 或 `/palette grep` flows。

## Decisions

### Decision: Slash Parser Mirrors CLI Ergonomics

`/file` defaults to `list`, maps `refs` to `references`, and treats the remaining text as the query. `/jump` defaults to `file` and supports `file`, `text`, and `symbol`. The resolver owns missing-query failures so diagnostics stay identical across CLI and chat.

`/file` 默认使用 `list`，将 `refs` 映射为 `references`，并把剩余文本作为 query。`/jump` 默认使用 `file`，支持 `file`、`text` 与 `symbol`。缺失 query 的失败仍由 resolver 负责，以保持 CLI 与 chat diagnostics 一致。

### Decision: Result Lists Update Chat Palette State

When a navigation slash command returns a `resultList`, chat will create or update the palette snapshot with that list as the active list. This keeps the vi/TUI navigation model consistent: `/file list src`, `/jump text needle`, then `j/k` or `/palette refs add current` can operate on the result.

当 navigation slash command 返回 `resultList` 时，chat 会创建或更新 palette snapshot，并将该 list 设为 active list。这样 vi/TUI navigation model 保持一致：`/file list src`、`/jump text needle` 后，`j/k` 或 `/palette refs add current` 可以继续作用在该结果上。

### Decision: JSONL Uses Chat Command Envelopes

The existing renderers emit `file.manager.*` and `jump.navigator.*` JSONL records. Chat wraps those records as `chat.command.file` and `chat.command.jump`, matching existing `/palette` and `/context` local command conventions.

现有 renderers 会输出 `file.manager.*` 与 `jump.navigator.*` JSONL records。Chat 会将这些 records 包装为 `chat.command.file` 与 `chat.command.jump`，对齐现有 `/palette` 与 `/context` local command conventions。

## Risks / Trade-offs

- [Risk] `/file` may look like a mutation surface. -> Mitigation: only expose read-only list, preview, and refs actions.
- [风险] `/file` 可能被误解为 mutation surface。-> 缓解：只暴露只读 list、preview 与 refs actions。
- [Risk] Result-list projection may duplicate `/palette files` behavior. -> Mitigation: keep `/file` as plugin workflow entry and keep `/palette files` as generic palette search.
- [风险] Result-list projection 可能与 `/palette files` 有重叠。-> 缓解：`/file` 保持为 plugin workflow entry，`/palette files` 保持为通用 palette search。
- [Risk] Symbol jump appears complete. -> Mitigation: keep `deferred` status and typed `JUMP_NAVIGATOR_SYMBOL_DEFERRED` diagnostics.
- [风险] Symbol jump 看起来像已完整实现。-> 缓解：保持 `deferred` status 与 typed `JUMP_NAVIGATOR_SYMBOL_DEFERRED` diagnostics。

## Migration Plan

1. Add chat slash parser helpers for file and jump commands.
2. Reuse existing adapters and renderers from chat without adding runtime turns.
3. Add palette-state projection helper for plugin result lists.
4. Update TUI local-command mode selection for file/jump result lists.
5. Add deterministic chat tests and run OpenSpec, typecheck, lint, boundary, and regression checks.
