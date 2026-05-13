## MODIFIED Requirements

### Requirement: Chat PageIndex Recall References Project On Prompt / Chat PageIndex 回溯引用在 Prompt 时投影

The chat shell SHALL allow focused PageIndex recall results from executable PageIndex scopes to be added as active references and carried as structured metadata on the next normal prompt without mutating the prompt text.

Chat shell 必须允许来自可执行 PageIndex scope 的 focused PageIndex recall results 被加入 active references，并在下一条普通 prompt 中作为 structured metadata 携带，且不得修改 prompt text。

#### Scenario: Add current recall result to references / 当前 Recall 结果加入引用

- **WHEN** the user focuses a PageIndex recall result and enters `/palette refs add current`
- **THEN** the active reference set receives a `kind=turn` reference item preserving scope, page id, session id, turn id, bounded previews, deterministic score, and redaction metadata
- **中文** 当用户聚焦 PageIndex recall result 并输入 `/palette refs add current` 时，active reference set 必须收到 `kind=turn` reference item，并保留 scope、page id、session id、turn id、有界 previews、deterministic score 与 redaction metadata。

#### Scenario: Recall reference projects on next prompt / Recall 引用在下一条 Prompt 投影

- **WHEN** a PageIndex recall reference exists and the user enters a normal prompt
- **THEN** the shell submits the exact prompt text plus structured reference metadata, and runtime-owned context projection materializes the bounded recall summary before model dispatch
- **中文** 当存在 PageIndex recall reference 且用户输入普通 prompt 时，shell 必须提交原样 prompt text 与 structured reference metadata，并由 runtime-owned context projection 在 model dispatch 前物化有界 recall summary。

#### Scenario: Workspace recall reference carries workspace provenance / Workspace Recall 引用携带 Workspace 来源

- **WHEN** a workspace-scoped PageIndex recall result is added to references and the user enters a normal prompt
- **THEN** the next runtime request carries a `kind=turn` reference with `scope=workspace`, and projected model context includes bounded workspace-scope recall provenance without exposing raw full transcript content
- **中文** 当 workspace-scoped PageIndex recall result 被加入 references 且用户输入普通 prompt 时，下一次 runtime request 必须携带 `scope=workspace` 的 `kind=turn` reference，并且投影后的模型上下文必须包含有界 workspace-scope recall provenance，不暴露完整原始 transcript content。
