## Context

DeepSeek already has the right owners for long-session context quality: `runtime` owns the turn lifecycle, `context-engine` owns projection, `memory-cache-management` owns durable memory and disposable cache, `code-intelligence` owns language-aware evidence, and CLI renders host-neutral runtime events. / DeepSeek 已具备长会话上下文质量所需的责任边界：`runtime` 负责回合生命周期，`context-engine` 负责投影，`memory-cache-management` 负责 durable memory 与 disposable cache，`code-intelligence` 负责语言感知证据，CLI 渲染 host-neutral runtime events。

The gap is main-path consumption. `deps.memory` and `deps.cache` exist, PageIndex/reference projection is wired, and code-intelligence diagnostics/symbols can enrich projection, but everyday turns do not yet consistently treat memory, compact boundaries, tool-result evidence, and references/definitions as structured context evidence. / 缺口在主路径消费：`deps.memory` 与 `deps.cache` 已存在，PageIndex/reference projection 已接入，code-intelligence diagnostics/symbols 可富化 projection，但日常回合尚未稳定地把 memory、compact boundary、tool-result evidence 与 references/definitions 当作结构化 context evidence。

## Goals / Non-Goals

**Goals:**

- Convert eligible working/session/project memory entries into runtime-owned context candidates before model dispatch. / 在模型派发前，将 eligible working/session/project memory entries 转换为 runtime-owned context candidates。
- Emit compact pressure/boundary metadata as replayable runtime events instead of hidden prompt rewrites. / 将 compact pressure/boundary metadata 作为可 replay runtime events 发出，而不是隐藏改写 prompt。
- Summarize tool results into bounded redacted evidence suitable for cache/replay and later context projection. / 将 tool results 摘要为有界、脱敏、适合 cache/replay 与后续 context projection 的 evidence。
- Project code-intelligence references/definitions as typed context evidence with safe fallback. / 将 code-intelligence references/definitions 作为 typed context evidence 投影，并具备安全 fallback。
- Preserve CLI-first behavior while keeping implementation in shared packages. / 保持 CLI-first 行为，同时把实现留在共享 packages。

**Non-Goals:**

- No remote/team memory sync, cross-host UX, or enterprise managed memory. / 不做 remote/team memory sync、cross-host UX 或 enterprise managed memory。
- No semantic/vector memory provider activation in this pack. Provider activation remains gated by index-provider evidence. / 本包不激活 semantic/vector memory provider；provider activation 仍由 index-provider evidence 门禁控制。
- No full automatic transcript summarizer. Compact v1 records pressure and replay boundaries; content synthesis can follow later. / 不做完整自动 transcript summarizer；compact v1 记录 pressure 与 replay boundary，内容合成后续推进。
- No direct CLI ownership of memory selection or tool-result persistence. / CLI 不直接拥有 memory selection 或 tool-result persistence。

## Decisions

### Decision 1: Runtime collects memory candidates, context-engine still selects

Runtime will query `deps.memory` for scoped entries and convert them into `ContextGraphNode` candidates. `context-engine` will remain the only selector/budget/redaction projection boundary. / Runtime 查询 `deps.memory` 的 scoped entries 并转换为 `ContextGraphNode` candidates；`context-engine` 仍是唯一 selector/budget/redaction projection boundary。

Alternative considered: let `context-engine` query memory directly. Rejected because `context-engine` should stay projection-focused and not learn runtime turn/session policy. / 备选方案是让 `context-engine` 直接查询 memory。拒绝原因是 `context-engine` 应专注投影，不应学习 runtime turn/session policy。

### Decision 2: Compact v1 is a boundary event, not prompt mutation

When selected+excluded context crosses compact pressure thresholds, runtime emits `context.compact.boundary` metadata with projection fingerprint, selected/excluded counts, and budget pressure. It does not rewrite the user prompt or inject synthetic summaries in this slice. / 当 selected+excluded context 跨过 compact pressure thresholds 时，runtime 发出 `context.compact.boundary` metadata，包含 projection fingerprint、selected/excluded counts 与 budget pressure。本切片不改写用户 prompt，也不注入合成 summary。

Alternative considered: immediately generate summaries. Rejected because summary quality and persistence policy need a separate acceptance gate. / 备选方案是立即生成摘要。拒绝原因是摘要质量与持久化策略需要单独验收门禁。

