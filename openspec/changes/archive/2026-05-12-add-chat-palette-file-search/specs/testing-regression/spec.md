## ADDED Requirements

### Requirement: Chat File Search Regression Coverage / Chat 文件搜索回归覆盖

Regression tests SHALL cover chat-local file search result lists, navigation, current-file reference creation, prompt-time projection, and no slash-command model submission.

回归测试必须覆盖 chat-local file search result lists、navigation、current-file reference creation、prompt-time projection，以及 slash-command 不提交 model。

#### Scenario: File search slash stays local in tests / 文件搜索 Slash 在测试中保持本地

- **WHEN** CLI host tests run scripted chat input containing `/palette files <pattern>` and navigation commands
- **THEN** tests assert local file-search and palette action records, changed result-list focus, no ANSI controls in structured output, and no `model.requested` event before a non-slash prompt
- **中文** 当 CLI host tests 运行包含 `/palette files <pattern>` 与 navigation commands 的 scripted chat input 时，测试必须断言本地 file-search 与 palette action records、result-list focus 变化、structured output 不含 ANSI controls，并且非 slash prompt 前没有 `model.requested` event。

#### Scenario: Current file result projects on prompt / 当前文件结果在 Prompt 投影

- **WHEN** CLI host tests focus a file result, run `/palette refs add current`, and then submit a normal prompt
- **THEN** tests assert the active reference item is `kind=file`, the model request contains runtime-owned projected file context, and the user prompt message remains unchanged
- **中文** 当 CLI host tests 聚焦 file result、运行 `/palette refs add current` 后提交普通 prompt 时，测试必须断言 active reference item 为 `kind=file`、model request 包含 runtime-owned projected file context，且 user prompt message 保持不变。

#### Scenario: File search content boundary is tested / 文件搜索内容边界被测试

- **WHEN** CLI host tests run only `/palette files <pattern>` and reference slash commands before a prompt
- **THEN** tests assert raw matched file content is absent from local JSONL records and no model request is emitted
- **中文** 当 CLI host tests 在 prompt 前只运行 `/palette files <pattern>` 与 reference slash commands 时，测试必须断言 local JSONL records 不包含 matched file raw content，且不发出 model request。
