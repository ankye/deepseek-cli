# DeepSeek CLI Documentation / DeepSeek CLI 文档体系

`docs/` is the developer knowledge base for DeepSeek CLI. It explains the architecture, product direction, development workflow, operational checks, and reference model in a way that is easier to read than raw OpenSpec changes.

`docs/` 是 DeepSeek CLI 的开发者知识库。它用比 OpenSpec 变更记录更易读的方式解释架构、产品方向、开发流程、运维检查和参考模型。

OpenSpec remains the formal requirements source. Docs explain how to work with those requirements.

OpenSpec 仍是正式需求来源。Docs 负责解释如何理解和执行这些需求。

## Documentation Map / 文档地图

| Volume / 卷 | Entry / 入口 | Audience / 读者 | Purpose / 目的 |
| --- | --- | --- | --- |
| Architecture / 架构卷 | [architecture/README.md](architecture/README.md) | Runtime/platform engineers | System layers, contracts, execution, orchestration, security, package boundaries. / 系统分层、契约、执行、编排、安全、包边界。 |
| Development / 开发卷 | [development/README.md](development/README.md) | Contributors | How to add packages, capabilities, tests, docs, and OpenSpec changes. / 如何新增包、能力、测试、文档和 OpenSpec change。 |
| Product / 产品卷 | [product/README.md](product/README.md) | Product and technical leads | Roadmap, competitive positioning, release gates, product capability staging. / 路线图、竞品定位、发布门禁、产品能力分期。 |
| Operations / 操作卷 | [operations/README.md](operations/README.md) | Maintainers/releasers | Validation gates, acceptance evidence, publishing, hygiene checks. / 校验门禁、验收证据、发布、卫生检查。 |
| Reference / 参考卷 | [reference/README.md](reference/README.md) | All developers | Glossary, package index, command index, test matrix, OpenSpec index. / 术语、包索引、命令索引、测试矩阵、OpenSpec 索引。 |

## Recommended Reading Paths / 推荐阅读路径

### New Contributor / 新贡献者

1. [Architecture Overview](architecture/system-overview.md)
2. [Package Map](architecture/package-map.md)
3. [Development Guide](development/development-guide.md)
4. [Testing And Acceptance](development/testing-and-acceptance.md)
5. [Glossary](reference/glossary.md)

### Runtime Or Platform Engineer / Runtime 或平台工程师

1. [System Overview](architecture/system-overview.md)
2. [Execution Model](architecture/execution-model.md)
3. [Orchestration And Scheduling](architecture/orchestration-and-scheduling.md)
4. [Security And Policy](architecture/security-and-policy.md)
5. [Protocol And Events](architecture/protocol-and-events.md)

### Product Planner / 产品规划者

1. [Product Overview](product/README.md)
2. [Product Roadmap](product/product-roadmap.md)
3. [Competitive Matrix](product/competitive-matrix.md)
4. [Future Host Landing Zones](architecture/future-host-landings.md)

### Release Or Archive Owner / 发布或归档负责人

1. [Operations Guide](operations/README.md)
2. [Validation Gates](operations/validation-gates.md)
3. [Publishing Guide](operations/publishing.md)
4. [Testing And Acceptance](development/testing-and-acceptance.md)

## Documentation Rules / 文档规则

- Keep developer-facing planning and behavior documents bilingual. / 面向开发者的规划和行为文档保持中英双语。
- README is a landing page; detailed concepts belong in `docs/`. / README 是入口页；详细概念放在 `docs/`。
- OpenSpec is the source of formal requirements; docs should link to specs instead of duplicating every scenario. / OpenSpec 是正式需求来源；docs 应链接 specs，而不是重复所有场景。
- If a change introduces a new architecture concept, update both OpenSpec and `docs/`. / 如果变更引入新架构概念，同时更新 OpenSpec 和 `docs/`。
- Keep docs close to package ownership and tests. / 文档要贴近包责任和测试。

## Current Documentation Coverage / 当前覆盖

| Area / 领域 | Status / 状态 |
| --- | --- |
| System architecture / 系统架构 | Covered by architecture volume. / 由架构卷覆盖。 |
| Evidence-first workflow / 证据优先工作流 | Covered by architecture execution model and OpenSpec change. / 由架构执行模型与 OpenSpec change 覆盖。 |
| Prompt assembly / Prompt 组装 | Covered by architecture package map and `@deepseek/prompt-assembly` README. / 由架构包地图与 `@deepseek/prompt-assembly` README 覆盖。 |
| Orchestration and scheduling / 编排与调度 | Covered by dedicated architecture doc. / 有专门架构文档。 |
| Capability system / 能力系统 | Covered by capability model doc. / 由能力模型文档覆盖。 |
| Security, policy, sandbox / 安全、策略、沙箱 | Covered by security doc and OpenSpec specs. / 由安全文档和 OpenSpec specs 覆盖。 |
| Development workflow / 开发流程 | Covered by development volume. / 由开发卷覆盖。 |
| Testing and acceptance / 测试与验收 | Covered by development and operations volumes. / 由开发卷和操作卷覆盖。 |
| Product roadmap / 产品路线图 | Covered by product volume. / 由产品卷覆盖。 |
| Competitive positioning / 竞品定位 | Covered by competitive matrix. / 由竞品矩阵覆盖。 |
| Package and command reference / 包与命令参考 | Covered by reference volume. / 由参考卷覆盖。 |
