## Why

Codex currently appears in CLI task-completion evaluation only as a deferred baseline. To make real comparison possible, maintainers need an explicit opt-in adapter path that can validate a local Codex executable without weakening the default safety posture.

Codex 目前在 CLI task-completion evaluation 中只是 deferred baseline。为了真正对比，维护者需要一个显式 opt-in adapter 路径，用于验证本地 Codex executable，同时不削弱默认安全姿态。

## What Changes

- Add explicit external baseline configuration flags for `diagnostics evaluate`.
- Keep Codex, Claude Code, and other external CLIs deferred unless `--allow-external-baseline` and a concrete command are provided.
- Probe configured external baselines through platform process execution with argv arrays and `shell: false`.
- Record configured baseline identity, command fingerprint, version probe output, diagnostics, and task-run planning evidence.
- Do not allow external baselines to mutate the workspace or run task prompts in this slice; this change only moves Codex from unconfigured to configured/probed.

- 为 `diagnostics evaluate` 新增显式 external baseline configuration flags。
- 除非提供 `--allow-external-baseline` 与具体 command，否则 Codex、Claude Code 和其他 external CLIs 仍保持 deferred。
- 通过 platform process execution、argv arrays 与 `shell: false` 探测已配置 external baseline。
- 记录 configured baseline identity、command fingerprint、version probe output、diagnostics 与 task-run planning evidence。
- 本切片不允许 external baseline 修改 workspace 或运行 task prompts；只把 Codex 从 unconfigured 推进到 configured/probed。

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `cli-task-completion-evaluation`: External baseline configuration can explicitly enable safe local Codex probing while preserving deferred default behavior.

## Impact

- Affected code: CLI argument parsing, diagnostics evaluation runner, platform process usage, evaluation DTO metadata, CLI tests, e2e tests, docs.
- Affected behavior: `deepseek diagnostics evaluate --baseline codex --allow-external-baseline --baseline-command <cmd>` records a configured external baseline if the command can be probed.
- Safety: no arbitrary shell strings, no default external execution, no task prompt execution, no publish/network/model assumptions.

- 影响代码：CLI argument parsing、diagnostics evaluation runner、platform process usage、evaluation DTO metadata、CLI tests、e2e tests、docs。
- 行为影响：`deepseek diagnostics evaluate --baseline codex --allow-external-baseline --baseline-command <cmd>` 会在 command 可探测时记录 configured external baseline。
- 安全性：不接受任意 shell strings，不默认执行外部命令，不执行 task prompt，不假设 publish/network/model。
