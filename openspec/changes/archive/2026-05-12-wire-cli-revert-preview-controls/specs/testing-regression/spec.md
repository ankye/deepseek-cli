## ADDED Requirements

### Requirement: CLI Revert Preview Regression Coverage / CLI 回退预览回归覆盖

The regression suite SHALL cover scriptable and chat-local revert preview controls, typed empty failures, malformed target failures, and non-mutating behavior.

Regression suite 必须覆盖可脚本化与 chat-local revert preview controls、类型化 empty failures、malformed target failures 和 non-mutating behavior。

#### Scenario: Scriptable revert preview is tested / 可脚本化回退预览被测试
- **WHEN** CLI host tests run `deepseek revert preview --request <request-id> --output json`
- **THEN** tests assert structured dry-run output and typed empty diagnostics when no checkpoint matches
- **中文** 当 CLI host tests 运行 `deepseek revert preview --request <request-id> --output json` 时，测试必须断言结构化 dry-run output，以及没有 matching checkpoint 时的 typed empty diagnostics。

#### Scenario: Chat revert preview is tested / Chat 回退预览被测试
- **WHEN** CLI host tests run scripted chat input containing `/revert preview --turn <turn-id>`
- **THEN** tests assert local output records and no model/runtime event submission for that line
- **中文** 当 CLI host tests 运行包含 `/revert preview --turn <turn-id>` 的 scripted chat input 时，测试必须断言本地 output records，且该行不提交 model/runtime event。

#### Scenario: Revert preview does not mutate test state / 回退预览不修改测试状态
- **WHEN** tests run revert preview against an injected workspace state manager with eligible checkpoints
- **THEN** checkpoint statuses and file content remain unchanged after preview
- **中文** 当测试对注入了 eligible checkpoints 的 workspace state manager 运行 revert preview 时，preview 后 checkpoint statuses 与 file content 必须保持不变。
