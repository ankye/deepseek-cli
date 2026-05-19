## Context

DeepSeek CLI already has trace ids, runtime events, evidence-first workflow records, prompt assembly evidence, lossless context nodes, first-party plugin manifests, and structured CLI result lists. The missing layer is product composition: users cannot yet read a coherent explanation of what the agent believed, which assumptions it made, why it selected a tool or context item, and how verification changed the answer.

DeepSeek CLI 已经具备 trace ids、runtime events、evidence-first workflow records、prompt assembly evidence、lossless context nodes、first-party plugin manifests 与结构化 CLI result lists。缺失的是产品组合层：用户目前还不能连贯地看到 agent 相信了什么、做了哪些假设、为什么选择某个工具或上下文，以及验证如何改变答案。

This change adds a visible reasoning surface. The surface is not a dump of raw provider/internal reasoning. It is a typed, redacted, replayable explanation layer made from model-authored rationale summaries, host/runtime decisions, tool evidence, context projection facts, plugin contributions, and verification outcomes.

本变更增加可见推理界面。该界面不是 raw provider/internal reasoning 的倾倒，而是由模型产出的 rationale summaries、host/runtime decisions、tool evidence、context projection facts、plugin contributions 与 verification outcomes 组成的类型化、脱敏、可回放解释层。

## Goals / Non-Goals

**Goals:**

- Provide a TUI panel that shows intent, assumptions, decision steps, evidence links, actions, risks, verification, and final outcome for each turn.
- 为每个 turn 提供 TUI 面板，展示 intent、assumptions、decision steps、evidence links、actions、risks、verification 与 final outcome。
- Define provider-neutral contracts for visible reasoning records and projections.
- 定义 provider-neutral 的 visible reasoning records 与 projection 契约。
- Make visible reasoning available in interactive TUI, text, JSON, and JSONL without terminal-specific behavior leaking into shared packages.
- 让可见推理同时可用于 interactive TUI、text、JSON 与 JSONL，且不让终端特定行为泄漏到共享包。
- Connect reasoning steps to existing context, evidence, command result, diff, check, and plugin target references.
- 将 reasoning steps 连接到已有 context、evidence、command result、diff、check 与 plugin target references。
- Give plugins a controlled contribution shape so plugin explanations feel native.
- 为插件提供受控 contribution 形态，使插件解释体验保持原生一致。

**Non-Goals:**

- Exposing raw hidden chain-of-thought, provider raw reasoning payloads, private prompt internals, or unsafe unbounded tool output.
- 暴露 raw hidden chain-of-thought、provider raw reasoning payloads、private prompt internals 或不安全的无边界工具输出。
- Adding a new model-provider dependency or provider-specific reasoning API in the CLI host.
- 在 CLI host 中增加新的模型供应商依赖或 provider-specific reasoning API。
- Replacing the existing observability, evidence-first, prompt assembly, or lossless context systems.
- 替换现有 observability、evidence-first、prompt assembly 或 lossless context 系统。

## Decisions

### Decision: Store visible reasoning as first-class DTOs

Create `VisibleReasoningRecord`, `VisibleReasoningStep`, `VisibleReasoningProjection`, and `VisibleReasoningEvidenceLink` in `@deepseek/platform-contracts`. Records are provider-neutral JSON DTOs with ids, session/turn/trace metadata, step kind, actor, status, redacted summary, evidence links, privacy class, redaction metadata, and compatibility metadata.

在 `@deepseek/platform-contracts` 中创建 `VisibleReasoningRecord`、`VisibleReasoningStep`、`VisibleReasoningProjection` 与 `VisibleReasoningEvidenceLink`。记录是 provider-neutral JSON DTO，包含 ids、session/turn/trace metadata、step kind、actor、status、脱敏 summary、evidence links、privacy class、redaction metadata 与 compatibility metadata。

Alternative considered: render ad hoc prose directly in CLI. Rejected because plugins, JSONL output, replay, and tests would not share one contract.

备选方案：直接在 CLI 中渲染临时文案。拒绝原因是 plugins、JSONL output、replay 与 tests 无法共享同一契约。

### Decision: Treat model thinking as an explainable summary, not raw internals

The model-facing output contract may ask the model for a concise rationale summary, assumption list, uncertainty list, and final decision notes. Runtime and plugins may add system-authored decision records. The UI labels these as visible reasoning summaries and links them to evidence. Raw provider/internal reasoning is excluded from storage and rendering by contract.

模型侧 output contract 可以要求模型提供简洁 rationale summary、assumption list、uncertainty list 与 final decision notes。Runtime 与插件可以增加系统产出的 decision records。UI 将其标记为 visible reasoning summaries，并连接到证据。raw provider/internal reasoning 按契约排除在存储与渲染之外。

Alternative considered: show whatever provider reasoning field is available. Rejected because provider formats vary, may expose unsafe internals, and cannot be replayed or redacted consistently.

备选方案：展示供应商可用的任何 reasoning 字段。拒绝原因是供应商格式不一致，可能暴露不安全内部信息，且无法稳定回放或脱敏。

### Decision: Make evidence links navigable

Every non-trivial reasoning step should carry zero or more links to existing target references: context nodes, result list items, tool evidence, command evidence, diff hunks, checks, plugin contributions, or diagnostics. The TUI inspector uses those links to jump from a decision to source material.

