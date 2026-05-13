## Why

Index provider manifests now separate requested provider intent from effective diagnostics, but semantic providers can still be over-trusted if a manifest claims `implementationStatus: "available"` without proving the required pieces exist. Before real ZVec and code-index implementations land, the platform needs an explicit activation evidence gate so CLI/readiness output cannot hallucinate semantic recall capability.

Index provider manifest 现在已经区分 requested provider intent 与 effective diagnostics，但如果 manifest 只声明 `implementationStatus: "available"` 而没有证明必要组件存在，semantic providers 仍可能被过度信任。在真实 ZVec 与 code-index 实现落地前，平台需要显式 activation evidence gate，避免 CLI/readiness 输出虚构 semantic recall 能力。

## What Changes

- Add serializable activation evidence DTOs for index provider manifest entries and resolved diagnostics.
- Require ZVec effective enablement to include present embedding-provider and vector-store evidence in addition to available implementation status.
- Require code-index effective enablement to include present code-analyzer and PageIndex provenance evidence in addition to available implementation status.
- Emit typed diagnostics when requested semantic enablement lacks activation evidence.
- Surface activation evidence summaries through readiness/doctor metadata without executing provider SDKs or exposing secrets.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `index-provider-boundary`: Tightens semantic provider enablement so implementation status alone is not enough; required activation evidence must be present and serializable.
- `cli-diagnostics-release-readiness`: Requires doctor metadata to expose activation evidence status and missing-evidence diagnostics while staying offline and redacted.

## Impact

- Affected code: `src/packages/platform-contracts`, `src/packages/index-provider`, `src/packages/command-system`, CLI config/readiness normalization, contract tests.
- Affected specs: `index-provider-boundary`, `cli-diagnostics-release-readiness`.
- No new external dependency, vector database execution, embedding generation, code analyzer execution, credential lookup, or storage migration.
