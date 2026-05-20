## Why

DeepSeek needs a stable runtime kernel before expanding hosts, plugins, agents, remote execution, or enterprise surfaces. / DeepSeek 在扩张 host、plugin、agent、remote execution 或企业级能力前，需要先拥有稳定 runtime kernel。

The current platform has strong contracts, but runtime responsibilities can still absorb subsystem logic over time; this change defines the first governance track that keeps the kernel small, auditable, and extension-safe. / 当前平台已有较强契约，但 runtime 职责仍可能逐步吸收子系统逻辑；本变更定义第一个治理专项，使 kernel 保持小、可审计且适合扩展。

## What Changes

- Define the allowed runtime kernel responsibility set. / 定义 runtime kernel 允许承担的职责集合。
- Govern forbidden dependencies and private imports inside runtime kernel code. / 治理 runtime kernel 代码中的禁止依赖与私有导入。
- Require explicit handoff contracts for policy, scheduler, context, prompt, model, tool, and event boundaries. / 要求 policy、scheduler、context、prompt、model、tool 与 event 边界具备显式 handoff contracts。
- Require compatibility shims to have owners, expiration triggers, extraction targets, and diagnostics. / 要求 compatibility shim 具备 owner、过期触发条件、抽取目标与 diagnostics。
- Add lint/readiness evidence before dependent tracks can promote behavior on top of runtime. / 在依赖专项基于 runtime 推广能力前，增加 lint/readiness 证据。
- No breaking runtime API changes in the proposal phase. / 提案阶段不引入破坏性 runtime API 变更。

## Capabilities

### New Capabilities

### Modified Capabilities

- `runtime-execution-kernel`: Add strict kernel boundary, dependency, handoff, and compatibility-shim governance requirements. / 增加严格 kernel boundary、dependency、handoff 与 compatibility-shim 治理要求。
- `architecture-scale-guardrails`: Add lint/readiness guardrails that enforce runtime kernel boundaries and central-file pressure. / 增加执行 runtime kernel 边界与中心文件压力的 lint/readiness 护栏。

## Impact

- Owner packages / 责任包: `src/packages/runtime`, `src/packages/platform-contracts`, `src/packages/policy-sandbox`, `src/packages/runtime-message-bus`, `src/packages/context-engine`, `src/packages/prompt-assembly`, `scripts/lint-framework`.
- Product surface / 产品表面: diagnostics and readiness only at first; runtime behavior remains unchanged until implementation tasks are applied. / 初期仅影响 diagnostics 与 readiness；在执行实现任务前 runtime 行为不变。
- Governance order / 治理顺序: this is the first required child track under `systematize-platform-governance`. / 这是 `systematize-platform-governance` 下第一个必需专项轨道。
