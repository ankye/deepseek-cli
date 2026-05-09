## Why

Long coding sessions need a deterministic context boundary before they can safely grow into memory, compaction, code intelligence, and multi-agent workflows. R2 should start by making ContextGraph projection a first-class platform capability so model requests are assembled from governed, replayable, budgeted, and redacted evidence instead of ad hoc prompt concatenation.

长时间 coding session 在进入 memory、compaction、code intelligence 和 multi-agent workflows 前，需要先建立确定性的上下文边界。R2 应先把 ContextGraph projection 做成一等平台能力，让 model request 从受治理、可 replay、受预算约束、已脱敏的证据中组装，而不是临时拼接 prompt。

## What Changes

- Add a ContextGraph projection product capability with typed projection request, selected nodes, excluded nodes, budget decisions, redaction evidence, and replay metadata.
- Extend `context-engine` from broad placeholder contracts into concrete projection semantics for node eligibility, ranking, token estimation, degradation, and output shape.
- Extend `memory-cache-management` with projection cache and memory-reference boundaries without implementing durable long-term memory in this change.
- Require the runtime event loop to use the projection boundary before model requests, while preserving the governed kernel path.
- Add protocol events for projection started/completed/degraded/rejected so CLI, VSCode, tests, and future server hosts consume the same evidence.
- Connect projection to usage-budget decisions through deterministic token estimates and hard/soft context limits.
- Add deterministic contract, integration, golden, compatibility, matrix, and e2e coverage for projection behavior.
- No breaking change is intended; this is additive and should remain behind default deterministic fakes until implementation is accepted.

- 新增 ContextGraph projection 产品能力，包含类型化 projection request、selected nodes、excluded nodes、budget decisions、redaction evidence 和 replay metadata。
- 将 `context-engine` 从宽泛占位契约推进到具体 projection 语义，包括 node eligibility、ranking、token estimation、degradation 和 output shape。
- 扩展 `memory-cache-management`，增加 projection cache 与 memory-reference 边界，但本 change 不实现完整 durable long-term memory。
- 要求 runtime event loop 在 model request 前使用 projection boundary，同时保持 governed kernel path。
- 增加 projection started/completed/degraded/rejected protocol events，让 CLI、VSCode、tests 和未来 server hosts 消费同一套证据。
- 通过确定性 token estimates 与 hard/soft context limits 把 projection 接入 usage-budget decisions。
- 增加 projection 行为的 deterministic contract、integration、golden、compatibility、matrix 和 e2e 覆盖。
- 不引入 breaking change；该能力为增量能力，并在实现验收前默认使用 deterministic fakes。

## Capabilities

### New Capabilities

- `context-graph-projection`: Product-level ContextGraph projection contract, including projection request/result semantics, budget handling, redaction, degradation, and replay evidence.

### Modified Capabilities

- `context-engine`: Define concrete projection engine contracts and deterministic node eligibility/ranking semantics.
- `memory-cache-management`: Define projection cache entries, invalidation, and memory reference boundaries for projection.
- `runtime-event-loop`: Require runtime model turns to consume projection results instead of assembling model context directly.
- `communication-protocol`: Add transport-neutral projection events and errors for host-visible evidence.
- `usage-budget-management`: Add deterministic context-token budget checks before model dispatch.
- `testing-regression`: Add projection-specific test ladder, golden replay, compatibility fixtures, and matrix coverage.

## Impact

- Affected packages: `platform-contracts`, `context-engine`, `memory-cache-management`, `usage-budget-management`, `runtime`, `runtime-message-bus`, `communication-protocol`, `testing-regression`, and host adapter tests.
- Affected APIs: new serializable projection DTOs, context node metadata, projection result metadata, budget decision metadata, and projection protocol events.
- Affected tests: contract tests for projection contracts, integration tests for runtime-to-model projection usage, golden replay for projection traces, compatibility fixtures for projection schema evolution, matrix tests for budget/redaction/degraded projections, and e2e smoke proving CLI output remains model-context neutral.
- Out of scope: full semantic memory retrieval, automatic compaction strategy, LSP/code-intelligence indexing, checkpoint/undo, and rich UX rendering.

- 影响包：`platform-contracts`、`context-engine`、`memory-cache-management`、`usage-budget-management`、`runtime`、`runtime-message-bus`、`communication-protocol`、`testing-regression` 与 host adapter tests。
- 影响 API：新增可序列化 projection DTOs、context node metadata、projection result metadata、budget decision metadata 和 projection protocol events。
- 影响测试：projection contracts 的合同测试、runtime-to-model projection usage 的集成测试、projection traces 的 golden replay、projection schema evolution 的 compatibility fixtures、budget/redaction/degraded projections 的 matrix tests，以及证明 CLI output 不暴露 model-context 内部细节的 e2e smoke。
- 不在范围内：完整 semantic memory retrieval、自动 compaction strategy、LSP/code-intelligence indexing、checkpoint/undo 和 rich UX rendering。
