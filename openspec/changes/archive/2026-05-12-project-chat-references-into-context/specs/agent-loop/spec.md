## ADDED Requirements

### Requirement: Agent Loop Injects Projected Reference Context / Agent Loop 注入已投影引用上下文

The agent loop SHALL make selected reference projection content model-visible through a runtime-owned context message while preserving the original user prompt message.

Agent loop 必须通过 runtime-owned context message 让 selected reference projection content 对模型可见，同时保留原始 user prompt message。

#### Scenario: Projected references become model context / 已投影引用成为模型上下文

- **WHEN** context projection selects reference-derived nodes for a prompt turn
- **THEN** the model request includes a deterministic context message containing the selected projected content and metadata summarizing the projection
- **中文** 当 context projection 为某个 prompt turn 选中 reference-derived nodes 时，model request 必须包含确定性的 context message，内含 selected projected content，并通过 metadata 汇总 projection。

#### Scenario: User prompt remains unchanged / 用户 Prompt 保持不变

- **WHEN** projected reference context is included in the model request
- **THEN** the user message content remains the exact submitted prompt and reference content is not appended to that user message
- **中文** 当 projected reference context 被加入 model request 时，user message content 必须保持为用户提交的确切 prompt，reference content 不得追加到该 user message。

#### Scenario: Rejected projection fails before model dispatch / 被拒绝的投影在模型派发前失败

- **WHEN** context projection rejects the turn due to hard budget or policy
- **THEN** the agent loop emits a typed terminal failure and does not call the model gateway
- **中文** 当 context projection 因 hard budget 或 policy 拒绝 turn 时，agent loop 必须发出 typed terminal failure，且不得调用 model gateway。
