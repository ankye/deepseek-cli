## Why

PageIndex recall now marks stale and unknown evidence, but users and the model only see the coarse freshness state. The CLI needs to expose the evidence behind that state so stale recall can be audited and model-visible summaries can avoid treating old context as unexplained truth.

PageIndex recall 现在已经能标记 stale 与 unknown evidence，但用户和模型目前只看到粗粒度 freshness state。CLI 需要暴露该状态背后的 evidence，使 stale recall 可审计，并让模型可见摘要避免把旧上下文当作没有解释的事实。

## What Changes

- Include freshness evidence fields in `/palette recall explain`, including reason, scope, stale mutation turn id, page workspace watermark, and current workspace watermark when available.
- Include the same freshness evidence in result metadata and projected PageIndex summary text/provenance.
- Keep evidence bounded and metadata-only; do not expose raw transcript or file content.
- Do not change recall ranking, matching, or freshness policy decisions.

## Capabilities

### New Capabilities

### Modified Capabilities
- `minimal-chat-cli`: PageIndex recall explain and projection SHALL expose bounded freshness evidence behind `fresh`, `stale`, and `unknown` states.
- `context-graph-projection`: PageIndex summary projection SHALL include freshness evidence in model-visible summaries and provenance.

## Impact

- Affected code: `src/apps/cli/src/commands/pageindex.ts`, `src/packages/runtime/src/context-projection.ts`, CLI/runtime projection tests.
- Affected specs: `minimal-chat-cli`, `context-graph-projection`.
- No new dependencies, storage migrations, or ranking changes.
