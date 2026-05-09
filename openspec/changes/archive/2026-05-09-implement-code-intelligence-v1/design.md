## Context

The repository already has a `code-intelligence` package and a `CodeIntelligenceService` contract, but the implementation is intentionally minimal. R2 now needs deterministic code evidence that can improve context selection and edit safety without pulling in host-specific VSCode APIs or live language servers.

仓库已有 `code-intelligence` package 和 `CodeIntelligenceService` contract，但实现刻意保持最小。R2 现在需要确定性的代码证据，用来改进 context selection 与 edit safety，同时不能引入 host-specific VSCode APIs 或 live language servers。

## Goals / Non-Goals

**Goals:**

- Add versioned DTOs for diagnostics, symbols, references, index metadata, and context nodes.
- Provide a deterministic local analyzer for TypeScript/JavaScript/text-like files.
- Convert diagnostics and symbols into `ContextGraphNode` values with redaction and provenance metadata.
- Support invalidation by path and deterministic re-indexing.
- Prove all behavior with deterministic tests that do not require a live IDE/LSP.

**目标：**

- 增加 diagnostics、symbols、references、index metadata 和 context nodes 的版本化 DTO。
- 为 TypeScript/JavaScript/text-like files 提供确定性 local analyzer。
- 将 diagnostics 与 symbols 转为带 redaction 和 provenance metadata 的 `ContextGraphNode`。
- 支持按 path invalidation 与确定性 re-indexing。
- 用不依赖 live IDE/LSP 的确定性测试证明行为。

**Non-Goals:**

- Full LSP client implementation.
- Semantic type checking using the TypeScript compiler API.
- Code action execution or automatic fixes.
- VSCode UI integration.
- Persistent index storage.

**非目标：**

- 完整 LSP client 实现。
- 使用 TypeScript compiler API 做语义类型检查。
- code action 执行或自动修复。
- VSCode UI 集成。
- 持久化 index storage。

## Decisions

1. **V1 is a deterministic local analyzer.**

   The local analyzer scans files through `PlatformRuntime.findFiles/readFile`, identifies simple TODO/FIXME/throw markers as diagnostics, extracts symbol-like declarations with stable regular expressions, and records references by text occurrence. This is enough to exercise contracts, context projection, and regression without pretending to be a full compiler.

   **中文：** v1 是确定性 local analyzer。local analyzer 通过 `PlatformRuntime.findFiles/readFile` 扫描文件，用稳定规则识别 TODO/FIXME/throw marker 为 diagnostics，提取 symbol-like declarations，并按文本出现记录 references。这足以验证 contracts、context projection 和 regression，不伪装成完整编译器。

2. **Contracts stay host-neutral and implementation-free.**

   DTOs live in `platform-contracts`, but no Node, VSCode, compiler, or SDK dependency is introduced there. Host-specific providers can implement the same contract later.

   **中文：** contracts 保持 host-neutral 和 implementation-free。DTO 位于 `platform-contracts`，但不引入 Node、VSCode、compiler 或 SDK 依赖。未来 host-specific providers 可实现同一 contract。

3. **Context projection uses regular context graph nodes.**

   Code intelligence evidence becomes `ContextGraphNode` objects with `source: "code-intelligence"`, `kind: "diagnostic"` or `"file"`, stable fingerprints, and bounded content. No parallel projection path is added.

   **中文：** context projection 使用普通 context graph nodes。code intelligence evidence 会成为 `ContextGraphNode`，带 `source: "code-intelligence"`、`kind: "diagnostic"` 或 `"file"`、稳定 fingerprints 和 bounded content。不新增平行 projection 管线。

4. **Invalidation is explicit and path-scoped.**

   `invalidate(path)` marks cached index entries stale for that path. A later query re-indexes the affected file/root. This matches edit-driven invalidation without needing file watchers in v1.

   **中文：** invalidation 显式且按 path 限定。`invalidate(path)` 将该 path 的 cached index entries 标记为 stale。后续 query 会重新索引受影响文件/root。这符合 edit-driven invalidation，v1 不需要 file watcher。

## Risks / Trade-offs

- [Risk] Regex-based symbols are incomplete. → Mitigation: treat v1 as evidence, not compiler truth; expose provider metadata and confidence.
- [风险] 基于正则的 symbols 不完整。→ 缓解：v1 作为 evidence，不作为 compiler truth；暴露 provider metadata 与 confidence。

- [Risk] File content may contain secrets. → Mitigation: bound and redact context node content through policy-sandbox helpers and never include raw secret-like evidence in golden traces.
- [风险] 文件内容可能包含 secrets。→ 缓解：通过 policy-sandbox helpers 对 context node content 限长并脱敏，golden traces 不包含 raw secret-like evidence。

- [Risk] Large workspaces can be expensive. → Mitigation: v1 limits file count, file size, and supported extensions with provider diagnostics for truncation.
- [风险] 大 workspace 成本较高。→ 缓解：v1 限制 file count、file size 和 supported extensions，并用 provider diagnostics 说明 truncation。

## Migration Plan

This is additive. Existing `NullCodeIntelligenceService` remains available. Deterministic runtime dependencies can switch to the local analyzer without changing host adapters.

这是 additive 变更。现有 `NullCodeIntelligenceService` 保留。deterministic runtime dependencies 可以切换到 local analyzer，而不改变 host adapters。

Rollback strategy: use `NullCodeIntelligenceService` in dependency wiring while keeping the expanded contracts.

回滚策略：依赖注入回退到 `NullCodeIntelligenceService`，同时保留扩展后的 contracts。
