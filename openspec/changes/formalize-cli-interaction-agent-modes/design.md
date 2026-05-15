## Context

Current DeepSeek CLI architecture is already suitable for a mature Agent CLI: `src/apps/cli` is a thin host adapter, `platform-contracts` owns DTOs, `runtime` owns execution, `command-system` owns local controls, `prompt-assembly` owns model prompt construction, and `agent-management` provides the first registry/lifecycle contract. The gap is not a missing mega-file; the gap is that interaction mode and agent mode are still implicit across CLI args, terminal profiles, prompt text, and partial agent-spawn behavior.

当前 DeepSeek CLI 架构方向是正确的：`src/apps/cli` 是薄 host adapter，`platform-contracts` 拥有 DTO，`runtime` 拥有执行，`command-system` 拥有本地控制，`prompt-assembly` 拥有模型 prompt 构造，`agent-management` 已有第一版 registry/lifecycle 契约。缺口不是缺一个大文件，而是 interaction mode 与 agent mode 仍隐含在 CLI args、terminal profile、prompt text 和部分 agent-spawn 行为中。

Current completion assessment:

- Complete or substantially present: `run` and `chat` entries, `text/json/jsonl` output, terminal capability profiles, local slash controls, palette/keymap/action model, reference sets, result lists, jump history, PageIndex recall, revert preview/apply surface, session resume/fork-lite, evidence-first runtime context, prompt assembly package, runtime events, tool preflight, approval lifecycle, and initial `agent.spawn`.
- 已完成或基本具备：`run` 与 `chat` 入口、`text/json/jsonl` 输出、terminal capability profiles、本地 slash controls、palette/keymap/action model、reference sets、result lists、jump history、PageIndex recall、revert preview/apply surface、session resume/fork-lite、evidence-first runtime context、prompt assembly package、runtime events、tool preflight、approval lifecycle 与初始 `agent.spawn`。
- Partial: agent definitions and instances exist, but product-facing agent roles, delegation decisions, continuation/stop semantics, independent verification, mode-aware permissions, result routing, and agent-mode prompt sections are not yet first-class.
- 部分完成：agent definitions 与 instances 已存在，但面向产品的 agent roles、delegation decisions、continuation/stop semantics、independent verification、mode-aware permissions、result routing 与 agent-mode prompt sections 还不是一等能力。
- Missing: a unified `InteractionMode` contract, persisted mode transitions, `/mode` and `/agent` local controls, coordinator/worker mode, verifier mode, scratchpad/checkpoint policy for workers, structured worker notifications, and acceptance matrices for multi-round operating quality.
- 未完成：统一的 `InteractionMode` 契约、持久化 mode transitions、`/mode` 与 `/agent` 本地控制、coordinator/worker mode、verifier mode、worker scratchpad/checkpoint policy、结构化 worker notifications，以及 multi-round operating quality 的验收矩阵。

Reference review of `参考/claude-code-2.1.88` informs this design at the principle level only. The useful patterns are explicit mode switching, coordinator-to-worker delegation, worker continuation/stop, self-contained worker prompts, remote-safe command filtering, plan/auto/permission mode transition attachments, vim-like input modes, and independent verification. The pitfalls we must avoid are mutable environment mode repair on resume, prompt-only mode contracts, workers that cannot see parent context unless synthesized correctly, unbounded scratchpad permissions, and over-delegation that hides rather than solves complexity.

对 `参考/claude-code-2.1.88` 的审阅只作为原则层参考。可吸收的模式包括显式 mode switching、coordinator-to-worker delegation、worker continuation/stop、自包含 worker prompts、remote-safe command filtering、plan/auto/permission mode transition attachments、vim-like input modes 与 independent verification。必须规避的坑包括 resume 时用可变环境修补 mode、只靠 prompt 约束 mode、worker 无法看到父上下文导致必须正确合成 prompt、无边界 scratchpad 权限，以及通过过度委派隐藏复杂度。

## Goals / Non-Goals

**Goals:**

