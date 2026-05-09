## Context

The repository already has `platform-contracts/src/hook.ts`, `src/packages/hook-system`, R3 `hook-system` requirements, governed execution lint, and deterministic runtime fakes. The current hook implementation stores manifests and runs handlers by point/order only, which is not enough for a platform extension boundary.

仓库已有 `platform-contracts/src/hook.ts`、`src/packages/hook-system`、R3 `hook-system` requirements、governed execution lint 和 deterministic runtime fakes。当前 hook 实现只存储 manifest，并按 point/order 运行 handler，不足以作为平台扩展边界。

## Goals / Non-Goals

**Goals:**

- Add versioned contracts for hook manifest validation, lifecycle points, invocation requests, outputs, diagnostics, ordering metadata, deadlines, failure policy, and replay fingerprints.
- Enforce canonical hooks v1 APIs only: validate, register, list, project order, and invoke.
- Provide deterministic hook ordering across priority, source trust, source kind, name, and id tie-breakers.
- Contain hook failures through explicit failure policies: continue, block, disable, and rollback-requested.
- Support per-hook timeout handling through injected clocks and deterministic timeout flags.
- Keep v1 hook execution observe-only unless the hook returns typed suggestions for other owners to review.
- Add deterministic tests across package, contracts, integration, golden replay, compatibility, matrix, and lint suites.

**目标：**

- 增加 hook manifest validation、lifecycle points、invocation requests、outputs、diagnostics、ordering metadata、deadlines、failure policy 和 replay fingerprints 的版本化契约。
- 只允许 canonical hooks v1 APIs：validate、register、list、project order 和 invoke。
- 提供跨 priority、source trust、source kind、name 和 id tie-breakers 的 deterministic hook ordering。
- 通过显式 failure policies 控制 hook failure：continue、block、disable 和 rollback-requested。
- 通过 injected clocks 与 deterministic timeout flags 支持 per-hook timeout handling。
- v1 hook execution 保持 observe-only，除非 hook 返回 typed suggestions 供其他 owner 审核。
- 增加覆盖 package、contracts、integration、golden replay、compatibility、matrix 和 lint suites 的确定性测试。

**Non-Goals:**

- Executing arbitrary hook code from plugins or workspace files.
- Installing hook packages from a marketplace.
- Applying hook policy/workflow/capability suggestions automatically.
- Running side-effect hooks through scheduler/sandbox in this change.
- Host UI for hook management.

**非目标：**

- 执行来自 plugins 或 workspace files 的任意 hook code。
- 从 marketplace 安装 hook packages。
- 自动应用 hook policy/workflow/capability suggestions。
- 在本变更中通过 scheduler/sandbox 运行 side-effect hooks。
- hook 管理 Host UI。

## Decisions

1. **Hooks v1 is canonical and breaking before launch.**

   `HookSystem` exposes `validateManifest`, `registerHook`, `listHooks`, `projectOrder`, and `invokeHooks`. Generic `register` and `run` APIs are removed and blocked by lint/contract tests because this project has no launch-time compatibility burden.

   **中文：** Hooks v1 是 canonical，且在上线前允许破坏性调整。`HookSystem` 暴露 `validateManifest`、`registerHook`、`listHooks`、`projectOrder` 和 `invokeHooks`。泛化 `register` 与 `run` APIs 会被移除，并由 lint/contract tests 阻止回流，因为本项目没有上线兼容负担。

2. **Observe-only comes first.**

   v1 handlers may return typed outputs and suggestions, but they do not directly mutate runtime state, policy, workflow, files, memory, cache, or host UI. Future side-effect hooks must become governed execution envelopes.

   **中文：** v1 先做 observe-only。v1 handlers 可以返回 typed outputs 与 suggestions，但不能直接修改 runtime state、policy、workflow、files、memory、cache 或 host UI。未来 side-effect hooks 必须进入 governed execution envelopes。

3. **Ordering is deterministic and inspectable before invocation.**

   `projectOrder()` returns the exact ordered hook summaries for a point without executing handlers. Sorting uses priority/order first, trusted sources before untrusted sources, built-in before extension/workspace/catalog, then name/id stable tie-breakers.

   **中文：** ordering 必须确定且可在 invocation 前检查。`projectOrder()` 对某个 point 返回精确的 ordered hook summaries，但不执行 handler。排序先使用 priority/order，再将 trusted sources 排在 untrusted sources 前，built-in 排在 extension/workspace/catalog 前，最后用 name/id 做稳定 tie-breakers。

4. **Failure policy decides the invocation terminal status.**

   A failed hook with `continue` records diagnostics and proceeds. `block` stops remaining hooks and returns blocked. `disable` marks the hook disabled for future invocations. `rollback-requested` returns a rollback request without performing rollback itself.

   **中文：** failure policy 决定 invocation terminal status。`continue` 记录 diagnostics 并继续。`block` 停止剩余 hooks 并返回 blocked。`disable` 将 hook 标记为 disabled 供后续 invocation 生效。`rollback-requested` 返回 rollback request，但不直接执行 rollback。

5. **Timeouts are deterministic in default tests.**

   v1 supports timeout policy through request metadata and deterministic handler results. Tests use fake timeout outcomes instead of sleeping on wall-clock timers, while the implementation still enforces `timeoutMs` around async handlers.

   **中文：** 默认测试中的 timeout 是确定性的。v1 通过 request metadata 与 deterministic handler results 支持 timeout policy。测试使用 fake timeout outcomes，而不是依赖 wall-clock sleep；实现仍会围绕 async handlers 执行 `timeoutMs`。

## Risks / Trade-offs

- [Risk] Hooks can become a hidden authority path. -> Mitigation: v1 is observe-only, suggestions are typed, side effects are future governed execution, and lint blocks direct bypasses.
- [风险] Hooks 可能成为隐藏 authority path。-> 缓解：v1 observe-only，suggestions 类型化，side effects 未来必须 governed execution，lint 阻止 direct bypass。

- [Risk] Hook ordering can drift and cause nondeterministic behavior. -> Mitigation: expose `projectOrder()`, assert stable ordering in package/matrix/golden tests, and use stable tie-breakers.
- [风险] Hook ordering 漂移会导致非确定行为。-> 缓解：暴露 `projectOrder()`，在 package/matrix/golden tests 中断言稳定 ordering，并使用稳定 tie-breakers。

- [Risk] Failure policy can block runtime flow unexpectedly. -> Mitigation: failure policy is explicit per manifest, invocation result records terminal status and diagnostics, and integration tests cover continue/block/disable/rollback-requested.
- [风险] failure policy 可能意外阻塞 runtime flow。-> 缓解：failure policy 在 manifest 中显式声明，invocation result 记录 terminal status 与 diagnostics，integration tests 覆盖 continue/block/disable/rollback-requested。

## Migration Plan

This is intentionally breaking before launch. Existing hook callers must move from `register`/`run` to `registerHook`/`invokeHooks`, and tests/lint must reject generic APIs.

这是上线前的有意破坏性调整。现有 hook 调用方必须从 `register`/`run` 迁移到 `registerHook`/`invokeHooks`，并由 tests/lint 拒绝泛化 APIs。

Rollback strategy: keep registered hook manifests visible through `listHooks()` but make `invokeHooks()` return a skipped result for every point.

回滚策略：保留 registered hook manifests，可通过 `listHooks()` 查看，但让 `invokeHooks()` 对所有 point 返回 skipped result。
