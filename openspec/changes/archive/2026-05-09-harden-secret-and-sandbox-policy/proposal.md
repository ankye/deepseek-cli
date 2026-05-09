## Why

R2 context projection now blocks obvious secret-like context before model dispatch, but the product still needs a platform-wide secret and sandbox hardening layer so file reads, edits, shell/process execution, tool evidence, traces, caches, and host output all fail closed under the same rules. This must happen before broader memory, code intelligence, plugin, MCP, and multi-agent workflows increase the amount of data and side effects flowing through the system.

R2 context projection 已经能在 model dispatch 前阻止明显的 secret-like context，但产品仍需要平台级 secret 与 sandbox hardening 层，让 file reads、edits、shell/process execution、tool evidence、traces、caches 和 host output 都遵循同一套 fail-closed 规则。该能力必须在 memory、code intelligence、plugin、MCP 和 multi-agent workflows 扩大数据量与副作用前完成。

## What Changes

- Introduce a product-level secret and sandbox hardening capability covering secret classification, redaction, deny/rewrite decisions, audit evidence, and deterministic sandbox enforcement matrix behavior.
- Extend `policy-sandbox` so policy decisions evaluate secret exposure, filesystem scope, process/shell scope, environment scope, network scope, and platform degradation before scheduler execution.
- Extend `context-graph-projection` so secret decisions remain consistent with policy/sandbox decisions and projection cannot whitelist content that policy denies.
- Extend `capability-execution-governance` so tool inputs/outputs declare side effects, secret exposure, resource scope, and sandbox requirements in the execution envelope.
- Extend `platform-abstraction` so fake and real platform adapters expose enough sandbox capability metadata to make deterministic policy decisions.
- Extend `testing-regression` with secret fixtures, sandbox matrix fixtures, golden/audit replay, lint bypass tests, and e2e no-secret-output checks.
- No breaking change is intended; unsafe behavior should become explicit typed rejection or rewrite rather than silent execution.

- 引入产品级 secret 与 sandbox hardening 能力，覆盖 secret classification、redaction、deny/rewrite decisions、audit evidence 和 deterministic sandbox enforcement matrix 行为。
- 扩展 `policy-sandbox`，让 policy decisions 在 scheduler execution 前评估 secret exposure、filesystem scope、process/shell scope、environment scope、network scope 和 platform degradation。
- 扩展 `context-graph-projection`，确保 secret decisions 与 policy/sandbox decisions 保持一致，且 projection 不能放行 policy deny 的内容。
- 扩展 `capability-execution-governance`，让 tool inputs/outputs 在 execution envelope 中声明 side effects、secret exposure、resource scope 和 sandbox requirements。
- 扩展 `platform-abstraction`，让 fake 与 real platform adapters 暴露足够 sandbox capability metadata，以做 deterministic policy decisions。
- 扩展 `testing-regression`，增加 secret fixtures、sandbox matrix fixtures、golden/audit replay、lint bypass tests 和 e2e no-secret-output checks。
- 不引入 breaking change；unsafe behavior 应变成明确 typed rejection 或 rewrite，而不是 silent execution。

## Capabilities

### New Capabilities

- `secret-sandbox-hardening`: Product-level hardening contract for secret classification, redaction, sandbox enforcement matrix, fail-closed behavior, and audit evidence.

### Modified Capabilities

- `policy-sandbox`: Add secret-aware and platform-aware sandbox decisions before governed execution reaches the scheduler.
- `context-graph-projection`: Align projection redaction with policy decisions and prevent policy-denied content from entering model context.
- `capability-execution-governance`: Require envelopes and capability manifests to declare secret exposure and sandbox/resource requirements.
- `platform-abstraction`: Add sandbox capability metadata and degraded-platform signals needed by deterministic policy.
- `testing-regression`: Add secret/sandbox regression ladder, fixtures, matrix coverage, golden audit replay, and lint bypass checks.

## Impact

- Affected packages: `platform-contracts`, `policy-sandbox`, `platform-abstraction`, `capability-registry`, `core-coding-tools`, `runtime`, `context-engine`, `testing-regression`, and CLI e2e tests.
- Affected APIs: policy request metadata, sandbox profile selection, platform execution context, capability manifests, execution envelope resource/sandbox metadata, redaction summaries, and audit records.
- Affected tests: contract tests for policy/envelope shapes, unit tests for secret classification and redaction, integration tests for denied/rewrite execution, matrix tests for filesystem/process/network/env platform states, golden replay for audit events, and e2e smoke for no raw secret output.
- Out of scope: full OS-level containerization, enterprise managed policy, signed plugins, remote organization audit export, and complete code-intelligence secret scanning.

- 影响包：`platform-contracts`、`policy-sandbox`、`platform-abstraction`、`capability-registry`、`core-coding-tools`、`runtime`、`context-engine`、`testing-regression` 和 CLI e2e tests。
- 影响 API：policy request metadata、sandbox profile selection、platform execution context、capability manifests、execution envelope resource/sandbox metadata、redaction summaries 和 audit records。
- 影响测试：policy/envelope shapes 合同测试、secret classification 与 redaction 单元测试、denied/rewrite execution 集成测试、filesystem/process/network/env platform states 矩阵测试、audit events golden replay，以及 no raw secret output 的 e2e smoke。
- 不在范围内：完整 OS-level containerization、enterprise managed policy、signed plugins、remote organization audit export 和完整 code-intelligence secret scanning。
