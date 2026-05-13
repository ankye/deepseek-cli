## ADDED Requirements

### Requirement: Plugin Contributions Preserve Provenance In Composition / 插件贡献在组合中保留来源

Plugin-contributed commands, skills, hooks, MCP connectors, and workflow templates SHALL preserve plugin id, version, source, trust, integrity, and permission metadata when normalized into composition records.

Plugin-contributed commands、skills、hooks、MCP connectors 和 workflow templates 归一化为 composition records 时，必须保留 plugin id、version、source、trust、integrity 和 permission metadata。

#### Scenario: Plugin command projection cites plugin source / 插件命令投影引用插件来源
- **WHEN** a plugin contributes a command to composition
- **THEN** the record includes plugin provenance, declared permissions, target id, and permission pit evidence when permissions are broader than the baseline
- **中文** 当 plugin 向 composition 贡献 command 时，record 必须包含 plugin provenance、declared permissions、target id，并在权限相对 baseline 扩张时包含 permission pit evidence。
