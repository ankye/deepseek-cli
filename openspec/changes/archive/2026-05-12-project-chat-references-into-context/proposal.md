## Why

Chat reference metadata now reaches the runtime and model request boundary, but the model still cannot consume selected reference content. The next CLI-first slice is to turn selected references into governed context projection input so user-selected items can influence the model without bypassing budget, redaction, replay, or runtime event evidence.

Chat reference metadata 现在已经到达 runtime 与 model request 边界，但模型仍无法消费被选中的引用内容。CLI-first 的下一步是把 selected references 转成受治理的 context projection input，让用户选中的条目可以影响模型，同时不绕过预算、脱敏、replay 或 runtime event evidence。

## What Changes

- Resolve supported chat reference targets into bounded context graph candidates before model dispatch.
- Project resolved reference candidates through the existing context engine budget, ordering, cache, and redaction boundary.
- Add selected projected reference slices to model request metadata and model prompt assembly through a deterministic context block owned by runtime, not by the CLI host.
- Emit projection started/completed/degraded/rejected evidence with selected and excluded reference ids.
- Keep unsupported targets, unreadable content, secret-like content, and over-budget candidates out of model-visible text with typed exclusion metadata.
- Preserve slash command locality: `/palette refs ...` controls still do not submit model/runtime requests by themselves.

- 在 model dispatch 前，将 supported chat reference targets 解析为有界 context graph candidates。
- 通过现有 context engine 的 budget、ordering、cache 与 redaction 边界投影 resolved reference candidates。
- 将选中的 projected reference slices 加入 model request metadata，并由 runtime 生成确定性 context block 参与 prompt assembly，而不是由 CLI host 拼接。
- 输出 projection started/completed/degraded/rejected evidence，包含 selected 与 excluded reference ids。
- 对 unsupported targets、不可读内容、疑似 secret 内容和超预算 candidates，输出 typed exclusion metadata，且不进入 model-visible text。
- 保持 slash command 本地化：`/palette refs ...` controls 自身仍不提交 model/runtime requests。

## Capabilities

### New Capabilities

None. / 无。

### Modified Capabilities

- `context-engine`: Resolve and project chat reference candidates under budget/redaction rules.
- `context-graph-projection`: Product projection now covers selected CLI reference content as typed candidates.
- `agent-loop`: Runtime injects projected context into model dispatch with projection events and fail-closed degradation.
- `minimal-chat-cli`: Prompt turns with active references consume governed projected context without CLI prompt mutation.
- `testing-regression`: Add deterministic coverage for reference content projection, exclusions, and prompt assembly boundaries.

## Impact

- Contracts: possible additive fields on context projection request/results and runtime event metadata.
- Runtime: `src/packages/runtime/src/agent-loop.ts` projection path before model dispatch.
- Context engine: `src/packages/context-engine/src/index.ts` candidate projection behavior if existing contracts need support.
- CLI tests: `src/apps/cli/test/cli.test.ts`.
- Contract/integration tests: `tests/contracts/*` or `tests/integration/*` as needed.
- No new external dependency, no CLI host file-content injection, no VSCode/server projection in this slice.

- 契约：可能给 context projection request/results 与 runtime event metadata 增加 additive fields。
- Runtime：`src/packages/runtime/src/agent-loop.ts` 在 model dispatch 前的 projection path。
- Context engine：如果现有 contracts 需要支持，调整 `src/packages/context-engine/src/index.ts` candidate projection behavior。
- CLI tests：`src/apps/cli/test/cli.test.ts`。
- Contract/integration tests：按需调整 `tests/contracts/*` 或 `tests/integration/*`。
- 不新增外部依赖，不在 CLI host 注入文件内容，本阶段不做 VSCode/server projection。
