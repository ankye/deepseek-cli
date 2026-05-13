## Context

`diagnostics release` and `diagnostics verify` now give the CLI a concrete release gate, but the supporting `tests/acceptance/latest/*.txt` files are still refreshed manually. That makes the gate easier to inspect than to maintain. The next step is to give the CLI a controlled, local evidence refresh path that writes the same files the release gate verifies.

`diagnostics release` 与 `diagnostics verify` 已经给 CLI 提供了具体 release gate，但支撑它们的 `tests/acceptance/latest/*.txt` 文件仍靠手工刷新。这让门禁更容易检查，却不够容易维护。下一步是给 CLI 一个受控、本地的 evidence refresh 路径，写入 release gate 验证的同一批文件。

## Goals / Non-Goals

**Goals:**

- Add `diagnostics refresh` to regenerate acceptance evidence through a built-in allowlist.
- Keep default mode bounded and useful before release: index, typecheck, lint, boundaries, build, headless smoke, release diagnostics, verify.
- Add `--full` for deterministic heavier suites without changing the default fast path.
- Write each command's stdout/stderr/exit code to a known `tests/acceptance/latest/*.txt` file.
- Render a structured summary that CI and scripts can consume.

- 新增 `diagnostics refresh`，通过内置 allowlist 重新生成 acceptance evidence。
- 默认模式保持有界且适合发布前使用：index、typecheck、lint、boundaries、build、headless smoke、release diagnostics、verify。
- 新增 `--full`，用于确定性更重的 suites，但不改变默认快速路径。
- 将每条命令的 stdout/stderr/exit code 写入已知 `tests/acceptance/latest/*.txt` 文件。
- 输出可被 CI 和脚本消费的结构化 summary。

**Non-Goals:**

- Do not run `npm publish`, `npm publish --dry-run`, live provider tests, network tests, or user-supplied commands.
- Do not replace CI. The command refreshes local evidence and reports failures; it does not claim environment-independent release certification.
- Do not add a new external dependency or move release logic into runtime packages.

- 不运行 `npm publish`、`npm publish --dry-run`、live provider tests、network tests 或用户自定义 commands。
- 不替代 CI。该命令刷新本地 evidence 并报告失败；不声称完成环境无关的 release certification。
- 不新增外部依赖，也不把 release 逻辑移入 runtime packages。

## Decisions

### Decision: Refresh belongs under diagnostics

`diagnostics refresh` is evidence maintenance for diagnostics/release gates. It belongs beside `release` and `verify`, not as a top-level `test` or `release` command.

`diagnostics refresh` 是 diagnostics/release gates 的 evidence maintenance。它应与 `release` 和 `verify` 同属 diagnostics，而不是新增顶层 `test` 或 `release` 命令。

Alternative considered: add an npm script only. That would help maintainers but leave the CLI product unable to maintain its own release evidence.

备选方案：只新增 npm script。这样对维护者有帮助，但 CLI 产品本身仍无法维护自己的 release evidence。

### Decision: Commands are allowlisted plans

The refresh command maps plan ids to fixed argv arrays and output paths. The parser only accepts mode flags such as `--full`; it never accepts arbitrary shell snippets.

refresh command 将 plan ids 映射到固定 argv arrays 和 output paths。parser 只接受 `--full` 等模式 flag；绝不接受任意 shell snippets。

Alternative considered: accept `--command`. That would turn diagnostics into arbitrary process execution and reopen shell/parser risks that policy fixtures are meant to close.

备选方案：接受 `--command`。这会把 diagnostics 变成任意进程执行，并重新打开 shell/parser 风险。

### Decision: Use platform process execution with `shell: false`

The CLI host can use `NodePlatformRuntime.runProcess()` because process execution is already owned by platform abstraction and returns structured exit/stdout/stderr. Refresh remains CLI-host work and does not call runtime/model/tool primitives.

CLI host 可以使用 `NodePlatformRuntime.runProcess()`，因为 process execution 已由 platform abstraction 归口，并返回结构化 exit/stdout/stderr。refresh 仍是 CLI-host 工作，不调用 runtime/model/tool primitives。

Alternative considered: direct `child_process` from CLI. That would bypass the platform boundary and weaken existing lint/architecture guardrails.

备选方案：CLI 直接使用 `child_process`。这会绕过 platform boundary，削弱现有 lint/architecture guardrails。

## Risks / Trade-offs

- [Risk] Default refresh may still take time. -> Mitigation: keep default to release-critical commands; heavier suites require `--full`. / 默认 refresh 仍可能耗时。-> 缓解：默认只跑 release-critical commands；更重 suites 需要 `--full`。
- [Risk] Refresh may overwrite useful evidence from a prior run. -> Mitigation: output paths are explicit and summary lists every refreshed file with exit code. / refresh 可能覆盖上一次有用 evidence。-> 缓解：输出路径显式，summary 列出每个刷新文件和 exit code。
- [Risk] Running commands from a non-repo directory will fail. -> Mitigation: refresh writes structured failure evidence and suggests running from repository root. / 在非 repo 目录运行会失败。-> 缓解：refresh 写入结构化失败 evidence，并建议从 repository root 运行。
