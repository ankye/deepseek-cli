## Context

DeepSeek CLI has a contract-first platform foundation: platform contracts, runtime kernel, message bus, model gateway, tool governance, command system, skills, hooks, MCP gateway, and testing harnesses. The missing piece is the first product-grade loop that users can run from npm and that future hosts can reuse without creating separate state machines.

DeepSeek CLI 已经具备 contract-first 平台基础：platform contracts、runtime kernel、message bus、model gateway、tool governance、command system、skills、hooks、MCP gateway 和测试框架。当前缺失的是第一个产品级 loop，让用户可以通过 npm 运行，也让未来 hosts 在不创建独立状态机的前提下复用。

The loop must be designed as a product surface over the kernel, not as CLI-owned glue code. Claude Code and Codex both expose a usable agent experience early; DeepSeek should do the same while preserving stricter architecture boundaries for scheduling, policy, replay, and future host adapters.

这个 loop 必须是 runtime kernel 之上的产品界面，而不是 CLI 自己拼接的 glue code。Claude Code 与 Codex 都很早提供可用 agent experience；DeepSeek 也应如此，但要保留更严格的 scheduling、policy、replay 和未来 host adapter 边界。

## Goals / Non-Goals

**Goals:**

- Provide `deepseek chat` and `deepseek run` as the first user-facing agent commands.
- Route every executable step through the runtime kernel, execution envelope, capability governance, scheduler, policy, and event bus.
- Support one canonical model-tool loop: model request, stream response, normalize tool-call intent, validate/repair, execute tool, feed tool result back, finish turn.
- Provide deterministic tests and golden traces without network credentials.
- Provide opt-in live DeepSeek smoke tests using existing credential and model profile contracts.
- Keep CLI, future VSCode, and future server hosts consuming the same runtime events.

- 提供 `deepseek chat` 与 `deepseek run` 作为首批用户可见 agent commands。
- 每个可执行步骤都必须经过 runtime kernel、execution envelope、capability governance、scheduler、policy 和 event bus。
- 支持唯一 canonical model-tool loop：model request、stream response、normalize tool-call intent、validate/repair、execute tool、tool result 回灌、完成 turn。
- 在无网络凭证下提供 deterministic tests 与 golden traces。
- 使用现有 credential 与 model profile contracts 提供 opt-in live DeepSeek smoke tests。
- 让 CLI、未来 VSCode、未来 server hosts 消费同一套 runtime events。

**Non-Goals:**

- Do not build a rich TUI, voice mode, auto-update UI, or team collaboration UI in this change.
- Do not implement full autonomous multi-agent planning; subagent scheduling remains governed by existing agent-management and orchestration specs.
- Do not bypass existing platform abstraction for shell, file, path, git, search, or process behavior.
- Do not make live DeepSeek tests part of the default offline test suite.

- 本变更不构建复杂 TUI、voice mode、auto-update UI 或团队协作 UI。
- 本变更不实现完整 autonomous multi-agent planning；subagent scheduling 继续受现有 agent-management 与 orchestration specs 约束。
- 不绕过现有 platform abstraction 来处理 shell、file、path、git、search 或 process behavior。
- 不把 live DeepSeek tests 纳入默认离线测试套件。

## Decisions

### Decision 1: Runtime owns the agent loop

The loop belongs in `src/packages/runtime`, with CLI only adapting argv/stdin/stdout to runtime input and presentation options. This keeps VSCode and server adapters from implementing separate loop logic.

agent loop 归 `src/packages/runtime` 所有，CLI 只负责把 argv/stdin/stdout 适配为 runtime input 和 presentation options。这样 VSCode 与 server adapters 不会各自实现独立 loop logic。

Alternatives considered:

- CLI-owned loop: faster to ship but creates duplicate host state machines and violates the host-neutral runtime boundary.
- Model-gateway-owned loop: incorrectly gives provider adapters tool execution authority.

备选方案：

- CLI-owned loop：更快交付，但会产生重复 host state machines，并破坏 host-neutral runtime boundary。
- Model-gateway-owned loop：错误地把 tool execution 权限交给 provider adapters。

### Decision 2: Tool calls are intents until preflight succeeds

The model gateway normalizes provider tool calls into provider-neutral intents. Runtime then applies provider-specific repair, schema validation, path/platform normalization, policy preflight, and capability lookup before scheduling execution.

model gateway 只把 provider tool calls 归一化为 provider-neutral intents。runtime 随后执行 provider-specific repair、schema validation、path/platform normalization、policy preflight 和 capability lookup，成功后才进入 scheduling。

Alternatives considered:

- Execute model tool calls immediately: simpler but unsafe because model outputs can contain malformed JSON, unsafe paths, unavailable platform commands, or disabled capabilities.
- Reject every malformed call without repair: safer but poor product quality for provider quirks that are deterministic and repairable.

备选方案：

- 立即执行 model tool calls：更简单但不安全，因为模型输出可能包含 malformed JSON、unsafe paths、不可用 platform commands 或 disabled capabilities。
- 所有 malformed call 直接拒绝：更安全但产品质量差，无法处理 deterministic 且可修复的 provider quirks。

### Decision 3: Event stream is the host contract

The canonical runtime event stream is the product integration point. CLI renders it as text, JSON, or JSONL; VSCode and server hosts later consume the same event types for UI state.

canonical runtime event stream 是产品集成点。CLI 把它渲染为 text、JSON 或 JSONL；未来 VSCode 与 server hosts 消费相同 event types 构建 UI state。

Alternatives considered:

- Return final strings only: easy for `run` but loses trace, tool state, cancellation, and replay.
- Host-specific events: creates drift across CLI, VSCode, and server surfaces.

