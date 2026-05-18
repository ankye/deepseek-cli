## ADDED Requirements

### Requirement: Evaluation Adapters Use Product Capabilities Only / 评测 Adapter 只使用产品能力

CLI task-completion evaluation adapters SHALL execute DeepSeek CLI through published CLI surfaces or governed runtime capabilities and SHALL NOT hide task-specific product behavior in adapter-only prompts or scripts.

CLI task-completion evaluation adapters 必须通过已发布 CLI surface 或受治理 runtime capabilities 执行 DeepSeek CLI，且不得把任务专用产品行为藏在 adapter-only prompts 或 scripts 中。

#### Scenario: Terminal-Bench adapter is a bridge / Terminal-Bench Adapter 是桥接层

- **WHEN** a Terminal-Bench run invokes DeepSeek CLI
- **THEN** the adapter may pass CLI path, environment file, timeout, live/fake setting, tool projection, and output capture configuration
- **BUT** task solving rules must come from CLI product contracts, prompt assembly, tools, verification, memory, or user prompt, not hidden adapter logic
- **中文** 当 Terminal-Bench run 调用 DeepSeek CLI 时，adapter 可以传入 CLI path、environment file、timeout、live/fake setting、tool projection 与 output capture configuration；但解题规则必须来自 CLI 产品 contracts、prompt assembly、tools、verification、memory 或 user prompt，而不是隐藏 adapter logic。

#### Scenario: Adapter-only success is not full delivery / Adapter-only 成功不是完整交付

- **WHEN** a task passes only because the adapter injected hidden instructions, custom validators, or task-specific recovery outside product capabilities
- **THEN** evaluation records the task as exposing a product gap and does not count the corresponding layer as complete
- **中文** 当任务只有因为 adapter 在产品能力外注入隐藏指令、自定义 validator 或任务专用 recovery 才通过时，evaluation 必须记录该任务暴露了 product gap，且不得把对应层计为完成。

### Requirement: Delivery Capability Score Is Layered / 交付能力分数按层计算

CLI task-completion evaluation SHALL score delivery capability across project rules, tools and permissions, task loop, output contracts, verification and regression, and context or memory.

CLI task-completion evaluation 必须跨 project rules、tools and permissions、task loop、output contracts、verification and regression、context or memory 计算交付能力分数。

#### Scenario: Missing layer reduces score / 缺失层扣分

- **WHEN** a required layer is missing, fake, adapter-only, unverified, or not assessed for a task
- **THEN** the delivery capability score applies the configured missing-layer penalty and reports the affected layer
- **中文** 当任务要求的某一层为 missing、fake、adapter-only、unverified 或 not assessed 时，delivery capability score 必须应用配置的 missing-layer penalty 并报告受影响层。

#### Scenario: One-point-zero requires all required layers / 1.0 要求所有必需层完成

- **WHEN** a run reports delivery capability score `1.0`
- **THEN** every required layer for that evaluated scope has passed evidence or is explicitly not applicable
- **中文** 当某次运行报告 delivery capability score `1.0` 时，被评估范围内的每个 required layer 都必须具备 passed evidence 或明确 not applicable。
