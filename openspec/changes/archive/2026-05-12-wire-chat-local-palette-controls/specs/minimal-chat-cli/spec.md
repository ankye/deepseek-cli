## ADDED Requirements

### Requirement: Chat Local Palette Controls / Chat 本地 Palette 控制

The chat shell SHALL expose local palette and keymap slash controls that reuse typed palette projection and action resolution without sending those slash inputs to the model.

Chat shell 必须暴露本地 palette 与 keymap slash controls，复用 typed palette projection 与 action resolution，且不得把这些 slash inputs 发送给 model。

#### Scenario: Palette slash renders locally / Palette Slash 本地渲染
- **WHEN** the user enters `/palette` or `/palette list` during chat
- **THEN** the shell renders the command palette locally and does not submit a runtime/model request
- **中文** 当用户在 chat 中输入 `/palette` 或 `/palette list` 时，shell 必须本地渲染 command palette，且不提交 runtime/model request。

#### Scenario: Keymap slash renders locally / Keymap Slash 本地渲染
- **WHEN** the user enters `/keymap vi-minimal` during chat
- **THEN** the shell renders the vi-minimal keymap profile locally with deterministic diagnostics
- **中文** 当用户在 chat 中输入 `/keymap vi-minimal` 时，shell 必须本地渲染 vi-minimal keymap profile，并包含确定性 diagnostics。

#### Scenario: Palette action slash is dry-run / Palette Action Slash 是 Dry Run
- **WHEN** the user enters `/palette action inspect <target-id>` during chat
- **THEN** the shell resolves the action as a dry-run typed action result without mutating workspace, sessions, checkpoints, or executing command owners
- **中文** 当用户在 chat 中输入 `/palette action inspect <target-id>` 时，shell 必须将 action 解析为 dry-run typed action result，且不修改 workspace、sessions、checkpoints 或执行 command owners。

#### Scenario: Palette slash failure is typed / Palette Slash 失败类型化
- **WHEN** the user enters `/palette action inspect <unknown-target-id>` during chat
- **THEN** the shell emits a typed local command failure or typed palette action result rather than sending the line to the model
- **中文** 当用户在 chat 中输入 `/palette action inspect <unknown-target-id>` 时，shell 必须输出类型化 local command failure 或 typed palette action result，而不是把该行发送给 model。

#### Scenario: Help includes palette controls / Help 包含 Palette 控制
- **WHEN** the user enters `/help`
- **THEN** the shell lists `/palette`, `/palette action`, and `/keymap` among local controls
- **中文** 当用户输入 `/help` 时，shell 必须在 local controls 中列出 `/palette`、`/palette action` 和 `/keymap`。
