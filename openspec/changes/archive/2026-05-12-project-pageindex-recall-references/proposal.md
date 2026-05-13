## Why

PageIndex recall can now find old turns locally, but the model still cannot use a selected recall result unless the user manually copies text into the next prompt. That repeats the same failure mode we are trying to avoid: long-session memory depends on ad hoc prompt text instead of governed, typed context.

PageIndex recall 现在已经能在本地找回旧 turns，但 model 仍不能直接使用选中的 recall result，除非用户手动把文本复制进下一条 prompt。这会重复我们要规避的问题：长会话记忆依赖临时 prompt text，而不是受治理、类型化的 context。

## What Changes

- Allow `/palette refs add current` to preserve PageIndex recall `turn` targets as active references.
- Teach runtime context projection to materialize `turn` references that carry PageIndex metadata into bounded `summary` context nodes.
- Keep projection runtime-owned: the CLI passes typed reference metadata only; it does not concatenate recall text into prompts.
- Preserve prompt boundaries: the user prompt remains unchanged and projected summaries enter as a system context message.
- Keep full transcript access out of scope. Projection uses bounded PageIndex previews only.
- Add regression coverage for CLI recall -> reference -> prompt projection and runtime turn-reference projection.

- 允许 `/palette refs add current` 将 PageIndex recall 的 `turn` targets 保留为 active references。
- 让 runtime context projection 将携带 PageIndex metadata 的 `turn` references 物化为有界 `summary` context nodes。
- 保持 projection 由 runtime 拥有：CLI 只传类型化 reference metadata，不把 recall 文本拼入 prompt。
- 保持 prompt boundary：user prompt 不变，投影 summary 作为 system context message 进入模型。
- 不读取完整 transcript。Projection 只使用有界 PageIndex previews。
- 增加 CLI recall -> reference -> prompt projection 与 runtime turn-reference projection 的回归覆盖。

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `minimal-chat-cli`: PageIndex recall results can be added as active references and carried to the next prompt.
- `vi-inspired-cli-composition`: Recall `turn` references remain typed reference items with page metadata.
- `context-graph-projection`: Runtime projection materializes PageIndex `turn` references into bounded summary nodes.
- `testing-regression`: Adds deterministic CLI and runtime coverage for recall reference projection.

## Impact

- Affected CLI PageIndex result-list metadata under `src/apps/cli/src/commands/pageindex.ts`.
- Affected runtime projection under `src/packages/runtime/src/context-projection.ts` and context message rendering in `agent-loop.ts`.
- Adds/updates tests in `src/apps/cli/test/cli.test.ts` and `src/packages/runtime/test/runtime.test.ts`.
- Does not add durable transcript storage, embeddings, or ZVec.

- 影响 `src/apps/cli/src/commands/pageindex.ts` 中的 PageIndex result-list metadata。
- 影响 `src/packages/runtime/src/context-projection.ts` 的 runtime projection，以及 `agent-loop.ts` 的 context message rendering。
- 在 `src/apps/cli/test/cli.test.ts` 与 `src/packages/runtime/test/runtime.test.ts` 增加/更新测试。
- 不增加 durable transcript storage、embeddings 或 ZVec。
