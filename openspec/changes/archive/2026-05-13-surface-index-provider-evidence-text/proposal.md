## Why

The index provider resolver now blocks semantic providers unless activation evidence is present, but CLI text output still mostly shows status and diagnostic codes. Users need the same safety reason in normal terminal output so `index-provider status`, `index-provider set`, and `diagnostics doctor` explain what evidence is missing without requiring JSON inspection.

Index provider resolver 现在会在缺少 activation evidence 时阻止 semantic providers，但 CLI text output 仍主要展示 status 与 diagnostic codes。用户需要在普通终端输出中直接看到同样的安全原因，让 `index-provider status`、`index-provider set` 与 `diagnostics doctor` 不需要查看 JSON 也能解释缺少哪些 evidence。

## What Changes

- Render activation evidence status summaries in `deepseek index-provider status` text output.
- Render missing activation evidence kinds alongside provider diagnostics in `deepseek index-provider set` text output.
- Render provider evidence and downgrade reasons in `deepseek diagnostics doctor` text output.
- Preserve JSON/JSONL output shapes and avoid any provider SDK, vector database, embedding provider, code analyzer, or credential calls.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `cli-diagnostics-release-readiness`: Text diagnostics for index provider commands and doctor output must surface activation evidence and missing-evidence reasons, not only effective status.

## Impact

- Affected code: CLI index-provider text renderer, diagnostics text renderer, CLI/e2e tests.
- Affected specs: `cli-diagnostics-release-readiness`.
- No contract changes, storage migration, external dependency, or live provider execution.
