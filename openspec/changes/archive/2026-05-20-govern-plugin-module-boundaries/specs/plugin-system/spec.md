## ADDED Requirements

### Requirement: Governed Module Manifest / 受治理 Module Manifest

Plugins, extensions, MCP bridges, skills, and hooks SHALL declare manifests before contributing behavior.

Plugins、extensions、MCP bridges、skills 与 hooks 在贡献行为前必须声明 manifests。

#### Scenario: Module declares contributions / Module 声明 Contributions

- **WHEN** a module contributes commands, tools, hooks, MCP bridges, UI surfaces, or runtime behavior
- **THEN** its manifest declares contribution ids, permissions, compatibility, owner, lifecycle hooks, and diagnostics surface
- **中文** 当 module 贡献 commands、tools、hooks、MCP bridges、UI surfaces 或 runtime behavior 时，其 manifest 必须声明 contribution ids、permissions、compatibility、owner、lifecycle hooks 与 diagnostics surface。

### Requirement: No Private Runtime Object Access / 禁止访问私有 Runtime Object

Modules SHALL interact through public contracts, capability APIs, events, and policy decisions rather than private runtime objects.

Modules 必须通过公共 contracts、capability APIs、events 与 policy decisions 交互，而不是私有 runtime objects。

#### Scenario: Private object access is blocked / 私有对象访问被阻止

- **WHEN** a module requests or receives a private runtime object, private package path, or host-only object outside its adapter
- **THEN** governance reports a module-boundary violation and readiness blocks product promotion depending on that access
- **中文** 当 module 请求或接收私有 runtime object、private package path 或 adapter 外的 host-only object 时，治理必须报告 module-boundary violation，并阻止依赖该访问的产品推广。

### Requirement: Module Lifecycle Governance / Module Lifecycle 治理

Modules SHALL support deterministic enable, disable, unload, cleanup, and diagnostic states.

Modules 必须支持确定性的 enable、disable、unload、cleanup 与 diagnostic states。

#### Scenario: Module unload is visible / Module Unload 可见

- **WHEN** a module is disabled or unloaded
- **THEN** the system records cleanup outcome, remaining contributions, policy revocation, and diagnostics status
- **中文** 当 module 被禁用或卸载时，系统必须记录 cleanup outcome、remaining contributions、policy revocation 与 diagnostics status。
