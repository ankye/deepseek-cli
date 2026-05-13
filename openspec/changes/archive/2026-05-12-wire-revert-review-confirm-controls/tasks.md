## 1. Review State And Rendering / 审阅状态与渲染

- [x] 1.1 Add chat pending revert review state and deterministic review ids. / 增加 chat pending revert review state 与确定性 review ids。
- [x] 1.2 Add review and confirm structured renderers for text, JSON, and JSONL. / 增加 review 与 confirm 的 text、JSON、JSONL 结构化渲染。

## 2. Chat Slash Controls / Chat Slash 控制

- [x] 2.1 Wire `/revert review current` to selected history and dry-run preview. / 将 `/revert review current` 接入 selected history 与 dry-run preview。
- [x] 2.2 Wire `/revert confirm <review-id|current>` to pending review apply. / 将 `/revert confirm <review-id|current>` 接入 pending review apply。
- [x] 2.3 Emit typed local failures for missing review, missing current history, and malformed review/confirm commands. / 对 missing review、missing current history 与 malformed review/confirm commands 输出类型化本地失败。
- [x] 2.4 Update chat help for review and confirm controls. / 更新 chat help，展示 review 与 confirm controls。

## 3. Regression Coverage / 回归覆盖

- [x] 3.1 Add chat JSONL test for successful review then confirm restoring a checkpoint. / 增加 review 后 confirm 成功恢复 checkpoint 的 chat JSONL 测试。
- [x] 3.2 Add chat JSONL test for confirm without review typed failure. / 增加未 review 就 confirm 的类型化失败 chat JSONL 测试。
- [x] 3.3 Add stale confirm test using review before an intervening file mutation. / 增加 review 后、confirm 前文件变化的 stale confirm 测试。
- [x] 3.4 Add help assertions for `/revert review current` and `/revert confirm <review-id|current>`. / 增加 `/revert review current` 与 `/revert confirm <review-id|current>` 的 help 断言。

## 4. Verification / 验证

- [x] 4.1 Validate OpenSpec change and all specs. / 验证 OpenSpec change 与全量 specs。
- [x] 4.2 Run typecheck, lint, targeted CLI tests, npm test, boundary checks, build:cli, and git hygiene checks. / 运行 typecheck、lint、定向 CLI tests、npm test、boundary checks、build:cli 与 git hygiene checks。
