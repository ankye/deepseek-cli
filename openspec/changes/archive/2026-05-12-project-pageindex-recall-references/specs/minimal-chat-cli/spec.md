## ADDED Requirements

### Requirement: Chat PageIndex Recall References Project On Prompt / Chat PageIndex 回溯引用在 Prompt 时投影

The chat shell SHALL allow focused PageIndex recall results to be added as active references and carried as structured metadata on the next normal prompt without mutating the prompt text.

Chat shell 必须允许 focused PageIndex recall results 被加入 active references，并在下一条普通 prompt 中作为 structured metadata 携带，且不得修改 prompt text。

#### Scenario: Add current recall result to references / 当前 Recall 结果加入引用

- **WHEN** the user focuses a PageIndex recall result and enters `/palette refs add current`
- **THEN** the active reference set receives a `kind=turn` reference item preserving page id, session id, turn id, bounded previews, deterministic score, and redaction metadata
- **中文** 当用户聚焦 PageIndex recall result 并输入 `/palette refs add current` 时，active reference set 必须收到 `kind=turn` reference item，并保留 page id、session id、turn id、有界 previews、deterministic score 与 redaction metadata。

#### Scenario: Recall reference projects on next prompt / Recall 引用在下一条 Prompt 投影

- **WHEN** a PageIndex recall reference exists and the user enters a normal prompt
- **THEN** the shell submits the exact prompt text plus structured reference metadata, and runtime-owned context projection materializes the bounded recall summary before model dispatch
- **中文** 当存在 PageIndex recall reference 且用户输入普通 prompt 时，shell 必须提交原样 prompt text 与 structured reference metadata，并由 runtime-owned context projection 在 model dispatch 前物化有界 recall summary。
