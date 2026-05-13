## Context

The evaluation framework now distinguishes internal DeepSeek CLI evidence from advisory public benchmark references. Codex and Claude Code baselines are present but deferred because executing vendor CLIs can involve credentials, network access, local side effects, changing model behavior, and unbounded output.

评估框架现在已经区分内部 DeepSeek CLI evidence 与 advisory public benchmark references。Codex 与 Claude Code baseline 已存在但处于 deferred，因为执行 vendor CLI 可能涉及 credentials、network access、本地副作用、变化的模型行为与无界输出。

## Goals / Non-Goals

**Goals:**

- Let maintainers explicitly configure a local Codex external baseline command for evaluation planning.
- Prove configuration with a safe version/probe command executed via platform abstraction and `shell: false`.
- Keep unconfigured or partially configured external baselines deferred.
- Keep evidence redacted, bounded, and machine-readable.

- 允许维护者显式配置本地 Codex external baseline command，用于 evaluation planning。
- 通过 platform abstraction 与 `shell: false` 执行安全 version/probe command 来证明配置。
- 未配置或部分配置的 external baseline 仍保持 deferred。
- evidence 保持脱敏、有界、机器可读。

**Non-Goals:**

- Do not send evaluation prompts to Codex in this slice.
- Do not allow external baselines to edit files, run tests, or mutate workspaces.
- Do not infer or discover vendor executables automatically.
- Do not store credentials or raw provider output.

- 本切片不向 Codex 发送 evaluation prompts。
- 不允许 external baseline 编辑文件、运行测试或修改 workspace。
- 不自动推断或发现 vendor executables。
- 不存储 credentials 或 raw provider output。

## Decisions

### Decision: Explicit Allow Flag Plus Command

External baseline execution requires both `--allow-external-baseline` and `--baseline-command <cmd>`. Missing either condition records a deferred baseline.

external baseline execution 必须同时提供 `--allow-external-baseline` 与 `--baseline-command <cmd>`。任一条件缺失都记录为 deferred baseline。

Alternative considered: run `codex --version` when `--baseline codex` is selected. That violates the opt-in requirement and can fail or hang on hosts without the tool.

备选方案：选择 `--baseline codex` 时自动运行 `codex --version`。这违反 opt-in 要求，也可能在未安装工具的 host 上失败或挂起。

### Decision: Probe Only, No Task Execution

The configured adapter only runs a bounded probe command, defaulting to `--version` when no `--baseline-arg` is provided. Task-run records remain `planned`, not `solved` or `failed`, until a later isolated execution slice exists.

configured adapter 只运行有界 probe command；未提供 `--baseline-arg` 时默认使用 `--version`。在后续隔离执行切片完成前，task-run records 仍是 `planned`，不是 `solved` 或 `failed`。

Alternative considered: immediately execute task prompts through Codex. That requires sandboxing, workspace copying, transcript capture, scoring, timeout, and credential controls that should be designed as a separate slice.

备选方案：立即通过 Codex 执行 task prompts。那需要 sandboxing、workspace copying、transcript capture、scoring、timeout 与 credential controls，应作为单独切片设计。

### Decision: Use Platform Process Execution

The probe uses `PlatformRuntime.runProcess(command, args, {cwd})`; it never concatenates shell strings. On Windows, platform/Node command resolution remains the host concern, and tests use injected fake platforms.

probe 使用 `PlatformRuntime.runProcess(command, args, {cwd})`；绝不拼接 shell strings。Windows 上 platform/Node command resolution 仍由 host 处理，测试使用注入 fake platforms。

Alternative considered: direct `child_process` from CLI. That bypasses platform abstraction and weakens architecture guardrails.

备选方案：CLI 直接使用 `child_process`。这会绕过 platform abstraction，削弱架构护栏。

## Risks / Trade-offs

- [Risk] A configured external command may still be slow or interactive. -> Mitigation: only support version/probe args in this slice and record failed probes as unavailable/deferred diagnostics.
- [Risk] Version output may contain local paths or account data. -> Mitigation: store bounded output snippets and mark them internal/redacted.
- [Risk] Users may expect real Codex task solving immediately. -> Mitigation: report `planned` task runs and next action that isolated external task execution is a follow-up.

- [Risk] 已配置 external command 仍可能慢或交互式。-> 缓解：本切片只支持 version/probe args，并将失败 probe 记录为 unavailable/deferred diagnostics。
- [Risk] version output 可能包含本地路径或账号信息。-> 缓解：只保存 bounded output snippets，并标记 internal/redacted。
- [Risk] 用户可能期待立即执行真实 Codex 解题。-> 缓解：task runs 报告为 `planned`，next action 指向后续 isolated external task execution。
