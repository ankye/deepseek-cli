## 1. Palette State Helpers / Palette 状态 Helpers

- [x] 1.1 Export a reusable palette composition snapshot helper. / 导出可复用的 palette composition snapshot helper。
- [x] 1.2 Add a chat-local palette state module for init, navigation, reference add, and summary rendering. / 增加 chat-local palette state module，支持初始化、导航、reference add 与摘要渲染。

## 2. Chat Slash Controls / Chat Slash 控制

- [x] 2.1 Wire `/palette next|previous|first|last` to local action resolution and state updates. / 将 `/palette next|previous|first|last` 接入本地 action resolution 与 state updates。
- [x] 2.2 Wire `/palette refs add <target-id|current>` to local reference-set updates. / 将 `/palette refs add <target-id|current>` 接入本地 reference-set updates。
- [x] 2.3 Add `/palette state` deterministic text, JSON, and JSONL rendering. / 增加 `/palette state` 的确定性 text、JSON 与 JSONL 渲染。
- [x] 2.4 Preserve existing `/palette`, `/palette list`, `/palette action`, and `/keymap` behavior. / 保持现有 `/palette`、`/palette list`、`/palette action` 与 `/keymap` 行为。

## 3. Regression Coverage / 回归覆盖

- [x] 3.1 Add chat JSONL tests for palette navigation focus and jump count. / 增加 chat JSONL tests，覆盖 palette navigation focus 与 jump count。
- [x] 3.2 Add chat JSONL tests for `/palette refs add current` reference count updates. / 增加 chat JSONL tests，覆盖 `/palette refs add current` 的 reference count 更新。
- [x] 3.3 Add typed malformed palette navigation tests and no model/runtime submission assertions. / 增加格式错误 palette navigation 的类型化测试与不提交 model/runtime 的断言。

## 4. Verification / 验证

- [x] 4.1 Validate OpenSpec change and all specs. / 验证 OpenSpec change 与全量 specs。
- [x] 4.2 Run typecheck, lint, targeted CLI tests, npm test, boundary checks, build:cli, and git hygiene checks. / 运行 typecheck、lint、定向 CLI tests、npm test、boundary checks、build:cli 与 git hygiene checks。