- Make top-tier Agent CLI behavior a multi-round loop: intent classification, evidence discovery, planning when needed, governed implementation, independent verification, safe repair, synthesis, and replay.
- 让顶级 Agent CLI 行为成为多轮闭环：intent classification、evidence discovery、必要时 planning、governed implementation、independent verification、safe repair、synthesis 与 replay。
- Define interaction modes and agent modes as contracts shared by CLI, runtime, protocol, session store, tests, and future hosts.
- 将 interaction modes 与 agent modes 定义为 CLI、runtime、protocol、session store、tests 与未来 hosts 共享的契约。
- Preserve the current architecture: apps remain adapters; shared packages own reusable product behavior; contracts remain implementation-free.
- 保持当前架构：apps 仍是 adapters；共享 packages 拥有可复用产品行为；contracts 保持无实现。
- Make mode and delegation decisions auditable, replayable, and testable.
- 让 mode 与 delegation decisions 可审计、可回放、可测试。
- Give users discoverable controls without requiring them to write more precise prompts for normal product/code tasks.
- 给用户可发现的控制能力，而不是要求用户为了普通产品/代码任务写更精确 prompt。

**Non-Goals:**

- Full Vim emulation, including registers, macros, marks, visual selections, or text objects.
- 完整 Vim 仿真，包括 registers、macros、marks、visual selections 或 text objects。
- Full remote/cloud agent infrastructure in this change.
- 本变更不实现完整 remote/cloud agent infrastructure。
- Making the CLI host own worker scheduling, permissions, prompt assembly, or verification logic.
- 不让 CLI host 拥有 worker scheduling、permissions、prompt assembly 或 verification logic。
- Copying reference implementation code or product-specific details into DeepSeek OpenSpec.
- 不把参考实现代码或其产品细节复制进 DeepSeek OpenSpec。

## Decisions

### Decision 1: Treat Interaction Mode As Session State, Not Terminal State

DeepSeek SHALL define `InteractionMode` and `InteractionModeTransition` contracts under `platform-contracts`. CLI terminal profiles may influence rendering and input strategy, but the active mode belongs to the session/runtime contract and is emitted as typed events.

DeepSeek 必须在 `platform-contracts` 中定义 `InteractionMode` 与 `InteractionModeTransition`。CLI terminal profiles 可以影响渲染和输入策略，但 active mode 属于 session/runtime 契约，并以 typed events 发出。

Rationale: mode must survive resume/fork, be visible to diagnostics, and be testable in JSONL/golden traces. Hidden process globals or environment variables create mismatch bugs.

理由：mode 必须跨 resume/fork 保留，必须对 diagnostics 可见，并能在 JSONL/golden traces 中测试。隐藏 process globals 或环境变量会制造 mismatch bugs。

Alternative considered: keep mode as CLI-only state. Rejected because it cannot support future VSCode/server hosts and cannot explain replayed behavior.

备选方案：把 mode 保持为 CLI-only state。拒绝原因：无法支持未来 VSCode/server hosts，也无法解释 replayed behavior。

### Decision 2: Split Interaction Modes From Agent Modes

Interaction modes describe how the user and host interact: one-shot, chat, palette, approval, result-list, review, headless, remote, or degraded. Agent modes describe how the runtime works: default, evidence, planner, implementer, verifier, coordinator, worker, repair, or synthesis.

Interaction modes 描述用户和 host 如何交互：one-shot、chat、palette、approval、result-list、review、headless、remote 或 degraded。Agent modes 描述 runtime 如何工作：default、evidence、planner、implementer、verifier、coordinator、worker、repair 或 synthesis。

Rationale: a headless run can still use planner+implementer+verifier; an interactive chat turn can still stay single-agent. Combining these axes would create mode explosion.

理由：headless run 仍可使用 planner+implementer+verifier；interactive chat turn 也可能保持 single-agent。把两个轴合并会导致 mode 爆炸。

Alternative considered: a single `mode` enum. Rejected because it conflates UI state with execution strategy and makes permissions difficult to reason about.

备选方案：单个 `mode` enum。拒绝原因：混淆 UI state 与 execution strategy，导致权限难以推理。

### Decision 3: Use A Multi-Round Operating Loop For Non-Trivial Work

The runtime SHALL support a task loop with explicit phases: classify, evidence, plan, execute, verify, repair, synthesize, and complete. Simple prompts may short-circuit phases, but fact-sensitive or mutating work must record why phases were used or skipped.

