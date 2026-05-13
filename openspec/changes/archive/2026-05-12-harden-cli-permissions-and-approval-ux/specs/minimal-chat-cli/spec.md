## ADDED Requirements

### Requirement: Chat Approval Rendering / Chat 审批渲染

The chat CLI SHALL render approval and denial lifecycle records using the same event semantics as run mode.

chat CLI 必须使用与 run mode 相同的 event semantics 渲染 approval 与 denial 生命周期记录。

#### Scenario: Chat approval uses runtime events / Chat 审批使用 Runtime Events

- **WHEN** a chat turn emits an approval-required event
- **THEN** the chat shell renders the approval summary from the event and waits for a broker/control decision without directly executing the requested capability
- **中文** 当 chat turn 发出 approval-required event 时，chat shell 必须从该 event 渲染 approval summary，并等待 broker/control decision，不得直接执行被请求的 capability。

#### Scenario: Chat denial keeps session alive / Chat 拒绝后保持会话

- **WHEN** an approval-required chat invocation is denied, cancelled, or times out
- **THEN** chat renders the structured denial or cancellation summary, records the event in session history, and keeps the REPL available for the next prompt
- **中文** 当需要审批的 chat invocation 被 denied、cancelled 或 timeout 时，chat 必须渲染 structured denial 或 cancellation summary，将 event 记录到 session history，并保持 REPL 可用于下一条 prompt。

### Requirement: Chat Approval Controls Stay Local / Chat 审批控制保持本地

Chat approval controls SHALL be local command/action requests that resolve approval ids and submit decisions through the approval broker or protocol control path.

chat approval controls 必须是解析 approval ids 并通过 approval broker 或 protocol control path 提交 decisions 的本地 command/action requests。

#### Scenario: Unknown approval command stays local / 未知审批命令保持本地

- **WHEN** the user enters an unknown approval-related slash command during chat
- **THEN** the shell prints a typed local command failure and does not send the line to the model or execute runtime primitives
- **中文** 当用户在 chat 中输入未知 approval-related slash command 时，shell 必须打印 typed local command failure，且不得把该行送给 model 或执行 runtime primitives。

#### Scenario: Approval cancellation uses control path / 审批取消使用控制路径

- **WHEN** the user cancels a pending approval from chat
- **THEN** the shell submits a cancel decision through the approval control path and emits an approval-cancelled record correlated to the original approval id
- **中文** 当用户从 chat 取消 pending approval 时，shell 必须通过 approval control path 提交 cancel decision，并发出关联原始 approval id 的 approval-cancelled record。
