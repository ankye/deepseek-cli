## Why

`@deepseek/code-intelligence` 导出了完整的 `DeterministicCodeIntelligenceService`(`src/packages/code-intelligence/src/index.ts:69`,~360 行真实实现:`status/index/diagnostics/symbols/definitions/references/contextNodes/invalidate`,含 `maxFiles` / `maxFileBytes` 有界降级、`invalidatedPaths` 路径级失效、secret redaction、`ContextGraphNode` 转换),`RuntimeDependencies.codeIntelligence` 契约槽位也早已就位。但 `src/packages/runtime/src/*.ts` **没有任何一处读取 `deps.codeIntelligence`** —— `grep -rn "codeIntelligence" src/packages/runtime/src` 零命中。唯一把它接上的地方只有 `src/packages/testing-regression/src/fakes/index.ts:144` 把实例塞进 `RuntimeDependencies`,以及 `tests/integration/code-intelligence-context.test.ts` 的调用方手动序列 —— 先自己调 `deps.codeIntelligence.contextNodes(...)`,再把 `codeContext.value?.nodes` 作为 `candidateNodes` 喂给 `deps.context.projectGraph(...)`。

`@deepseek/code-intelligence` ships `DeterministicCodeIntelligenceService` (`src/packages/code-intelligence/src/index.ts:69`) with the full `status/index/diagnostics/symbols/definitions/references/contextNodes/invalidate` surface, bounded degradation, path-scoped invalidation, secret redaction, and `ContextGraphNode` conversion. `RuntimeDependencies.codeIntelligence` has always been a contract slot — yet nothing under `src/packages/runtime/src/*.ts` reads `deps.codeIntelligence`. Only `testing-regression/fakes/index.ts:144` registers the service, and only `tests/integration/code-intelligence-context.test.ts` exercises it by calling `deps.codeIntelligence.contextNodes` at the caller level and splicing the result into `candidateNodes` manually.

后果:

- 契约漂移:Roadmap 把 `code-intelligence` v1 标注为 R2「已实现 / implemented」,并明确列出「pre/post-edit evidence」,但实际 runtime 主路径(`context-projection.ts` / `agent-loop.ts` / `headless.ts` / `kernel.ts`)完全不消费该服务,属于 dead code。
- 路径级失效未被触发:kernel 的写路径(edit/patch 工具执行后)**从不**调用 `codeIntelligence.invalidate(path)`,意味着 `CachedIndex` 在 runtime 视角下永远不会收到 invalidation 信号 —— 即使 `DeterministicCodeIntelligenceService` 正确实现了失效语义,runtime 侧也感知不到。
- pre-edit / post-edit evidence 是 spec 承诺的 `Language-Aware Edit Safety` 场景(`openspec/specs/code-intelligence/spec.md:33-42`),但 runtime 并未在 edit 前后插入 `diagnostics()` 调用来形成 evidence。
- candidate node 富化只能由调用方手工完成:当 agent loop 自动推进时,跨 turn 的 diagnostic / symbol 证据不会自动进入投影。

Consequences: the roadmap marks `code-intelligence` v1 as "implemented" in R2 with "pre/post-edit evidence" explicitly listed; in reality the runtime main path never calls `deps.codeIntelligence`, the kernel never triggers `invalidate()` after write-path tools, and pre/post-edit diagnostics evidence exists only as a service capability — never as wired runtime behavior. Candidate enrichment is caller-only; agent-loop turns never auto-project code intelligence evidence.

## What Changes

- `@deepseek/context-engine`:`InMemoryContextEngine` 构造函数新增可选 `{ codeIntelligence?: CodeIntelligenceService }`。当注入时,`projectGraph` 在选择前先调用 `codeIntelligence.contextNodes({ sessionId, root: scope.workspaceRoot ?? "/workspace", includeDiagnostics: true, includeSymbols: true })`,把 `value?.nodes ?? []` 追加到调用方传入的 `candidateNodes` 末尾(不覆盖、保序、去重按 `id`)。若 `contextNodes` 返回 `ok: false` 或超时,走现有 fallback,不阻塞 projection(policy-first 不 fail-open;只是不富化)。
- `@deepseek/runtime`:**不**直接 import `code-intelligence`。改法与 memory-cache pack 一致:在 `testing-regression` 的 `createDeterministicRuntimeDependencies` 里先建 `codeIntelligence` 实例,再传进 `new InMemoryContextEngine({ cache, codeIntelligence })`;`createLiveCliDependencies` 通过 `...base` 继承。runtime src 保持零耦合。
- `@deepseek/runtime`:kernel 的写路径(现由 `core-coding-tools` 注册的 edit/patch 类工具负责)在工具执行**完成后**发起一次非阻塞的 `deps.codeIntelligence?.invalidate(path).catch(() => void 0)`(if present),把 invalidation 信号送达。该 hook 仅在 `deps.codeIntelligence` 存在时触发,不把 runtime 耦合到具体实现。具体触发点放在 `agent-loop.ts` 工具执行后的 evidence 收集处(或封装在 `core-coding-tools` 的 post-exec hook 里,以避免 runtime 直接依赖)。
- `@deepseek/code-intelligence`:
  - `contextNodes` 文档化:当 `includeDiagnostics: true` 且 root 不存在时返回 `ok: true, value: { nodes: [] }`(而不是 throw),供 projection 侧安全 fallback。
  - `invalidate` 文档化:输入 path 不在 `CachedIndex` 里时静默返回 `ok: true`(幂等、无副作用)。
  - 两条语义都由 `DeterministicCodeIntelligenceService` 现行实现支撑,本 pack 只补文档和单测,不改行为。
