## Why

DeepSeek must be integrated as an AI provider behind the platform model gateway, not as provider-shaped logic leaking into runtime, tools, CLI, or VSCode. DeepSeek's API is compatible with OpenAI and Anthropic entry points while also exposing provider-specific reasoning, strict tool call, prefix/FIM, and cache usage metadata, so the first adapter layer needs a stable normalization boundary now.

DeepSeek 必须作为 platform model gateway 背后的 AI provider 接入，而不是让 provider-specific 逻辑泄漏到 runtime、tools、CLI 或 VSCode。DeepSeek API 同时提供 OpenAI/Anthropic compatible entry points，并带有 reasoning、strict tool call、prefix/FIM 和 cache usage 等 provider-specific 元数据，因此第一版 adapter layer 需要现在就定义稳定的 normalization boundary。

## What Changes

- Add a DeepSeek AI provider adapter under `@deepseek/model-gateway` that converts platform-neutral `ModelRequest` into DeepSeek chat-completions requests.
- 在 `@deepseek/model-gateway` 下增加 DeepSeek AI provider adapter，将 platform-neutral `ModelRequest` 转换为 DeepSeek chat-completions request。
- Extend model contracts to describe provider adapter configuration, transport injection, normalized reasoning events, normalized cache/usage metadata, finish reasons, and provider errors.
- 扩展 model contracts，描述 provider adapter configuration、transport injection、normalized reasoning events、normalized cache/usage metadata、finish reasons 和 provider errors。
- Keep tool calls as model intent only; provider adapters MUST NOT execute tools, capabilities, MCP tools, plugins, skills, commands, hooks, or scheduler work directly.
- 工具调用只作为 model intent；provider adapters 不得直接执行 tools、capabilities、MCP tools、plugins、skills、commands、hooks 或 scheduler work。
- Add deterministic fixtures and tests for DeepSeek text streaming, reasoning streaming, tool-call normalization, usage/cache normalization, provider errors, credential-missing behavior, and default no-network behavior.
- 增加 deterministic fixtures/tests，覆盖 DeepSeek text streaming、reasoning streaming、tool-call normalization、usage/cache normalization、provider errors、credential-missing behavior 和 default no-network behavior。
- Add AST lint enforcement so provider packages cannot read raw environment variables for credentials or call governed execution primitives.
- 增加 AST lint enforcement，禁止 provider packages 为凭据读取 raw environment variables，禁止调用 governed execution primitives。
- Add a tool-call preflight boundary for validating and repairing normalized AI tool intent before execution envelopes are created.
- 增加 tool-call preflight boundary，在创建 execution envelopes 前校验并修复 normalized AI tool intent。
- Add provider-specific preflight profiles so DeepSeek, Claude, Codex/OpenAI, and future providers can contribute deterministic repairs without weakening the common safety core.
- 增加 provider-specific preflight profiles，使 DeepSeek、Claude、Codex/OpenAI 和未来 providers 可以贡献确定性修复，但不能削弱 common safety core。

## Capabilities

### New Capabilities

<!-- No new top-level capability area is required. This change extends the existing provider-neutral model gateway. -->

### Modified Capabilities

- `model-gateway`: Add DeepSeek provider adapter contracts, normalized provider events, credential/transport boundaries, and provider execution constraints.
- `credential-auth-management`: Model providers must consume scoped credential values through injected credential resolution rather than direct environment or filesystem reads.
- `usage-budget-management`: Model provider usage events must carry normalized input/output/reasoning/cache token metadata.
- `memory-cache-management`: Model provider cache metadata must be normalized separately from durable memory and exposed without provider-shaped leakage.
- `testing-regression`: Deterministic provider fixtures and contract/golden coverage must be available without live provider network calls.
- `capability-execution-governance`: Add preflight validation/repair for normalized model tool-call intent before governed execution.
- `platform-abstraction`: Add deterministic path/platform normalization helpers for model-produced tool inputs.

## Impact

- Affects `src/packages/platform-contracts/src/model.ts`, `src/packages/model-gateway`, testing fakes, contract tests, integration/golden tests, lint rules, and OpenSpec specs.
- 影响 `src/packages/platform-contracts/src/model.ts`、`src/packages/model-gateway`、testing fakes、contract tests、integration/golden tests、lint rules 和 OpenSpec specs。
- No production network dependency is introduced for default tests; live DeepSeek calls remain opt-in through explicit injected transport and credentials.
- 默认测试不引入生产网络依赖；live DeepSeek calls 只能通过明确注入 transport 和 credentials 选择性开启。
- Runtime/tool execution architecture remains unchanged: provider adapters emit normalized events only, and the runtime kernel remains the execution owner.
- runtime/tool execution 架构保持不变：provider adapters 只发出 normalized events，runtime kernel 仍是 execution owner。
- Tool-call execution becomes stricter: provider output is treated as untrusted intent until preflight validates path, platform, schema, and repairability.
- tool-call execution 更严格：provider output 在 preflight 校验 path、platform、schema 和 repairability 前都视为 untrusted intent。
