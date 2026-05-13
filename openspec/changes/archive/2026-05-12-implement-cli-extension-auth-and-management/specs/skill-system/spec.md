## ADDED Requirements

### Requirement: CLI Skill Management Projection / CLI Skill 管理投影

The skill system SHALL provide summaries and activation results that CLI extension management can render without inlining full context segment text by default.

Skill system 必须提供 summaries 与 activation results，供 CLI extension management 渲染，默认不得内联完整 context segment text。

#### Scenario: Skill list is compact / Skill 列表紧凑
- **WHEN** CLI extension management lists skills
- **THEN** it renders stable skill id, name, version, source, trust, enabled state, loading state, execution modes, permissions, and redaction metadata from `SkillSummary`
- **中文** 当 CLI extension management 列出 skills 时，必须从 `SkillSummary` 渲染 stable skill id、name、version、source、trust、enabled state、loading state、execution modes、permissions 和 redaction metadata。

#### Scenario: Skill activation omits full content / Skill 激活省略完整内容
- **WHEN** CLI extension management activates a skill
- **THEN** the output includes activation status, summary, segment count, estimated tokens, diagnostics, replay fingerprint, and redaction metadata without printing full context segment text unless a future explicit inspect mode is added
- **中文** 当 CLI extension management 激活 skill 时，输出必须包含 activation status、summary、segment count、estimated tokens、diagnostics、replay fingerprint 和 redaction metadata，且除非未来增加显式 inspect mode，否则不得打印完整 context segment text。
