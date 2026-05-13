## Why

Chat palette controls can add the focused result-list item to a structured reference set, but users cannot inspect or switch the active reference item afterward. That blocks the vi-inspired multi-file workflow from feeling like a real working set instead of a hidden counter.

Chat palette controls 现在可以把当前 result-list item 加入结构化 reference set，但用户之后不能查看或切换 active reference item。这会让 vi-inspired multi-file workflow 停留在隐藏计数器，而不是可操作的工作集。

## What Changes

- Add chat-local `/palette refs list` to render active reference sets and items with deterministic ids, labels, targets, provenance, order, and active item metadata.
- Add chat-local `/palette refs focus <ref-id|index|target-id|current>` to switch active reference focus without dropping existing references.
- Keep `/palette refs add <target-id|current>` behavior and use the same composition snapshot state.
- Render text, JSON, and JSONL records without ANSI controls or raw file contents.
- Keep reference-set controls local: no model request, no runtime invocation, no command owner execution, and no workspace mutation.

- 增加 chat-local `/palette refs list`，渲染 active reference sets 与 items，包含确定性 ids、labels、targets、provenance、order 和 active item metadata。
- 增加 chat-local `/palette refs focus <ref-id|index|target-id|current>`，在不丢失已有 references 的情况下切换 active reference focus。
- 保留 `/palette refs add <target-id|current>` 行为，并复用同一个 composition snapshot state。
- 渲染 text、JSON、JSONL records，不包含 ANSI controls 或 raw file contents。
- reference-set controls 保持本地化：不提交 model request、不调用 runtime、不执行 command owner、不修改 workspace。

## Capabilities

### New Capabilities

None. / 无。

### Modified Capabilities

- `vi-inspired-cli-composition`: Make reference-set inspection and focus switching explicit local controls.
- `command-palette-vi-actions`: Define structured reference-set focus updates over composition snapshots.
- `minimal-chat-cli`: Expose `/palette refs list` and `/palette refs focus ...` slash controls.
- `testing-regression`: Add deterministic regression coverage for list, focus, missing target, and no-model/no-runtime behavior.

- `vi-inspired-cli-composition`：将 reference-set inspection 与 focus switching 明确为本地 controls。
- `command-palette-vi-actions`：定义 composition snapshots 上的结构化 reference-set focus updates。
- `minimal-chat-cli`：暴露 `/palette refs list` 与 `/palette refs focus ...` slash controls。
- `testing-regression`：增加 list、focus、missing target 与 no-model/no-runtime behavior 的确定性回归覆盖。

## Impact

- Platform contracts: `src/packages/platform-contracts/src/cli-composition.ts`, `src/packages/platform-contracts/src/cli-palette.ts`.
- Command action resolver: `src/packages/command-system/src/actions.ts`.
- CLI chat palette state: `src/apps/cli/src/commands/palette-state.ts`, `src/apps/cli/src/commands/chat.ts`.
- Help projection: `src/packages/command-system/src/implementation.ts`.
- Tests: `tests/contracts/cli-palette-actions.test.ts`, `src/apps/cli/test/cli.test.ts`.
- No new dependencies, no cross-app imports, no runtime execution bypass, and no external reference implementation details.

- Platform contracts：`src/packages/platform-contracts/src/cli-composition.ts`、`src/packages/platform-contracts/src/cli-palette.ts`。
- Command action resolver：`src/packages/command-system/src/actions.ts`。
- CLI chat palette state：`src/apps/cli/src/commands/palette-state.ts`、`src/apps/cli/src/commands/chat.ts`。
- Help projection：`src/packages/command-system/src/implementation.ts`。
- Tests：`tests/contracts/cli-palette-actions.test.ts`、`src/apps/cli/test/cli.test.ts`。
- 不新增依赖，不跨 app import，不绕过 runtime execution，不包含外部参考实现细节。
