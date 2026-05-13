## ADDED Requirements

### Requirement: Approval Contract DTOs / 审批契约 DTOs

`@deepseek/platform-contracts` SHALL define implementation-free approval DTOs for approval requests, decisions, summaries, risk summaries, broker inputs, broker results, and audit references.

`@deepseek/platform-contracts` 必须定义无实现的 approval DTOs，覆盖 approval requests、decisions、summaries、risk summaries、broker inputs、broker results 和 audit references。

#### Scenario: Approval DTOs are serializable / 审批 DTO 可序列化

- **WHEN** an approval DTO crosses package, protocol, runtime, CLI, test, or future host boundaries
- **THEN** it includes schema version, stable ids, decision kind, redaction metadata, trace metadata, readonly serializable value fields, and no concrete implementation objects
- **中文** 当 approval DTO 跨越 package、protocol、runtime、CLI、test 或未来 host 边界时，它必须包含 schema version、stable ids、decision kind、redaction metadata、trace metadata、readonly serializable value fields，且不包含 concrete implementation objects。

#### Scenario: Approval contracts stay host agnostic / 审批契约保持 Host Agnostic

- **WHEN** `platform-contracts` is imported in a browser-like, CLI, VSCode, test, or server environment
- **THEN** approval contracts load without Node filesystem/process APIs, terminal libraries, VSCode APIs, model SDKs, or implementation packages
- **中文** 当 `platform-contracts` 在 browser-like、CLI、VSCode、test 或 server environment 中被导入时，approval contracts 必须能加载，且不依赖 Node filesystem/process APIs、terminal libraries、VSCode APIs、model SDKs 或 implementation packages。

### Requirement: Approval Broker Contract / 审批 Broker 契约

`@deepseek/platform-contracts` SHALL expose an approval broker interface for requesting decisions and returning deterministic allow, deny, timeout, or cancel results.

`@deepseek/platform-contracts` 必须暴露 approval broker interface，用于请求 decision 并返回确定性的 allow、deny、timeout 或 cancel results。

#### Scenario: Broker result is typed / Broker 结果类型化

- **WHEN** an approval broker resolves a request
- **THEN** the result includes approval id, decision, decision source, reason code, optional user message, audit reference, trace metadata, and redaction metadata
- **中文** 当 approval broker 解析 request 时，result 必须包含 approval id、decision、decision source、reason code、optional user message、audit reference、trace metadata 和 redaction metadata。
