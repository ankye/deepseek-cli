## ADDED Requirements

### Requirement: Chat Local Text Search Control / Chat 本地文本搜索控制

The chat shell SHALL expose a local `/palette grep <text>` control that searches workspace text through the injected platform abstraction, creates a navigable result list, and does not submit the slash input to runtime or model execution.

Chat shell 必须暴露本地 `/palette grep <text>` 控制，通过注入的 platform abstraction 搜索 workspace text，创建可导航 result list，且不得把该 slash input 提交给 runtime 或 model execution。

#### Scenario: Text search creates result list / 文本搜索创建结果列表

- **WHEN** the user enters `/palette grep <text>` during chat
- **THEN** the shell searches workspace text through the platform abstraction, stores bounded matches as the active result list, renders deterministic local search records, and does not submit a runtime/model request
- **中文** 当用户在 chat 中输入 `/palette grep <text>` 时，shell 必须通过 platform abstraction 搜索 workspace text，将有界 matches 存为 active result list，渲染确定性的本地 search records，且不提交 runtime/model request。

#### Scenario: Missing text search pattern stays local / 缺少文本搜索 Pattern 保持本地

- **WHEN** the user enters `/palette grep` without text
- **THEN** the shell emits a typed local failure and keeps the REPL available without submitting a runtime/model request
- **中文** 当用户输入没有 text 的 `/palette grep` 时，shell 必须输出 typed local failure 并保持 REPL 可用，不提交 runtime/model request。

#### Scenario: Text search output is bounded / 文本搜索输出有界

- **WHEN** `/palette grep <text>` returns matching lines
- **THEN** the shell renders only bounded metadata and preview text for each match, and full file content remains unavailable until a subsequent prompt turn carries active references to runtime projection
- **中文** 当 `/palette grep <text>` 返回匹配行时，shell 必须只为每个 match 渲染有界 metadata 与 preview text；完整 file content 必须直到后续 prompt turn 携带 active references 交给 runtime projection 后才可用。
