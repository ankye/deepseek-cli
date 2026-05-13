## 1. Chat History State / Chat History 状态

- [x] 1.1 Add chat history entry types and local state fields. / 增加 chat history entry types 与本地 state 字段。
- [x] 1.2 Record completed prompt turns from terminal runtime events. / 从 terminal runtime events 记录已完成 prompt turns。
- [x] 1.3 Add deterministic history summary and entry rendering for text, JSON, and JSONL. / 增加 text、JSON 与 JSONL 的确定性 history summary 和 entry rendering。

## 2. Chat Slash Controls / Chat Slash 控制

- [x] 2.1 Wire `/history` local listing. / 接入 `/history` 本地列表。
- [x] 2.2 Wire `/history select <turn-id|index|current|last>` local selection. / 接入 `/history select <turn-id|index|current|last>` 本地选择。
- [x] 2.3 Wire `/revert preview current` to selected history turn dry-run preview. / 将 `/revert preview current` 接到 selected history turn dry-run preview。
- [x] 2.4 Update chat help for history and current revert controls. / 更新 chat help，展示 history 与 current revert controls。

## 3. Regression Coverage / 回归覆盖

- [x] 3.1 Add chat JSONL tests for `/history` records after prompt turns. / 增加 prompt turns 后 `/history` records 的 chat JSONL 测试。
- [x] 3.2 Add chat JSONL tests for `/history select` and `/revert preview current`. / 增加 `/history select` 与 `/revert preview current` 的 chat JSONL 测试。
- [x] 3.3 Add empty-history failure tests and no model submission assertions for history slash controls. / 增加 empty-history failure tests 与 history slash controls 不提交 model 的断言。

## 4. Verification / 验证

- [x] 4.1 Validate OpenSpec change and all specs. / 验证 OpenSpec change 与全量 specs。
- [x] 4.2 Run typecheck, lint, targeted CLI tests, npm test, boundary checks, build:cli, and git hygiene checks. / 运行 typecheck、lint、定向 CLI tests、npm test、boundary checks、build:cli 与 git hygiene checks。
