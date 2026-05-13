## ADDED Requirements

### Requirement: PageIndex Turn References Materialize As Summaries / PageIndex Turn 引用物化为 Summary

ContextGraph projection SHALL materialize PageIndex-shaped `turn` references into bounded `summary` context nodes and SHALL leave other unsupported references as evidence-only.

ContextGraph projection 必须将 PageIndex 形态的 `turn` references 物化为有界 `summary` context nodes，并将其他 unsupported references 保持为 evidence-only。

#### Scenario: PageIndex turn reference becomes summary node / PageIndex Turn 引用成为 Summary Node

- **WHEN** a prompt turn contains an active `turn` reference with PageIndex page metadata and bounded previews
- **THEN** runtime projection creates a `summary` candidate node from those previews, runs normal budget/redaction selection, and emits resolved reference evidence
- **中文** 当 prompt turn 包含带 PageIndex page metadata 与 bounded previews 的 active `turn` reference 时，runtime projection 必须基于这些 previews 创建 `summary` candidate node，运行正常 budget/redaction selection，并发出 resolved reference evidence。

#### Scenario: Non-PageIndex turn reference remains unresolved / 非 PageIndex Turn 引用保持未解析

- **WHEN** a prompt turn contains a `turn` reference without PageIndex page metadata
- **THEN** projection records it as unsupported or incomplete without reading transcript content or failing the turn
- **中文** 当 prompt turn 包含没有 PageIndex page metadata 的 `turn` reference 时，projection 必须将其记录为 unsupported 或 incomplete，不读取 transcript content，也不让 turn 失败。

#### Scenario: Projected recall summary preserves prompt boundary / 投影 Recall Summary 保持 Prompt 边界

- **WHEN** projected PageIndex summaries are sent to the model
- **THEN** they appear in runtime-owned context messages while the user prompt message remains the exact submitted prompt text
- **中文** 当投影后的 PageIndex summaries 被发送给 model 时，它们必须出现在 runtime-owned context messages 中，而 user prompt message 必须保持用户提交的原样 prompt text。
