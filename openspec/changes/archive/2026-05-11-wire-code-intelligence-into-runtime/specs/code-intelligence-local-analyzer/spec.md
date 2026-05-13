## ADDED Requirements

### Requirement: Projection Auto-Enrichment / 投影自动富化

The deterministic local analyzer SHALL expose `contextNodes` and `invalidate` with idempotent, safe-fallback semantics so context-engine projection can auto-enrich candidate nodes without risking projection failure. `contextNodes` SHALL return `{ ok: true, value: { nodes: [] } }` for non-existent roots (never throw, never return `ok: false`), and `invalidate` SHALL resolve without error for unknown paths, enabling runtime consumers to call both methods unconditionally.

deterministic local analyzer 必须以幂等、安全回退的语义暴露 `contextNodes` 与 `invalidate`，让 context-engine projection 能够安全地自动富化 candidate nodes 而不引入投影失败风险。`contextNodes` 对不存在的 root 必须返回 `{ ok: true, value: { nodes: [] } }`（不抛错、不返回 `ok: false`），`invalidate` 对未知 path 必须静默 resolve，使 runtime 消费方可以无条件地调用这两个方法。

#### Scenario: contextNodes on missing root / contextNodes 对不存在的 root

- **WHEN** `contextNodes` is invoked with a `root` that does not exist on the platform file system
- **THEN** the analyzer returns `{ ok: true, value: { nodes: [], ... } }` without throwing
- **中文** 当 `contextNodes` 以一个在 platform file system 上不存在的 `root` 被调用时，analyzer 必须返回 `{ ok: true, value: { nodes: [], ... } }` 且不抛错。

#### Scenario: invalidate on unknown path / invalidate 对未知 path

- **WHEN** `invalidate` is invoked with a path that is not currently tracked in the `CachedIndex`
- **THEN** the analyzer resolves idempotently with no side effects and no error
- **中文** 当 `invalidate` 以一个当前未被 `CachedIndex` 追踪的 path 被调用时，analyzer 必须幂等地 resolve，不产生副作用、不报错。

#### Scenario: Auto-enriched candidates surface diagnostics / 自动富化 candidate 浮现 diagnostics

- **WHEN** the analyzer is injected into the context engine and a file containing diagnostic-worthy content (e.g., a `// TODO` marker) is written, then `projectGraph` is invoked
- **THEN** the projection result includes at least one `source: "code-intelligence"` node derived from the analyzer's diagnostics, even if the caller passed no `candidateNodes`
- **中文** 当 analyzer 被注入到 context engine，写入包含可诊断内容（例如 `// TODO` 标记）的文件后调用 `projectGraph` 时，投影结果必须至少包含一个由 analyzer 的 diagnostics 派生、`source: "code-intelligence"` 的节点，即便调用方未传入 `candidateNodes`。
