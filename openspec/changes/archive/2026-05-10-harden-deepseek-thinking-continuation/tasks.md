## 1. Contracts / 契约

- [x] 1.1 Add optional `reasoningContent: string` and optional `reasoningRedaction: RedactionMetadata` to `ModelChatMessage` in `src/packages/platform-contracts/src/model.ts`.
- [x] 1.2 Add `"model.reasoning.persisted"` to the `RuntimeEventKind` union in `src/packages/platform-contracts/src/runtime.ts`.

## 2. Provider Serialization / Provider 序列化

- [x] 2.1 In `providerMessagesFrom` (`src/packages/model-gateway/src/index.ts`), when a source `ModelChatMessage` has `reasoningContent`, include it as `reasoning_content: <text>` on the outgoing body alongside `role`, `content`, and `tool_calls`.
- [x] 2.2 Do not serialize `reasoning_content` when the source message has no `reasoningContent`; absence of the field must be indistinguishable from today's behavior.
- [x] 2.3 Preserve order: `role` first, then `content`, then `reasoning_content`, then `tool_calls`, for stable diff and snapshot consistency.

## 3. Runtime Accumulation / Runtime 累加

- [x] 3.1 In `src/packages/runtime/src/agent-loop.ts`, declare a `let iterationReasoning = ""` reset at the top of each `while (iterations < limits.maxModelIterations)` iteration.
- [x] 3.2 In the `reasoning` branch, append `modelEvent.text` to `iterationReasoning` before emitting the runtime event.
- [x] 3.3 In the `tool-call` branch, when pushing the `{ role: "assistant", content: "", toolCalls: [...] }` message, include `reasoningContent: iterationReasoning` if the buffer is non-empty, and include `reasoningRedaction: { class: "internal" }` alongside.
- [x] 3.4 When `reasoningContent` is attached, emit a single `model.reasoning.persisted` event with `{ iteration, byteLength, redaction }` and no raw text, right after the `model.tool.intent` event for that iteration.
- [x] 3.5 Reset the buffer after the message is pushed so the next iteration starts clean.

## 4. Tests / 测试

- [x] 4.1 Extend `src/packages/model-gateway/test/deepseek-partial-tool-calls.test.ts` or add a new `deepseek-reasoning-continuation.test.ts` with two cases: message with `reasoningContent` serializes to `reasoning_content`; message without it omits the field.
- [x] 4.2 Add a runtime case in `src/packages/runtime/test/runtime-tool-feedback.test.ts` (or a new file) where a `ReasoningThenToolModelGateway` fixture emits two reasoning chunks + a tool call + finish, and assert: the captured `messages` array (via a recording provider) shows the assistant record with `reasoningContent` equal to the concatenated reasoning text; the runtime event stream contains exactly one `model.reasoning.persisted` event with correct `iteration` and `byteLength`.
- [x] 4.3 Negative assertion in the gated live smoke: the serialized event stream must not contain `PROVIDER_TRANSPORT_FAILED` with a message matching `reasoning_content`.

## 5. Operator Surface / 运维面

- [x] 5.1 Update `docs/development/testing-and-acceptance.md` Live Agent Tool Execution section with a new paragraph explaining the thinking-mode continuation contract and the `model.reasoning.persisted` event.
- [x] 5.2 No new npm script: the existing `smoke:live:agent-tools` is sufficient to exercise this path.

## 6. Verification / 验证

- [x] 6.1 Run `npm run typecheck`.
- [x] 6.2 Run `npm run lint`.
- [x] 6.3 Run `npm test` and expect the deterministic suite to stay green (252 + new cases, 0 fail).
- [x] 6.4 Run `node scripts/check-boundaries.mjs`.
- [x] 6.5 Run `npm run smoke:live:e2e` to confirm no regression on the deterministic real-FS path.
- [x] 6.6 Run gated live check manually: `DEEPSEEK_LIVE_AGENT_TOOL_TESTS=1 npm run smoke:live:agent-tools`.
- [x] 6.7 Refresh `tests/acceptance/latest/` evidence and regenerate `acceptance-index.md`.
- [x] 6.8 Validate OpenSpec: `openspec validate harden-deepseek-thinking-continuation --strict` and `openspec validate --specs --strict`.
