## ADDED Requirements

### Requirement: Accepted slash suggestions bridge to raw chat input
The chat TUI SHALL bridge accepted slash command bar suggestions into raw chat input as either submitted prompts or editable draft prefixes.

Chat TUI 必须将 accepted slash command bar suggestions 桥接到 raw chat input，形成 submitted prompts 或 editable draft prefixes。

#### Scenario: Complete slash suggestion submits immediately
- **WHEN** the raw command bar accepts a complete slash suggestion without required placeholders
- **THEN** the raw chat input reader yields that slash command as a prompt and closes the command bar
- **中文** 当 raw command bar 接受不含 required placeholders 的完整 slash suggestion 时，raw chat input reader 必须 yield 该 slash command 作为 prompt，并关闭 command bar。

#### Scenario: Incomplete slash suggestion fills draft prefix
- **WHEN** the raw command bar accepts a slash suggestion whose preview contains a placeholder
- **THEN** the raw chat input reader inserts the selected slash command plus one trailing space into the pending prompt buffer
- **中文** 当 raw command bar 接受 preview 含 placeholder 的 slash suggestion 时，raw chat input reader 必须将选中的 slash command 加一个尾随空格插入 pending prompt buffer。

#### Scenario: Draft prefix can be completed and submitted
- **WHEN** a draft prefix has been inserted from an accepted slash suggestion and the user types arguments followed by Enter
- **THEN** the raw chat input reader yields the completed slash prompt
- **中文** 当 accepted slash suggestion 已插入 draft prefix，且用户继续输入参数并按 Enter 时，raw chat input reader 必须 yield 完整 slash prompt。

### Requirement: Raw slash key preserves prompt text semantics
The chat TUI SHALL only intercept `/` for command bar opening when the raw prompt buffer is empty.

Chat TUI 只有在 raw prompt buffer 为空时，才可以拦截 `/` 来打开 command bar。

#### Scenario: Empty prompt opens command bar
- **WHEN** the raw prompt buffer is empty and the user presses `/`
- **THEN** the input bridge opens the command bar and does not add `/` to the prompt buffer
- **中文** 当 raw prompt buffer 为空且用户按 `/` 时，input bridge 必须打开 command bar，且不得将 `/` 加入 prompt buffer。

#### Scenario: Non-empty prompt keeps slash text
- **WHEN** the raw prompt buffer is not empty and the user presses `/`
- **THEN** the input bridge leaves `/` as normal prompt text
- **中文** 当 raw prompt buffer 非空且用户按 `/` 时，input bridge 必须将 `/` 保留为普通 prompt text。

### Requirement: Non-slash descriptors do not bypass governance
The chat TUI SHALL NOT convert non-slash or plugin command bar descriptors into raw chat prompts unless a governed execution bridge explicitly supports them.

Chat TUI 不得将 non-slash 或 plugin command bar descriptors 转成 raw chat prompts，除非已有明确的 governed execution bridge 支持它们。

#### Scenario: Plugin descriptor remains local
- **WHEN** the command bar accepts a plugin descriptor
- **THEN** the input bridge consumes the event locally without yielding a raw chat prompt or executing the plugin
- **中文** 当 command bar 接受 plugin descriptor 时，input bridge 必须在本地消费事件，不得 yield raw chat prompt，也不得执行 plugin。
