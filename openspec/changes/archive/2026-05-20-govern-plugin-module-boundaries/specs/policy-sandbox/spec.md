## ADDED Requirements

### Requirement: Module Permission Policy / Module Permission Policy

Policy-sandbox SHALL evaluate module permissions before risky plugin, extension, MCP, hook, or skill behavior executes.

Policy-sandbox 必须在有风险 plugin、extension、MCP、hook 或 skill 行为执行前评估 module permissions。

#### Scenario: Module permission is missing / Module Permission 缺失

- **WHEN** a module attempts a risky operation not declared in its manifest permissions
- **THEN** policy denies or prompts according to configured policy and emits an audit record
- **中文** 当 module 尝试未在 manifest permissions 中声明的风险操作时，policy 必须按配置 deny 或 prompt，并发出 audit record。
