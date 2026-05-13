## ADDED Requirements

### Requirement: Revert Preview Current Target Resolution / 回退预览 Current Target 解析

Chat revert preview SHALL resolve `current` to an explicit turn/session target before invoking checkpoint dry-run preview.

Chat revert preview 必须先将 `current` 解析为显式 turn/session target，再调用 checkpoint dry-run preview。

#### Scenario: Current target is explicit in preview result / Current Target 在预览结果中显式
- **WHEN** `/revert preview current` is invoked with a selected history turn
- **THEN** the preview result target contains the selected turn id and session id rather than the opaque token `current`
- **中文** 当 `/revert preview current` 在有 selected history turn 时被调用，preview result target 必须包含 selected turn id 与 session id，而不是不透明 token `current`。
