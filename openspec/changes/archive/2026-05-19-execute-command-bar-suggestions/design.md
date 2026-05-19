## Context

The TUI command bar already projects bounded suggestions from core controls, navigation commands, and plugin contributions. It can be opened and closed, but it does not yet behave like a command surface: users cannot type a query through the TUI dispatch path, move the active suggestion, or accept the selected suggestion into a command preview.

TUI command bar 目前已经能从 core controls、navigation commands 与 plugin contributions 投影 bounded suggestions。它可以打开和关闭，但还不像真正的 command surface：用户还不能通过 TUI dispatch path 输入 query、移动 active suggestion，或把选中的 suggestion 接受为 command preview。

## Goals / Non-Goals

**Goals:**
- Add deterministic command bar key handling for printable characters, Backspace, ArrowUp/ArrowDown, Ctrl+N/Ctrl+P, Tab/Shift+Tab within command bar, and Enter.
- Preserve the existing local-only model: command bar acceptance returns a typed result and updates command bar state, without executing shell, plugin, or model work.
- Support both built-in slash suggestions and plugin contribution suggestions through the same command descriptor.
- Keep escaped/cancelled command bar behavior restoring the prior panel.
- Cover the interaction with contract tests and pseudo-terminal-style dispatch tests where appropriate.

**目标：**
- 为 command bar 增加确定性的 key handling：printable characters、Backspace、ArrowUp/ArrowDown、Ctrl+N/Ctrl+P、command bar 内的 Tab/Shift+Tab 与 Enter。
- 保持既有 local-only 模型：command bar acceptance 返回 typed result 并更新 command bar state，不执行 shell、plugin 或 model work。
- 通过同一 command descriptor 支持 built-in slash suggestions 与 plugin contribution suggestions。
- 保持 Escape/cancel 能恢复 prior panel。
- 用 contract tests 与必要的 pseudo-terminal dispatch tests 覆盖交互。

**Non-Goals:**
- Do not execute accepted commands in this change.
- Do not add a line editor, cursor movement, quoting parser, or multi-token completion engine.
- Do not change plugin permission semantics.
- Do not change `/file` or `/jump` execution behavior.

**非目标：**
- 本变更不执行 accepted commands。
- 不增加完整 line editor、cursor movement、quoting parser 或 multi-token completion engine。
- 不改变 plugin permission semantics。
- 不改变 `/file` 或 `/jump` 执行行为。

## Decisions

### Decision: Acceptance Produces a Local Descriptor

`Enter` on a command bar suggestion will produce a typed dispatch result with a `commandName` and `previewText`. Built-in slash commands use the suggestion `commandName` such as `/file list`; plugin suggestions use their registered command name. The TUI state records the accepted suggestion id and preview query so renderers/tests can show what will be submitted next.

`Enter` 接受 command bar suggestion 时会产生 typed dispatch result，包含 `commandName` 与 `previewText`。Built-in slash commands 使用 suggestion 的 `commandName`，例如 `/file list`；plugin suggestions 使用其注册 command name。TUI state 会记录 accepted suggestion id 与 preview query，方便 renderer/tests 展示下一步将提交的内容。

### Decision: Query Editing Stays in Workbench State

Printable keys and Backspace update `commandBar.query`, then re-project suggestions from the existing suggestion source. No separate mutable editor buffer is introduced.

Printable keys 与 Backspace 直接更新 `commandBar.query`，随后从既有 suggestion source 重新投影 suggestions。不引入单独 mutable editor buffer。

### Decision: Selection Is ID-Based and Bounded

Navigation changes the active suggestion by id within the currently visible bounded suggestions. If filtering removes the active id, the first visible suggestion becomes active. Empty results keep the command bar open and return a local diagnostic on acceptance.

Selection 通过当前 visible bounded suggestions 内的 id 移动。若 filtering 移除了 active id，则首个 visible suggestion 成为 active。空结果保持 command bar 打开，并在 acceptance 时返回 local diagnostic。

## Risks / Trade-offs

- [Risk] Users may expect `Enter` to execute immediately. -> Mitigation: expose `previewText` and keep execution owned by existing chat local command dispatch, making the next execution step explicit and testable.
- [风险] 用户可能预期 `Enter` 直接执行。-> 缓解：暴露 `previewText`，并保持 execution 由现有 chat local command dispatch 拥有，让下一步执行显式且可测试。
- [Risk] Suggestion navigation may conflict with panel Tab cycling. -> Mitigation: when command bar is focused and open, Tab/Shift+Tab move suggestions; outside command bar they keep panel cycling behavior.
- [风险] Suggestion navigation 可能与 panel Tab cycling 冲突。-> 缓解：当 command bar focused 且 open 时，Tab/Shift+Tab 移动 suggestions；在 command bar 外继续保持 panel cycling。
- [Risk] Plugin command suggestions might need permissions before execution. -> Mitigation: acceptance is descriptor-only and does not bypass governed plugin execution.
- [风险] Plugin command suggestions 可能需要 execution 前权限。-> 缓解：acceptance 仅生成 descriptor，不绕过 governed plugin execution。