runtime 必须支持显式阶段的 task loop：classify、evidence、plan、execute、verify、repair、synthesize 与 complete。简单 prompt 可以跳过部分阶段，但事实敏感或会修改状态的工作必须记录阶段被使用或跳过的原因。

Rationale: the user should not have to say "search evidence first" or "verify after generating." The product should internalize this behavior.

理由：用户不应该必须说“先搜证”或“生成后验证”。产品应内化这种行为。

Alternative considered: encode these behaviors only in the system prompt. Rejected because prompt-only rules are hard to test, cannot produce structured metrics, and are brittle across providers.

备选方案：只在 system prompt 编码这些行为。拒绝原因：prompt-only rules 难测试，无法产生结构化指标，且跨 provider 脆弱。

### Decision 4: Coordinator Is A Runtime Role With Narrow Powers

Coordinator mode SHALL plan, delegate, synthesize, and reconcile results. It SHALL NOT directly mutate workspace state unless the active request explicitly permits direct implementation. Worker/implementer modes own scoped execution; verifier mode owns independent proof.

coordinator mode 必须负责 plan、delegate、synthesize 与 reconcile results。除非 active request 显式允许直接实现，否则不得直接修改 workspace state。worker/implementer modes 拥有有边界执行；verifier mode 拥有独立证明。

Rationale: coordination creates leverage only when responsibilities are clear. If the coordinator can mutate, delegate, and self-verify freely, it becomes an untestable all-powerful loop.

理由：coordination 只有在职责清晰时才有价值。如果 coordinator 可自由 mutate、delegate 与 self-verify，就会变成不可测试的全能循环。

Alternative considered: let the main agent decide ad hoc through prompts. Rejected because it makes permission projection, metrics, and failure recovery ambiguous.

备选方案：让 main agent 通过 prompt 临时决定。拒绝原因：permission projection、metrics 与 failure recovery 都会变得含糊。

### Decision 5: Delegation Requires A Synthesized Self-Contained Work Order

Every delegated worker request SHALL include a structured work order with purpose, original user goal, relevant evidence ids, file paths or target ids, allowed tools, done criteria, verification expectations, and parent/session lineage. The parent agent must synthesize the order; "based on the prior findings" is not a valid work order.

每个 delegated worker request 必须包含结构化 work order，含 purpose、original user goal、relevant evidence ids、file paths 或 target ids、allowed tools、done criteria、verification expectations 与 parent/session lineage。父 agent 必须合成该 work order；“基于之前发现继续”不是有效 work order。

Rationale: workers do not have reliable access to the parent conversation and should not infer missing context. Structured work orders also make replay and evaluation possible.

理由：worker 不应假设能可靠看到父会话上下文，也不应推断缺失上下文。结构化 work orders 还能支持 replay 和 evaluation。

Alternative considered: pass raw conversation history to all workers. Rejected because it increases token cost, leaks irrelevant context, and makes focused verification harder.

备选方案：把原始 conversation history 传给所有 worker。拒绝原因：增加 token 成本，泄漏无关上下文，并让 focused verification 更困难。

### Decision 6: Continue Versus Spawn Is A Recorded Decision

The orchestrator SHALL record whether a follow-up uses an existing worker or spawns a fresh worker, including context-overlap evidence, reason code, and expected benefit. High-overlap fixes can continue; independent verification and wrong-approach retries should generally spawn fresh.

orchestrator 必须记录后续工作是继续 existing worker 还是 spawn fresh worker，并包含 context-overlap evidence、reason code 与 expected benefit。高重叠修复可以 continue；独立验证和错误路线重试通常应 spawn fresh。

Rationale: continuation is powerful for error context; fresh workers reduce anchoring. Recording the choice turns a hidden heuristic into a testable decision.

理由：continuation 对错误上下文有价值；fresh workers 能减少 anchoring。记录该选择能把隐藏启发式变成可测试决策。

### Decision 7: Verification Is Adversarial And Evidence-Based

Verifier mode SHALL independently inspect changed outputs, run relevant checks, produce command/evidence references, and return pass/fail/partial with reasons. A worker's self-check does not satisfy independent verification for non-trivial changes.

verifier mode 必须独立检查 changed outputs、运行相关 checks、产出 command/evidence references，并返回带原因的 pass/fail/partial。对非琐碎变更，worker 的 self-check 不等价于 independent verification。

