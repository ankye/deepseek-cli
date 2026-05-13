## ADDED Requirements

### Requirement: Scriptable Palette Regression Coverage / 可脚本化 Palette 回归覆盖

The regression suite SHALL cover scriptable CLI palette list, keymap, action resolution, typed failures, structured rendering, and inert/no-owner-execution behavior.

Regression suite 必须覆盖可脚本化 CLI palette list、keymap、action resolution、typed failures、structured rendering 和惰性/不执行 owner 行为。

#### Scenario: CLI palette list is tested / CLI Palette List 被测试
- **WHEN** CLI host tests run `palette list` in JSON and JSONL modes
- **THEN** tests assert stable entries, result-list metadata, reference pit fixture ids, no ANSI controls, and no model/runtime events
- **中文** 当 CLI host tests 以 JSON 与 JSONL 模式运行 `palette list` 时，测试必须断言 stable entries、result-list metadata、reference pit fixture ids、无 ANSI controls 且无 model/runtime events。

#### Scenario: CLI keymap profile is tested / CLI Keymap Profile 被测试
- **WHEN** CLI host tests run `palette keymap vi-minimal`
- **THEN** tests assert vi navigation mappings and deterministic diagnostics
- **中文** 当 CLI host tests 运行 `palette keymap vi-minimal` 时，测试必须断言 vi navigation mappings 与确定性 diagnostics。

#### Scenario: CLI palette action is tested / CLI Palette Action 被测试
- **WHEN** CLI host tests run `palette action`
- **THEN** tests assert typed success and failure results, dry-run descriptors, and no workspace/session mutation
- **中文** 当 CLI host tests 运行 `palette action` 时，测试必须断言 typed success 与 failure results、dry-run descriptors 和无 workspace/session mutation。
