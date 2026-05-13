## ADDED Requirements

### Requirement: Skill Composition Projection / Skill 组合投影

Skill summaries SHALL be projectable as composition records for explicit activation, context projection, and user-visible discovery without loading full skill content by default.

Skill summaries 必须可作为 composition records 投影，用于 explicit activation、context projection 和 user-visible discovery，默认不加载完整 skill content。

#### Scenario: Skill summary projects inert target / Skill 摘要投影惰性 Target
- **WHEN** a registered skill is projected into composition
- **THEN** the record includes skill id/name, activation aliases, execution modes, permissions, trust, loading state, target id, and redaction metadata without context segment content
- **中文** 当已注册 skill 被投影到 composition 时，record 必须包含 skill id/name、activation aliases、execution modes、permissions、trust、loading state、target id 和 redaction metadata，且不包含 context segment content。

#### Scenario: Side-effecting skill is not model-visible by default / 副作用 Skill 默认模型不可见
- **WHEN** a skill declares tool, workflow, or sandboxed executor modes
- **THEN** model-visible projection excludes it unless an owning tool or workflow contract exposes a governed callable command
- **中文** 当 skill 声明 tool、workflow 或 sandboxed executor modes 时，model-visible projection 默认排除它，除非 owner tool 或 workflow contract 暴露受治理 callable command。