Rationale: top-tier Agent CLI quality comes from proof, not confidence. This also supports fair comparison against Codex/Claude/other baselines.

理由：顶级 Agent CLI 的质量来自 proof，而不是 confidence。这也支持与 Codex/Claude/其他 baseline 的公平对比。

### Decision 8: Scratchpad And Checkpoints Are Governed Capabilities

Worker scratchpads SHALL be scoped, declared, redacted, and checkpoint-aware. Write-capable workers must use checkpoint policy before mutating workspace state, and scratchpad content must not bypass session/audit boundaries.

worker scratchpads 必须有 scope、声明、脱敏并感知 checkpoint。具备写能力的 worker 在修改 workspace state 前必须走 checkpoint policy，scratchpad content 不得绕过 session/audit boundaries。

Rationale: scratchpads are useful for durable cross-worker knowledge, but unmanaged scratchpads become an unreviewed side channel.

理由：scratchpads 对跨 worker 持久知识有用，但无治理 scratchpads 会变成未审计的旁路。

### Decision 9: Mode-Aware Permission Projection Is Mandatory

Agent mode SHALL constrain visible tools, context, commands, skills, hooks, MCP, model profiles, and host capabilities before runtime execution. Planner/research defaults to read-only; implementer may use read-write with checkpoints; verifier gets test/process scope; coordinator primarily delegates.

Agent mode 必须在 runtime execution 前约束 visible tools、context、commands、skills、hooks、MCP、model profiles 与 host capabilities。planner/research 默认 read-only；implementer 可在 checkpoint 下 read-write；verifier 获得 test/process scope；coordinator 主要负责 delegation。

Rationale: permission mode is a security and product boundary, not a prompt suggestion.

理由：permission mode 是安全和产品边界，不是 prompt 建议。

### Decision 10: Separate Model Reasoning Effort From Product Loop Budgets

Model reasoning effort SHALL be treated as a model/provider execution parameter, while evidence discovery count, verification depth, repair attempts, delegation fan-out, and maximum loop rounds SHALL be treated as product orchestration budgets owned by runtime policy.

模型 reasoning effort 必须被视为 model/provider execution parameter；而 evidence discovery count、verification depth、repair attempts、delegation fan-out 与 maximum loop rounds 必须被视为 runtime policy 拥有的产品编排预算。

Rationale: "low/medium/high/xhigh intelligence" can improve internal reasoning quality, but it does not guarantee the agent searched the project, verified an artifact, or reran a failing check. A top-tier Agent CLI must expose and record the actual external evidence/verification loop, not infer it from model settings.

理由：“low/medium/high/xhigh 智能程度”可以提升内部推理质量，但不能保证 agent 已搜索项目、验证产物或复跑失败检查。顶级 Agent CLI 必须暴露并记录真实的外部证据/验证循环，而不能从模型设置推断。

Alternative considered: map high reasoning effort directly to more evidence loops. Rejected because expensive internal reasoning and external proof solve different problems; the runtime may choose both for high-risk tasks, but each budget must be observable independently.

备选方案：把 high reasoning effort 直接映射为更多 evidence loops。拒绝原因：昂贵的内部推理和外部证明解决的是不同问题；runtime 可以在高风险任务中同时选择二者，但每个预算都必须可独立观测。

### Decision 11: CLI Controls Stay Local And Discoverable

`/mode`, `/agent`, `/workers`, `/verify`, `/plan`, and future raw-key bindings SHALL resolve locally through command/action contracts. Unknown or unsupported controls must fail locally and never become model prompts.

`/mode`、`/agent`、`/workers`、`/verify`、`/plan` 与未来 raw-key bindings 必须通过 command/action contracts 在本地解析。未知或不支持的控制必须在本地失败，不得变成 model prompt。

Rationale: local controls prevent accidental prompt injection into the model and keep cross-platform behavior deterministic.

理由：本地 controls 能防止意外 prompt injection 进入 model，并保持跨平台行为确定。

## Risks / Trade-offs

