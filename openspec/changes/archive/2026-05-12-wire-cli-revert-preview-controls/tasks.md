## 1. Revert Command Surface / 回退命令 Surface

- [x] 1.1 Add CLI option types and parser support for `revert preview` target flags. / 增加 `revert preview` target flags 的 CLI option types 与 parser 支持。
- [x] 1.2 Add usage/help entries for scriptable revert preview. / 增加可脚本化 revert preview 的 usage/help entries。
- [x] 1.3 Implement a dedicated CLI revert command module with shared target parsing and rendering. / 实现专门的 CLI revert command module，包含共享 target parsing 与 rendering。

## 2. Chat Local Control / Chat 本地控制

- [x] 2.1 Wire `/revert preview ...` into chat as a local slash control. / 将 `/revert preview ...` 接入 chat，作为本地 slash control。
- [x] 2.2 Update chat help to advertise `/revert preview`. / 更新 chat help，展示 `/revert preview`。
- [x] 2.3 Ensure malformed chat revert preview inputs return typed local failures. / 确保格式错误的 chat revert preview inputs 返回 typed local failures。

## 3. Regression Coverage / 回归覆盖

- [x] 3.1 Add scriptable revert preview tests for typed empty JSON/JSONL output. / 增加可脚本化 revert preview 的类型化 empty JSON/JSONL output 测试。
- [x] 3.2 Add chat-local revert preview tests with no model/runtime submission. / 增加 chat-local revert preview 测试，断言不提交 model/runtime。
- [x] 3.3 Add injected workspace-state preview test proving no file/checkpoint mutation. / 增加注入 workspace-state 的 preview 测试，证明不修改 file/checkpoint。

## 4. Verification / 验证

- [x] 4.1 Validate OpenSpec change and all specs. / 验证 OpenSpec change 与全量 specs。
- [x] 4.2 Run typecheck, lint, targeted CLI tests, npm test, boundary checks, build:cli, and git hygiene checks. / 运行 typecheck、lint、定向 CLI tests、npm test、boundary checks、build:cli 与 git hygiene checks。
