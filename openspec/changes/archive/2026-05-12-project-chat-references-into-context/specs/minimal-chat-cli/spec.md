## ADDED Requirements

### Requirement: Chat File References Stay Local Until Prompt Turn / Chat 文件引用在 Prompt Turn 前保持本地

The chat shell SHALL allow users to add a file reference to the active reference set without reading file content or submitting a model/runtime request for the slash command itself.

Chat shell 必须允许用户把 file reference 加入 active reference set，但不得为该 slash command 自身读取文件内容或提交 model/runtime request。

#### Scenario: Add file reference locally / 本地增加文件引用

- **WHEN** the user enters `/palette refs add-file <path>`
- **THEN** the shell records a structured file reference target with path metadata, renders local reference state, and does not submit a model/runtime request for the slash command
- **中文** 当用户输入 `/palette refs add-file <path>` 时，shell 必须记录带 path metadata 的 structured file reference target，渲染本地 reference state，且不为该 slash command 提交 model/runtime request。

#### Scenario: File reference projects on next prompt / 文件引用在下一条 Prompt 投影

- **WHEN** a file reference exists and the user enters a normal prompt
- **THEN** the prompt turn carries the reference metadata to runtime so governed context projection can materialize the file content
- **中文** 当 file reference 存在且用户输入普通 prompt 时，该 prompt turn 必须将 reference metadata 携带到 runtime，以便 governed context projection materialize 文件内容。
