## Why

`/revert preview current` already lets the CLI explain what a selected chat turn would roll back, but users still cannot complete the rollback from the same controlled flow. To avoid the Claude-style trap where earlier requests cannot be safely reverted, the CLI needs a small apply surface that uses existing checkpoint contracts, keeps slash controls local, and makes every mutation explicit and typed.

`/revert preview current` 已经可以解释选中 chat turn 会回退什么，但用户还不能在同一条受控路径里完成回退。为了避免 Claude CLI 那类“前序请求无法安全回退”的坑，CLI 需要一个小而明确的 apply 能力：复用现有 checkpoint contracts，保持 slash controls 本地化，并让每一次 mutation 都显式、可审计、类型化。

## What Changes

- Add scriptable `deepseek revert apply --request|--turn|--session [--path]` support that calls the workspace state manager with `dryRun=false` and renders typed restore evidence.
- Add chat-local `/revert apply current` support that resolves `current` through selected chat history before applying the request/turn-scoped revert.
- Add deterministic text, JSON, and JSONL rendering for revert apply summaries, diagnostics, restored path counts, stale paths, and redaction metadata.
- Keep malformed, empty-history, missing-target, and stale-file cases typed and local without submitting slash commands to the model.
- Update help text and regression coverage so preview remains non-mutating while apply mutates only through checkpoint safety checks.

- 增加可脚本化 `deepseek revert apply --request|--turn|--session [--path]`，通过 workspace state manager 以 `dryRun=false` 执行，并渲染类型化 restore evidence。
- 增加 chat-local `/revert apply current`，先通过 selected chat history 解析 `current`，再执行 request/turn-scoped revert。
- 为 revert apply summary、diagnostics、restored path counts、stale paths 和 redaction metadata 增加确定性的 text、JSON 与 JSONL 渲染。
- malformed、empty-history、missing-target 与 stale-file 场景保持类型化本地失败，不把 slash command 发送给 model。
- 更新 help 与回归测试，确保 preview 仍不修改状态，而 apply 只能通过 checkpoint safety checks 修改。

## Capabilities

### New Capabilities

None. / 无。

### Modified Capabilities

- `checkpoint-undo`: Add CLI request/turn/session scoped revert apply controls that use existing checkpoint restore safety checks.
- `minimal-chat-cli`: Add chat-local `/revert apply current` behavior and help exposure.
- `testing-regression`: Add deterministic regression coverage for successful apply, stale rejection, local chat apply, and preview/apply separation.

- `checkpoint-undo`：增加 CLI request/turn/session scoped revert apply controls，并复用现有 checkpoint restore safety checks。
- `minimal-chat-cli`：增加 chat-local `/revert apply current` 行为与 help 暴露。
- `testing-regression`：增加 successful apply、stale rejection、local chat apply、preview/apply separation 的确定性回归覆盖。

## Impact

- CLI host adapter: `src/apps/cli/src/commands/revert.ts`, `src/apps/cli/src/commands/chat.ts`, `src/apps/cli/src/commands/parse.ts`, `src/apps/cli/src/types.ts`, and README/help surfaces.
- Command system help: `src/packages/command-system/src/implementation.ts`.
- Tests: `src/apps/cli/test/cli.test.ts` plus existing workspace checkpoint contract behavior.
- No new runtime dependency is required; the change reuses `WorkspaceStateManager.revertRequest`.
- No app-to-app imports, no contract implementation in `platform-contracts`, and no external reference implementation is copied.

- CLI host adapter：`src/apps/cli/src/commands/revert.ts`、`src/apps/cli/src/commands/chat.ts`、`src/apps/cli/src/commands/parse.ts`、`src/apps/cli/src/types.ts` 与 README/help surfaces。
- Command system help：`src/packages/command-system/src/implementation.ts`。
- 测试：`src/apps/cli/test/cli.test.ts` 以及现有 workspace checkpoint contract 行为。
- 不引入新的 runtime dependency；复用 `WorkspaceStateManager.revertRequest`。
- 不做 app-to-app import，不在 `platform-contracts` 写实现，不复制外部参考实现细节。
