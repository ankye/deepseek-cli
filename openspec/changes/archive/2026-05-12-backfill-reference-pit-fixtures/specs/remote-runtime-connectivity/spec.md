## ADDED Requirements

### Requirement: Remote Identity Pit Fixtures / 远程身份坑位 Fixtures

Remote runtime connectivity SHALL include deterministic fixtures that keep session identity, transport identity, display identity, and audit correlation distinct before host promotion.

remote runtime connectivity 必须包含确定性 fixtures，在 host promotion 前保持 session identity、transport identity、display identity 和 audit correlation 相互区分。

#### Scenario: Remote binding preserves identity domains / Remote Binding 保持身份域

- **WHEN** a remote binding is created or reconnected
- **THEN** the fixture proves that remote binding id, session id, transport kind, trusted device identity, and audit correlation metadata remain separately addressable
- **中文** 当 remote binding 被创建或重连时，fixture 必须证明 remote binding id、session id、transport kind、trusted device identity 和 audit correlation metadata 仍可分别寻址。

#### Scenario: Remote cancel targets transport binding / Remote Cancel 作用于传输绑定

- **WHEN** remote cancellation is requested
- **THEN** the cancellation target is the remote binding id and does not rewrite session identity or audit identity
- **中文** 当请求 remote cancellation 时，cancellation target 必须是 remote binding id，且不得改写 session identity 或 audit identity。
