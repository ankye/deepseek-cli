## Context

The current agent loop creates `ModelChatMessage[]` inline, prepends projected context as a system message, stringifies the messages into `prompt`, and passes visible tool schemas directly to the model gateway. This keeps the first loop simple, but prompt behavior is now spread across runtime, context projection, model tooling, provider adaptation, tests, and evaluation.

当前 agent loop 会在内部创建 `ModelChatMessage[]`，把 projected context 作为 system message 前置，将 messages 字符串化为 `prompt`，并直接把 visible tool schemas 传给 model gateway。这让第一版 loop 足够简单，但 prompt 行为已经分散在 runtime、context projection、model tooling、provider adaptation、tests 与 evaluation 中。

The Claude reference shows the same area tends to accumulate patches: system prompt parts, user context, system context, compaction boundaries, tool-result budgeting, cache-safe params, provider request capture, prompt cache eligibility, and special-mode injections all become intertwined. We should learn from that by creating a flexible package boundary now, not by copying implementation details.

Claude 参考实现说明这个区域很容易不断堆补丁：system prompt parts、user context、system context、compaction boundaries、tool-result budgeting、cache-safe params、provider request capture、prompt cache eligibility 与 special-mode injections 会相互缠绕。我们应该借鉴这一点，提前建立灵活的 package 边界，而不是复制其实现细节。

## Goals / Non-Goals

**Goals:**
- Create `@deepseek/prompt-assembly` as a first-class workspace package with clear public exports.
- Keep the package host-agnostic and provider-neutral: no CLI UI, VSCode API, process shelling, filesystem reads, or live provider SDK calls.
- Make the assembly pipeline highly extensible through registries and typed interfaces rather than conditionals in the runtime loop.
- Support deterministic, replayable assembly records with redaction, fingerprints, token estimates, budget decisions, and section provenance.
- Preserve context-engine as the owner of retrieval/projection while giving prompt assembly a stable evidence input.
- Let runtime and evaluation diagnose whether failures came from missing context, dropped sections, tool projection, provider adaptation, or model behavior.
- Keep current CLI behavior compatible during migration.

**目标：**
- 将 `@deepseek/prompt-assembly` 建成一等 workspace package，并提供清晰 public exports。
- 保持 package host-agnostic 与 provider-neutral：不依赖 CLI UI、VSCode API、process shell、filesystem reads 或 live provider SDK calls。
- 通过 registries 与 typed interfaces 实现高度扩展，而不是在 runtime loop 内堆条件分支。
- 支持 deterministic、replayable assembly records，包含 redaction、fingerprints、token estimates、budget decisions 与 section provenance。
- 保持 context-engine 对 retrieval/projection 的所有权，同时给 prompt assembly 一个稳定的 evidence input。
- 让 runtime 与 evaluation 能诊断失败来自 missing context、dropped sections、tool projection、provider adaptation 还是 model behavior。
- 迁移期间保持当前 CLI 行为兼容。

**Non-Goals:**
- Do not implement a new retrieval engine in prompt assembly.
- Do not copy external reference prompt text or proprietary implementation details.
- Do not make provider adapters decide task semantics or context selection.
- Do not require ZVec or any embedding provider to exist before the assembly package lands.
- Do not make prompt assembly a CLI-only feature.

**非目标：**
- 不在 prompt assembly 中实现新的 retrieval engine。
- 不复制外部参考 prompt 文本或专有实现细节。
- 不让 provider adapters 决定任务语义或上下文选择。
- 不要求 ZVec 或 embedding provider 先存在才能落地 assembly package。
- 不把 prompt assembly 做成 CLI-only 功能。

## Decisions

### 1. Create a dedicated workspace package

`src/packages/prompt-assembly` will be added as `@deepseek/prompt-assembly`. It may depend on `@deepseek/platform-contracts`, but it must not depend on `@deepseek/runtime`, apps, provider implementations, or testing fakes. Runtime imports the package; the package never imports runtime.

