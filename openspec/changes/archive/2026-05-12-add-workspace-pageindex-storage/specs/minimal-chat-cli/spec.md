## ADDED Requirements

### Requirement: Chat Workspace PageIndex Recall / Chat Workspace PageIndex 回溯

The chat shell SHALL persist bounded PageIndex evidence to workspace metadata and SHALL support `/palette recall --scope workspace <query>` without submitting the slash input to runtime or model execution.

Chat shell 必须将有界 PageIndex evidence 持久化到 workspace metadata，并且必须支持 `/palette recall --scope workspace <query>`，不得把该 slash input 提交给 runtime 或 model execution。

#### Scenario: Prompt turn persists workspace page / Prompt Turn 持久化 Workspace Page

- **WHEN** a normal chat prompt finishes with a terminal runtime event and workspace metadata storage is available
- **THEN** the shell writes a bounded workspace PageIndex record containing page id, scope, workspace root metadata, session id, turn id, turn sequence, status, trace id, prompt preview, assistant preview, semantic status, and redaction metadata
- **中文** 当普通 chat prompt 以 terminal runtime event 结束且 workspace metadata storage 可用时，shell 必须写入有界 workspace PageIndex record，包含 page id、scope、workspace root metadata、session id、turn id、turn sequence、status、trace id、prompt preview、assistant preview、semantic status 与 redaction metadata。

#### Scenario: Workspace recall searches persisted pages / Workspace Recall 搜索持久化 Pages

- **WHEN** the user enters `/palette recall --scope workspace <query>` in a later chat session in the same workspace
- **THEN** the shell loads workspace PageIndex pages, searches them locally, renders recall records with `scope=workspace`, and does not submit a runtime/model request
- **中文** 当用户在同一 workspace 的后续 chat session 输入 `/palette recall --scope workspace <query>` 时，shell 必须加载 workspace PageIndex pages、本地搜索、渲染带 `scope=workspace` 的 recall records，且不提交 runtime/model request。

#### Scenario: Workspace recall does not fall back to session / Workspace Recall 不回退到 Session

- **WHEN** workspace PageIndex storage cannot be resolved or read
- **THEN** the shell emits a typed local workspace recall failure or deferred diagnostic and does not return session-scoped result items for a workspace-scoped request
- **中文** 当 workspace PageIndex storage 无法 resolve 或读取时，shell 必须输出 typed local workspace recall failure 或 deferred diagnostic，且不得为 workspace-scoped request 返回 session-scoped result items。

#### Scenario: Workspace page output is bounded / Workspace Page 输出有界

- **WHEN** prompt or assistant text exceeds the PageIndex preview limit
- **THEN** persisted workspace PageIndex records and recall output contain only bounded previews and stable provenance, not the raw full transcript content
- **中文** 当 prompt 或 assistant text 超过 PageIndex preview limit 时，持久化 workspace PageIndex records 与 recall output 必须只包含有界 previews 与稳定 provenance，而不是 raw full transcript content。

#### Scenario: Global recall remains deferred / Global Recall 继续延后

- **WHEN** the user enters `/palette recall --scope global <query>`
- **THEN** the shell emits a typed local deferred result until global PageIndex storage is explicitly implemented
- **中文** 当用户输入 `/palette recall --scope global <query>` 时，shell 必须输出 typed local deferred result，直到 global PageIndex storage 被显式实现。
