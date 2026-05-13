## ADDED Requirements

### Requirement: Chat Local PageIndex Recall / Chat 本地 PageIndex 回溯

The chat shell SHALL maintain a local PageIndex of completed prompt turns and expose `/palette recall <query>` as a local recall command without submitting the slash input to runtime or model execution.

Chat shell 必须维护 completed prompt turns 的本地 PageIndex，并暴露 `/palette recall <query>` 作为本地 recall command，不得把该 slash input 提交给 runtime 或 model execution。

#### Scenario: Completed prompt turn creates page / 完成的 Prompt Turn 创建 Page

- **WHEN** a normal chat prompt finishes with a terminal runtime event
- **THEN** the shell records a PageIndex page containing page id, session id, turn id, turn sequence, status, trace id, prompt preview, assistant preview, and redaction metadata
- **中文** 当普通 chat prompt 以 terminal runtime event 结束时，shell 必须记录一个 PageIndex page，包含 page id、session id、turn id、turn sequence、status、trace id、prompt preview、assistant preview 与 redaction metadata。

#### Scenario: Recall creates result list locally / Recall 本地创建结果列表

- **WHEN** the user enters `/palette recall <query>` during chat
- **THEN** the shell searches local PageIndex pages, stores matching pages as the active result list, renders deterministic recall records, and does not submit a runtime/model request
- **中文** 当用户在 chat 中输入 `/palette recall <query>` 时，shell 必须搜索本地 PageIndex pages，将匹配 pages 存为 active result list，渲染确定性 recall records，且不提交 runtime/model request。

#### Scenario: Missing recall query stays local / 缺少 Recall 查询保持本地

- **WHEN** the user enters `/palette recall` without a query
- **THEN** the shell emits a typed local failure and keeps the REPL available without submitting a runtime/model request
- **中文** 当用户输入没有 query 的 `/palette recall` 时，shell 必须输出 typed local failure 并保持 REPL 可用，不提交 runtime/model request。

#### Scenario: Recall output is bounded / Recall 输出有界

- **WHEN** recall returns matching pages
- **THEN** the shell renders only bounded prompt and assistant previews, stable ids, status, score metadata, and redaction metadata rather than raw full transcript content
- **中文** 当 recall 返回匹配 pages 时，shell 必须只渲染有界 prompt 与 assistant previews、stable ids、status、score metadata 和 redaction metadata，而不是 raw full transcript content。
