## Why

The CLI now has a shared index provider boundary, but users and diagnostics cannot yet see which recall providers are active, deferred, or unavailable. As we keep PageIndex first and defer ZVec/code-index work, doctor output needs explicit provider evidence so the CLI does not look more capable than it is.

CLI 现在已经有 shared index provider boundary，但用户与诊断还不能看到哪些 recall providers 已启用、延期或不可用。我们继续以 PageIndex 优先、ZVec/code-index 延后时，doctor 输出需要明确的 provider evidence，避免 CLI 看起来拥有尚未实现的能力。

## What Changes

- Add a serializable index provider diagnostics summary that lists PageIndex, ZVec, and code-index status with scopes, ranking modes, diagnostics, and redaction metadata.
- Expose PageIndex-only default diagnostics from `@deepseek/index-provider`: PageIndex enabled, semantic/vector/code providers deferred until configured.
- Surface the provider summary through CLI readiness/diagnostics doctor output without importing SDKs, reading secrets, or performing live provider calls.
- Keep real ZVec storage, embedding provider selection, ANN search, and code semantic ranking out of scope for this slice.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `index-provider-boundary`: Adds diagnostic summary requirements for explicit provider readiness/status projection.
- `cli-diagnostics-release-readiness`: Requires CLI doctor diagnostics to surface index provider status safely in text and structured modes.

## Impact

- Affected code: `src/packages/platform-contracts`, `src/packages/index-provider`, `src/packages/command-system`, `src/apps/cli/src/commands/readiness.ts`, `src/apps/cli/src/diagnostics/index.ts`, CLI and contract tests.
- Affected specs: `index-provider-boundary`, `cli-diagnostics-release-readiness`.
- No external dependencies, network calls, storage migrations, or real vector/embedding provider integration.
