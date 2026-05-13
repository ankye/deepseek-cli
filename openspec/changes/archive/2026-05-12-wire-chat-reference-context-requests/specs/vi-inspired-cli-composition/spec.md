## ADDED Requirements

### Requirement: Reference Sets Project To Prompt-Turn Context / 引用集投影到 Prompt Turn 上下文

The vi-inspired CLI composition model SHALL project focused reference sets into prompt-turn context metadata before runtime/model execution.

Vi-inspired CLI composition model 必须在 runtime/model execution 前，将已聚焦的 reference sets 投影为 prompt-turn context metadata。

#### Scenario: Active reference focus is preserved / 当前引用焦点被保留

- **WHEN** a prompt turn is submitted with reference sets
- **THEN** the projected context metadata preserves active reference set id, active item id, item ordering, item targets, and provenance
- **中文** 当 prompt turn 携带 reference sets 提交时，投影出的 context metadata 必须保留 active reference set id、active item id、item ordering、item targets 与 provenance。

#### Scenario: Projection is metadata-only / 投影仅为元数据

- **WHEN** reference sets are projected into a prompt turn
- **THEN** the projection carries metadata needed to resolve references later and does not inline file contents or command output text
- **中文** 当 reference sets 被投影到 prompt turn 中时，该投影必须只携带后续解析 references 所需的 metadata，不内联 file contents 或 command output text。
