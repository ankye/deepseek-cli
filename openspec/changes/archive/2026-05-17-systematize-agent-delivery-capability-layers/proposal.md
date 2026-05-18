## Why

Recent live Terminal-Bench and delivery-score work exposed a structural problem: several missing product capabilities were temporarily diagnosed through the evaluation adapter and prompt guidance. That is useful evidence, but it is not an acceptable delivery architecture. The CLI must route every exposed gap into the layer that should own it: project rules, tool governance, task loop, output contracts, verification/regression, or context/memory.

最近的 live Terminal-Bench 与交付能力评分暴露了一个结构性问题：若干缺失的产品能力被临时放在 evaluation adapter 与 prompt guidance 中诊断。这些证据有价值，但不能作为交付架构。CLI 必须把每个暴露出来的问题放回它应归属的层：项目规则、工具治理、任务循环、输出契约、验证回归或上下文/记忆。

## What Changes

- Define a layered delivery capability model that reuses the existing `evidence -> plan -> execute -> verify -> repair -> synthesize` workflow rather than creating a benchmark-only flow.
- 定义分层交付能力模型，复用现有 `evidence -> plan -> execute -> verify -> repair -> synthesize` 工作流，而不是创建 benchmark-only 流程。
- Add typed contracts for project rule evidence, output contracts, verification expectations, and execution profiles so the runtime can reason about JSON/schema/file/command-plan deliverables.
- 增加 project rule evidence、output contracts、verification expectations 与 execution profiles 的类型契约，使 runtime 能处理 JSON/schema/file/command-plan 等交付物。
- Move noninteractive command behavior, pager/editor avoidance, and process diagnostics into governed shell/test tool execution.
- 将 noninteractive command behavior、pager/editor avoidance 与 process diagnostics 放入受治理的 shell/test tool execution。
- Make output-contract verification feed the existing self-repair loop, including schema, artifact, check-command, and semantic data-shape failures.
- 让 output-contract verification 进入现有 self-repair loop，覆盖 schema、artifact、check-command 与 semantic data-shape failures。
- Require evaluation adapters to use official CLI/core capabilities only. Adapter prompt hacks become diagnostics and regression seeds, not hidden product behavior.
- 要求 evaluation adapter 只使用正式 CLI/core capabilities。Adapter prompt hacks 只能成为诊断与回归种子，不能成为隐藏产品行为。
- Clarify memory layering: current context, PageIndex/index recall, lossless context, permanent memory, provider cache, and external memory hooks are separate capabilities with separate gates.
- 明确记忆分层：current context、PageIndex/index recall、lossless context、permanent memory、provider cache 与 external memory hooks 是不同能力，具备不同门禁。

## Codex/Claude Reference Lessons / Codex 与 Claude 参考经验

This change does not claim access to private Codex or Claude internals. It extracts observable product lessons from mature coding agents: durable project instructions are treated as first-class context, tools run through governed capabilities, completion is tied to verification evidence, repair is a bounded loop, and context/memory is layered rather than treated as one prompt blob.

本变更不声称掌握 Codex 或 Claude 的私有内部实现。它提炼成熟 coding agents 可观察到的产品经验：持久项目规则是一等上下文，工具通过受治理 capability 执行，完成状态绑定验证证据，修复是有界循环，上下文/记忆按层管理而不是塞成一个 prompt blob。

The local Claude reference is treated as source-map-derived product evidence. We may use it to understand mature module boundaries and control-flow responsibilities, but OpenSpec and implementation must stay in DeepSeek CLI terms and must not copy external source, task-specific hidden prompts, or reference-specific private mechanisms.

本地 Claude 参考按 source-map 还原出的产品证据处理。我们可以用它理解成熟模块边界与控制流职责，但 OpenSpec 与实现必须保持 DeepSeek CLI 自身语义，不得复制外部源码、任务专用隐藏 prompt 或参考实现的私有机制。

## Impact

- Affected packages: `src/packages/platform-contracts`, `src/packages/prompt-assembly`, `src/packages/runtime`, `src/packages/core-coding-tools`, `src/packages/capability-execution-governance` or equivalent governance owners, `src/packages/testing-regression`, and `src/apps/cli`.
- 影响包：`src/packages/platform-contracts`、`src/packages/prompt-assembly`、`src/packages/runtime`、`src/packages/core-coding-tools`、`src/packages/capability-execution-governance` 或等价治理归属包、`src/packages/testing-regression` 与 `src/apps/cli`。
- Evaluation adapters, including Terminal-Bench adapters, must become thin bridges over CLI product behavior.
- 包括 Terminal-Bench adapter 在内的 evaluation adapters 必须变成 CLI 产品行为上的薄桥接。
- Delivery scoring can identify which layer is incomplete and must not give full credit for adapter-only or fake behavior.
- 交付评分可以识别哪个层未完成，且不得给 adapter-only 或 fake behavior 满分。
