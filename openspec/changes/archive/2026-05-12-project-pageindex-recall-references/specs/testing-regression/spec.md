## ADDED Requirements

### Requirement: PageIndex Recall Reference Projection Regression Coverage / PageIndex 回溯引用投影回归覆盖

Regression tests SHALL cover PageIndex recall references becoming projected summary context without prompt mutation or full transcript access.

回归测试必须覆盖 PageIndex recall references 被投影为 summary context，且不修改 prompt、不访问完整 transcript。

#### Scenario: CLI recall reference projection is tested / CLI Recall 引用投影被测试

- **WHEN** CLI host tests run prompts, recall a prior turn, add the focused recall result as a reference, and submit another prompt
- **THEN** tests assert the reference item is `kind=turn`, the model request includes a runtime-owned projected PageIndex summary, the user prompt remains unchanged, recall slash commands do not submit model requests, and raw over-limit history text is absent from recall projection records
- **中文** 当 CLI host tests 运行 prompts、recall 先前 turn、将 focused recall result 加为 reference 并提交另一条 prompt 时，测试必须断言 reference item 是 `kind=turn`、model request 包含 runtime-owned projected PageIndex summary、user prompt 保持不变、recall slash commands 不提交 model requests，且超出限制的 history raw text 不出现在 recall projection records 中。

#### Scenario: Runtime turn-reference projection is tested / Runtime Turn 引用投影被测试

- **WHEN** runtime tests submit an `AgentLoopReferenceContext` containing a PageIndex-shaped turn reference
- **THEN** tests assert context projection selects a `summary` host node, unresolved reference count is zero, the system context message contains bounded PageIndex previews, and the user message remains unchanged
- **中文** 当 runtime tests 提交包含 PageIndex 形态 turn reference 的 `AgentLoopReferenceContext` 时，测试必须断言 context projection 选择 `summary` host node、unresolved reference count 为零、system context message 包含有界 PageIndex previews，且 user message 保持不变。
