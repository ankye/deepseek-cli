## ADDED Requirements

### Requirement: Hook Composition Projection / Hook 组合投影

Hook summaries SHALL be projectable as ordered composition records for inspection, diagnostics, and extension management without invoking hook handlers.

Hook summaries 必须可作为有序 composition records 投影，用于 inspection、diagnostics 和 extension management，且不调用 hook handlers。

#### Scenario: Hook projection is dry-run only / Hook 投影仅 Dry Run
- **WHEN** hooks are projected into composition
- **THEN** the hook system uses summaries or order projection results and does not invoke hook handlers
- **中文** 当 hooks 被投影到 composition 时，hook system 必须使用 summaries 或 order projection results，且不调用 hook handlers。

#### Scenario: Hook ordering metadata is preserved / Hook 排序元数据保留
- **WHEN** multiple hooks are projected for a lifecycle point
- **THEN** each record includes lifecycle point, ordering priority, failure policy, timeout, source/trust, target id, and replay metadata
- **中文** 当为某个 lifecycle point 投影多个 hooks 时，每条 record 必须包含 lifecycle point、ordering priority、failure policy、timeout、source/trust、target id 和 replay metadata。
