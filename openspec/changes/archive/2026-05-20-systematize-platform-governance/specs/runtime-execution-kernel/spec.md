## ADDED Requirements

### Requirement: Runtime Kernel First Governance Track / Runtime Kernel 第一专项治理

Runtime kernel governance SHALL be the first required child governance track in the platform hardening program.

Runtime kernel 治理必须是平台加固 program 中第一个必需专项治理轨道。

#### Scenario: Dependent work waits for kernel evidence / 依赖工作等待内核证据

- **WHEN** a change promotes host expansion, plugin execution, remote runtime, multi-agent write execution, policy enforcement, context caching, or enterprise distribution
- **THEN** it cites stable runtime kernel boundary evidence or records an explicit release-risk deferral
- **中文** 当变更推广 host expansion、plugin execution、remote runtime、多 agent 写执行、policy enforcement、context caching 或企业级分发时，必须引用稳定 runtime kernel boundary 证据，或记录显式发布风险延期。

### Requirement: Small Runtime Kernel Boundary / 小 Runtime Kernel 边界

The runtime execution kernel SHALL own only turn lifecycle, execution envelopes, policy handoff, scheduler handoff, canonical event emission, and model/tool continuation orchestration.

Runtime execution kernel 必须只负责 turn lifecycle、execution envelopes、policy handoff、scheduler handoff、canonical event emission 与 model/tool continuation orchestration。

#### Scenario: Subsystem logic stays in owner package / 子系统逻辑留在责任包

- **WHEN** runtime needs context retrieval, prompt assembly, memory/cache storage, plugin execution, MCP transport, code intelligence, provider serialization, or host rendering
- **THEN** it calls the responsible package through public contracts rather than importing private implementation logic or embedding subsystem rules in runtime
- **中文** 当 runtime 需要 context retrieval、prompt assembly、memory/cache storage、plugin execution、MCP transport、code intelligence、provider serialization 或 host rendering 时，必须通过公共契约调用责任包，而不是导入私有实现逻辑或把子系统规则嵌入 runtime。

#### Scenario: Kernel growth requires extraction plan / Kernel 增长需要拆分计划

- **WHEN** a runtime change adds new subsystem-owned behavior to central runtime files
- **THEN** the proposal or task list includes an extraction plan, owner package target, public export, and regression coverage
- **中文** 当 runtime 变更向中心 runtime 文件增加新的子系统所有行为时，proposal 或 task list 必须包含拆分计划、目标 owner package、公共导出和回归覆盖。

### Requirement: Kernel Event ABI Stability / Kernel Event ABI 稳定性

Kernel-emitted runtime events SHALL be stable, versioned, additive by default, and safe for host projection and replay.

Kernel 发出的 runtime events 必须稳定、版本化、默认 additive，并且可安全用于 host projection 与 replay。

#### Scenario: Breaking event change is governed / Breaking Event 变更受治理

- **WHEN** a change renames, removes, retypes, or changes redaction semantics for a persisted runtime event field
- **THEN** it requires OpenSpec migration or fail-closed version rejection evidence before release
- **中文** 当变更重命名、删除、重定类型或改变 persisted runtime event field 的 redaction semantics 时，发布前必须具备 OpenSpec migration 或 fail-closed version rejection 证据。
