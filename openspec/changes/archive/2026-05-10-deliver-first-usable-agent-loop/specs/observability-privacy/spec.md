## ADDED Requirements

### Requirement: Agent Loop Trace Correlation / Agent Loop Trace 关联

Observability SHALL correlate every agent loop event, model request, tool intent, tool execution, retry, error, cancellation, and terminal result with session id, turn id, trace id, and parent execution id when present.

observability 必须把每个 agent loop event、model request、tool intent、tool execution、retry、error、cancellation 和 terminal result 与 session id、turn id、trace id 以及存在时的 parent execution id 关联。

#### Scenario: Tool trace links to model intent / 工具 trace 关联模型意图

- **WHEN** a model-requested tool is executed
- **THEN** the tool execution trace includes the originating model request id, tool intent id, capability id, execution envelope id, and scheduler task id
- **中文** 当执行模型请求的工具时，tool execution trace 必须包含 originating model request id、tool intent id、capability id、execution envelope id 和 scheduler task id。

### Requirement: Agent Loop Redaction / Agent Loop 脱敏

Agent loop events SHALL redact credentials, authorization headers, exact secret values, provider raw request bodies containing secrets, and unsafe raw tool outputs before presentation, persistence, replay, or golden fixture generation.

agent loop events 必须在 presentation、persistence、replay 或 golden fixture generation 前脱敏 credentials、authorization headers、精确 secret values、包含 secrets 的 provider raw request bodies 和不安全 raw tool outputs。

#### Scenario: Credential does not appear in JSONL / 凭证不出现在 JSONL

- **WHEN** an agent command runs with live DeepSeek credentials and JSONL output
- **THEN** no emitted JSON line contains raw API keys, authorization headers, or credential environment values
- **中文** 当 agent command 使用 live DeepSeek credentials 与 JSONL output 运行时，输出的 JSON 行不得包含 raw API keys、authorization headers 或 credential environment values。

#### Scenario: Large tool output is bounded / 大工具输出有边界

- **WHEN** a tool produces output larger than configured presentation limits
- **THEN** the displayed event contains preview, byte counts, truncation metadata, digest, and redaction metadata rather than unbounded raw output
- **中文** 当工具输出超过配置的 presentation limits 时，展示 event 必须包含 preview、byte counts、truncation metadata、digest 和 redaction metadata，而不是无边界 raw output。

### Requirement: Agent Loop Audit Evidence / Agent Loop 审计证据

Observability SHALL record replay-safe audit evidence for agent loop decisions, including model profile, policy decision, repair decision, scheduler admission, tool result summary, and terminal status.

observability 必须为 agent loop decisions 记录 replay-safe audit evidence，包括 model profile、policy decision、repair decision、scheduler admission、tool result summary 和 terminal status。

#### Scenario: Repair decision is auditable / 修复决策可审计

- **WHEN** runtime repairs a provider tool-call intent
- **THEN** observability records the repair type, before/after structural metadata, validation evidence, and redacted diagnostics without storing secret or unsafe raw content
- **中文** 当 runtime 修复 provider tool-call intent 时，observability 必须记录 repair type、before/after structural metadata、validation evidence 和 redacted diagnostics，且不存储 secret 或 unsafe raw content。
