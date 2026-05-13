## 1. Palette Helper Reuse / Palette Helper 复用

- [x] 1.1 Export focused palette render and action helper functions for chat reuse. / 导出聚焦的 palette render 与 action helper functions 供 chat 复用。
- [x] 1.2 Keep scriptable `deepseek palette` behavior unchanged while sharing helpers. / 共享 helpers 的同时保持可脚本化 `deepseek palette` 行为不变。

## 2. Chat Slash Controls / Chat Slash 控制

- [x] 2.1 Add `/palette` and `/palette list` local chat controls for text, JSON, and JSONL modes. / 为 text、JSON、JSONL 模式增加 `/palette` 与 `/palette list` 本地 chat controls。
- [x] 2.2 Add `/keymap [core|vi-minimal]` local chat control. / 增加 `/keymap [core|vi-minimal]` 本地 chat control。
- [x] 2.3 Add `/palette action <action> <target-id>` dry-run local chat control with typed failures. / 增加 `/palette action <action> <target-id>` dry-run 本地 chat control 与类型化失败。
- [x] 2.4 Update `/help` text to list palette and keymap controls. / 更新 `/help` 文本，列出 palette 与 keymap controls。

## 3. Regression Coverage / 回归覆盖

- [x] 3.1 Add chat JSONL tests for `/palette`, `/keymap`, and `/palette action` local records without model requests. / 增加 `/palette`、`/keymap` 和 `/palette action` 的 chat JSONL 本地 records 测试，且无 model requests。
- [x] 3.2 Add chat text tests for `/help` palette entries. / 增加 `/help` palette 条目的 chat text 测试。
- [x] 3.3 Add typed unknown-target failure tests for chat palette action. / 增加 chat palette action 未知 target 的类型化失败测试。

## 4. Verification / 验证

- [x] 4.1 Validate OpenSpec change and all specs. / 验证 OpenSpec change 与全量 specs。
- [x] 4.2 Run typecheck, lint, targeted CLI tests, npm test, boundary checks, build:cli, and git hygiene checks. / 运行 typecheck、lint、定向 CLI tests、npm test、boundary checks、build:cli 与 git hygiene checks。
