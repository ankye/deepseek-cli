## ADDED Requirements

### Requirement: Session History Targets Are Selectable / Session History Target 可选择

The vi-inspired CLI composition model SHALL treat chat history turns as selectable typed targets for local navigation and revert preview.

Vi-inspired CLI composition model 必须将 chat history turns 作为可选择 typed targets，用于本地导航和 revert preview。

#### Scenario: History turn becomes target / History Turn 成为 Target
- **WHEN** a completed chat turn is added to local history
- **THEN** it can be addressed by index, turn id, `last`, or `current` and resolved into a typed turn target
- **中文** 当完成的 chat turn 被加入本地 history 时，必须能通过 index、turn id、`last` 或 `current` 寻址，并解析成 typed turn target。

#### Scenario: Revert current uses typed turn target / Revert Current 使用 Typed Turn Target
- **WHEN** the user invokes revert preview on `current`
- **THEN** the CLI resolves `current` to a typed turn target before calling checkpoint/session revert contracts
- **中文** 当用户对 `current` 调用 revert preview 时，CLI 必须先将 `current` 解析为 typed turn target，再调用 checkpoint/session revert contracts。
