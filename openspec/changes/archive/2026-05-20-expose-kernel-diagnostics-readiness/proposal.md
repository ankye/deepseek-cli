## Why

DeepSeek needs a `/proc`-style diagnostics surface that exposes kernel boundary health, UAPI compatibility, context cache health, bus pressure, agent scopes, policy gates, and module state before release decisions. / DeepSeek 需要 `/proc` 风格 diagnostics 表面，在发布决策前暴露 kernel boundary health、UAPI compatibility、context cache health、bus pressure、agent scopes、policy gates 与 module state。

Without a single product-facing readiness view, governance evidence remains scattered across lint, tests, docs, and package internals. / 如果没有统一的产品就绪视图，治理证据会分散在 lint、tests、docs 与 package internals 中。

## What Changes

- Add structured diagnostics sections for kernel and extensibility governance. / 增加 kernel 与 extensibility governance 的结构化 diagnostics sections。
- Require text, JSON, and JSONL readiness output for governance findings. / 要求 governance findings 支持 text、JSON 与 JSONL readiness output。
- Link diagnostics findings to platform-governance records and acceptance evidence. / 将 diagnostics findings 链接到 platform-governance records 与 acceptance evidence。

## Capabilities

### New Capabilities

### Modified Capabilities

- `cli-diagnostics-release-readiness`: Add `/proc`-style governance diagnostics and output requirements. / 增加 `/proc` 风格治理 diagnostics 与输出要求。
- `platform-governance`: Add governance finding linkage and closure evidence requirements. / 增加治理发现链接与关闭证据要求。

## Impact

- Owner packages / 责任包: `apps/cli`, `platform-governance` records, `testing-regression`, diagnostics/readiness code.
- Product surface / 产品表面: CLI diagnostics/readiness output changes only. / 仅改变 CLI diagnostics/readiness 输出。
