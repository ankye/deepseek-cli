## Why

Index provider diagnostics now show PageIndex/ZVec/code-index status, but the status is still produced from a fixed default. Before adding real ZVec, embedding, or code-index providers, the platform needs a host-agnostic manifest resolver so configuration can be explicit, validated, and safe to surface in CLI doctor output.

Index provider diagnostics 现在能显示 PageIndex/ZVec/code-index 状态，但状态仍来自固定默认值。在加入真实 ZVec、embedding 或 code-index providers 前，平台需要 host-agnostic manifest resolver，让配置显式、可校验，并能安全地出现在 CLI doctor 输出中。

## What Changes

- Add serializable index provider manifest DTOs for default provider, provider entries, source metadata, and disabled/deferred/enabled intent.
- Add a shared manifest resolver in `@deepseek/index-provider` that normalizes partial or malformed manifests into safe diagnostics.
- Keep PageIndex enabled by default and force semantic providers without implementation evidence back to `deferred` or `disabled`.
- Thread CLI config-derived provider manifest input into readiness/diagnostics doctor metadata.
- Do not add real ZVec, embedding SDK, vector database, or code semantic index execution in this slice.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `index-provider-boundary`: Adds manifest-based provider configuration and safe normalization requirements.
- `cli-diagnostics-release-readiness`: Requires doctor diagnostics to identify provider manifest source and validation diagnostics without exposing secrets.

## Impact

- Affected code: `src/packages/platform-contracts`, `src/packages/index-provider`, CLI readiness environment assembly, CLI/contract tests.
- Affected specs: `index-provider-boundary`, `cli-diagnostics-release-readiness`.
- No external dependencies, storage migration, network calls, or real semantic provider execution.
