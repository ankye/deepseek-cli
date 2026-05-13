## ADDED Requirements

### Requirement: Chat Local File Search Control / Chat 本地文件搜索控制

The chat shell SHALL expose a local `/palette files <pattern>` control that searches workspace files through the injected platform abstraction, creates a navigable file result list, and does not submit the slash input to runtime or model execution.

Chat shell 必须暴露本地 `/palette files <pattern>` 控制，通过注入的 platform abstraction 搜索 workspace files，创建可导航 file result list，且不得把该 slash input 提交给 runtime 或 model execution。

#### Scenario: File search creates result list / 文件搜索创建结果列表

- **WHEN** the user enters `/palette files <pattern>` during chat
- **THEN** the shell searches workspace files through the platform abstraction, stores the matches as the active result list, renders deterministic local file-search records, and does not submit a runtime/model request
- **中文** 当用户在 chat 中输入 `/palette files <pattern>` 时，shell 必须通过 platform abstraction 搜索 workspace files，将 matches 存为 active result list，渲染确定性的本地 file-search records，且不提交 runtime/model request。

#### Scenario: Missing file search pattern stays local / 缺少文件搜索 Pattern 保持本地

- **WHEN** the user enters `/palette files` without a pattern
- **THEN** the shell emits a typed local failure and keeps the REPL available without submitting a runtime/model request
- **中文** 当用户输入没有 pattern 的 `/palette files` 时，shell 必须输出 typed local failure 并保持 REPL 可用，不提交 runtime/model request。

#### Scenario: File search does not read content / 文件搜索不读取内容

- **WHEN** `/palette files <pattern>` returns matching file paths
- **THEN** the shell records path metadata only and does not read or render raw file content until a subsequent prompt turn carries active references to runtime projection
- **中文** 当 `/palette files <pattern>` 返回匹配 file paths 时，shell 必须只记录 path metadata，不读取或渲染 raw file content，直到后续 prompt turn 携带 active references 交给 runtime projection。
