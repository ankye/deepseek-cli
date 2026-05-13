## Why

Long CLI chat sessions should not lose local recall context after a process restart. PageIndex already gives deterministic in-session recall, so the next step is to persist its bounded pages through the existing session snapshot contract.

长时间 CLI chat 会话不应在进程重启后丢失本地回溯上下文。PageIndex 已经提供会话内确定性回溯，下一步应通过既有 session snapshot 合约持久化其有界 pages。

## What Changes

- Add `deepseek chat --session <id>` as the chat resume entry for PageIndex restoration.
- Snapshot bounded Chat PageIndex pages after terminal prompt turns through the injected session store.
- Hydrate PageIndex pages from a resumed session snapshot before local slash commands run.
- Keep snapshot payloads bounded, versioned, redacted, and free of raw full transcript content.
- Emit typed local failures when chat resume cannot resolve the requested session.

## Capabilities

### New Capabilities

### Modified Capabilities
- `minimal-chat-cli`: Chat PageIndex recall must persist through session snapshots and restore via `deepseek chat --session <id>`.
- `testing-regression`: Regression coverage must verify chat PageIndex snapshot persistence, resume behavior, no slash-command model submission, and bounded snapshot output.

## Impact

- Affected code: `src/apps/cli/src/commands/parse.ts`, `src/apps/cli/src/commands/chat.ts`, `src/apps/cli/src/commands/pageindex.ts`, CLI host tests, and runtime wiring for the default CLI session store if needed.
- Affected contracts: uses existing `SessionStore.snapshot/resume` and `SessionSnapshot.payload`; no new platform-contracts API is required.
- Risk boundary: snapshots contain only bounded PageIndex previews and metadata, not raw transcript text.