- [Risk] Mode taxonomy becomes too broad → Mitigation: separate interaction modes and agent modes, start with a minimal stable set, and require unknown modes to fail closed with compatibility metadata.
- [风险] mode taxonomy 过宽 → 缓解：拆分 interaction modes 与 agent modes，从最小稳定集合开始，并要求 unknown modes 携带 compatibility metadata 安全失败。
- [Risk] Multi-agent orchestration adds latency and token cost → Mitigation: task classifier records skip reasons, simple prompts stay single-agent, and delegation requires non-trivial benefit evidence.
- [风险] multi-agent orchestration 增加延迟和 token 成本 → 缓解：task classifier 记录 skip reasons，简单 prompt 保持 single-agent，delegation 必须有非琐碎收益证据。
- [Risk] Verification can become rubber-stamping → Mitigation: verifier output must cite command/evidence ids; non-trivial pass requires reproducible checks or explicit partial status.
- [风险] verification 变成橡皮图章 → 缓解：verifier output 必须引用 command/evidence ids；非琐碎 pass 需要可复现 checks 或显式 partial status。
- [Risk] Worker writes conflict with parent or other workers → Mitigation: disjoint write scopes, checkpoint gates, stale workspace watermark checks, and stop/continue lifecycle events.
- [风险] worker 写入与 parent 或其他 worker 冲突 → 缓解：disjoint write scopes、checkpoint gates、stale workspace watermark checks 与 stop/continue lifecycle events。
- [Risk] CLI raw-key mode remains cross-platform fragile → Mitigation: keep slash-driven controls as semantic baseline; raw key support is an optional renderer profile over the same actions.
- [风险] CLI raw-key mode 跨平台脆弱 → 缓解：slash-driven controls 作为语义基线；raw key support 只是同一 actions 上的可选 renderer profile。
- [Risk] Existing tests become noisy as events grow → Mitigation: use event schema versioning, compatibility metadata, normalized golden traces, and additive event payloads.
- [风险] events 增多导致现有测试噪声变大 → 缓解：使用 event schema versioning、compatibility metadata、normalized golden traces 与 additive event payloads。

## Migration Plan

1. Add contracts and tests first: interaction mode DTOs, agent mode DTOs, transitions, delegation work orders, worker result events, and compatibility metadata.
1. 先加 contracts 与 tests：interaction mode DTOs、agent mode DTOs、transitions、delegation work orders、worker result events 与 compatibility metadata。
2. Wire read-only observability next: emit mode status and transition events without changing execution behavior.
2. 再接入只读 observability：发出 mode status 与 transition events，不改变执行行为。
3. Add CLI local controls and diagnostics: `/mode`, `/agent`, status/list commands, JSONL output, and completion matrix.
3. 增加 CLI local controls 与 diagnostics：`/mode`、`/agent`、status/list commands、JSONL output 与 completion matrix。
4. Extend prompt assembly with mode sections and work order sections.
4. 扩展 prompt assembly，加入 mode sections 与 work order sections。
5. Upgrade `agent.spawn` to structured work orders and result routing; then add continuation/stop.
5. 将 `agent.spawn` 升级为结构化 work orders 与 result routing；再加入 continuation/stop。
6. Add coordinator/verifier rollout behind explicit config/flag, then enable bounded defaults for non-trivial CLI tasks after golden and e2e evidence passes.
6. 在显式 config/flag 后滚动加入 coordinator/verifier；golden 与 e2e evidence 通过后，对非琐碎 CLI tasks 启用有边界默认值。

Rollback strategy: because contracts are additive, rollback disables coordinator/verifier activation and mode-aware orchestration while keeping older single-agent run/chat behavior valid.

回滚策略：因为 contracts 是 additive，回滚时禁用 coordinator/verifier activation 与 mode-aware orchestration，同时保留旧 single-agent run/chat 行为有效。

## Open Questions

- Which CLI flag names should expose initial agent modes: `--agent-mode`, `--mode`, or only local `/agent` controls first?
- 初始 agent modes 应用哪些 CLI flag 暴露：`--agent-mode`、`--mode`，还是先只做本地 `/agent` controls？
- Should coordinator mode become default for all non-trivial tasks, or only after evaluation proves lower correction cost than single-agent self-repair?
- coordinator mode 应成为所有非琐碎任务默认值，还是等评估证明其 correction cost 低于 single-agent self-repair 后再默认启用？
- What is the first verifier threshold: file count, capability kind, generated artifact type, or risk classification?
- 第一版 verifier 阈值应按 file count、capability kind、generated artifact type 还是 risk classification 判断？
