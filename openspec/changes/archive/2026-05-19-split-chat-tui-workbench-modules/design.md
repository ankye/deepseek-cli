## Context

The previous change added host-owned plugin execution records and projected them into the TUI workbench. To ship that product behavior quickly, two central TUI files were temporarily added to the architecture lint split-plan baseline. The next step is to make the implementation match the architecture guardrail again.

前一轮变更增加了 host-owned plugin execution records，并将其投影进 TUI workbench。为了快速交付产品行为，两个中心 TUI 文件被临时加入 architecture lint 的 split-plan baseline。下一步是让实现重新符合架构护栏。

## Goals / Non-Goals

**Goals:**
- Keep `chat-tui.ts` focused on controller/state orchestration and public exports.
- Keep `chat-tui-workbench.ts` focused on workbench layout composition and keyboard dispatch.
- Move plugin execution attachment and plugin shelf/activity projection to dedicated modules.
- Remove the temporary split-plan baseline entries after line counts are under threshold.
- Preserve all existing imports used by tests and callers.

**目标：**
- 让 `chat-tui.ts` 聚焦 controller/state orchestration 与 public exports。
- 让 `chat-tui-workbench.ts` 聚焦 workbench layout composition 与 keyboard dispatch。
- 将 plugin execution attachment 与 plugin shelf/activity projection 移入专门模块。
- 在文件行数低于阈值后移除临时 split-plan baseline。
- 保持 tests 与 callers 依赖的现有 imports 不变。

**Non-Goals:**
- Do not redesign TUI behavior or plugin execution semantics.
- Do not change public package contracts.
- Do not introduce a new renderer or terminal runtime.

**非目标：**
- 不重新设计 TUI 行为或 plugin execution 语义。
- 不改变 public package contracts。
- 不引入新的 renderer 或 terminal runtime。

## Decisions

### Decision: Split by Product Responsibility

Create `chat-tui-plugin-execution.ts` for TUI execution attachment and `chat-tui-workbench-plugins.ts` for plugin workbench projections. This keeps the extracted modules aligned to product responsibilities instead of arbitrary helper buckets.

创建 `chat-tui-plugin-execution.ts` 承载 TUI execution attachment，创建 `chat-tui-workbench-plugins.ts` 承载 plugin workbench projections。这样拆分按产品责任划分，而不是按随意 helper bucket 划分。

Alternative considered: move small helpers into generic utility modules. Rejected because generic utility buckets hide ownership and tend to become new central files.

### Decision: Preserve Existing Public Surface

`chat-tui.ts` will re-export plugin execution helpers so existing tests and future callers keep the same import path. The new modules remain private to the CLI host adapter.

`chat-tui.ts` 会继续 re-export plugin execution helpers，使现有 tests 与未来 callers 保持相同 import path。新模块保持 CLI host adapter 私有。

### Decision: Remove Baseline After Mechanical Evidence

The architecture lint baseline is only updated after typecheck, focused tests, lint, and boundary checks prove the split is behavior-preserving.

只有在 typecheck、聚焦测试、lint 与 boundary checks 证明拆分保持行为后，才更新 architecture lint baseline。

## Risks / Trade-offs

- [Risk] Type-only cycles can accidentally become runtime cycles. -> Mitigation: use `import type` for state/workbench shapes and keep runtime imports one-directional.
- [风险] type-only cycles 可能意外变成 runtime cycles。-> 缓解：对 state/workbench 形状使用 `import type`，并保持 runtime imports 单向。
- [Risk] Moving projection code can alter ordering. -> Mitigation: run focused TUI/plugin tests and full lint/boundary checks.
- [风险] 移动 projection code 可能改变排序。-> 缓解：运行聚焦 TUI/plugin tests 与完整 lint/boundary checks。

## Migration Plan

1. Add private modules and move logic without behavior changes.
2. Re-export existing helper APIs from `chat-tui.ts`.
3. Remove split-plan baseline entries.
4. Run focused tests, typecheck, lint, boundary checks, and OpenSpec validation.
