## 1. Contracts And Provider Normalization / 契约与 Provider 归一化

- [ ] 1.1 Define provider-neutral live tool intent, partial intent diagnostic, tool-call finish, tool result feedback, continuation policy, and terminal failure DTOs with schema versions and redaction metadata.
- [ ] 1.2 Extend DeepSeek/OpenAI SDK stream normalization to assemble partial tool-call chunks, parse arguments deterministically, and emit malformed-intent diagnostics without executing tools.
- [ ] 1.3 Add provider-compatible tool schema and optional tool choice formatting for gated live smoke requests while keeping runtime as execution owner.
- [x] 1.4 Add bounded tool result feedback formatting for successful, repaired, rejected, denied, timed-out, cancelled, and failed tool outcomes.
- [x] 1.5 Add provider boundary lint or tests that reject model-gateway imports/calls into kernel, scheduler, policy, sandbox, command, skill, hook, MCP, plugin, or session mutation packages.

## 2. Runtime Live Tool Loop / Runtime Live 工具循环

- [x] 2.1 Extend runtime agent-loop iteration to handle live tool-call finish signals, execute accepted intents, append feedback messages, and continue model requests.
- [x] 2.2 Enforce max model iterations, max tool calls, turn timeout, tool timeout, output byte limits, retry limits, and continuation budget before every provider or tool dispatch.
- [x] 2.3 Implement continuation policy for successful feedback, correctable rejection feedback, terminal safety rejection, provider failure, timeout, cancellation, and repeated unsafe calls.
- [x] 2.4 Preserve canonical event order for model request, tool intent, repair, envelope, policy, sandbox, scheduler, result feedback, continuation request, model output, and terminal completion.
- [x] 2.5 Ensure cancellation and timeout abort queued/running tool work and prevent further provider continuation requests.

## 3. Tool Intent Preflight And Core Tool Projection / 工具意图预检与核心工具投影

- [x] 3.1 Add DeepSeek-specific repair rules for argument unwrapping, JSON-string arguments, known tool aliases, path separator normalization, and provider metadata preservation.
- [x] 3.2 Keep platform-common safety validation for schema-invalid input, unknown tools, hidden tools, traversal paths, home paths, absolute paths, drive-relative paths, null bytes, and unsupported platform commands.
- [x] 3.3 Project a safe first live tool set, defaulting to read-only workspace tools unless an explicit policy profile enables write/process/network tools.
- [x] 3.4 Return model-facing tool previews that are redacted, byte-bounded, trace-linked, and separate from richer replay/audit evidence.
- [x] 3.5 Add matrix coverage for Windows, macOS, Linux, WSL, CI, and remote-like path repair and rejection behavior.

## 4. CLI Product Surface / CLI 产品界面

- [x] 4.1 Add or document a deterministic tool-loop smoke entry that runs without network credentials and emits canonical JSONL/text output.
- [x] 4.2 Add live tool-loop smoke gating with `DEEPSEEK_LIVE_AGENT_TOOL_TESTS=1`, credential checks, model profile resolution, timeout controls, and typed skipped/missing-credential diagnostics.
- [x] 4.3 Ensure `deepseek run` and `deepseek chat` can surface live tool events in text, JSON, and JSONL without owning execution state.
- [x] 4.4 Keep old direct prompt flags and legacy compatibility aliases absent from help, parsing, tests, and docs.
- [x] 4.5 Update README and docs with live tool execution flow, safety boundaries, command examples, live test setup, and troubleshooting.

## 5. Tests, Replay, And Acceptance / 测试、回放与验收

- [ ] 5.1 Add unit tests for DeepSeek tool-call chunks, partial arguments, malformed JSON, tool choice formatting, feedback formatting, and provider redaction.
- [x] 5.2 Add runtime tests for one-tool success, multi-tool success, repair success, repair rejection, policy denial, timeout, cancellation, provider failure, loop-limit stop, and repeated unsafe calls.
- [x] 5.3 Add integration tests proving model -> tool intent -> preflight -> kernel execution -> tool feedback -> model continuation -> terminal result.
- [ ] 5.4 Add golden replay fixtures for live tool event ordering, schema versions, trace correlation, redaction metadata, and terminal statuses.
- [x] 5.5 Add e2e tests for CLI deterministic tool-loop smoke in text and JSONL modes without live provider access.
- [x] 5.6 Add live-gated DeepSeek tool-loop smoke that asserts structure, reachability, redaction, event order, and terminal status without snapshotting exact generated prose.
- [x] 5.7 Regenerate acceptance evidence for contracts, integration, golden, matrix, e2e, smoke, live-gated status, lint, typecheck, boundary checks, and OpenSpec validation.

## 6. Verification / 验证

- [x] 6.1 Run `npm run typecheck`.
- [x] 6.2 Run `npm run lint`.
- [x] 6.3 Run `npm test`.
- [x] 6.4 Run `node scripts/check-boundaries.mjs`.
- [x] 6.5 Run `npm run test:contracts`, `npm run test:integration`, `npm run test:golden`, `npm run test:matrix`, and `npm run test:e2e`.
- [x] 6.6 Run `npm run build:cli` and local CLI smoke checks for deterministic tool-loop commands.
- [ ] 6.7 Run gated live checks manually when credentials are available: `DEEPSEEK_LIVE_AGENT_TOOL_TESTS=1 npm run smoke:live:agent-tools`.
- [x] 6.8 Validate OpenSpec with `openspec validate enable-live-agent-tool-execution --strict` and `openspec validate --specs --strict`.
