## Why

R2 Context And Safety requires language-aware evidence so edits can be reviewed with diagnostics, symbols, references, and deterministic context without depending on a live IDE. The current code-intelligence package is a null placeholder, so the next product step is to establish a real v1 provider model and local analyzer baseline.

R2 Context And Safety 需要 language-aware evidence，让编辑可以结合 diagnostics、symbols、references 和确定性上下文进行审查，而不依赖 live IDE。当前 code-intelligence package 只是 null placeholder，因此下一步产品推进是建立真正的 v1 provider model 与本地 analyzer baseline。

## Roadmap Metadata / 路线图元数据

```text
Roadmap node / 路线图节点: R2 Context And Safety
Launch gate / 发布门禁: alpha
Owner packages / 责任包: platform-contracts, code-intelligence, context-engine, workspace-state-management, testing-regression
Dependencies / 依赖: context graph projection, core coding tools, checkpoint/undo, platform abstraction
Required tests / 必需测试: unit, contract, integration, golden, matrix
Acceptance evidence / 验收证据: deterministic analyzer fixtures, diagnostic context nodes, symbol/reference lookup, post-edit invalidation trace
Risk class / 风险等级: medium
Data/privacy class / 数据与隐私等级: sensitive
Host surfaces / Host 表面: cli | vscode | server | sdk
Protocol impact / 协议影响: additive
Feature flag / 功能开关: required
Migration/rollback / 迁移与回滚: not-needed for v1 in-memory/local analyzer contracts
```

## What Changes

- Define versioned code intelligence DTOs for diagnostics, symbols, references, provider status, indexes, and context-node projection.
- Implement a deterministic local analyzer that scans workspace files through the platform abstraction, without requiring VSCode or an LSP server.
- Convert diagnostics and symbol evidence into context graph nodes that can be projected by the context engine.
- Add cache/invalidation metadata so file edits can invalidate code intelligence indexes.
- Add tests proving deterministic behavior, redacted evidence, and no live IDE dependency.
- No breaking changes. Existing `CodeIntelligenceService` methods are expanded additively.

- 定义版本化 code intelligence DTO，覆盖 diagnostics、symbols、references、provider status、indexes 和 context-node projection。
- 实现确定性 local analyzer，通过 platform abstraction 扫描 workspace files，不要求 VSCode 或 LSP server。
- 将 diagnostics 与 symbol evidence 转成 context graph nodes，供 context engine 投影。
- 增加 cache/invalidation metadata，使 file edits 能失效 code intelligence indexes。
- 增加测试证明确定性行为、脱敏 evidence，以及不依赖 live IDE。
- 不引入破坏性变更。现有 `CodeIntelligenceService` methods 以 additive 方式扩展。

## Capabilities

### New Capabilities

- `code-intelligence-local-analyzer`: Deterministic local analyzer, code intelligence index, diagnostics/symbol/reference evidence, and context-node conversion.

### Modified Capabilities

- `code-intelligence`: Code intelligence service requirements gain versioned v1 DTOs, provider status, context projection, and invalidation behavior.
- `context-engine`: Context projection must accept code-intelligence diagnostic/symbol nodes as governed context graph nodes.
- `testing-regression`: Regression suites must cover code intelligence fixtures without a live IDE or LSP.

## Impact

- Contracts: `platform-contracts` expands code-intelligence interfaces and DTOs.
- Implementation: `code-intelligence` gains `DeterministicCodeIntelligenceService` while keeping the null service.
- Runtime/test dependencies: deterministic runtime dependencies use the real local analyzer where safe.
- Tests: package, contract, integration, golden, and matrix coverage for diagnostics, symbols, references, context nodes, invalidation, and redaction.
- Docs: product and architecture docs mark code intelligence v1 as an R2 safety building block after archive.

- 契约：`platform-contracts` 扩展 code-intelligence interfaces 与 DTO。
- 实现：`code-intelligence` 增加 `DeterministicCodeIntelligenceService`，同时保留 null service。
- Runtime/test dependencies：deterministic runtime dependencies 在安全范围内使用真实 local analyzer。
- 测试：package、contract、integration、golden 和 matrix 覆盖 diagnostics、symbols、references、context nodes、invalidation 与 redaction。
- 文档：archive 后产品与架构文档会把 code intelligence v1 标记为 R2 安全基础能力。
