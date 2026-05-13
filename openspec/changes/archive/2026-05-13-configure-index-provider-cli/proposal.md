## Why

The platform can normalize index provider manifests, but users still have no safe CLI surface to inspect or change provider intent. CLI-first work needs a local command that makes PageIndex/ZVec/code-index configuration visible and auditable without enabling unsupported providers or reading secrets.

平台已经可以归一化 index provider manifests，但用户还没有安全的 CLI 入口来查看或修改 provider intent。CLI-first 工作需要一个本地命令，让 PageIndex/ZVec/code-index 配置可见、可审计，同时不启用未支持 providers、不读取 secrets。

## What Changes

- Add `deepseek index-provider status` to render resolved provider diagnostics and manifest source.
- Add `deepseek index-provider set <provider> <status>` to store safe provider intent in workspace/user config.
- Constrain configurable providers and statuses to known values and route all effective status decisions through `@deepseek/index-provider`.
- Show requested status, effective status, implementation evidence, and validation diagnostic codes in text/JSON/JSONL output.
- Do not execute ZVec, embedding providers, vector databases, code analyzers, model providers, or credential resolvers.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `index-provider-boundary`: Adds CLI-manageable provider intent constraints while preserving manifest normalization as the effective authority.
- `cli-diagnostics-release-readiness`: Adds a local CLI index-provider command surface that remains diagnostics/configuration-only.

## Impact

- Affected code: CLI types/parser/usage, new CLI command handler, config known keys, CLI tests.
- Affected specs: `index-provider-boundary`, `cli-diagnostics-release-readiness`.
- No new dependencies, network calls, or semantic provider implementations.
