# Development Volume / 开发卷

This volume explains day-to-day engineering workflow for contributors.

本卷解释贡献者的日常工程流程。

## Documents / 文档

| Document / 文档 | Purpose / 用途 |
| --- | --- |
| [Development Guide](development-guide.md) | Repository layout, package rules, adding packages and capabilities. / 仓库结构、包规则、新增包和能力。 |
| [Testing And Acceptance](testing-and-acceptance.md) | Test layers, commands, acceptance evidence, live test rules. / 测试层、命令、验收证据、live test 规则。 |
| [Contribution Workflow](contribution-workflow.md) | How to move from idea to OpenSpec, implementation, tests, docs, archive. / 如何从想法推进到 OpenSpec、实现、测试、文档、归档。 |
| [Architecture Lint](architecture-lint.md) | How lint rules are organized and when to add one. / lint rule 如何组织、何时新增。 |

## Developer Checklist / 开发者检查表

- Read the relevant architecture doc before changing shared packages. / 修改共享包前阅读相关架构文档。
- Start non-trivial changes with OpenSpec. / 非平凡变更从 OpenSpec 开始。
- Keep docs and OpenSpec bilingual where they describe behavior or planning. / 行为或规划文档保持双语。
- Add the smallest useful tests at the right layer. / 在正确层级增加最小有效测试。
- Run the default gate before handing off. / 交付前运行默认门禁。
