## ADDED Requirements

### Requirement: Skill Execution Normalization

The skill system SHALL normalize skill-backed execution into governed execution envelopes unless the skill is context-only and only contributes bounded prompt or context projection.

skill system 必须将 skill-backed execution 规范化为 governed execution envelopes，除非该 skill 是 context-only 且只贡献有界 prompt 或 context projection。

#### Scenario: Context-only skill avoids scheduling

- **WHEN** a skill only contributes bounded instructions, examples, or context references
- **THEN** it can remain in the projection pipeline without scheduler work while preserving provenance, redaction, compatibility, and budget metadata

#### Scenario: Tool-backed skill is governed

- **WHEN** a skill executes code, invokes a tool, runs a workflow, mutates memory/cache/workspace, calls MCP, or requires sandbox controls
- **THEN** it creates a governed execution envelope and follows policy, approval, sandbox, scheduler, bus, audit, and replay rules
