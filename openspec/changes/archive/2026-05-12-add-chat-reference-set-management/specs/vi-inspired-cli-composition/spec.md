## ADDED Requirements

### Requirement: Reference Sets Are Locally Mutable / 引用集可本地变更

The vi-inspired CLI composition model SHALL allow local reference sets to be removed, cleared, and replaced through typed controls while preserving structured targets, provenance, and prompt-turn boundaries.

Vi-inspired CLI composition model 必须允许通过类型化 controls 本地 remove、clear、replace reference sets，同时保留 structured targets、provenance 和 prompt-turn boundaries。

#### Scenario: Remove preserves deterministic focus / 移除后保持确定性焦点

- **WHEN** a reference item is removed from a reference set
- **THEN** the remaining items keep their relative ordering, the active reference focus moves to the next item at the same position or previous item if needed, and active target follows the new active reference when present
- **中文** 当 reference item 从 reference set 移除时，剩余 items 必须保持相对顺序，active reference focus 必须移动到同位置的下一项或必要时前一项，且 active target 在存在新 active reference 时跟随它。

#### Scenario: Clear removes prompt-turn references / 清空移除 Prompt Turn 引用

- **WHEN** reference sets are cleared locally
- **THEN** subsequent prompt-turn context projection receives no reference metadata until references are added again
- **中文** 当 reference sets 被本地清空时，后续 prompt-turn context projection 在重新添加 references 前不得收到 reference metadata。

#### Scenario: Replace current creates exact working set / 替换当前项创建精确工作集

- **WHEN** a focused result-list item replaces the active reference set
- **THEN** the resulting reference set contains exactly one item derived from the focused target and preserves target kind, path, line/search metadata, provenance, and ordering
- **中文** 当聚焦 result-list item 替换 active reference set 时，生成的 reference set 必须只包含一个由当前 target 派生的 item，并保留 target kind、path、line/search metadata、provenance 和 ordering。
