## ADDED Requirements

### Requirement: Chat PageIndex Snapshot Resume / Chat PageIndex 快照恢复

The chat shell SHALL persist bounded PageIndex recall pages through session snapshots and SHALL restore them when started with an explicit `deepseek chat --session <session-id>`.

Chat shell 必须通过 session snapshots 持久化有界 PageIndex recall pages，并且在通过显式 `deepseek chat --session <session-id>` 启动时恢复这些 pages。

#### Scenario: Prompt turn snapshots PageIndex / Prompt Turn 快照 PageIndex
- **WHEN** a normal chat prompt finishes with a terminal runtime event and a session id is available
- **THEN** the shell writes a versioned `chat.pageindex.snapshot` payload through the session store containing bounded PageIndex pages, page count, schema version, and redaction metadata
- **中文** 当普通 chat prompt 以 terminal runtime event 结束且存在 session id 时，shell 必须通过 session store 写入 versioned `chat.pageindex.snapshot` payload，包含有界 PageIndex pages、page count、schema version 与 redaction metadata。

#### Scenario: Chat session restores recall pages / Chat Session 恢复 Recall Pages
- **WHEN** a user runs `deepseek chat --session <session-id>` for a session whose latest snapshot contains PageIndex pages
- **THEN** the shell restores those pages before processing slash commands, and `/palette recall <query>` can return matching prior turns without submitting a model request
- **中文** 当用户对 latest snapshot 包含 PageIndex pages 的 session 运行 `deepseek chat --session <session-id>` 时，shell 必须在处理 slash commands 前恢复这些 pages，并且 `/palette recall <query>` 能返回匹配的历史 turns，而不提交 model request。

#### Scenario: Explicit chat resume failure is typed / 显式 Chat Resume 失败类型化
- **WHEN** a user runs `deepseek chat --session <missing-session-id>` and the session store cannot resume that id
- **THEN** the shell emits a typed local resume failure and does not start a new ambiguous session or submit a model request
- **中文** 当用户运行 `deepseek chat --session <missing-session-id>` 且 session store 无法恢复该 id 时，shell 必须输出 typed local resume failure，不得启动新的 ambiguous session 或提交 model request。

#### Scenario: Snapshot output remains bounded / Snapshot 输出保持有界
- **WHEN** a prompt or assistant response contains text longer than the PageIndex preview limit
- **THEN** the snapshot payload contains only bounded previews and stable metadata, not the raw full transcript content
- **中文** 当 prompt 或 assistant response 包含超过 PageIndex preview limit 的文本时，snapshot payload 必须只包含有界 previews 与稳定 metadata，而不是 raw full transcript content。

#### Scenario: Restored pages preserve recall provenance / 恢复后的 Pages 保留回溯出处
- **WHEN** restored PageIndex pages are returned through `/palette recall <query>`
- **THEN** each result carries page id, session id, turn id, deterministic rank metadata, redaction metadata, and explicit session-scoped provenance so later projection can distinguish evidence-backed context from unsupported memory
- **中文** 当恢复后的 PageIndex pages 通过 `/palette recall <query>` 返回时，每个结果必须携带 page id、session id、turn id、deterministic rank metadata、redaction metadata 与显式 session-scoped provenance，使后续 projection 能区分 evidence-backed context 与 unsupported memory。
