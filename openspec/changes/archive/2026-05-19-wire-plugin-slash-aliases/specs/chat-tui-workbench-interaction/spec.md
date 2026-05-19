## ADDED Requirements

### Requirement: Built-in plugin slash aliases bridge with input awareness
The chat TUI SHALL distinguish complete built-in plugin slash aliases from aliases that require arguments when accepting command bar suggestions.

Chat TUI 必须在接受 command bar suggestions 时，区分完整 built-in plugin slash aliases 与需要参数的 aliases。

#### Scenario: Plugin alias requiring arguments becomes draft prefix
- **WHEN** the command bar accepts a built-in plugin slash suggestion whose owner route metadata contains a placeholder fallback command
- **THEN** raw chat input inserts the selected slash alias plus one trailing space into the pending prompt buffer instead of submitting it
- **中文** 当 command bar 接受 owner route metadata 含 placeholder fallback command 的 built-in plugin slash suggestion 时，raw chat input 必须将所选 slash alias 加一个尾随空格插入 pending prompt buffer，而不是立即提交。

#### Scenario: Complete plugin alias submits as local slash prompt
- **WHEN** the command bar accepts a built-in plugin slash suggestion whose owner route metadata has no required placeholder
- **THEN** raw chat input submits that slash alias as a local chat prompt
- **中文** 当 command bar 接受 owner route metadata 不含 required placeholder 的 built-in plugin slash suggestion 时，raw chat input 必须将该 slash alias 作为 local chat prompt 提交。

### Requirement: Built-in plugin slash aliases execute locally after completion
The chat slash router SHALL handle supported first-party built-in plugin slash aliases through an injected owner-route alias registry and local owner subsystem handlers.

Chat slash router 必须通过注入式 owner-route alias registry 与本地 owner subsystem handlers 处理受支持的一方内置插件 slash aliases。

#### Scenario: Repo slash alias executes through repo navigator
- **WHEN** the user submits `/repo files <query>` or `/repo grep <query>` in chat
- **THEN** the CLI resolves the request through the repo navigator owner subsystem and projects any result list into TUI state
- **中文** 当用户在 chat 中提交 `/repo files <query>` 或 `/repo grep <query>` 时，CLI 必须通过 repo navigator owner subsystem 解析请求，并将可用 result list 投影到 TUI state。

#### Scenario: Git and checks slash aliases execute through owner subsystems
- **WHEN** the user submits `/git status`, `/git diff`, `/git review`, or a supported `/checks <action>` alias in chat
- **THEN** the CLI routes the request through the git review or developer checks owner subsystem without invoking plugin-private code
- **中文** 当用户在 chat 中提交 `/git status`、`/git diff`、`/git review` 或受支持的 `/checks <action>` alias 时，CLI 必须通过 git review 或 developer checks owner subsystem 路由请求，且不得调用 plugin-private code。

#### Scenario: Plugin aliases are injected rather than hard-coded
- **WHEN** a first-party plugin owner route exposes a slash alias
- **THEN** the chat slash router can match the longest slash alias from the injected registry without adding that business command name to the core router
- **中文** 当一方 plugin owner route 暴露 slash alias 时，chat slash router 必须能从注入式 registry 中匹配最长 slash alias，而无需将该业务 command name 加入 core router。

### Requirement: Executable plugin slash aliases rank before metadata entries
The chat TUI command bar SHALL rank executable plugin slash aliases before informational plugin palette metadata entries when both match the same query.

Chat TUI command bar 在 executable plugin slash aliases 与 informational plugin palette metadata entries 同时匹配 query 时，必须优先展示 executable plugin slash aliases。

#### Scenario: Repo query selects executable alias first
- **WHEN** the command bar query is `repo`
- **THEN** `/repo files <query>` is selectable before `Repo: Files` metadata inspection entries
- **中文** 当 command bar query 为 `repo` 时，`/repo files <query>` 必须排在 `Repo: Files` 等 metadata inspection entries 之前。