### Decision 3: Tool-result evidence is bounded and redacted by construction

Runtime records tool-result evidence from existing model/tool result events using stable ids, capability ids, result status, changed-file summaries, diagnostics counts, and replay hashes. Raw stdout/stderr or renderer text is excluded unless already redacted and bounded by an owning tool contract. / Runtime 基于现有 model/tool result events 记录 tool-result evidence，包含 stable ids、capability ids、result status、changed-file summaries、diagnostics counts 与 replay hashes。raw stdout/stderr 或 renderer text 不进入 evidence，除非已由工具契约脱敏并限界。

Alternative considered: cache entire tool results. Rejected because it increases privacy risk and couples context to host rendering. / 备选方案是缓存完整 tool results。拒绝原因是隐私风险更高，并会把上下文耦合到 host rendering。

### Decision 4: Code references/definitions enrich evidence opportunistically

Code-intelligence references/definitions are converted to context candidates when a symbol query can be derived from selected references, prompt hints, or existing code-intelligence metadata. Failures produce degraded evidence, not model-dispatch failure. / 当可从 selected references、prompt hints 或既有 code-intelligence metadata 推导 symbol query 时，references/definitions 会转换为 context candidates。失败产出 degraded evidence，不阻断 model dispatch。

Alternative considered: require a complete LSP-quality analyzer. Rejected because deterministic local analyzer coverage should improve incrementally. / 备选方案是要求完整 LSP 质量 analyzer。拒绝原因是 deterministic local analyzer 覆盖应渐进增强。

## Directory Plan / 目录计划

- `src/packages/runtime/src/context-projection.ts`: add small private helpers for memory candidates, compact evidence, and code-reference candidate assembly; split only if the file approaches the repository guardrail. / 增加 memory candidates、compact evidence 与 code-reference candidate assembly 的私有 helper；若文件接近仓库护栏再拆分。
- `src/packages/runtime/src/agent-loop.ts`: attach tool-result evidence records at the runtime event boundary without changing provider/tool execution semantics. / 在 runtime event boundary 附加 tool-result evidence records，不改变 provider/tool execution 语义。
- `src/packages/memory-cache-management/src/index.ts`: add factories for memory candidate fingerprints, compact cache/evidence metadata, and bounded turn evidence. / 增加 memory candidate fingerprints、compact cache/evidence metadata 与 bounded turn evidence 的工厂。
- `src/packages/platform-contracts/src/runtime.ts` and related contract files: add implementation-free DTO fields/types only when needed. / 仅在需要时增加无实现 DTO fields/types。
- Tests: focused contract tests under `tests/contracts`, runtime integration tests under `tests/integration`, and replay assertions under `tests/golden`. / 测试放在 `tests/contracts`、`tests/integration` 与 `tests/golden`。
- Host-specific files in `src/apps/cli` should only render already-structured event metadata. / `src/apps/cli` 的 host-specific 文件只渲染已结构化 event metadata。

## Risks / Trade-offs

- Memory can become noisy -> keep deterministic scope ordering, priorities, token estimates, and budget exclusions visible in projection evidence. / Memory 可能引入噪音 -> 保持 deterministic scope ordering、priority、token estimate，并在 projection evidence 中暴露 budget exclusions。
- Compact events without summaries may look incomplete -> document this as compact v1 boundary evidence, with summary synthesis deferred. / 没有摘要的 compact events 可能显得不完整 -> 明确这是 compact v1 boundary evidence，summary synthesis 后续推进。
- Tool-result evidence can leak secrets -> store summaries and redaction metadata, not raw result text. / Tool-result evidence 可能泄漏秘密 -> 存储 summary 与 redaction metadata，不存 raw result text。
- Code references/definitions can be weak in local analyzer -> degrade with diagnostics and do not block turns. / 本地 analyzer 的 references/definitions 可能较弱 -> 用 diagnostics 降级，不阻断回合。

## Migration Plan

This is additive. Existing sessions, events, and CLI commands continue to work. If evidence projection creates regressions, disable the new candidate builders while leaving existing context projection intact. / 这是 additive 变更。现有 sessions、events 与 CLI commands 继续工作。若 evidence projection 引入回归，可禁用新 candidate builders，同时保留既有 context projection。