备选方案：

- 只返回最终字符串：对 `run` 简单，但会丢失 trace、tool state、cancellation 和 replay。
- host-specific events：会导致 CLI、VSCode 和 server surfaces 分叉。

### Decision 4: Offline tests are authoritative, live tests are gated

Default verification uses deterministic model streams, fake platform runtimes, golden traces, and CLI e2e fixtures. Live DeepSeek checks are opt-in and assert structure, not exact generated text.

默认验证使用 deterministic model streams、fake platform runtimes、golden traces 和 CLI e2e fixtures。Live DeepSeek checks 为 opt-in，只断言结构，不断言精确生成文本。

Alternatives considered:

- Require live tests by default: fragile, slow, costly, and unsuitable for CI without credentials.
- Skip live tests entirely: misses provider integration regressions.

备选方案：

- 默认要求 live tests：脆弱、慢、有成本，且不适合无凭证 CI。
- 完全跳过 live tests：会漏掉 provider integration regressions。

### Decision 5: First loop is single-session, multi-turn capable

`deepseek run` executes one task to terminal completion. `deepseek chat` keeps one session open and submits multiple turns, but it does not introduce advanced TUI or multi-agent orchestration in this change.

`deepseek run` 执行一个任务直到终态。`deepseek chat` 保持一个 session 并提交多个 turns，但本变更不引入高级 TUI 或 multi-agent orchestration。

Alternatives considered:

- One-shot only: easier but does not validate session continuation.
- Full TUI first: distracts from the kernel loop and increases product surface before the execution semantics are proven.

备选方案：

- 只做 one-shot：更容易，但无法验证 session continuation。
- 先做完整 TUI：会分散 kernel loop 焦点，并在执行语义验证前扩大产品面。

## Risks / Trade-offs

- [Risk] Tool-call repair can hide model/provider defects. → Mitigation: every repair must emit structured repair evidence and tests must cover repaired and rejected cases.
- [Risk] Streaming event contracts may change as the product matures. → Mitigation: version events and keep host presentation separate from core event data.
- [Risk] CLI output can become noisy. → Mitigation: support quiet, text, JSON, and JSONL modes with bounded previews and trace ids.
- [Risk] Live provider behavior is nondeterministic. → Mitigation: live tests assert structural events, terminal status, redaction, and reachability only.
- [Risk] First loop may tempt direct host shortcuts. → Mitigation: architecture lint and e2e tests must reject CLI direct model/tool execution.

- [风险] tool-call repair 可能掩盖 model/provider defects。→ 缓解：每次 repair 都必须发出 structured repair evidence，测试覆盖 repaired 与 rejected cases。
- [风险] streaming event contracts 会随产品成熟变化。→ 缓解：events 版本化，并保持 host presentation 与核心 event data 分离。
- [风险] CLI 输出可能变得嘈杂。→ 缓解：支持 quiet、text、JSON 和 JSONL modes，使用 bounded previews 与 trace ids。
- [风险] live provider behavior 不确定。→ 缓解：live tests 只断言 structural events、terminal status、redaction 和 reachability。
- [风险] first loop 容易诱导 direct host shortcuts。→ 缓解：architecture lint 与 e2e tests 必须拒绝 CLI 直接 model/tool execution。

## Migration Plan

This project is pre-release, so this change performs a product-surface reset instead of preserving compatibility. Legacy prompt flags, legacy interactive entry names, and old stream naming are removed from the public CLI contract.

本项目仍处于 pre-release，因此本变更执行产品界面重置，而不是保留兼容。旧 prompt flags、旧 interactive entry names 与旧 stream naming 都从 public CLI contract 中移除。

1. Add agent-loop contracts and tests as the new public runtime surface.
2. Implement runtime loop behind deterministic tests.
3. Replace old CLI entry points with `deepseek run` and `deepseek chat` thin adapters.
4. Add `text`, `json`, and `jsonl` output contracts and golden replay fixtures.
5. Add opt-in live DeepSeek agent-loop smoke test target.
6. Update README and docs with the first usable workflow.

1. 增加 agent-loop contracts 与 tests，作为新的 public runtime surface。
2. 在 deterministic tests 后实现 runtime loop。
3. 用 `deepseek run` 与 `deepseek chat` thin adapters 替换旧 CLI 入口。
4. 添加 `text`、`json`、`jsonl` output contracts 与 golden replay fixtures。
5. 添加 opt-in live DeepSeek agent-loop smoke test target。
6. 更新 README 与 docs，说明第一个可用 workflow。

Rollback strategy: because this is pre-1.0, rollback means disabling the new CLI commands or feature flagging the loop while retaining tests and contracts for diagnosis. It does not restore old public compatibility.

回滚策略：由于项目仍处于 pre-1.0，回滚方式是禁用新 CLI commands 或通过 feature flag 关闭 loop，同时保留 tests 与 contracts 用于诊断；不恢复旧 public compatibility。

## Open Questions

- Should `deepseek chat` later add rich TUI controls after the minimal stdin loop proves runtime semantics?
- Should the first loop expose tool approval prompts immediately, or only policy-driven automatic allow/deny with structured events?
- Should JSONL be the primary machine-readable format, with JSON reserved for final summaries?

- `deepseek chat` 是否应在最小 stdin loop 证明 runtime semantics 后，再加入 rich TUI controls？
- 第一版 loop 是否立即暴露 tool approval prompts，还是先只提供 policy-driven automatic allow/deny 与 structured events？
- JSONL 是否应作为主要 machine-readable format，而 JSON 仅用于 final summaries？
