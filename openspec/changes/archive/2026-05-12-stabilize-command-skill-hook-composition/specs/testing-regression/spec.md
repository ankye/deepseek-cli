## ADDED Requirements

### Requirement: Composition Regression Coverage / 组合层回归覆盖

The regression suite SHALL include deterministic coverage for command/skill/hook/MCP/plugin/workflow composition records, projection filters, alias collisions, schema versioning, and no-execution projection.

Regression suite 必须为 command/skill/hook/MCP/plugin/workflow composition records、projection filters、alias collisions、schema versioning 和 no-execution projection 提供确定性覆盖。

#### Scenario: Projection parity is tested / 投影一致性被测试
- **WHEN** composition records are projected for CLI help, chat slash commands, user-visible records, and model-visible records
- **THEN** tests assert stable target ids, ordering, visibility, redaction, diagnostics, and reference pit ids
- **中文** 当 composition records 投影到 CLI help、chat slash commands、user-visible records 和 model-visible records 时，测试必须断言 stable target ids、ordering、visibility、redaction、diagnostics 和 reference pit ids。

#### Scenario: Projection does not execute owners / 投影不执行 Owner
- **WHEN** projection includes records derived from commands, skills, hooks, MCP, plugins, or workflows
- **THEN** tests assert no command handler, skill activation, hook handler, MCP call, plugin lifecycle action, or workflow execution was invoked
- **中文** 当 projection 包含来自 commands、skills、hooks、MCP、plugins 或 workflows 的 records 时，测试必须断言没有调用 command handler、skill activation、hook handler、MCP call、plugin lifecycle action 或 workflow execution。

### Requirement: Composition Pit Fixture Coverage / 组合层坑位 Fixture 覆盖

Composition regression SHALL cite reference pit fixture ids for legacy contribution normalization, MCP/plugin precedence, and extension permission expansion where applicable.

Composition regression 必须在适用处引用 legacy contribution normalization、MCP/plugin precedence 和 extension permission expansion 的 reference pit fixture ids。

#### Scenario: Required composition pit ids are asserted / 必需组合坑位 ID 被断言
- **WHEN** composition tests serialize projection evidence
- **THEN** relevant records include `pit.legacy-contribution-normalization.manifest-boundary`, `pit.mcp-plugin-precedence.enterprise-deny`, or `pit.extension-permission-expansion.permission-diff`
- **中文** 当 composition tests 序列化 projection evidence 时，相关 records 必须包含 `pit.legacy-contribution-normalization.manifest-boundary`、`pit.mcp-plugin-precedence.enterprise-deny` 或 `pit.extension-permission-expansion.permission-diff`。
