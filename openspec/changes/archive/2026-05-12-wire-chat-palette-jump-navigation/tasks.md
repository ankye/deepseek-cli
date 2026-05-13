## 1. Contracts And Resolver / 契约与解析器

- [x] 1.1 Add `back` and `forward` to CLI action contracts. / 将 `back` 与 `forward` 加入 CLI action contracts。
- [x] 1.2 Implement typed jump-history traversal in the command action resolver. / 在 command action resolver 中实现类型化 jump-history traversal。
- [x] 1.3 Preserve matching result-list focus and return typed diagnostics at traversal bounds. / 保留匹配的 result-list focus，并在 traversal bounds 返回类型化 diagnostics。

## 2. Chat Controls / Chat 控制

- [x] 2.1 Wire `/palette back` and `/palette forward` through chat palette state. / 通过 chat palette state 接入 `/palette back` 与 `/palette forward`。
- [x] 2.2 Update palette supported actions and chat help text. / 更新 palette supported actions 与 chat help text。
- [x] 2.3 Keep JSONL rendering record-oriented with action result plus state summary. / 保持 JSONL rendering 为 action result 加 state summary 的 record-oriented 输出。

## 3. Regression Coverage / 回归覆盖

- [x] 3.1 Add contract tests for back/forward cursor, focus, and bound diagnostics. / 增加 back/forward cursor、focus 与 bound diagnostics 的 contract tests。
- [x] 3.2 Add CLI chat JSONL tests for `/palette back`, `/palette forward`, and `/palette state`. / 增加 `/palette back`、`/palette forward` 与 `/palette state` 的 CLI chat JSONL tests。
- [x] 3.3 Add empty jump traversal regression test. / 增加空 jump traversal 回归测试。
- [x] 3.4 Add help assertion for `/palette back|forward`. / 增加 `/palette back|forward` 的 help 断言。

## 4. Verification / 验证

- [x] 4.1 Validate OpenSpec change and all specs. / 验证 OpenSpec change 与全量 specs。
- [x] 4.2 Run targeted contract and CLI tests, typecheck, lint, boundary checks, and git hygiene checks. / 运行定向 contract 与 CLI tests、typecheck、lint、boundary checks 与 git hygiene checks。
