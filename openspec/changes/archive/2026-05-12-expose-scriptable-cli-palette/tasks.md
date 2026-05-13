## 1. CLI Parsing And Routing / CLI 解析与路由

- [x] 1.1 Add `palette` command options for `list`, `keymap`, and `action` in CLI types and parser. / 在 CLI types 与 parser 中增加 `palette` 的 `list`、`keymap` 和 `action` options。
- [x] 1.2 Route palette commands through a focused command module without growing `run-cli.ts` beyond dispatch. / 通过聚焦 command module 路由 palette commands，避免 `run-cli.ts` 超出分发职责。
- [x] 1.3 Update deterministic usage output to include palette commands. / 更新确定性 usage output，加入 palette commands。

## 2. Palette Command Module / Palette 命令模块

- [x] 2.1 Implement default CLI palette projection from existing local command composition records. / 基于现有本地 command composition records 实现默认 CLI palette projection。
- [x] 2.2 Implement `palette list` rendering for text, JSON, and JSONL without ANSI controls. / 实现 `palette list` 的 text、JSON、JSONL 渲染，不包含 ANSI controls。
- [x] 2.3 Implement `palette keymap [core|vi-minimal]` rendering with deterministic diagnostics. / 实现 `palette keymap [core|vi-minimal]` 渲染，包含确定性 diagnostics。
- [x] 2.4 Implement `palette action <action> <target-id>` dry-run action resolution over an ephemeral palette snapshot. / 基于临时 palette snapshot 实现 `palette action <action> <target-id>` dry-run action resolution。
- [x] 2.5 Return typed failures for unknown actions or targets without unstructured host exceptions. / 对 unknown actions 或 targets 返回类型化失败，不抛出非结构化 host exceptions。

## 3. Regression Coverage / 回归覆盖

- [x] 3.1 Add CLI host tests for palette list JSON/JSONL/text output and no model/runtime event emission. / 增加 palette list JSON/JSONL/text 输出和无 model/runtime event 的 CLI host 测试。
- [x] 3.2 Add CLI host tests for vi keymap profile output and diagnostics. / 增加 vi keymap profile output 与 diagnostics 的 CLI host 测试。
- [x] 3.3 Add CLI host tests for palette action success, dry-run descriptor, and typed unknown-target failure. / 增加 palette action success、dry-run descriptor 和 typed unknown-target failure 的 CLI host 测试。
- [x] 3.4 Add/adjust help tests to assert palette commands appear and do not start chat/model work. / 增加或调整 help 测试，断言 palette commands 出现且不启动 chat/model work。

## 4. Verification / 验证

- [x] 4.1 Validate OpenSpec change and all specs. / 验证 OpenSpec change 与全量 specs。
- [x] 4.2 Run typecheck, lint, targeted CLI tests, npm test, boundary checks, and git hygiene checks. / 运行 typecheck、lint、定向 CLI tests、npm test、boundary checks 和 git hygiene checks。
