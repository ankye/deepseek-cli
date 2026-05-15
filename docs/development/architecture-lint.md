# Architecture Lint / 架构 Lint

Architecture lint turns repository conventions into executable rules. It exists because manual review is not enough once the codebase grows.

架构 lint 将仓库约定变成可执行规则。代码规模变大后，单靠人工 review 不够。

## Location / 位置

```text
scripts/lint-framework/
```

Key files:

关键文件：

| File / 文件 | Role / 角色 |
| --- | --- |
| `conventions.mjs` | Shared package ownership and policy data. / 共享包责任与策略数据。 |
| `rules/*.mjs` | Focused rule modules. / 聚焦的规则模块。 |
| `context.mjs` | Rule execution context and reporting. / 规则执行上下文与报告。 |
| `failure.mjs` | Stable failure formatting. / 稳定失败格式。 |

## Existing Rule Themes / 现有规则主题

- Cross-package relative imports. / 跨包相对引用。
- App-to-app imports. / app 之间引用。
- Implementation imports inside `platform-contracts`. / `platform-contracts` 中引用实现。
- Host/process/filesystem APIs inside contracts. / contracts 中使用 host/process/filesystem API。
- Runtime dependency on testing fakes. / runtime 依赖测试 fake。
- Workspace package names and exports. / workspace 包名和 exports。
- Publish metadata and dependency versions. / 发布 metadata 和依赖版本。
- Governed execution primitive bypasses. / 受治理执行原语绕过。
- Secret/sandbox/platform primitive bypasses. / secret、sandbox、platform 原语绕过。
- Context projection bypasses. / context projection 绕过。

## Split-Plan Baselines / 拆分计划基线

`scripts/lint-framework/conventions.mjs` may list a source file in `scaleGuardrails.plannedOversizedFiles` only when the file already has a bounded split plan. These entries are not exemptions from ownership; they are visible debt for the next architecture slice.

`scripts/lint-framework/conventions.mjs` 只有在文件已有有界拆分计划时，才可以把 source file 列入 `scaleGuardrails.plannedOversizedFiles`。这些条目不是责任豁免，而是下一轮架构切分的显式债务。

Current runtime baseline:

当前 runtime 基线：

- `src/packages/runtime/src/agent-loop.ts`: split evidence-first orchestration, self-repair orchestration, hook firing, model dispatch, and terminal summary helpers into focused runtime modules while keeping `runAgentLoop` as the state-machine coordinator.

## Adding A Rule / 新增规则

1. Add shared ownership data to `conventions.mjs` when needed. / 需要时在 `conventions.mjs` 增加共享 ownership 数据。
2. Add a focused rule module under `rules/`. / 在 `rules/` 下新增聚焦 rule module。
3. Register it in `rules/index.mjs`. / 在 `rules/index.mjs` 注册。
4. Add positive and negative fixtures in `tests/contracts/lint-framework.test.ts`. / 在 lint framework contract tests 中增加正反 fixture。
5. Use stable rule ids and the standard report format. / 使用稳定 rule id 和标准报告格式。

## Rule Quality / 规则质量

A good architecture lint rule should be:

好的架构 lint 规则应：

- precise enough to avoid noisy false positives / 足够精确，避免噪声误报
- broad enough to catch real bypasses / 足够广，能抓到真实绕过
- tied to an architecture principle / 绑定架构原则
- covered by tests / 有测试覆盖
- documented if developer behavior changes / 如果改变开发者行为则写文档
