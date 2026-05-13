## ADDED Requirements

### Requirement: Chat Local Revert Preview / Chat 本地回退预览

The chat shell SHALL expose a local `/revert preview` control that renders request/turn/session revert preview results without sending the slash input to the model.

Chat shell 必须暴露本地 `/revert preview` control，渲染 request/turn/session revert preview results，且不得把 slash input 发送给 model。

#### Scenario: Chat revert preview stays local / Chat 回退预览保持本地
- **WHEN** the user enters `/revert preview --turn <turn-id>` during chat
- **THEN** the shell parses the target, renders a local structured revert preview result, and does not submit a runtime/model request
- **中文** 当用户在 chat 中输入 `/revert preview --turn <turn-id>` 时，shell 必须解析 target、渲染本地结构化 revert preview result，且不提交 runtime/model request。

#### Scenario: Chat revert malformed input is local failure / Chat 回退格式错误是本地失败
- **WHEN** the user enters `/revert preview` without a target selector
- **THEN** the shell emits a typed local failure and keeps the REPL available
- **中文** 当用户输入没有 target selector 的 `/revert preview` 时，shell 必须输出 typed local failure，并保持 REPL 可用。
