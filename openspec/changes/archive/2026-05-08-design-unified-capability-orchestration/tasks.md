## 1. OpenSpec Capability Governance Design

- [x] 1.1 Define the proposal for unified capability execution governance. / 定义统一能力执行治理 proposal。
- [x] 1.2 Define architecture decisions for capability levels, execution envelope, workflow/scheduler boundary, host event consumption, and lint enforcement. / 定义能力分级、execution envelope、workflow/scheduler 边界、host event consumption 和 lint enforcement 架构决策。
- [x] 1.3 Add new `capability-execution-governance` specification. / 添加新的 `capability-execution-governance` 规范。
- [x] 1.4 Add delta specs for capability registry, workflow, concurrency, runtime, bus, policy/sandbox, agent, skill, plugin, hook, MCP, and regression. / 添加相关能力 delta specs。

## 2. Architecture Lint Enforcement

- [x] 2.1 Add lint conventions for governed execution primitives, approved execution owners, deterministic fakes, tests, and owning packages. / 添加受治理执行 primitive、approved execution owners、deterministic fakes、tests 和 owning packages 的 lint conventions。
- [x] 2.2 Add AST lint rule that rejects direct governed primitive calls outside approved locations. / 添加 AST lint rule，拒绝 approved locations 之外直接调用受治理 primitive。
- [x] 2.3 Add regression tests for valid direct calls in runtime/owners/tests and invalid bypasses in app or non-owner package code. / 添加回归测试，覆盖合法与非法直接调用。
- [x] 2.4 Document how to extend the governed execution lint rule when new executable primitives are introduced. / 记录新增 executable primitives 时如何扩展 lint rule。

## 3. Validation

- [x] 3.1 Run `openspec validate design-unified-capability-orchestration --strict`. / 运行 OpenSpec strict validation。
- [x] 3.2 Run `npm run lint`, `npm run typecheck`, and `npm test`. / 运行 lint、typecheck 和 tests。
