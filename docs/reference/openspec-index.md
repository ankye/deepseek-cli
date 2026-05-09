# OpenSpec Index / OpenSpec 索引

OpenSpec specs are the formal requirements source. This index maps important specs to docs and packages.

OpenSpec specs 是正式需求来源。本索引将重要 specs 映射到 docs 和 packages。

| Spec / 规格 | Related docs / 相关文档 | Main packages / 主要包 |
| --- | --- | --- |
| `runtime-execution-kernel` | [Execution Model](../architecture/execution-model.md) | `runtime` |
| `runtime-event-loop` | [Execution Model](../architecture/execution-model.md), [Protocol And Events](../architecture/protocol-and-events.md) | `runtime`, `runtime-message-bus` |
| `communication-protocol` | [Protocol And Events](../architecture/protocol-and-events.md) | `communication-protocol` |
| `workflow-orchestration` | [Orchestration And Scheduling](../architecture/orchestration-and-scheduling.md) | `workflow-orchestration` |
| `concurrency-orchestration` | [Orchestration And Scheduling](../architecture/orchestration-and-scheduling.md) | `concurrency-orchestration` |
| `agent-management` | [Orchestration And Scheduling](../architecture/orchestration-and-scheduling.md) | `agent-management` |
| `capability-registry` | [Capability Model](../architecture/capability-model.md) | `capability-registry` |
| `capability-execution-governance` | [Capability Model](../architecture/capability-model.md), [Security And Policy](../architecture/security-and-policy.md) | `platform-contracts`, `runtime`, `policy-sandbox` |
| `policy-sandbox` | [Security And Policy](../architecture/security-and-policy.md) | `policy-sandbox` |
| `secret-sandbox-hardening` | [Security And Policy](../architecture/security-and-policy.md) | `platform-contracts`, `policy-sandbox`, `runtime`, `context-engine` |
| `platform-abstraction` | [Security And Policy](../architecture/security-and-policy.md), [Package Map](../architecture/package-map.md) | `platform-abstraction` |
| `model-gateway` | [Package Map](../architecture/package-map.md) | `model-gateway` |
| `context-engine` | [Capability Model](../architecture/capability-model.md), [Security And Policy](../architecture/security-and-policy.md) | `context-engine` |
| `skill-system` | [Capability Model](../architecture/capability-model.md), [Package Map](../architecture/package-map.md), [Test Matrix](test-matrix.md) | `skill-system`, `context-engine`, `testing-regression` |
| `hook-system` | [Capability Model](../architecture/capability-model.md), [Package Map](../architecture/package-map.md), [Test Matrix](test-matrix.md) | `hook-system`, `runtime-message-bus`, `testing-regression` |
| `checkpoint-undo` | [Security And Policy](../architecture/security-and-policy.md), [Testing And Acceptance](../development/testing-and-acceptance.md) | `workspace-state-management`, `core-coding-tools` |
| `code-intelligence-local-analyzer` | [Product Roadmap](../product/product-roadmap.md), [Testing And Acceptance](../development/testing-and-acceptance.md) | `code-intelligence`, `context-engine` |
| `observability-privacy` | [Product Roadmap](../product/product-roadmap.md), [Testing And Acceptance](../development/testing-and-acceptance.md) | `observability`, `runtime-message-bus`, `testing-regression` |
| `testing-regression` | [Testing And Acceptance](../development/testing-and-acceptance.md) | `testing-regression`, `tests/*` |
| `product-roadmap` | [Product Roadmap](../product/product-roadmap.md) | all roadmap packages |
