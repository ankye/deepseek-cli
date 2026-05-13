## ADDED Requirements

### Requirement: Chat PageIndex Recall Explain / Chat PageIndex 回溯解释

The chat shell SHALL expose a local `/palette recall explain` command that explains the focused or selected PageIndex recall result without submitting the command to runtime or model execution.

Chat shell 必须暴露本地 `/palette recall explain` command，用于解释 focused 或 selected PageIndex recall result，且不得把该 command 提交给 runtime 或 model execution。

#### Scenario: Explain current recall result locally / 本地解释当前 Recall 结果

- **WHEN** the user enters `/palette recall explain` or `/palette recall explain current` after a PageIndex recall result list exists
- **THEN** the shell renders a bounded explain record for the active recall item containing scope, page id, session id, turn id, createdAt, freshness status, matched fields, ranking reason, deterministic score, semantic status, and redaction metadata
- **中文** 当用户在已有 PageIndex recall result list 后输入 `/palette recall explain` 或 `/palette recall explain current` 时，shell 必须为 active recall item 渲染有界 explain record，包含 scope、page id、session id、turn id、createdAt、freshness status、matched fields、ranking reason、deterministic score、semantic status 与 redaction metadata。

#### Scenario: Explain selected recall result locally / 本地解释指定 Recall 结果

- **WHEN** the user enters `/palette recall explain <item-id|target-id>`
- **THEN** the shell resolves the selected PageIndex recall item from local result-list state and renders its bounded explain record without submitting a runtime/model request
- **中文** 当用户输入 `/palette recall explain <item-id|target-id>` 时，shell 必须从本地 result-list state 解析指定 PageIndex recall item，并渲染其有界 explain record，不提交 runtime/model request。

#### Scenario: Missing explain target is typed / 缺失 Explain 目标类型化

- **WHEN** the user enters `/palette recall explain` before a PageIndex recall result exists, or selects a missing item
- **THEN** the shell emits a typed local failure and preserves the prior palette state
- **中文** 当用户在没有 PageIndex recall result 前输入 `/palette recall explain`，或选择不存在的 item 时，shell 必须输出 typed local failure，并保持之前的 palette state。

#### Scenario: Explain output remains bounded / Explain 输出保持有界

- **WHEN** an explained recall item originated from a prompt or assistant response with hidden long content
- **THEN** the explain output includes only bounded previews and metadata, not raw full transcript content
- **中文** 当被解释的 recall item 来源 prompt 或 assistant response 包含隐藏长内容时，explain output 必须只包含有界 previews 与 metadata，而不是完整原始 transcript content。
