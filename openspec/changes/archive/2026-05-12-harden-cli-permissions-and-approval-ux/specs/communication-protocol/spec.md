## ADDED Requirements

### Requirement: Approval Lifecycle Protocol Records / 审批生命周期协议记录

The communication protocol SHALL define transport-neutral approval lifecycle records for approval required, approval decided, approval denied, approval timeout, approval cancelled, and audit linked events.

communication protocol 必须定义 transport-neutral approval lifecycle records，覆盖 approval required、approval decided、approval denied、approval timeout、approval cancelled 和 audit linked events。

#### Scenario: Approval required is protocol-compatible / 需要审批事件兼容协议

- **WHEN** runtime emits approval-required evidence
- **THEN** the protocol record includes protocol version, schema version, message id, approval id, correlation id, session id, trace metadata, redaction metadata, decision options, render summary, and audit reference
- **中文** 当 runtime 发出 approval-required evidence 时，protocol record 必须包含 protocol version、schema version、message id、approval id、correlation id、session id、trace metadata、redaction metadata、decision options、render summary 和 audit reference。

#### Scenario: Approval decision is protocol-compatible / 审批决策兼容协议

- **WHEN** a host submits allow, deny, timeout, or cancel for an approval request
- **THEN** the protocol record carries approval id, decision, decision source, reason code, trace metadata, and compatibility metadata without embedding host-specific UI state
- **中文** 当 host 为 approval request 提交 allow、deny、timeout 或 cancel 时，protocol record 必须携带 approval id、decision、decision source、reason code、trace metadata 和 compatibility metadata，且不得嵌入 host-specific UI state。

### Requirement: Approval Control Routing / 审批控制路由

The protocol SHALL route approval decisions as control messages correlated to the original approval request.

protocol 必须把 approval decisions 作为 control messages 路由，并关联到原始 approval request。

#### Scenario: Approval decision does not rerun request / 审批决策不重新运行请求

- **WHEN** a host sends an approval decision control message
- **THEN** the protocol routes it to the waiting approval broker or runtime scope and does not resubmit the original model, tool, command, or runtime request
- **中文** 当 host 发送 approval decision control message 时，protocol 必须将其路由到等待中的 approval broker 或 runtime scope，且不得重新提交原始 model、tool、command 或 runtime request。

### Requirement: Approval Protocol Compatibility / 审批协议兼容性

Approval lifecycle records SHALL be versioned and compatibility-tested before archive.

approval lifecycle records 必须版本化，并在 archive 前经过 compatibility tests。

#### Scenario: Additive approval fields remain compatible / 增量审批字段保持兼容

- **WHEN** approval lifecycle records add optional summary, risk, or audit fields
- **THEN** existing decoders can parse required fields and ignore unknown optional fields while preserving denial and fail-closed semantics
- **中文** 当 approval lifecycle records 增加 optional summary、risk 或 audit fields 时，existing decoders 必须能解析 required fields 并忽略 unknown optional fields，同时保持 denial 和 fail-closed semantics。
