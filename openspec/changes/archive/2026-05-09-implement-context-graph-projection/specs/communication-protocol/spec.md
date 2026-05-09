## ADDED Requirements

### Requirement: Projection Protocol Events / Projection 协议事件

The communication protocol SHALL define transport-neutral projection started, cache-hit, degraded, rejected, and completed events.

communication protocol 必须定义 transport-neutral 的 projection started、cache-hit、degraded、rejected 和 completed events。

#### Scenario: Hosts receive projection summary / Hosts 接收 projection 摘要

- **WHEN** CLI, VSCode, tests, or future server transports consume runtime events
- **THEN** they can observe projection summary metadata without reading context-engine internals
- **中文** 当 CLI、VSCode、tests 或未来 server transports 消费 runtime events 时，必须能观察 projection summary metadata，而不读取 context-engine internals。

### Requirement: Projection Protocol Redaction / Projection 协议脱敏

Projection protocol events SHALL expose redacted summaries and references, never raw secret-like context content.

projection protocol events 必须暴露 redacted summaries 与 references，绝不能暴露 raw secret-like context content。

#### Scenario: Rejected node remains redacted / 被拒绝节点保持脱敏

- **WHEN** a node is excluded because of redaction, policy, or scope
- **THEN** protocol events expose only node id, type, redaction class, and exclusion reason permitted by policy
- **中文** 当节点因 redaction、policy 或 scope 被排除时，protocol events 只能暴露 policy 允许的 node id、type、redaction class 和 exclusion reason。

### Requirement: Projection Protocol Compatibility / Projection 协议兼容性

Projection request, result, and event schemas SHALL be versioned and compatibility-tested.

projection request、result 和 event schemas 必须版本化并经过 compatibility tests。

#### Scenario: Additive projection event fields are compatible / 增量 projection event 字段兼容

- **WHEN** projection events add optional fields
- **THEN** existing readers can parse required fields and ignore unknown optional fields
- **中文** 当 projection events 增加 optional fields 时，existing readers 必须能解析 required fields 并忽略 unknown optional fields。
