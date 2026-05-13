## Why

PageIndex summaries now expose provenance and evidence quality, but the model-visible text still lacks an explicit instruction boundary telling the model to treat recall as historical evidence rather than current truth. Adding a usage qualifier helps reduce hallucinated continuity in long sessions.

PageIndex summary 现在已暴露 provenance 与 evidence quality，但模型可见文本仍缺少明确边界，未说明 recall 应被视为历史证据而不是当前事实。增加 usage qualifier 能减少长会话中的连续性幻觉。

## What Changes

- Add a model-visible PageIndex usage qualifier line to projected recall summaries.
- Preserve the qualifier in node provenance and replay dependency fingerprints.
- Add regression coverage that projected PageIndex context includes the qualifier while keeping the user prompt unchanged.

## Capabilities

### New Capabilities

### Modified Capabilities
- `context-graph-projection`: PageIndex summary projection must include an evidence usage qualifier.

## Impact

- Affected code: `src/packages/runtime/src/context-projection.ts`, `src/apps/cli/test/cli.test.ts`.
- Affected specs: `context-graph-projection`.
- No CLI command changes, no model/provider dependency changes.
