## ADDED Requirements

### Requirement: Pipeline Families Are Executable Runtime Capabilities / Pipeline Families 是可执行 Runtime Capabilities
The workflow orchestration layer SHALL expose `pipeline.sequence`, `pipeline.parallel`, `pipeline.artifact-routing`, and `pipeline.stream` as runtime-owned executable capabilities.

workflow orchestration layer 必须把 `pipeline.sequence`、`pipeline.parallel`、`pipeline.artifact-routing` 与 `pipeline.stream` 暴露为 runtime-owned executable capabilities。

#### Scenario: Sequential pipeline records every governed step / 顺序管线记录每个受治理 Step
- **WHEN** a sequential pipeline reads a file, applies a patch, and runs tests
- **THEN** every step records policy, preflight, execution, evidence, replay metadata, and bounded artifact references
- **中文** 当顺序管线读取文件、应用 patch 并运行测试时，每一步都必须记录 policy、preflight、execution、evidence、replay metadata 与 bounded artifact references。

### Requirement: Private Executor Chaining Is Rejected / 私下 Executor 互调被拒绝
Tool executors SHALL NOT call other tool executors directly; all composition SHALL go through runtime pipelines or the agent loop.

tool executors 不得直接调用其他 tool executors；所有组合必须通过 runtime pipelines 或 agent loop。

#### Scenario: Lint catches executor-to-executor call / Lint 捕获 Executor 互调
- **WHEN** a tool executor imports or resolves another executor to run it privately
- **THEN** architecture lint or runtime validation fails with a stable diagnostic
- **中文** 当 tool executor 导入或解析另一个 executor 并私下运行时，architecture lint 或 runtime validation 必须以稳定 diagnostic 失败。
