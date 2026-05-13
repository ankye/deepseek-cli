## Why

PageIndex recall now persists session-scoped chat evidence, but users need an explicit way to ask whether recall is session-only or broader. Making scope visible now prevents the CLI from implying cross-session memory before workspace/global indexes are implemented.

PageIndex recall 现在已经能持久化 session-scoped chat evidence，但用户需要明确指定回溯范围。现在把 scope 显式化，可以避免 CLI 在 workspace/global index 尚未实现时暗示自己已经具备跨会话记忆。

## What Changes

- Add explicit scope parsing for chat-local `/palette recall`, with `session` as the default scope.
- Support both `/palette recall <query>` and `/palette recall --scope session <query>` for current behavior.
- Return a typed local deferred result for `/palette recall --scope workspace|global <query>` until broader PageIndex indexes exist.
- Preserve PageIndex provenance in recall summaries and result items so later context projection can distinguish session evidence from future workspace/global evidence.
- Add regression tests for default scope, explicit session scope, unsupported broader scopes, and invalid/missing scope input.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `minimal-chat-cli`: Chat PageIndex recall gains explicit scope controls and typed deferred behavior for unavailable broader scopes.
- `testing-regression`: Regression coverage is extended for PageIndex recall scope parsing and unsupported-scope safety.

## Impact

- `src/apps/cli/src/commands/chat.ts`
- `src/apps/cli/src/commands/pageindex.ts`
- `src/apps/cli/test/cli.test.ts`
- OpenSpec specs for `minimal-chat-cli` and `testing-regression`
