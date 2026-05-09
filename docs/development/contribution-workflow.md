# Contribution Workflow / 贡献流程

This workflow keeps product intent, architecture contracts, implementation, tests, and docs aligned.

该流程确保产品意图、架构契约、实现、测试和文档保持一致。

## 1. Classify The Change / 变更分类

| Change type / 变更类型 | OpenSpec required? / 是否需要 OpenSpec | Docs required? / 是否需要 Docs |
| --- | --- | --- |
| Bug fix within existing behavior / 现有行为内 bug fix | Usually no / 通常不需要 | Usually no / 通常不需要 |
| New capability / 新能力 | Yes / 需要 | Yes / 需要 |
| Runtime/protocol/event change / runtime、协议、事件变更 | Yes / 需要 | Yes / 需要 |
| Policy/sandbox/security change / 策略、安全、沙箱变更 | Yes / 需要 | Yes / 需要 |
| Test infrastructure change / 测试基础设施变更 | Usually yes / 通常需要 | Yes if developer-facing / 面向开发者则需要 |
| README or docs-only wording / README 或纯文档措辞 | No / 不需要 | Yes / 需要 |

## 2. OpenSpec First / 先 OpenSpec

For non-trivial changes:

非平凡变更：

```bash
openspec list
openspec validate <change-id> --type change --strict
```

The OpenSpec change should define:

OpenSpec change 应定义：

- Why / 为什么做
- What changes / 改什么
- Affected packages / 影响包
- Requirements and scenarios / 需求与场景
- Tasks / 任务
- Acceptance gates / 验收门禁

## 3. Implement Narrowly / 窄范围实现

Implementation should follow existing package ownership.

实现应遵守现有包责任。

- Contracts first if new shapes cross packages. / 新跨包形态先改 contracts。
- Runtime changes must preserve event replay. / runtime 变更必须保持 event replay。
- Capabilities must declare manifests and governance metadata. / capability 必须声明 manifest 与治理 metadata。
- Platform-specific behavior must enter through `platform-abstraction`. / 平台特定行为必须通过 `platform-abstraction`。
- Security-sensitive changes must fail closed. / 安全敏感变更必须 fail closed。

## 4. Test By Risk / 按风险测试

| Risk / 风险 | Minimum test / 最小测试 |
| --- | --- |
| DTO/schema change / DTO 或 schema 变更 | Contract + versioning tests. / contract + versioning tests。 |
| Runtime path change / runtime 路径变更 | Unit + integration + golden tests. / unit + integration + golden tests。 |
| Platform behavior / 平台行为 | Matrix tests. / matrix tests。 |
| Host behavior / host 行为 | E2E tests. / e2e tests。 |
| Secret/sandbox/policy / secret、sandbox、policy | Unit + contract + integration + golden + matrix + e2e. / 全层测试。 |

## 5. Update Docs / 更新 Docs

Update `docs/` when a change introduces a concept a future developer must understand.

如果变更新增未来开发者必须理解的概念，就更新 `docs/`。

Examples:

示例：

- New package or ownership boundary -> update [Package Map](../architecture/package-map.md). / 新包或责任边界 -> 更新包地图。
- New runtime event -> update [Protocol And Events](../architecture/protocol-and-events.md). / 新 runtime event -> 更新协议事件文档。
- New capability type -> update [Capability Model](../architecture/capability-model.md). / 新能力类型 -> 更新能力模型。
- New release/test gate -> update [Testing And Acceptance](testing-and-acceptance.md) and [Validation Gates](../operations/validation-gates.md). / 新发布或测试门禁 -> 更新测试与校验文档。

## 6. Archive / 归档

After implementation and validation:

实现与校验后：

```bash
openspec archive <change-id> --yes
openspec validate --specs --strict
```

Record acceptance evidence under `tests/acceptance/latest/` when the change is infrastructure, release, safety, or archive-sensitive.

当变更涉及基础设施、发布、安全或归档敏感内容时，在 `tests/acceptance/latest/` 记录验收证据。
