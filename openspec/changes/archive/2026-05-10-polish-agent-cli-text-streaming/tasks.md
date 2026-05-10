## 1. Renderer State Machine / 渲染状态机

- [x] 1.1 In `src/apps/cli/src/index.ts`, introduce an internal `TextStreamState` with `deltaOpen: boolean` and `reasoningOpen: boolean`, reset at the top of each iteration when a `model.requested` event fires.
- [x] 1.2 Replace the text branch in `emitAgentLoop` with a small dispatcher: `model.delta` -> `openDeltaStream` + inline-write the chunk text; `model.reasoning` -> first chunk opens with a `[reasoning]` prefix (with a trailing space emitted at runtime), subsequent chunks inline-write text; any other event closes both streams by emitting one newline before its own line output.
- [x] 1.3 On `agent.loop.completed` and `agent.loop.failed`, ensure any remaining open stream is closed with a newline before writing the final status line.

## 2. Dual-Channel Writer / 双通道 Writer

- [x] 2.1 Add an internal `createCliWriters(write: CliWrite, stdoutIsTTY: boolean)` helper returning `{ writeLine(line: string): Promise<void>; writeInline(chunk: string): Promise<void> }`.
- [x] 2.2 When `stdoutIsTTY === true` and the passed-in `write` is the default `console.log`, route `writeInline` to `process.stdout.write(chunk)` (no newline).
- [x] 2.3 When a custom `write` is injected (test harness, VSCode extension adapter), route `writeInline` to that `write` with no newline semantics so harness sees the chunk as-is; state machine above ensures the line is still coherent.

## 3. Tests / 测试

- [x] 3.1 Add `src/apps/cli/test/cli.test.ts` case "text mode coalesces delta chunks into a single line" that injects a harness writer recording every call, runs `runCli(["run", "hi", "--output", "text"])` with a mock runtime that yields 3 `model.delta` chunks, and asserts that combined output contains the concatenated text followed by exactly one trailing newline before the `[completed]` line.
- [x] 3.2 Add "text mode emits one reasoning indicator per iteration" case with 2 reasoning chunks + 1 delta + finish; assert recorded output has exactly one `[reasoning]` prefix (trailing space is included at runtime) containing both thinking chunks on the same line.
- [x] 3.3 Keep every existing CLI, golden, integration, e2e, and live smoke test green without modification.

## 4. Docs / 文档

- [x] 4.1 Append one short paragraph to `docs/development/testing-and-acceptance.md` Live Agent Tool Execution section describing the text-mode streaming contract: JSON/JSONL are one-event-per-line; text mode coalesces delta and reasoning into per-iteration streaming lines.

## 5. Verification / 验证

- [x] 5.1 `npm run typecheck`.
- [x] 5.2 `npm run lint`.
- [x] 5.3 `npm test` (expect 257 + new cases, 0 fail).
- [x] 5.4 `node scripts/check-boundaries.mjs`.
- [x] 5.5 Refresh `tests/acceptance/latest/` evidence and regenerate `acceptance-index.md`.
- [x] 5.6 `openspec validate polish-agent-cli-text-streaming --strict` and `openspec validate --specs --strict`.
