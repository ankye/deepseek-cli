## Design

The system keeps one agent workflow. The new work is not a mode, benchmark path, or hidden prompt bundle. It is a set of typed contracts, prompt sections, tool profiles, verifier rules, memory boundaries, and regression evidence that the existing runtime phases consume.

系统保留一条 agent workflow。新增内容不是 mode、benchmark path 或隐藏 prompt bundle，而是一组 typed contracts、prompt sections、tool profiles、verifier rules、memory boundaries 与 regression evidence，由现有 runtime phases 消费。

## Layer Ownership / 分层归属

| Layer | Owner | Product Responsibility |
| --- | --- | --- |
| Project rules / 项目规则 | `prompt-assembly`, `context-engine`, CLI host | Load `AGENTS.md`, future `CLAUDE.md`-style files, host rules, and repository guidance as prioritized runtime-owned sections. |
| Tools and permissions / 工具与权限 | capability governance, `core-coding-tools`, platform runtime | Execute shell/file/git/test/network work only through governed capabilities, execution envelopes, policy, sandbox, and replay evidence. |
| Task loop / 任务循环 | `runtime`, `agent-loop`, `agent-self-repair-loop` | Classify, gather evidence, plan, execute, verify, repair, and synthesize with typed terminal outcomes. |
| Output contracts / 输出契约 | `platform-contracts`, `prompt-assembly`, verifier policy | Represent JSON/schema/file/artifact/command-plan expectations as DTOs and prompt sections, then verify them deterministically when possible. |
| Verification and regression / 验证与回归 | `runtime`, `testing-regression`, evaluation packages | Prove completion with command results, schema checks, artifact checks, golden traces, matrix tests, and scorecard evidence. |
| Context and memory / 上下文与记忆 | `context-engine`, PageIndex, lossless context, permanent memory | Separate short context, index recall, lossless recovery, durable promoted memory, provider cache, and external memory hooks. |

## Exposed Gaps Routed To Layers / 暴露问题的归属

- `git diff` or pager hangs belong to `core-coding-tools` noninteractive execution profile, not Terminal-Bench prompt text.
- `git diff` 或 pager 卡死归属 `core-coding-tools` noninteractive execution profile，而不是 Terminal-Bench prompt 文本。
- JSON/schema failures belong to output contracts plus verifier/self-repair, not adapter-specific validation prompts.
- JSON/schema failures 归属 output contracts 与 verifier/self-repair，而不是 adapter-specific validation prompts。
- Data-shape errors such as id-vs-name confusion belong to output contract semantics, schema evidence, and generated artifact verification.
- ID 与 name 混淆等 data-shape errors 归属 output contract semantics、schema evidence 与 generated artifact verification。
- Long-context loss or stale recall belongs to context projection, lossless context, and permanent memory gates.
- 长上下文丢失或 stale recall 归属 context projection、lossless context 与 permanent memory gates。
- Hidden benchmark rules belong nowhere in product runtime. They must become regression fixtures, scoring diagnostics, or formal contracts.
- 隐藏 benchmark rules 不属于产品 runtime。它们必须转化为 regression fixtures、scoring diagnostics 或正式 contracts。

## Completion Invariant / 完成不变量

A turn can be reported as delivered only when the active contract, required tools, verification expectations, and memory/context requirements are either satisfied, explicitly not applicable, or fail-closed with actionable diagnostics. Model text alone is not completion evidence for structured or mutating tasks.

只有当 active contract、required tools、verification expectations 与 memory/context requirements 已满足、明确不适用，或以可行动诊断安全失败时，turn 才能报告为 delivered。对于结构化或会修改状态的任务，模型文本本身不是完成证据。

## Adapter Boundary / Adapter 边界

Evaluation adapters may configure allowed capabilities, timeouts, live/fake provider mode, output capture, and external harness arguments. They must not encode hidden task-specific instructions that the CLI product does not expose through contracts, prompt assembly, tools, verification, or memory policy.

Evaluation adapters 可以配置 allowed capabilities、timeouts、live/fake provider mode、output capture 与 external harness arguments。它们不得编码 CLI 产品没有通过 contracts、prompt assembly、tools、verification 或 memory policy 暴露的隐藏任务专用指令。

## Source-Map Reference Reading / Source-map 参考阅读

The Claude reference under `参考/` is source-map-derived evidence. It is useful because it exposes mature product control flow instead of black-box prompts. The transferable lessons are architectural responsibilities:

`参考/` 下的 Claude 参考是 source-map 还原证据。它的价值在于暴露成熟产品控制流，而不是黑盒 prompt。可迁移经验是架构职责：

- Headless execution should be a first-class runtime path with the same tool, permission, hook, output, budget, and session semantics as interactive execution.
- Headless execution 应是一等 runtime path，与交互执行共享 tool、permission、hook、output、budget 与 session 语义。
- Shell/test execution should own noninteractive process hygiene: closed stdin, pager/editor avoidance, timeout/cancel/background semantics, bounded output persistence, cwd tracking, secret scrubbing, and semantic exit interpretation.
- Shell/test execution 应负责 noninteractive process hygiene：关闭 stdin、避免 pager/editor、timeout/cancel/background 语义、有界输出持久化、cwd tracking、secret scrubbing 与 exit 语义解释。
- Tool errors, permission denials, schema failures, and verifier failures should return as typed observations that the loop can repair, not as silent adapter exceptions.
- Tool errors、permission denials、schema failures 与 verifier failures 应作为 typed observations 返回给 loop 修复，而不是静默 adapter exceptions。
- Structured output should be a contract-visible capability with schema validation, retry budget, final result extraction, and clean machine-readable stdout.
- Structured output 应是 contract-visible capability，包含 schema validation、retry budget、final result extraction 与干净 machine-readable stdout。
- Project rules and memory should be layered, prioritized, diagnosable, and disable-able; permanent memory should store promoted durable knowledge, not replace current repository inspection.
- Project rules 与 memory 应分层、按优先级、可诊断、可关闭；permanent memory 存储 promoted durable knowledge，而不是替代当前仓库检查。
- Context compaction/lossless recovery should preserve tool-use/result pairing and session replay invariants so long tasks can continue without corrupting the conversation graph.
- Context compaction/lossless recovery 应保持 tool-use/result pairing 与 session replay invariants，使长任务可继续且不破坏 conversation graph。

These lessons must be re-expressed through DeepSeek CLI contracts, packages, and tests. The reference cannot become a source of copied implementation details or hidden benchmark rules.

这些经验必须通过 DeepSeek CLI 的 contracts、packages 与 tests 重新表达。参考代码不能成为复制实现细节或隐藏 benchmark rules 的来源。
