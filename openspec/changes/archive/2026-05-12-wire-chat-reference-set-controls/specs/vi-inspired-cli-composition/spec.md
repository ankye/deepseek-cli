## ADDED Requirements

### Requirement: Reference Sets Are Inspectable And Focusable / 引用集可查看且可聚焦

The vi-inspired CLI composition model SHALL allow users to inspect structured reference sets and switch active reference focus without losing existing reference items.

Vi-inspired CLI composition model 必须允许用户查看结构化 reference sets，并在不丢失现有 reference items 的情况下切换 active reference focus。

#### Scenario: User inspects active references / 用户查看当前引用

- **WHEN** a user asks to list active references
- **THEN** the CLI renders reference set ids, labels, active item ids, item ids, item labels, target ids, provenance, ordering, and redaction metadata without raw file content
- **中文** 当用户请求列出 active references 时，CLI 必须渲染 reference set ids、labels、active item ids、item ids、item labels、target ids、provenance、ordering 和 redaction metadata，且不包含 raw file content。

#### Scenario: User focuses a reference item / 用户聚焦引用项

- **WHEN** a user focuses a reference by reference id, index, target id, or `current`
- **THEN** the CLI updates active reference focus and active target while preserving all existing reference items
- **中文** 当用户通过 reference id、index、target id 或 `current` 聚焦 reference 时，CLI 必须更新 active reference focus 与 active target，并保留所有已有 reference items。

#### Scenario: Focus failure is typed / 聚焦失败类型化

- **WHEN** a user focuses a reference selector that does not resolve
- **THEN** the CLI returns a typed diagnostic and preserves the prior reference set state
- **中文** 当用户聚焦无法解析的 reference selector 时，CLI 必须返回 typed diagnostic，并保留之前的 reference set state。