每个非平凡 reasoning step 应携带零个或多个指向现有 target references 的链接：context nodes、result list items、tool evidence、command evidence、diff hunks、checks、plugin contributions 或 diagnostics。TUI inspector 使用这些链接从决策跳转到源材料。

Alternative considered: show a linear transcript only. Rejected because the product advantage is auditability, not just narration.

备选方案：只展示线性 transcript。拒绝原因是产品优势在可审计性，而不仅是叙述。

### Decision: Project by renderer profile

Interactive TUI gets a dedicated reasoning panel and inspector. Plain text gets a compact “reasoning” block. JSON gets one full projection object. JSONL gets ordered records suitable for replay and streaming. All modes use the same DTOs and redaction pipeline.

Interactive TUI 获得专用 reasoning panel 与 inspector。plain text 获得 compact “reasoning” block。JSON 获得一个完整 projection object。JSONL 获得有序 records，适合 replay 与 streaming。所有模式使用同一 DTO 与脱敏管线。

Alternative considered: implement only TUI rendering first. Rejected because CLI automation, tests, and support bundles need the same visibility.

备选方案：只先实现 TUI 渲染。拒绝原因是 CLI automation、tests 与 support bundles 也需要同样可见性。

### Decision: Let plugins contribute bounded reasoning fragments

Plugin manifests can declare reasoning contribution support. First-party plugin adapters return bounded records using shared step kinds and evidence links. The host validates plugin records for ids, sizes, redaction metadata, unsupported privacy classes, and stale references before projection.

Plugin manifests 可以声明 reasoning contribution support。第一方插件适配器使用共享 step kinds 与 evidence links 返回有界 records。host 在投影前校验 plugin records 的 ids、大小、redaction metadata、不支持的 privacy classes 与 stale references。

Alternative considered: let plugins render their own explanation panels. Rejected because it would recreate the current “拼凑感” at the UX layer.

备选方案：允许插件渲染自己的解释面板。拒绝原因是会在 UX 层重新制造当前的“拼凑感”。

## Risks / Trade-offs

- Users may think visible reasoning is a literal dump of model internals. → Label records as “reasoning summary”, “system decision”, “evidence”, and “assumption”; docs explain that raw internal/provider reasoning is intentionally excluded.
- 用户可能认为可见推理是模型内部过程的逐字倾倒。→ 将记录标记为 “reasoning summary”、“system decision”、“evidence” 与 “assumption”；文档说明 raw internal/provider reasoning 被有意排除。
- Reasoning summaries can become verbose and distract from work. → Add compact/full/detail levels and terminal width-aware truncation with inspector expansion.
- Reasoning summaries 可能变得冗长并干扰工作。→ 增加 compact/full/detail levels，并用终端宽度感知截断与 inspector 展开。
- A model can produce inaccurate rationale summaries. → Require evidence links and certainty classes; unsupported rationale is marked assumption or diagnostic.
- 模型可能产出不准确的 rationale summaries。→ 要求 evidence links 与 certainty classes；未支持的 rationale 标记为 assumption 或 diagnostic。
- Plugin contributions can leak private content. → Validate size, privacy class, redaction metadata, and evidence references before rendering or persistence.
- 插件贡献可能泄露私有内容。→ 在渲染或持久化前校验 size、privacy class、redaction metadata 与 evidence references。
- More runtime events can increase output noise. → JSONL uses explicit record kinds and text/TUI projections collapse completed low-value steps by default.
- 更多 runtime events 可能增加输出噪音。→ JSONL 使用显式 record kinds，text/TUI projections 默认折叠已完成的低价值步骤。

## Migration Plan

1. Add platform-contract DTOs and type tests without changing default rendering.
2. 在不改变默认渲染的情况下增加 platform-contract DTO 与类型测试。
3. Emit visible reasoning records from existing chat, context, repo, git review, checks, and prompt assembly boundaries.
4. 从现有 chat、context、repo、git review、checks 与 prompt assembly 边界发出 visible reasoning records。
5. Add CLI renderers for text/JSON/JSONL and TUI panel projection.
6. 增加 CLI text/JSON/JSONL 渲染器与 TUI panel projection。
7. Add first-party plugin contribution metadata and validation.
8. 增加第一方插件 contribution metadata 与校验。
9. Gate default expanded rendering behind TUI profile support while keeping compact text output stable.
10. 根据 TUI profile 支持门控默认展开渲染，同时保持 compact text output 稳定。

Rollback is safe because visible reasoning is additive. Existing commands can ignore the optional projection if a host has not implemented rendering.

回滚是安全的，因为可见推理是增量能力。未实现渲染的 host 可以忽略可选 projection。

## Open Questions

- Should compact/full reasoning level be a command flag, a persistent preference, or both?
- compact/full reasoning level 应该是命令 flag、持久偏好，还是二者都支持？
- Should reasoning records be stored in session logs by default, or only projected live unless diagnostics are requested?
- reasoning records 应该默认存储到 session logs，还是仅 live projection，除非用户请求 diagnostics？
- Should plugin marketplace metadata expose a “reasoning contribution quality” score for third-party plugin review?
- plugin marketplace metadata 是否应暴露 “reasoning contribution quality” score，用于第三方插件审核？
