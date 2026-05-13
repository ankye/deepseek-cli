## 1. Contract DTO / 契约 DTO

- [x] 1.1 Add `AgentLoopReferenceContext`, set, and item DTOs to platform contracts. / 将 `AgentLoopReferenceContext`、set 与 item DTOs 加入 platform contracts。
- [x] 1.2 Add optional `referenceContext` to `AgentLoopRequest`. / 将可选 `referenceContext` 加入 `AgentLoopRequest`。

## 2. Chat Serialization / Chat 序列化

- [x] 2.1 Add helper to serialize active chat palette references into `AgentLoopReferenceContext`. / 增加 helper，将 active chat palette references 序列化为 `AgentLoopReferenceContext`。
- [x] 2.2 Wire normal chat prompt turns to include reference context when references exist. / 在存在 references 时，让普通 chat prompt turns 携带 reference context。
- [x] 2.3 Keep slash reference controls local and prompt text unchanged. / 保持 slash reference controls 本地化，并保持 prompt text 不变。

## 3. Runtime Metadata / Runtime 元数据

- [x] 3.1 Include reference context summary in `agent.loop.started`. / 在 `agent.loop.started` 中包含 reference context summary。
- [x] 3.2 Include reference context in `turn.started` and hook inputs. / 在 `turn.started` 与 hook inputs 中包含 reference context。
- [x] 3.3 Include reference context in model request metadata without mutating message text. / 在 model request metadata 中包含 reference context，且不修改 message text。

## 4. Regression Coverage / 回归覆盖

- [x] 4.1 Add CLI chat JSONL test for reference context propagation into runtime/model events. / 增加 reference context 传播到 runtime/model events 的 CLI chat JSONL test。
- [x] 4.2 Assert raw content and slash-only model submissions are absent. / 断言 raw content 与 slash-only model submissions 不存在。

## 5. Verification / 验证

- [x] 5.1 Validate OpenSpec change and all specs. / 验证 OpenSpec change 与全量 specs。
- [x] 5.2 Run targeted CLI tests, typecheck, lint, boundary checks, and git hygiene checks. / 运行定向 CLI tests、typecheck、lint、boundary checks 与 git hygiene checks。
