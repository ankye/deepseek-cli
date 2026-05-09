## Why

R1 needs a first usable product surface beyond one-shot headless commands: users must be able to stay in a terminal session, submit multiple prompts, run local commands, cancel safely, and see runtime events without the CLI becoming a second execution engine.

R1 需要在一次性 headless commands 之外提供第一个可用产品入口：用户必须能够停留在终端会话中，连续提交 prompts、运行本地命令、安全取消，并看到 runtime events，同时 CLI 不能变成第二套执行引擎。

## What Changes

- Add a minimal interactive CLI shell that starts from `deepseek`/`deepseek interactive` when the terminal is interactive, while preserving `deepseek -p`, `deepseek run`, readiness commands, and `--output stream-json`.
- 增加最小交互式 CLI shell，在交互式终端中可通过 `deepseek`/`deepseek interactive` 启动，同时保留 `deepseek -p`、`deepseek run`、readiness commands 和 `--output stream-json`。
- Route each submitted prompt through the same runtime kernel-backed event stream used by headless mode.
- 每次提交的 prompt 都通过与 headless mode 相同的 runtime kernel-backed event stream。
- Add minimal built-in interactive controls for help, exit, clear, cancellation, and command delegation without implementing a rich TUI.
- 增加 help、exit、clear、cancellation 和 command delegation 的最小内置交互控制，但不实现 rich TUI。
- Define interactive event rendering as a host adapter over canonical runtime/protocol events, not as a separate state machine.
- 将 interactive event rendering 定义为 canonical runtime/protocol events 之上的 host adapter，而不是独立状态机。
- Add deterministic unit, contract/integration, golden, and e2e coverage for the minimal interactive workflow.
- 为最小交互流程增加确定性的 unit、contract/integration、golden 和 e2e 覆盖。

## Capabilities

### New Capabilities

- `minimal-interactive-cli`: Defines the R1 terminal interactive shell contract, prompt loop behavior, event rendering, control commands, cancellation semantics, and acceptance expectations.

### Modified Capabilities

- `command-system`: Adds interactive command dispatch and slash/control command requirements for the minimal CLI shell.
- `communication-protocol`: Adds the requirement that interactive CLI rendering consumes the same canonical runtime/protocol events as headless and future host adapters.
- `testing-regression`: Adds deterministic regression coverage for minimal interactive CLI prompt, command, cancellation, exit, stream-json parity, and golden replay behavior.

## Impact

- Affected code: `src/apps/cli`, `src/packages/command-system`, `src/packages/runtime`, `src/packages/testing-regression`, `tests/e2e`, `tests/integration`, `tests/golden`, and architecture lint where needed.
- 受影响代码：`src/apps/cli`、`src/packages/command-system`、`src/packages/runtime`、`src/packages/testing-regression`、`tests/e2e`、`tests/integration`、`tests/golden`，以及必要时的 architecture lint。
- Public behavior: `deepseek` in an interactive TTY can start a minimal prompt loop; non-interactive/scripted usage remains deterministic and stream-json compatible.
- 公共行为：交互式 TTY 中的 `deepseek` 可以启动最小 prompt loop；非交互式/脚本用法保持确定性，并继续兼容 stream-json。
- No breaking changes are intended for existing headless or readiness commands.
- 不计划对现有 headless 或 readiness commands 做 breaking changes。
