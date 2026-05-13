## ADDED Requirements

### Requirement: Chat Prompt Turns Carry Active References / Chat Prompt Turn 携带当前引用

The chat shell SHALL include active palette reference sets as structured `referenceContext` metadata when submitting non-slash prompt turns.

Chat shell 在提交非 slash prompt turns 时，必须将 active palette reference sets 作为结构化 `referenceContext` metadata 一起提交。

#### Scenario: Prompt receives active reference metadata / Prompt 接收当前引用元数据

- **WHEN** the user adds references with `/palette refs add ...` and then enters a normal prompt
- **THEN** the shell submits the prompt through the runtime with `referenceContext` metadata derived from local composition state
- **中文** 当用户通过 `/palette refs add ...` 增加 references 后输入普通 prompt 时，shell 必须通过 runtime 提交 prompt，并携带从本地 composition state 派生的 `referenceContext` metadata。

#### Scenario: Slash commands remain model-hidden / Slash 命令继续对模型隐藏

- **WHEN** the user lists, focuses, or adds references with `/palette refs ...`
- **THEN** those slash commands remain local and do not themselves submit model/runtime requests
- **中文** 当用户通过 `/palette refs ...` list、focus 或 add references 时，这些 slash commands 必须保持本地化，且其自身不提交 model/runtime requests。

#### Scenario: Prompt text is unchanged / Prompt 文本不被修改

- **WHEN** chat submits a prompt with active references
- **THEN** the user prompt text sent to the agent loop remains the exact non-slash prompt text, while references are carried separately as metadata
- **中文** 当 chat 携带 active references 提交 prompt 时，发送给 agent loop 的 user prompt text 必须保持确切的非 slash prompt text，references 必须单独作为 metadata 携带。
