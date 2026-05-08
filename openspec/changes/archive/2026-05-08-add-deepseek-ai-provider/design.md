## Context

`model-gateway` currently exposes a deterministic mock adapter and a live-provider skeleton. That was enough for framework bootstrap, but it does not yet encode the provider boundary that DeepSeek needs: credentials must be injected through platform services, transport must be injectable for tests, provider responses must normalize into stable platform events, and DeepSeek-specific fields must not leak upward as ad hoc JSON.

`model-gateway` 当前只有 deterministic mock adapter 和 live-provider skeleton，足够支撑 framework bootstrap，但还没有编码 DeepSeek 需要的 provider boundary：credentials 必须通过 platform services 注入，transport 必须可注入以便测试，provider responses 必须归一化为稳定 platform events，DeepSeek-specific fields 不能以临时 JSON 方式泄漏到上层。

DeepSeek's public API is intentionally compatible with OpenAI-style chat completions and also offers Anthropic-compatible access. The platform should treat those as wire protocols behind provider adapters, not as runtime architecture. Our runtime kernel remains the execution owner; provider adapters only generate model events and tool-call intent.

DeepSeek public API 兼容 OpenAI-style chat completions，也提供 Anthropic-compatible access。平台应把这些视为 provider adapters 背后的 wire protocols，而不是 runtime architecture。我们的 runtime kernel 仍是 execution owner；provider adapters 只生成 model events 和 tool-call intent。

## Goals / Non-Goals

**Goals:**

- Add a first-class DeepSeek provider adapter behind `ModelGateway`.
- 在 `ModelGateway` 背后增加 first-class DeepSeek provider adapter。
- Normalize DeepSeek text, reasoning, tool-call, usage, cache, finish, and error signals into provider-neutral events.
- 将 DeepSeek text、reasoning、tool-call、usage、cache、finish 和 error signals 归一化为 provider-neutral events。
- Keep credentials and transport injectable so tests are deterministic and default CI never calls the live provider.
- 保持 credentials 和 transport 可注入，使测试确定性，默认 CI 永不调用 live provider。
- Add lint and tests that fail if provider code executes tools/capabilities or reads raw host credentials directly.
- 增加 lint/tests，若 provider code 执行 tools/capabilities 或直接读取 raw host credentials 则失败。

**Non-Goals:**

- No live network test in default CI.
- 默认 CI 不增加 live network test。
- No direct Anthropic-compatible DeepSeek adapter in this change; the contracts leave room for it, but first implementation targets OpenAI-compatible chat completions.
- 本变更不直接实现 Anthropic-compatible DeepSeek adapter；contracts 保留空间，但第一版实现 OpenAI-compatible chat completions。
- No provider-side tool execution, MCP invocation, plugin execution, sandbox execution, or scheduler integration.
- 不做 provider-side tool execution、MCP invocation、plugin execution、sandbox execution 或 scheduler integration。
- No pricing table or production token-cost accounting beyond normalized usage metadata.
- 除 normalized usage metadata 外，不做 pricing table 或 production token-cost accounting。

## Decisions

### Decision: Provider adapter owns wire format only

`DeepSeekOpenAIProvider` will convert `ModelRequest` into a DeepSeek chat-completions payload and convert transport chunks/responses back into `ModelStreamEvent`. It will not depend on runtime, capability registry, scheduler, policy, sandbox, CLI, VSCode, or host APIs.

`DeepSeekOpenAIProvider` 只负责把 `ModelRequest` 转成 DeepSeek chat-completions payload，并把 transport chunks/responses 转回 `ModelStreamEvent`。它不依赖 runtime、capability registry、scheduler、policy、sandbox、CLI、VSCode 或 host APIs。

Alternative considered: put DeepSeek request handling directly in runtime. Rejected because it would couple runtime state with provider API evolution and break provider-neutral orchestration.

### Decision: Injectable transport and credential resolver

The provider receives a `ModelProviderTransport` and optional `ModelCredentialProvider`. The default adapter can be constructed without a transport, but streaming then emits a typed `PROVIDER_TRANSPORT_NOT_CONFIGURED` error. Missing credentials emit `PROVIDER_CREDENTIAL_MISSING`. No provider code reads `process.env`, filesystem secrets, or host keychains directly.

