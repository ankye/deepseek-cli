## 1. Contracts & Boundaries

- [x] 1.1 `context-engine/package.json` 确认 `"@deepseek/code-intelligence": "0.1.0"` dependency(若未声明则添加)。
- [x] 1.2 `scripts/workspace-packages.mjs` `packageDependencies["context-engine"]` 加 `"code-intelligence"`,并确认 `node scripts/check-boundaries.mjs` 通过。
- [x] 1.3 `platform-contracts`:**不改**(`CodeIntelligenceService` / `ContextGraphNode` / `ContextProjectionRequest` 已足够)。此任务为 alignment check。

## 2. code-intelligence

- [x] 2.1 `DeterministicCodeIntelligenceService.contextNodes` 当 root 不存在时返回 `{ ok: true, value: { nodes: [] } }`(若当前实现 throw,则改为 safe fallback;若已 safe,仅补 JSDoc 说明)。
- [x] 2.2 `DeterministicCodeIntelligenceService.invalidate` 对未知 path 幂等返回 `{ ok: true }`,补 JSDoc 说明「无副作用、可重复调用」。
- [x] 2.3 补单测:`contextNodes` 不存在 root、`invalidate` 未知 path 各自的幂等语义。

## 3. context-engine

- [x] 3.1 `InMemoryContextEngine` 构造函数新增可选参数 `{ cache?: CacheManager; codeIntelligence?: CodeIntelligenceService }`(与现有 cache 合并成同一 options bag)。
- [x] 3.2 `projectGraph`:在选择(selection)之前,若 `this.codeIntelligence` 存在:
  - `const enrich = await this.codeIntelligence.contextNodes({ sessionId: request.sessionId, root: request.scope.workspaceRoot ?? "/workspace", includeDiagnostics: true, includeSymbols: true })`(非阻塞,包在 try/catch,失败则跳过)。
  - 把 `enrich.value?.nodes ?? []` 追加到 `candidateNodes` 末尾;按 `id` 去重(调用方传入的同 id 节点优先)。
- [x] 3.3 不改现有 cache 分支逻辑(富化后的 candidate 参与 `projectionCacheKey` 的 `dependencyFingerprints`,自动保证 cache 正确性 —— 富化前后 cache key 会不同,属预期行为)。
- [x] 3.4 未注入 `codeIntelligence` 时行为与当前字节级一致(由现有 context-engine 测试验证)。

## 4. Runtime / Testing Wiring

- [x] 4.1 `testing-regression/src/fakes/index.ts`:在 `createDeterministicRuntimeDependencies` 里把 `codeIntelligence` 先建,再传进 context:
  ```
  const cache = new InMemoryCacheManager();
  const codeIntelligence = new DeterministicCodeIntelligenceService(platform);
  // ...
  context: new InMemoryContextEngine({ cache, codeIntelligence }),
  // ...
  codeIntelligence,
  ```
- [x] 4.2 `core-coding-tools`:在 edit / patch 工具的 post-exec 路径插入 `deps.codeIntelligence?.invalidate(absolutePath).catch(() => void 0)` 非阻塞调用。优先落在 `core-coding-tools`(已依赖 `code-intelligence`),避免 runtime 新增直接依赖。
- [x] 4.3 `runtime/src/*.ts` **不新增** `deps.codeIntelligence` 直接消费(与 memory-cache pack 一致,只通过 context-engine 间接接入)。
- [x] 4.4 `createLiveCliDependencies` 继承 base 即可,无额外动作(`...base` 已自动拿到接了 codeIntelligence 的 context-engine)。

## 5. Tests

- [x] 5.1 `tests/contracts/code-intelligence.test.ts`(新建或扩展):
  - `contextNodes` 对不存在 root 返回 `{ ok: true, value: { nodes: [] } }`(不 throw)。
  - `invalidate` 对未知 path 幂等返回 `{ ok: true }`。
- [x] 5.2 `tests/contracts/context-engine-code-intelligence.test.ts`(新建):
  - 注入 `DeterministicCodeIntelligenceService`:写入带 `// TODO` 的文件后 `projectGraph` 的 `selectedNodes` 中出现 `source: "code-intelligence"` 节点。
  - 未注入时 `selectedNodes` 中不出现 `source: "code-intelligence"` 节点(零回归)。
  - `codeIntelligence.contextNodes` 内部 throw 时 projection 走 fallback(不抛,不把错误升级成 projection 失败)。
- [x] 5.3 `tests/integration/code-intelligence-context.test.ts`:保持原 case 通过;新增一条「调用方不手工调 `contextNodes`,仅 writeFile + projectGraph,也能看到 `code-intelligence` 节点」。
- [x] 5.4 `tests/integration/edit-invalidation.test.ts`(新建):
  - writeFile v1 → `codeIntelligence.diagnostics(root)` 产出 D1。
  - 通过 edit/patch 工具改文件为 v2。
  - 下一次 `codeIntelligence.diagnostics(root)` 反映 v2(证明 `invalidate` 被触发)。
- [x] 5.5 全量 `npm test`:零 fail / 零新增 skipped;整体 count 提升到 318→322+。

## 6. Spec Deltas

- [x] 6.1 `code-intelligence` spec 新增:
  - `Runtime Main-Path Consumption` requirement + scenarios(注入场景、未注入 fallback、失败不阻塞 projection)。
  - `Language-Aware Edit Safety` 现有 requirement 下补 scenario:「写路径工具执行后 invalidate 被触发」。
- [x] 6.2 `code-intelligence-local-analyzer` spec 新增:
  - `Projection Auto-Enrichment` requirement + scenarios(写入带 diagnostic 的文件 → 投影自动包含 code-intelligence 节点;未注入 → 不自动富化)。

## 7. Docs

- [x] 7.1 `docs/architecture/execution-model.md` 补「Code Intelligence Auto-Enrichment」小节(紧贴「Projection Cache Tiers」),描述注入 / 未注入两种行为的决策树 + 失败 fallback。
- [x] 7.2 `docs/product/product-roadmap.md` R2 `implement-code-intelligence-v1` 节点:追加现状说明「context-engine 已接入 diagnostic + symbol 自动富化;写路径 invalidate 已挂;references/definitions 自动富化与 policy-channel pre-edit evidence 留到后续 pack」,纠正此前「v1 完整接入 runtime」的过度声明。

## 8. Verification

- [x] 8.1 `npm run typecheck`。
- [x] 8.2 `npm run lint`。
- [x] 8.3 `node scripts/check-boundaries.mjs`。
- [x] 8.4 `npm test`(预期从 318 → 322+:新增 4 pass,零 fail / 零新增 skipped)。
- [x] 8.5 `openspec validate wire-code-intelligence-into-runtime --strict`。
- [x] 8.6 `openspec validate --specs --strict`。
- [x] 8.7 刷新 `tests/acceptance/latest/`。
