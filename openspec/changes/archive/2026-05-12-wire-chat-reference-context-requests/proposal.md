## Why

Chat reference sets can now be created, inspected, and focused, but prompt turns still ignore them. The next CLI-first step is to carry selected references into the governed runtime request as structured metadata, proving the path before any raw file-content projection or richer TUI.

Chat reference sets 现在可以创建、查看和聚焦，但 prompt turns 仍然不会使用它们。CLI-first 的下一步是将选中的 references 作为结构化 metadata 带入受治理的 runtime request，在做 raw file-content projection 或 richer TUI 前先证明这条路径。

## What Changes

- Add a host-agnostic `referenceContext` field to `AgentLoopRequest` containing reference set ids, active reference id, item ids, target ids/kinds, labels, provenance, ordering, and redaction metadata.
- Have chat build `referenceContext` from the active palette composition snapshot when submitting a normal prompt turn.
- Emit reference context metadata in `agent.loop.started`, `turn.started`, relevant hook inputs, and model request metadata so tests and future context projection can consume it.
- Keep prompt text unchanged and do not read raw file contents in this slice.
- Preserve local slash command behavior: listing/focusing references remains local and model-hidden; only subsequent non-slash prompt turns receive reference metadata.

- 在 `AgentLoopRequest` 中增加 host-agnostic `referenceContext` 字段，包含 reference set ids、active reference id、item ids、target ids/kinds、labels、provenance、ordering 与 redaction metadata。
- Chat 在提交普通 prompt turn 时，从 active palette composition snapshot 构建 `referenceContext`。
- 在 `agent.loop.started`、`turn.started`、相关 hook inputs 和 model request metadata 中输出 reference context metadata，便于 tests 与后续 context projection 使用。
- 本阶段保持 prompt text 不变，不读取 raw file contents。
- 保留本地 slash command 行为：listing/focusing references 仍然本地且对 model 隐藏；只有后续非 slash prompt turns 接收 reference metadata。

## Capabilities

### New Capabilities

None. / 无。

### Modified Capabilities

- `platform-contracts`: Add structured reference context to agent loop request contracts.
- `minimal-chat-cli`: Submit active chat references with prompt turns as structured runtime request metadata.
- `vi-inspired-cli-composition`: Advance reference sets from local focus state into structured prompt-turn context metadata.
- `testing-regression`: Add deterministic coverage that reference context is carried without raw content or slash-command model submission.

- `platform-contracts`：在 agent loop request contracts 中增加结构化 reference context。
- `minimal-chat-cli`：随 prompt turns 提交 active chat references，作为结构化 runtime request metadata。
- `vi-inspired-cli-composition`：将 reference sets 从本地 focus state 推进到结构化 prompt-turn context metadata。
- `testing-regression`：增加确定性覆盖，验证 reference context 被携带且没有 raw content 或 slash-command model submission。

## Impact

- Contracts: `src/packages/platform-contracts/src/runtime.ts`.
- Runtime event/model metadata: `src/packages/runtime/src/agent-loop.ts`.
- CLI chat state projection: `src/apps/cli/src/commands/palette-state.ts`, `src/apps/cli/src/commands/chat.ts`.
- Tests: `src/apps/cli/test/cli.test.ts`, plus contract/runtime tests if required.
- No new dependency, no runtime execution bypass, no raw file content projection, and no external reference implementation details.

- Contracts：`src/packages/platform-contracts/src/runtime.ts`。
- Runtime event/model metadata：`src/packages/runtime/src/agent-loop.ts`。
- CLI chat state projection：`src/apps/cli/src/commands/palette-state.ts`、`src/apps/cli/src/commands/chat.ts`。
- Tests：`src/apps/cli/test/cli.test.ts`，必要时补 contract/runtime tests。
- 不新增依赖，不绕过 runtime execution，不做 raw file content projection，不包含外部参考实现细节。