新增 `src/packages/prompt-assembly`，包名为 `@deepseek/prompt-assembly`。它可以依赖 `@deepseek/platform-contracts`，但不得依赖 `@deepseek/runtime`、apps、provider implementations 或 testing fakes。Runtime 导入该 package；该 package 不反向导入 runtime。

**Alternative considered:** keep assembly under `src/packages/runtime/src/prompt-assembly`. This is faster, but it invites direct access to runtime internals and repeats the patch accumulation problem we are trying to avoid.

**备选方案：** 放在 `src/packages/runtime/src/prompt-assembly`。这样更快，但会鼓励直接访问 runtime internals，并重复我们想规避的补丁堆积问题。

### 2. Contracts live in platform-contracts, behavior lives in prompt-assembly

`@deepseek/platform-contracts` will define serializable DTOs such as `PromptAssemblyInput`, `PromptAssemblyResult`, `PromptSection`, `PromptSectionRegistryEntry`, `PromptBudgetReport`, `PromptToolPlan`, `PromptAssemblyTrace`, and runtime event payload shapes. The new package will implement `PromptAssembler`, default section providers, default budgeter, default tool projector, and provider-neutral request planning.

`@deepseek/platform-contracts` 定义可序列化 DTO，例如 `PromptAssemblyInput`、`PromptAssemblyResult`、`PromptSection`、`PromptSectionRegistryEntry`、`PromptBudgetReport`、`PromptToolPlan`、`PromptAssemblyTrace` 与 runtime event payload shapes。新 package 实现 `PromptAssembler`、default section providers、default budgeter、default tool projector 与 provider-neutral request planning。

**Rationale:** contracts stay implementation-free and shared by runtime, CLI diagnostics, tests, and future VSCode host.

**原因：** contracts 保持 implementation-free，并可被 runtime、CLI diagnostics、tests 与未来 VSCode host 共享。

### 3. Use a staged pipeline, not one formatter

The default assembler will run the following stages:

```text
PromptAssemblyInput
  -> normalize input
  -> plan task/mode
  -> collect section candidates from registered providers
  -> order sections by deterministic priority
  -> fit budget and record exclusions
  -> weave ModelChatMessage[]
  -> project tools
  -> produce provider-neutral ModelRequest plan
  -> emit PromptAssemblyResult + redacted trace
```

默认 assembler 执行以下阶段：

```text
PromptAssemblyInput
  -> normalize input
  -> plan task/mode
  -> collect section candidates from registered providers
  -> order sections by deterministic priority
  -> fit budget and record exclusions
  -> weave ModelChatMessage[]
  -> project tools
  -> produce provider-neutral ModelRequest plan
  -> emit PromptAssemblyResult + redacted trace
```

Each stage takes immutable input and returns a new value. Stages must be individually testable and must not mutate runtime message history.

每个阶段接收 immutable input 并返回新值。各阶段必须可独立测试，且不得修改 runtime message history。

### 4. Make section providers pluggable

The package will expose a `PromptSectionProvider` interface. Built-in providers will cover:
- identity/operating rules
- project instructions
- task intent and output contract
- context projection evidence
- PageIndex recall evidence
- semantic recall placeholder evidence for future ZVec integration
- file/reference evidence
- code intelligence evidence
- tool result evidence
- skill-provided context
- tool policy and available tool summary

该 package 暴露 `PromptSectionProvider` 接口。内置 providers 覆盖：
- identity/operating rules
- project instructions
- task intent and output contract
- context projection evidence
- PageIndex recall evidence
- future ZVec integration 的 semantic recall placeholder evidence
- file/reference evidence
- code intelligence evidence
- tool result evidence
- skill-provided context
- tool policy 与 available tool summary

Providers register by stable id and declare section kinds, priority, budget class, trust level, and compatibility. Unknown providers can be excluded safely with diagnostics. This is the main extensibility point.

Providers 通过 stable id 注册，并声明 section kinds、priority、budget class、trust level 与 compatibility。未知 provider 可以被安全排除并记录 diagnostics。这是主要扩展点。

### 5. Keep context retrieval outside prompt assembly

