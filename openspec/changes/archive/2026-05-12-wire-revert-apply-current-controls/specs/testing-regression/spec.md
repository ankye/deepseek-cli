## ADDED Requirements

### Requirement: Revert Apply Regression Coverage / 回退执行回归覆盖

Regression tests SHALL cover scriptable and chat-local revert apply behavior with deterministic injected workspace checkpoints.

回归测试必须使用确定性注入的 workspace checkpoints 覆盖可脚本化与 chat-local revert apply 行为。

#### Scenario: Successful apply mutates through checkpoint / 成功执行通过 Checkpoint 修改

- **WHEN** a test injects an eligible checkpoint and runs `deepseek revert apply --request <request-id> --output json`
- **THEN** the assertion verifies the file content is restored, the checkpoint status is `restored`, and no raw rollback content appears in externally visible records
- **中文** 当测试注入 eligible checkpoint 并运行 `deepseek revert apply --request <request-id> --output json` 时，断言必须验证 file content 已恢复、checkpoint status 为 `restored`，且 externally visible records 不包含 raw rollback content。

#### Scenario: Stale apply is non-mutating / 过期执行不修改

- **WHEN** a test mutates the file after checkpoint creation and then runs revert apply
- **THEN** the assertion verifies stale diagnostics are emitted, file content remains unchanged, and the checkpoint remains eligible
- **中文** 当测试在 checkpoint 创建后再次修改文件并运行 revert apply 时，断言必须验证输出 stale diagnostics、file content 保持不变，且 checkpoint 仍为 eligible。

#### Scenario: Chat apply slash stays local / Chat 执行 Slash 保持本地

- **WHEN** a scripted chat input runs `/revert apply current`
- **THEN** the assertion verifies the slash command emits `chat.command.revert-apply`, does not emit a model request for that slash command, and preserves structured JSONL output without ANSI escape sequences
- **中文** 当 scripted chat input 运行 `/revert apply current` 时，断言必须验证 slash command 输出 `chat.command.revert-apply`，不会为该 slash command 发出 model request，并保持 structured JSONL output 不含 ANSI escape sequences。
