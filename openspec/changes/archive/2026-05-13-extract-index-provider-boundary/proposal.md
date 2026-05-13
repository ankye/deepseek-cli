## Why

PageIndex recall is already carrying session/workspace evidence, freshness, and future semantic status, but the implementation boundary still lives too close to the CLI host. Before adding ZVec, code index, or embedding providers, the platform needs a host-agnostic index provider contract so CLI can focus on terminal interaction while shared packages own deterministic indexing, recall, provenance, and provider configuration.

PageIndex recall 已经承载 session/workspace evidence、freshness 与未来 semantic status，但实现边界仍然离 CLI host 太近。在加入 ZVec、code index 或 embedding providers 前，平台需要一个 host-agnostic index provider contract，让 CLI 专注终端交互，由共享 packages 负责确定性的 indexing、recall、provenance 与 provider configuration。

## What Changes

- Add an `index-provider-boundary` capability that defines PageIndex as the deterministic truth source and ZVec/code index as optional projections or ranking providers.
- Introduce platform contracts for index provider ids, scopes, pages, recall requests/results, freshness evidence, semantic provider status, and provider configuration.
- Add a shared `@deepseek/index-provider` package for deterministic PageIndex DTO normalization and text recall primitives.
- Keep embedding/ZVec providers deferred behind contracts; no external vector database or embedding SDK is added in this slice.
- Refactor CLI PageIndex to consume shared contracts/primitives without changing user-visible recall behavior.

## Capabilities

### New Capabilities
- `index-provider-boundary`: Defines host-agnostic index provider contracts, deterministic PageIndex truth-source rules, optional semantic provider boundaries, and CLI/runtime ownership constraints.

### Modified Capabilities
- `minimal-chat-cli`: CLI PageIndex recall SHALL route deterministic indexing/recall through the shared index provider boundary while keeping slash commands local.
- `context-graph-projection`: PageIndex/ZVec/code-index projection SHALL preserve deterministic PageIndex provenance when semantic providers are introduced.

## Impact

- Affected code: `src/packages/platform-contracts`, new `src/packages/index-provider`, `src/apps/cli/src/commands/pageindex.ts`, workspace package metadata, contract/CLI tests.
- Affected specs: new `index-provider-boundary`, plus `minimal-chat-cli` and `context-graph-projection` deltas.
- No new external dependencies, storage migration, or semantic ranking implementation in this slice.
