## Why

PageIndex recall now carries scope and evidence quality metadata, but users cannot inspect a focused recall item without reading raw JSONL or adding it to references first. A local explain command makes recall provenance and match quality visible before the evidence influences the next prompt.

PageIndex recall 现在已携带 scope 与 evidence quality metadata，但用户无法在不读原始 JSONL 或先加入 references 的情况下检查 focused recall item。本地 explain command 可以让 recall provenance 与 match quality 在影响下一条 prompt 前可见。

## What Changes

- Add a local `/palette recall explain <current|item-id|target-id>` command for focused PageIndex recall results.
- Render bounded explain records containing scope, page id, session/turn ids, createdAt, freshness status, matched fields, ranking reason, deterministic score, semantic status, and redaction metadata.
- Keep explain local: no model request, no runtime invocation, no full transcript hydration.

## Capabilities

### New Capabilities

### Modified Capabilities
- `minimal-chat-cli`: PageIndex recall results must be explainable locally through structured command output.

## Impact

- Affected code: `src/apps/cli/src/commands/pageindex.ts`, `src/apps/cli/src/commands/chat.ts`, `src/apps/cli/test/cli.test.ts`.
- Affected specs: `minimal-chat-cli`.
- No new external dependencies and no model/runtime dispatch for explain commands.
