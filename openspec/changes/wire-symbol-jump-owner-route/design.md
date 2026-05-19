## Context

`jump.navigator.symbol` is currently declared by the built-in jump navigator plugin but intentionally projected as a deferred route. The CLI already has a host-owned `CodeIntelligenceService` in `RuntimeDependencies`, and the deterministic local analyzer can index symbols from workspace files. The missing layer is the thin CLI owner adapter that passes that service into jump navigation, turns symbol references into result-list items, and keeps route readiness honest.

`jump.navigator.symbol` 目前由内置 jump navigator plugin 声明，但仍被投影为 deferred route。CLI 的 `RuntimeDependencies` 已经包含 host-owned `CodeIntelligenceService`，确定性的本地 analyzer 也能从 workspace files 索引 symbols。缺失的是薄的 CLI owner adapter：把该 service 注入 jump navigation、将 symbol references 转成 result-list items，并让 route readiness 与真实能力一致。

## Goals / Non-Goals

**Goals:**
- Make `deepseek jump symbol <query>`, `/jump symbol <query>`, and injected plugin aliases return executable symbol navigation results.
- 让 `deepseek jump symbol <query>`、`/jump symbol <query>` 与注入式 plugin aliases 返回可执行 symbol navigation results。
- Preserve the plugin-system rule that built-in plugins only declare contributions while the host owns execution.
- 保持 plugin-system 规则：built-in plugins 只声明 contributions，host 负责执行。
- Reuse the existing `CodeIntelligenceService` contract and deterministic local analyzer.
- 复用现有 `CodeIntelligenceService` contract 与 deterministic local analyzer。

**Non-Goals:**
- Introduce LSP, IDE, or external semantic providers.
- 不引入 LSP、IDE 或外部 semantic providers。
- Redesign the result-list model or command bar interaction model.
- 不重新设计 result-list model 或 command bar interaction model。
- Make repo recall or project index routes executable in this change.
- 本次不实现 repo recall 或 project index routes。

## Decisions

1. **Inject code intelligence into the host adapter.**
   `resolveJumpNavigator` will accept an optional `CodeIntelligenceService`. CLI commands and owner-route dispatch will pass `runtime.deps.codeIntelligence`; tests can pass deterministic dependencies directly. This keeps platform file/text jumps unchanged and avoids coupling plugins to implementation packages.

   **中文** `resolveJumpNavigator` 接受可选 `CodeIntelligenceService`。CLI commands 与 owner-route dispatch 传入 `runtime.deps.codeIntelligence`；测试可直接传入确定性依赖。这样 file/text jumps 保持不变，并避免 plugins 依赖实现包。

2. **Index before symbol lookup.**
   Symbol jump will call `codeIntelligence.index(workspaceRoot)` before `symbols(query)` so the local analyzer has current workspace data. Failed index results become typed failed jump results with diagnostics.

   **中文** Symbol jump 会先调用 `codeIntelligence.index(workspaceRoot)`，再调用 `symbols(query)`，保证本地 analyzer 拥有当前 workspace 数据。索引失败会转为 typed failed jump result，并携带 diagnostics。

3. **Project symbols as file targets.**
   Each `SymbolReference` becomes a `CliResultListItem` with a file target, path, line, symbol name, kind, source, and provider metadata. The first item becomes the active target, matching file/text jump behavior.

   **中文** 每个 `SymbolReference` 会转为带 file target 的 `CliResultListItem`，包含 path、line、symbol name、kind、source 与 provider metadata。第一项成为 active target，与 file/text jump 行为一致。

4. **Route readiness follows host capability, not plugin code.**
   `jump.navigator.symbol` changes from `deferred` to `implemented` in the owner-route table. Dispatch still calls the host-owned jump adapter, so no plugin-private handler, callback, or execute metadata is introduced.

   **中文** `jump.navigator.symbol` 在 owner-route table 中从 `deferred` 改为 `implemented`。Dispatch 仍然调用 host-owned jump adapter，因此不会引入 plugin-private handler、callback 或 execute metadata。

## Risks / Trade-offs

- [Risk] Local symbol extraction is intentionally lightweight and regex-based, so results are not full semantic LSP precision. → Mitigation: label provider metadata as `codeIntelligence.symbols` / `local-analyzer` and keep future provider replacement behind the existing contract.
- [风险] 本地 symbol extraction 是轻量 regex 实现，不是完整 LSP 语义精度。→ 缓解：provider metadata 标记为 `codeIntelligence.symbols` / `local-analyzer`，未来 provider 替换继续走现有 contract。
- [Risk] Indexing on every symbol jump can read many files. → Mitigation: the deterministic analyzer already has bounded `maxFiles` / `maxFileBytes` limits and cache invalidation.
- [风险] 每次 symbol jump 都索引可能读取较多文件。→ 缓解：deterministic analyzer 已有 `maxFiles` / `maxFileBytes` 边界和缓存失效机制。
- [Risk] Tests that asserted deferred symbol behavior must be updated carefully so repo deferred routes remain explicit. → Mitigation: keep repo recall/project-index expectations unchanged and add focused executable symbol tests.
- [风险] 之前断言 symbol deferred 的测试需要谨慎更新，确保 repo deferred routes 仍显式存在。→ 缓解：保持 repo recall/project-index 断言不变，并添加聚焦的 executable symbol tests。
