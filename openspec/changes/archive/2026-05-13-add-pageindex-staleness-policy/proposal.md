## Why

PageIndex recall now has runtime-sourced timestamps, but the quality signal still collapses most usable evidence into `known`. The CLI needs a clearer freshness vocabulary before PageIndex, zvec, and future workspace invalidation can tell the model whether recalled context is current, stale, or unverifiable.

PageIndex recall 现在已经有 runtime-sourced timestamps，但 quality signal 仍把大多数可用 evidence 折叠为 `known`。CLI 需要更清晰的 freshness vocabulary，才能让 PageIndex、zvec 与未来 workspace invalidation 告诉模型 recalled context 是 current、stale，还是无法验证。

## What Changes

- Replace the binary `known/unknown` PageIndex freshness interpretation with a bounded policy vocabulary: `fresh`, `stale`, and `unknown`.
- Mark newly recorded runtime-timestamped PageIndex pages as `fresh` instead of merely `known`.
- Preserve deterministic fallback behavior as `unknown` for legacy or malformed events.
- Keep projection wording conservative: fresh still remains historical recall evidence and must not be treated as verified current workspace state.

## Capabilities

### New Capabilities

### Modified Capabilities
- `minimal-chat-cli`: PageIndex recall metadata SHALL expose bounded freshness states instead of only known/unknown.

## Impact

- Affected code: `src/apps/cli/src/commands/pageindex.ts`, CLI tests, runtime context projection tests that assert PageIndex evidence text.
- Affected specs: `minimal-chat-cli`.
- No new external dependency, no vector store change, and no workspace edit invalidation logic in this slice.
