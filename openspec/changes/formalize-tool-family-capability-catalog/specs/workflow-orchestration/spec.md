## ADDED Requirements

### Requirement: Runtime-Owned Tool Pipelines / Runtime 拥有工具管线
Workflow orchestration SHALL represent tool chaining as runtime-owned pipelines with typed steps, declared inputs, artifact references, policy decisions, preflight results, execution results, and replay metadata.

workflow orchestration 必须把工具衔接表示为 runtime-owned pipelines，包含 typed steps、declared inputs、artifact references、policy decisions、preflight results、execution results 与 replay metadata。

#### Scenario: Sequential pipeline routes artifacts / 顺序管线路由 Artifact
- **WHEN** a pipeline reads a file, applies a patch, and runs tests
- **THEN** each step consumes explicit inputs or artifact references and records its own policy, preflight, execution, and evidence records
- **中文** 当 pipeline 读取文件、应用 patch 并运行测试时，每一步必须消费显式 inputs 或 artifact references，并记录自己的 policy、preflight、execution 与 evidence records。

### Requirement: Executors Do Not Call Executors / Executor 不得互调
Capability executors SHALL NOT directly invoke other capability executors; all chaining SHALL go through the runtime pipeline or agent loop.

capability executors 不得直接调用其他 capability executors；所有衔接必须经过 runtime pipeline 或 agent loop。

#### Scenario: Private tool call is rejected / 私下工具调用被拒绝
- **WHEN** an implementation attempts to call another tool executor from inside a tool executor
- **THEN** architecture lint or runtime validation fails with a stable diagnostic
- **中文** 当实现试图在一个 tool executor 内调用另一个 tool executor 时，architecture lint 或 runtime validation 必须以稳定 diagnostic 失败。

### Requirement: Parallel Pipelines Preserve Isolation / 并行管线保持隔离
Parallel pipeline steps SHALL declare independent scopes, resource locks, merge strategy, and conflict behavior before execution.

并行 pipeline steps 必须在执行前声明 independent scopes、resource locks、merge strategy 与 conflict behavior。

#### Scenario: Overlapping write scopes block parallel mutation / 写范围重叠阻止并行修改
- **WHEN** two parallel steps request overlapping write scope
- **THEN** orchestration rejects the parallel plan or serializes the steps with explicit diagnostics
- **中文** 当两个 parallel steps 请求重叠 write scope 时，orchestration 必须拒绝 parallel plan 或以显式 diagnostics 串行化这些 steps。

### Requirement: Stream Pipelines Are Bounded / 流式管线有边界
Streaming pipelines SHALL preserve backpressure, truncation, redaction, cancellation, and replay-safe summaries between steps.

流式 pipelines 必须在 steps 之间保留 backpressure、truncation、redaction、cancellation 与 replay-safe summaries。

#### Scenario: Stream truncation is recorded / 流式截断被记录
- **WHEN** one step streams more output than the next step can accept
- **THEN** orchestration records truncation metadata and passes a bounded artifact reference rather than unbounded raw content
- **中文** 当某一步 stream 的输出超过下一步可接受范围时，orchestration 必须记录 truncation metadata，并传递 bounded artifact reference，而不是无边界 raw content。
