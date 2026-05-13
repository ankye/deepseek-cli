## 1. Scriptable Revert Apply / 可脚本化回退执行

- [x] 1.1 Extend CLI revert action parsing to distinguish `preview` and `apply`. / 扩展 CLI revert action parsing，区分 `preview` 与 `apply`。
- [x] 1.2 Add `applyRevert` and deterministic text, JSON, and JSONL renderers. / 增加 `applyRevert` 以及确定性的 text、JSON、JSONL renderers。
- [x] 1.3 Route `deepseek revert apply ...` through workspace checkpoint restore safety checks. / 将 `deepseek revert apply ...` 接入 workspace checkpoint restore safety checks。
- [x] 1.4 Update CLI usage/help and README command surface for revert apply. / 更新 CLI usage/help 与 README command surface，展示 revert apply。

## 2. Chat Local Apply Current / Chat 本地当前执行

- [x] 2.1 Wire `/revert apply current` to selected history turn resolution. / 将 `/revert apply current` 接入 selected history turn 解析。
- [x] 2.2 Emit local typed failures for missing current history or malformed apply input. / 对缺失 current history 或格式错误 apply input 输出本地类型化失败。
- [x] 2.3 Update chat help for `/revert apply current`. / 更新 chat help，展示 `/revert apply current`。

## 3. Regression Coverage / 回归覆盖

- [x] 3.1 Add scriptable successful apply test that restores file content and checkpoint status. / 增加可脚本化成功执行测试，验证 file content 与 checkpoint status。
- [x] 3.2 Add stale apply rejection test that leaves file and checkpoint unchanged. / 增加 stale apply rejection 测试，验证 file 与 checkpoint 不变。
- [x] 3.3 Add chat JSONL test for `/revert apply current` staying local. / 增加 `/revert apply current` 保持本地的 chat JSONL 测试。
- [x] 3.4 Add parser/help assertions for `revert apply`. / 增加 `revert apply` parser/help 断言。

## 4. Verification / 验证

- [x] 4.1 Validate OpenSpec change and all specs. / 验证 OpenSpec change 与全量 specs。
- [x] 4.2 Run typecheck, lint, targeted CLI tests, npm test, boundary checks, build:cli, and git hygiene checks. / 运行 typecheck、lint、定向 CLI tests、npm test、boundary checks、build:cli 与 git hygiene checks。