Prompt assembly consumes `ContextProjectionResult`, memory/PageIndex evidence, reference context, and tool evidence supplied by runtime dependencies. It does not perform filesystem scanning or embedding search by itself. For ZVec later, the retrieval provider belongs in context/index infrastructure; prompt assembly only receives typed semantic evidence and labels it as semantic, possibly stale, and lower authority than exact references.

Prompt assembly 消费 runtime dependencies 提供的 `ContextProjectionResult`、memory/PageIndex evidence、reference context 与 tool evidence。它不自行执行 filesystem scanning 或 embedding search。未来 ZVec 的 retrieval provider 属于 context/index infrastructure；prompt assembly 只接收 typed semantic evidence，并标记为 semantic、可能 stale，权威性低于 exact references。

### 6. Separate tool projection from tool execution

The assembler will produce a `PromptToolPlan` that records visible tool schemas, hidden/excluded tools, tool policy, and reasons. Runtime remains responsible for actual policy enforcement and execution governance. The tool plan is advisory for model visibility, not a security boundary.

Assembler 生成 `PromptToolPlan`，记录 visible tool schemas、hidden/excluded tools、tool policy 与 reasons。Runtime 仍负责实际 policy enforcement 与 execution governance。Tool plan 只决定模型可见性，不是安全边界。

### 7. Provider adaptation remains downstream

The assembler outputs provider-neutral `ModelChatMessage[]`, `promptText`, `tools`, `toolChoice`, and metadata. `@deepseek/model-gateway` remains responsible for serializing those fields into provider-specific request bodies. Provider-specific constraints can be represented as options in `PromptAssemblyInput`, but they must not leak provider SDK types into contracts.

Assembler 输出 provider-neutral 的 `ModelChatMessage[]`、`promptText`、`tools`、`toolChoice` 与 metadata。`@deepseek/model-gateway` 仍负责把这些字段序列化为 provider-specific request bodies。Provider-specific constraints 可以用 `PromptAssemblyInput` 中的 options 表示，但不得把 provider SDK types 泄漏到 contracts。

### 8. Assembly evidence is first-class

Runtime will emit a `prompt.assembled` event before `model.requested`. The event will include:
- assembly fingerprint
- section ids/kinds/source/fingerprints
- included/excluded counts and reasons
- redacted previews
- budget report
- tool plan summary
- provider target metadata
- compatibility/schema version

Runtime 会在 `model.requested` 之前发出 `prompt.assembled` event。该 event 包含：
- assembly fingerprint
- section ids/kinds/source/fingerprints
- included/excluded counts 与 reasons
- redacted previews
- budget report
- tool plan summary
- provider target metadata
- compatibility/schema version

This event lets evaluation correlate task failures with prompt assembly decisions without logging raw secrets or full unbounded prompts.

该 event 让 evaluation 能把 task failure 与 prompt assembly decisions 关联起来，同时不记录 raw secrets 或完整无限 prompt。

### 9. Budgeting is priority based and explainable

The default budgeter will apply deterministic tiers:
1. hard system identity and safety
2. exact user prompt
3. explicit task output contract
4. current workspace/reference evidence
5. exact PageIndex/session recall
6. tool result evidence needed for loop continuity
7. code intelligence diagnostics/references
8. semantic ZVec recall
9. low-priority examples or style hints

默认 budgeter 采用确定性优先级：
1. hard system identity and safety
2. exact user prompt
3. explicit task output contract
4. current workspace/reference evidence
5. exact PageIndex/session recall
6. tool result evidence needed for loop continuity
7. code intelligence diagnostics/references
8. semantic ZVec recall
9. low-priority examples or style hints

Every dropped section must record a reason such as `budget-exceeded`, `policy-excluded`, `stale-suppressed`, `provider-incompatible`, or `duplicate-fingerprint`.

每个被裁掉的 section 都必须记录原因，例如 `budget-exceeded`、`policy-excluded`、`stale-suppressed`、`provider-incompatible` 或 `duplicate-fingerprint`。