provider 接收 `ModelProviderTransport` 和可选 `ModelCredentialProvider`。默认 adapter 可在没有 transport 时构造，但 streaming 会发出 typed `PROVIDER_TRANSPORT_NOT_CONFIGURED` error。缺少 credentials 时发出 `PROVIDER_CREDENTIAL_MISSING`。provider code 不直接读取 `process.env`、filesystem secrets 或 host keychains。

Alternative considered: convenience environment lookup inside adapter. Rejected because platform credential governance requires scoped credential references and redaction.

### Decision: Canonical provider events include reasoning and cache metadata

`ModelStreamEvent` will add provider-neutral event kinds for `reasoning`, `finish`, and richer `usage` metadata. Existing `delta`, `tool-call`, `usage`, `error`, and `done` remain valid. DeepSeek `reasoning_content`, tool calls, cache hit/miss tokens, and finish reasons are normalized into those events.

`ModelStreamEvent` 增加 provider-neutral 的 `reasoning`、`finish` 和更丰富的 `usage` metadata。现有 `delta`、`tool-call`、`usage`、`error`、`done` 保持有效。DeepSeek `reasoning_content`、tool calls、cache hit/miss tokens 和 finish reasons 被归一化到这些事件。

Alternative considered: expose raw DeepSeek chunks in `metadata`. Rejected because hosts would recreate provider-specific state machines.

### Decision: Tool calls are intent, not execution

When DeepSeek emits tool calls, the provider returns normalized `tool-call` events with stable id/name/input metadata. The runtime kernel or future orchestration layer decides whether and how to execute that intent through governed execution.

当 DeepSeek 产生 tool calls 时，provider 返回 normalized `tool-call` events，包含稳定 id/name/input metadata。是否以及如何执行该 intent，由 runtime kernel 或未来 orchestration layer 通过 governed execution 决定。

Alternative considered: execute tools inside provider to mimic some SDK helpers. Rejected because it bypasses policy, sandbox, scheduler, audit, and replay.

### Decision: Deterministic fixtures are the first acceptance layer

Provider behavior will be covered by package-local unit tests plus contract/golden tests using fake transport frames. Live provider tests can be added later behind explicit environment/config gates, but they are not required for this change.

provider behavior 通过 package-local unit tests 和使用 fake transport frames 的 contract/golden tests 覆盖。live provider tests 以后可通过明确 env/config gate 加入，但本变更不要求。

## Risks / Trade-offs

- [Risk] DeepSeek response shapes may evolve. -> Mitigation: all parsing is defensive and unsupported shapes emit typed provider errors rather than throwing raw exceptions.
- [风险] DeepSeek response shapes 可能演进。-> 缓解：解析保持 defensive，不支持的 shape 发出 typed provider errors，而不是抛出 raw exceptions。
- [Risk] Streaming and non-streaming chunks can differ. -> Mitigation: adapter normalizes both complete responses and incremental chunks through the same mapper functions.
- [风险] streaming 与 non-streaming chunks 可能不同。-> 缓解：adapter 用同一组 mapper functions 归一化 complete responses 和 incremental chunks。
- [Risk] Additional event kinds can affect existing consumers. -> Mitigation: event union is additive and current consumers already ignore unknown model-specific details; tests cover mock behavior unchanged.
- [风险] 新事件类型可能影响现有 consumers。-> 缓解：event union 是 additive，当前 consumers 不依赖 provider-specific details；测试覆盖 mock behavior unchanged。
- [Risk] Lint credential rule may flag legitimate platform code. -> Mitigation: allow credential owner/platform packages and tests, block provider and non-owner source by stable rule id.
- [风险] lint credential rule 可能误伤合法 platform code。-> 缓解：允许 credential owner/platform packages 和 tests，阻止 provider 与 non-owner source，使用稳定 rule id。

## Migration Plan