- Spec delta(`code-intelligence`):新增「Runtime Main-Path Consumption / Runtime 主路径消费」requirement,并在 `Language-Aware Edit Safety` 下补 scenario,明确「写路径工具执行后 runtime 主路径必须发出 `invalidate(path)` 信号」。
- Spec delta(`code-intelligence-local-analyzer`):新增「Projection Auto-Enrichment / 投影自动富化」requirement(scenario 覆盖:注入时 `projectGraph` 自动追加 diagnostic / symbol 节点;未注入时行为与当前字节级一致)。
- Roadmap:给 `implement-code-intelligence-v1` 节点加一条「context-engine 已接入、runtime 写路径 invalidation 已挂、但仍在最小范围(仅 diagnostic + symbol,不含 references/definitions 自动富化)」的现状说明,纠正「v1 已完整接入 runtime」的过度声明。
- Docs:`docs/architecture/execution-model.md` 补「Code Intelligence Auto-Enrichment」小节(紧贴已存在的「Projection Cache Tiers」),描述注入 / 未注入两种行为的决策树。

## Impact

- 受影响规范:`code-intelligence`(runtime 主路径消费 + edit-safety invalidation scenario)、`code-intelligence-local-analyzer`(投影自动富化)。
- 受影响代码:
  - `src/packages/context-engine/src/index.ts`:`InMemoryContextEngine` 构造新增 `{ codeIntelligence? }`;`projectGraph` 在 candidate 合并处按策略富化。
  - `src/packages/context-engine/package.json`:加依赖 `@deepseek/code-intelligence`(若尚未声明);`scripts/workspace-packages.mjs` 与 `scripts/check-boundaries.mjs` 相应更新。
  - `src/packages/code-intelligence/src/index.ts`:仅补 JSDoc / 注释文档化(不改行为)。
  - `src/packages/testing-regression/src/fakes/index.ts`:把 `codeIntelligence` 先建,再作为 `new InMemoryContextEngine({ cache, codeIntelligence })` 参数。
  - `src/packages/runtime/src/agent-loop.ts` **或** `src/packages/core-coding-tools/src/*`:在 edit/patch 工具 post-exec 处插入 `deps.codeIntelligence?.invalidate(path)` 非阻塞调用。最终落点取决于「哪一侧更少引入 runtime → code-intelligence 直接依赖」—— 优先落在 `core-coding-tools`,因为它已经依赖 `code-intelligence` 语义。
- 测试:
  - `tests/contracts/code-intelligence.test.ts`(如不存在则新建):`contextNodes` 对不存在的 root 返回 `ok: true, nodes: []`;`invalidate` 对未知 path 幂等。
  - `tests/contracts/context-engine-code-intelligence.test.ts`(新增):注入 `DeterministicCodeIntelligenceService` 后 projection 自动包含 `source: "code-intelligence"` 节点;未注入时无该类节点(零回归)。
  - `tests/integration/code-intelligence-context.test.ts`:保持通过(原手工调用路径仍可用);补一条新 case 验证「不手工调用也能出现 `code-intelligence` 节点」。
  - `tests/integration/edit-invalidation.test.ts`(新增):edit 工具执行后 `codeIntelligence.diagnostics(root)` 必须反映新内容(依赖 `invalidate` 触发)。
- 零回归:未注入 `codeIntelligence` 的 `InMemoryContextEngine` 路径保持字节级不变;现行 311+ 测试不受影响。
- Docs:`docs/architecture/execution-model.md` 新小节 + `docs/product/product-roadmap.md` 现状说明。

## Non-Goals

- 不把 `references/definitions` 纳入自动富化(这俩需要查询意图信号,留到单独 pack)。
- 不实现 pre-edit diagnostics evidence 自动附加到 `policy.decided` 或 `capability.start` event(那是 policy 侧的 evidence channel,独立 pack)。
- 不做跨会话的 `CachedIndex` 共享(当前 process-local `Map` 已足够解漂移)。
- 不改 LSP / IDE provider 路径 —— 本 pack 只治理 deterministic local analyzer 的 runtime 接入。
- 不改 `codeIntelligence.index()` 的触发策略(目前由 caller 显式驱动;auto-index on workspace open 留到 host-side pack)。
