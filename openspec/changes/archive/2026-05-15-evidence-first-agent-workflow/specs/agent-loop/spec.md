## ADDED Requirements

### Requirement: Agent Loop Runs Evidence Discovery Before Fact-Sensitive Dispatch / Agent Loop 在事实敏感派发前执行搜证

The agent loop SHALL run task-intent classification and evidence discovery before model dispatch for fact-sensitive repository, product, code, documentation, release, or evaluation tasks.

agent loop 必须在 fact-sensitive repository、product、code、documentation、release 或 evaluation tasks 的 model dispatch 前运行 task-intent classification 与 evidence discovery。

#### Scenario: Fact-sensitive run emits evidence events / 事实敏感运行发出证据事件
- **WHEN** `deepseek run` receives a prompt that asks for current-project product copy, command guidance, code changes, docs, release, or evaluation conclusions
- **THEN** the event stream includes evidence classification, evidence plan, selected evidence summary, and evidence manifest or unsupported-claim decision before final output
- **中文** 当 `deepseek run` 收到要求当前项目产品文案、命令指导、代码修改、文档、发布或评估结论的 prompt 时，event stream 必须在最终输出前包含 evidence classification、evidence plan、selected evidence summary 与 evidence manifest 或 unsupported-claim decision。

#### Scenario: Non-fact task can skip evidence with classification / 非事实任务可带分类跳过搜证
- **WHEN** a task is classified as casual, explicitly fictional, or pure brainstorming
- **THEN** the agent loop may skip mandatory evidence discovery but records the classification and prevents the output from being treated as factual project evidence
- **中文** 当任务被分类为 casual、明确虚构或纯 brainstorming 时，agent loop 可以跳过强制 evidence discovery，但必须记录分类，并防止输出被当作 factual project evidence。

### Requirement: Agent Loop Preserves Prompt Boundary With Evidence Context / Agent Loop 通过证据上下文保留 Prompt 边界

The agent loop SHALL preserve the exact user prompt while adding evidence plan and selected evidence as runtime-owned model context.

agent loop 必须保留用户 prompt 的精确内容，同时将 evidence plan 与 selected evidence 作为 runtime-owned model context 加入。

#### Scenario: Evidence context does not mutate user prompt / 证据上下文不修改用户 Prompt
- **WHEN** evidence-first context is projected into a model request
- **THEN** the user message remains byte-equivalent to the submitted prompt and evidence appears only in runtime-owned context sections or messages
- **中文** 当 evidence-first context 被投影到 model request 时，user message 必须与提交 prompt 字节等价，evidence 只能出现在 runtime-owned context sections 或 messages 中。

#### Scenario: Unsupported claim feedback reaches model / 未支持声明反馈给模型
- **WHEN** the workflow detects unsupported strict claims before final output acceptance
- **THEN** the agent loop can feed bounded diagnostics back to the model for revision, or fail closed if retry policy is exhausted
- **中文** 当 workflow 在最终输出接受前检测到 unsupported strict claims 时，agent loop 可以将有界 diagnostics 回传给模型进行修订，或在 retry policy 耗尽时安全失败。
