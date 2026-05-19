## ADDED Requirements

### Requirement: Plugin Executable APIs Route Through Governance / 插件可执行 API 通过治理路由

Executable plugin APIs SHALL be represented as governed capability, command, hook, tool, MCP, workflow, model, workspace, memory/cache, or session requests owned by their respective subsystems.

可执行 plugin APIs 必须表示为受治理 capability、command、hook、tool、MCP、workflow、model、workspace、memory/cache 或 session requests，并由各自 owner subsystems 拥有。

#### Scenario: Plugin cannot execute privately / 插件不能私有执行
- **WHEN** a plugin contribution or runtime API requests process execution, filesystem mutation, network access, model calls, MCP calls, workspace writes, memory/cache writes, credential use, hook invocation, or subagent delegation
- **THEN** the request is denied or converted into a governed execution envelope with owner subsystem, permissions, policy, sandbox, approval where needed, audit, redaction, trace, and replay metadata
- **中文** 当 plugin contribution 或 runtime API 请求 process execution、filesystem mutation、network access、model calls、MCP calls、workspace writes、memory/cache writes、credential use、hook invocation 或 subagent delegation 时，该请求必须被拒绝，或转换为 governed execution envelope，包含 owner subsystem、permissions、policy、sandbox、必要时 approval、audit、redaction、trace 与 replay metadata。

#### Scenario: Plugin source affects policy / 插件来源影响策略
- **WHEN** a plugin executable request is evaluated
- **THEN** policy considers plugin source, trust level, install scope, enterprise policy, workspace trust, user grants, permissions, credential grants, compatibility, and contribution provenance
- **中文** 当 plugin executable request 被评估时，policy 必须考虑 plugin source、trust level、install scope、enterprise policy、workspace trust、user grants、permissions、credential grants、compatibility 与 contribution provenance。

### Requirement: Plugin Runtime Request Evidence / 插件 Runtime 请求证据

Governed plugin runtime requests SHALL produce evidence consumable by CLI, TUI inspector, JSON, JSONL, audit, and regression replay.

受治理 plugin runtime requests 必须产生可被 CLI、TUI inspector、JSON、JSONL、audit 与 regression replay 消费的 evidence。

#### Scenario: Runtime request evidence is complete / Runtime 请求证据完整
- **WHEN** a plugin runtime request completes, fails, is denied, is skipped, or requires approval
- **THEN** evidence includes plugin id, contribution id, API level, owner subsystem, operation, permissions, policy result, approval result where applicable, side-effect summary, diagnostics, and replay fingerprint
- **中文** 当 plugin runtime request completed、failed、denied、skipped 或 requires approval 时，evidence 必须包含 plugin id、contribution id、API level、owner subsystem、operation、permissions、policy result、适用时 approval result、side-effect summary、diagnostics 与 replay fingerprint。