## Risks / Trade-offs

- **More abstraction before all features exist** -> Keep the first implementation narrow and compatible: reproduce current message behavior through the assembler, then add richer sections.
- **在功能完全成型前增加抽象** -> 第一版实现保持收窄并兼容：先通过 assembler 复现当前 message 行为，再加入更丰富 sections。

- **Package boundary may slow iteration** -> Expose a registry and default builder so new sections can be added inside the package without touching runtime, while tests guard dependency direction.
- **Package 边界可能降低迭代速度** -> 暴露 registry 与 default builder，让新 sections 可以在 package 内添加而不改 runtime，同时用 tests 守住依赖方向。

- **Prompt traces can leak sensitive content** -> Store section metadata, fingerprints, token estimates, and bounded redacted previews only; raw section content stays in model request memory and is not persisted by default.
- **Prompt traces 可能泄漏敏感内容** -> 只存 section metadata、fingerprints、token estimates 与有界脱敏 preview；raw section content 默认只存在于 model request memory，不持久化。

- **Context-engine and prompt-assembly responsibilities can blur** -> Context-engine owns retrieval/projection; prompt assembly owns ordering/weaving/request planning from normalized evidence. Add boundary tests and docs.
- **context-engine 与 prompt-assembly 责任可能模糊** -> Context-engine 负责 retrieval/projection；prompt assembly 负责从 normalized evidence 做 ordering/weaving/request planning。增加边界测试与文档。

- **Provider quirks may pressure assembler to become provider-specific** -> Keep provider constraints declarative and push serialization to model-gateway. Only provider-neutral fields enter contracts.
- **provider quirks 可能迫使 assembler provider-specific 化** -> 保持 provider constraints declarative，把序列化放到 model-gateway。Contracts 只进入 provider-neutral 字段。

## Migration Plan

1. Add contracts and the empty package skeleton with boundary lint coverage.
2. Implement default assembler that reproduces current behavior: user prompt, optional projected context system message, visible tools, metadata, and prompt text.
3. Wire agent loop to call the assembler and emit `prompt.assembled` before `model.requested`.
4. Add section registry and budget reports while preserving existing tests/golden order.
5. Extend CLI evaluation records to read assembly evidence and summarize prompt readiness.
6. Add richer section providers for task output contracts, PageIndex recall labeling, and future ZVec placeholders.

1. 新增 contracts 与空 package skeleton，并覆盖 boundary lint。
2. 实现默认 assembler，复现当前行为：user prompt、可选 projected context system message、visible tools、metadata 与 prompt text。
3. 将 agent loop 接入 assembler，并在 `model.requested` 前发出 `prompt.assembled`。
4. 增加 section registry 与 budget reports，同时保持现有 tests/golden 顺序。
5. 扩展 CLI evaluation records，读取 assembly evidence 并总结 prompt readiness。
6. 增加更丰富的 section providers，包括 task output contracts、PageIndex recall labeling 与未来 ZVec placeholders。

Rollback is straightforward while the runtime call remains behind a small integration function: agent loop can temporarily fall back to the previous inline assembly if the assembler fails closed during early migration. After golden replay is updated and stable, the fallback should be removed.

迁移早期只要 runtime 调用通过一个小集成函数，回滚很直接：如果 assembler fail closed，agent loop 可临时回退到之前的 inline assembly。golden replay 更新并稳定后，应移除 fallback。

## Open Questions

- Should prompt assembly expose a public plugin registration API immediately, or keep external registration internal until the package stabilizes?
- Should token estimation use model gateway token counters when available, or start with deterministic whitespace estimates and provider hints?
- Should `prompt.assembled` include a redacted prompt preview by default, or require an explicit diagnostics mode?

- prompt assembly 是否应立即暴露 public plugin registration API，还是在 package 稳定前只保留内部注册？
- token estimation 是否应在可用时使用 model gateway token counters，还是先用 deterministic whitespace estimates 与 provider hints？
- `prompt.assembled` 是否默认包含 redacted prompt preview，还是要求显式 diagnostics mode？
