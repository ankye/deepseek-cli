## ADDED Requirements

### Requirement: Core Tools Use Governed Execution / 核心工具使用受治理执行

Every executable core coding tool SHALL be invoked through execution envelope creation, policy evaluation, scheduler submission, platform provider context, runtime message bus events, and replayable session records.

每个 executable core coding tool 必须通过 execution envelope creation、policy evaluation、scheduler submission、platform provider context、runtime message bus events 和 replayable session records 调用。

#### Scenario: Tool invocation enters runtime kernel / 工具调用进入 runtime kernel

- **WHEN** a host, model loop, or test invokes a core coding tool
- **THEN** the invocation enters `RuntimeKernel.execute` or an equivalent governed kernel entry point before the tool executor runs
- **中文** 当 host、model loop 或 test 调用 core coding tool 时，invocation 必须在 tool executor 运行前进入 `RuntimeKernel.execute` 或等价受治理 kernel entry point。

#### Scenario: Tool denial prevents scheduling / 工具拒绝阻止调度

- **WHEN** policy denies a write, shell, test, or platform-unavailable core tool invocation
- **THEN** no scheduler task is created and the canonical event stream includes a typed rejection
- **中文** 当 policy 拒绝 write、shell、test 或 platform-unavailable core tool invocation 时，不得创建 scheduler task，canonical event stream 必须包含 typed rejection。
