## ADDED Requirements

### Requirement: Built-In Plugin Owner Route Coverage / 内置插件 Owner Route 覆盖
The first-party development plugin pack SHALL validate owner route readiness for every built-in command contribution.

First-party development plugin pack 必须为每个 built-in command contribution 校验 owner route readiness。

#### Scenario: Pack validates command routes / 插件包校验命令路由
- **WHEN** first-party plugin manifests are validated
- **THEN** validation reports no duplicate ids, source/integrity errors, executable metadata, or missing owner routes
- **中文** 当 first-party plugin manifests 被校验时，validation 不得报告 duplicate ids、source/integrity errors、executable metadata 或 missing owner routes。

#### Scenario: Pack projection stays inert / 插件包投影保持惰性
- **WHEN** first-party plugin command, TUI, and reasoning contributions are listed
- **THEN** projection returns metadata only and does not execute command handlers, shell processes, model calls, hook handlers, MCP calls, or host callbacks
- **中文** 当 first-party plugin command、TUI 与 reasoning contributions 被列出时，projection 只能返回 metadata，不得执行 command handlers、shell processes、model calls、hook handlers、MCP calls 或 host callbacks。
