## Why

`/revert apply current` is now capable of restoring files through checkpoint safety checks, but an interactive user can still jump from intent to mutation too quickly. The chat CLI needs a local review/confirm layer so users can inspect the dry-run impact, get a stable review id, and then explicitly confirm the exact reviewed target.

`/revert apply current` 现在已经能通过 checkpoint safety checks 恢复文件，但交互用户仍然可能太快从意图跳到 mutation。Chat CLI 需要一个本地 review/confirm 层，让用户先查看 dry-run impact、获得稳定 review id，然后显式确认这个被 review 过的 target。

## What Changes

- Add chat-local `/revert review current` to resolve selected history, run dry-run preview, and store a pending review record.
- Add chat-local `/revert confirm <review-id|current>` to apply only a pending review's explicit session/turn target.
- Render deterministic text, JSON, and JSONL review/confirmation summaries with affected checkpoint/path counts, target ids, status, diagnostics, and redaction metadata.
- Keep review and confirm slash commands local: no model request, no direct runtime primitive execution from vi-style command handling, and no raw rollback content.
- Leave scriptable `deepseek revert apply ...` unchanged for automation.

- 增加 chat-local `/revert review current`，解析 selected history，运行 dry-run preview，并保存 pending review record。
- 增加 chat-local `/revert confirm <review-id|current>`，只能对 pending review 的显式 session/turn target 执行 apply。
- 为 review/confirmation summary 渲染确定性的 text、JSON、JSONL，包含 affected checkpoint/path counts、target ids、status、diagnostics 和 redaction metadata。
- review 与 confirm slash commands 保持本地化：不提交 model request，不从 vi-style command handling 直接执行 runtime primitives，不暴露 raw rollback content。
- 保持可脚本化 `deepseek revert apply ...` 不变，继续服务自动化。

## Capabilities

### New Capabilities

None. / 无。

### Modified Capabilities

- `minimal-chat-cli`: Add chat-local revert review and confirm controls before interactive apply.
- `checkpoint-undo`: Add review-before-confirm semantics for interactive chat apply while preserving scriptable apply.
- `testing-regression`: Add deterministic coverage for review creation, confirmation, stale confirm rejection, and no-model-submission behavior.

- `minimal-chat-cli`：增加交互 apply 前的 chat-local revert review 和 confirm controls。
- `checkpoint-undo`：为 interactive chat apply 增加 review-before-confirm 语义，同时保留 scriptable apply。
- `testing-regression`：增加 review creation、confirmation、stale confirm rejection、no-model-submission behavior 的确定性覆盖。

## Impact

- CLI chat command handling and local session state: `src/apps/cli/src/commands/chat.ts`.
- Revert rendering helpers: `src/apps/cli/src/commands/revert.ts`.
- Chat help projection: `src/packages/command-system/src/implementation.ts`.
- CLI tests: `src/apps/cli/test/cli.test.ts`.
- No new dependency, no contract implementation inside `platform-contracts`, and no external reference implementation is copied.

- CLI chat command handling 与本地 session state：`src/apps/cli/src/commands/chat.ts`。
- Revert rendering helpers：`src/apps/cli/src/commands/revert.ts`。
- Chat help projection：`src/packages/command-system/src/implementation.ts`。
- CLI tests：`src/apps/cli/test/cli.test.ts`。
- 不新增依赖，不在 `platform-contracts` 写实现，不复制外部参考实现细节。