1. Extend `platform-contracts` model interfaces with provider configuration, transport, credential, reasoning, cache, finish, and richer usage metadata.
2. Implement DeepSeek OpenAI-compatible adapter and keep deterministic mock behavior stable.
3. Add package-local provider tests for payload formation, missing credentials/transport, response normalization, reasoning, tool calls, usage/cache, and errors.
4. Add contract/golden coverage for normalized provider event traces.
5. Extend AST lint with a direct credential access rule and provider execution bypass coverage.
6. Validate OpenSpec and default test suites.

## Open Questions

- Should the Anthropic-compatible DeepSeek endpoint be implemented as a second adapter immediately after this change, or wait until the platform has a native Anthropic adapter to share mapping code?
- DeepSeek Anthropic-compatible endpoint 应在本变更后立即作为第二 adapter 实现，还是等平台有 native Anthropic adapter 后共享 mapping code？
- Should token cache usage feed directly into `CacheManager`, or stay as usage metadata until model response caching is designed?
- token cache usage 应直接写入 `CacheManager`，还是在 model response caching 设计前先停留在 usage metadata？

### Decision: Tool-call preflight validates and repairs execution input

Provider normalization deliberately stops at stable tool-call intent. Before an intent can become a governed capability invocation, the runtime platform needs a `ToolIntentPreflight` boundary that validates capability existence, input schema shape, workspace path semantics, platform support, policy-relevant side effects, and repairability. Safe deterministic repairs, such as converting slash direction, resolving workspace-relative paths, removing redundant `./`, and mapping semantic commands to platform operations, can be applied before scheduling. Unsafe or ambiguous repairs must be rejected with typed diagnostics and replayable metadata.

Provider normalization 只负责输出稳定的 tool-call intent。intent 转成 governed capability invocation 前，runtime platform 需要一个 `ToolIntentPreflight` boundary，用来校验 capability existence、input schema shape、workspace path semantics、platform support、policy-relevant side effects 和 repairability。安全且确定性的修复，例如 slash direction 转换、workspace-relative path 解析、移除多余 `./`、把 semantic commands 映射到 platform operations，可以在 scheduling 前应用。不安全或有歧义的修复必须用 typed diagnostics 和 replayable metadata 拒绝。

Alternative considered: let each tool executor repair its own inputs. Rejected because every executor would implement different path/platform semantics and failures would happen after policy/scheduler decisions.

### Decision: Repair is explicit, bounded, and auditable

Repairs are not silent mutation. Every repair returns original input, repaired input, repair actions, confidence, and diagnostics. The kernel or orchestration layer can then emit `tool-intent.repaired` or `tool-intent.rejected` before creating an execution envelope.

repair 不是 silent mutation。每次修复都返回 original input、repaired input、repair actions、confidence 和 diagnostics。kernel 或 orchestration layer 可以在创建 execution envelope 前发出 `tool-intent.repaired` 或 `tool-intent.rejected`。

Alternative considered: automatically rewrite provider output in the model gateway. Rejected because provider adapters do not know workspace root, active platform, capability schema, or policy context.

### Decision: Provider profiles add repairs, common safety remains mandatory

Different AI providers produce different tool-call shapes. DeepSeek commonly uses OpenAI-style `function.arguments` JSON strings, Claude-style providers may preserve richer structured inputs, and Codex/OpenAI adapters may emit different function names or path field names. Preflight therefore supports provider-specific profiles for tool name aliases, argument unwrapping, provider path fields, and stricter provider diagnostics. These profiles run before the common safety core, but they cannot disable model-visible tool validation, workspace path boundary checks, platform checks, policy metadata, or replay recording.

不同 AI provider 会产生不同 tool-call shape。DeepSeek 常见 OpenAI-style `function.arguments` JSON string，Claude-style provider 可能保留更丰富的 structured inputs，Codex/OpenAI adapters 可能产生不同 function names 或 path field names。因此 preflight 支持 provider-specific profiles，用于 tool name aliases、argument unwrapping、provider path fields 和更严格 provider diagnostics。这些 profile 在 common safety core 前运行，但不能关闭 model-visible tool validation、workspace path boundary checks、platform checks、policy metadata 或 replay recording。

Alternative considered: put provider repair logic inside each provider adapter. Rejected because adapters do not own workspace/platform/policy context and would silently diverge from governed execution semantics.
