## 1. Reference Candidate Resolution / 引用候选解析

- [x] 1.1 Add runtime helper to convert `AgentLoopReferenceContext` file items into context graph candidate nodes. / 增加 runtime helper，将 `AgentLoopReferenceContext` 的 file items 转成 context graph candidate nodes。
- [x] 1.2 Record unsupported, unreadable, and unsafe reference ids as projection evidence without failing non-budget turns. / 将 unsupported、unreadable 与 unsafe reference ids 记录为 projection evidence，且非预算失败不终止 turn。

## 2. Runtime Projection And Prompt Assembly / Runtime 投影与 Prompt 组装

- [x] 2.1 Make `projectAgentLoopContext` return the final `ContextProjectionResult` after emitting projection events. / 让 `projectAgentLoopContext` 在发出 projection events 后返回最终 `ContextProjectionResult`。
- [x] 2.2 Inject selected reference-derived projection content as one runtime-owned system context message before model dispatch. / 在 model dispatch 前，将 selected reference-derived projection content 作为一条 runtime-owned system context message 注入。
- [x] 2.3 Include projection summary in `model.requested`, model-call hooks, and model request metadata. / 在 `model.requested`、model-call hooks 与 model request metadata 中包含 projection summary。
- [x] 2.4 Preserve original user prompt message unchanged. / 保持原始 user prompt message 不变。

## 3. CLI File Reference Control / CLI 文件引用控制

- [x] 3.1 Add `/palette refs add-file <path>` local chat control that records file target metadata without reading content. / 增加本地 chat control `/palette refs add-file <path>`，记录 file target metadata 但不读取内容。
- [x] 3.2 Render file references through existing reference list/focus output with redaction metadata. / 通过现有 reference list/focus output 渲染 file references，并带 redaction metadata。

## 4. Regression Coverage / 回归覆盖

- [x] 4.1 Add runtime/model test proving file reference content reaches the model through projection context while user prompt is unchanged. / 增加 runtime/model test，证明 file reference content 通过 projection context 到达 model，且 user prompt 不变。
- [x] 4.2 Add CLI JSONL test proving `/palette refs add-file` is local and later prompt carries projected reference context. / 增加 CLI JSONL test，证明 `/palette refs add-file` 本地化，且后续 prompt 携带 projected reference context。
- [x] 4.3 Add unsafe secret-like reference exclusion test. / 增加疑似 secret reference exclusion test。

## 5. Verification / 验证

- [x] 5.1 Validate OpenSpec change and all specs. / 验证 OpenSpec change 与全量 specs。
- [x] 5.2 Run targeted runtime/CLI tests, typecheck, lint, boundary checks, and git hygiene checks. / 运行定向 runtime/CLI tests、typecheck、lint、boundary checks 与 git hygiene checks。
