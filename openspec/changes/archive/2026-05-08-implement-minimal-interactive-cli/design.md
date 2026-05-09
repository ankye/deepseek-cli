## Context

DeepSeek currently has kernel-backed headless CLI commands, local readiness commands, core coding tools, runtime events, and deterministic regression harnesses. The next R1 milestone is a minimal terminal session that users can keep open while still preserving the architecture rule that hosts adapt runtime events and never own execution state.

DeepSeek 当前已有 kernel-backed headless CLI commands、local readiness commands、core coding tools、runtime events 和 deterministic regression harnesses。下一个 R1 里程碑是一个可持续打开的最小终端会话，同时继续遵守架构规则：host 只适配 runtime events，不拥有 execution state。

## Goals / Non-Goals

**Goals:**

- Provide `deepseek interactive` and safe default `deepseek` interactive startup when stdin/stdout are TTYs and no headless/readiness command is provided.
- 提供 `deepseek interactive`，并在 stdin/stdout 为 TTY 且没有 headless/readiness command 时安全默认启动 `deepseek` interactive。
- Reuse the runtime kernel event stream and text/stream-json renderers already used by headless mode.
- 复用 headless mode 已使用的 runtime kernel event stream 与 text/stream-json renderers。
- Support minimal controls: `/help`, `/exit`, `/quit`, `/clear`, `/cancel`, and readiness command delegation where appropriate.
- 支持最小控制命令：`/help`、`/exit`、`/quit`、`/clear`、`/cancel`，以及适当的 readiness command delegation。
- Keep input/output deterministic enough for scripted tests using injected streams and fake runtime dependencies.
- 通过注入 streams 与 fake runtime dependencies，让输入输出足够确定，可用于脚本化测试。
- Add e2e and golden tests that prove interactive and headless consume the same event semantics.
- 增加 e2e 与 golden tests，证明 interactive 与 headless 消费相同 event semantics。

**Non-Goals:**

- No rich Ink/TUI transcript, virtualized rendering, vim mode, keybinding editor, voice input, banners, tips, or notifications in this change.
- 本变更不实现 rich Ink/TUI transcript、virtualized rendering、vim mode、keybinding editor、voice input、banners、tips 或 notifications。
- No persistent session resume/fork; this is a prompt loop over current runtime behavior only.
- 不实现持久 session resume/fork；这里只是在当前 runtime behavior 之上的 prompt loop。
- No live provider requirement; default tests continue using deterministic fakes.
- 不要求 live provider；默认测试继续使用 deterministic fakes。

## Decisions

### Decision 1: CLI shell is a host adapter over a reusable interactive session runner

The CLI app will expose a small interactive runner that accepts input/output streams, a runtime factory, command handlers, and terminal capability flags. This keeps `src/apps/cli` thin and testable while avoiding a new shared package before there is a second host consumer.

CLI app 将暴露一个小型 interactive runner，接收 input/output streams、runtime factory、command handlers 和 terminal capability flags。这样 `src/apps/cli` 保持轻薄且可测试，同时在第二个 host consumer 出现前避免过早增加共享包。

Alternative considered: create a `terminal-ui` package now. Rejected because R1 only needs one minimal CLI host; extracting a UI package before VSCode/server consumers exist would add API surface without proven reuse.

备选方案：现在创建 `terminal-ui` package。拒绝原因：R1 只需要一个最小 CLI host；在 VSCode/server consumer 出现前抽 UI package 会增加尚未验证复用价值的 API surface。

### Decision 2: Runtime work stays kernel-backed per prompt

Each non-command input line becomes one governed runtime invocation using the same runtime factory and renderer path as `deepseek -p`. The interactive loop owns only input sequencing, display, and lifecycle of the current invocation.

每个非命令输入行都会变成一次 governed runtime invocation，使用与 `deepseek -p` 相同的 runtime factory 和 renderer path。interactive loop 只拥有 input sequencing、display，以及当前 invocation 生命周期。

Alternative considered: keep a long-running custom agent loop inside CLI. Rejected because it would bypass the runtime kernel, scheduler, policy, event bus, and golden replay boundaries.

备选方案：在 CLI 内维护一个 long-running custom agent loop。拒绝原因：这会绕过 runtime kernel、scheduler、policy、event bus 和 golden replay 边界。

### Decision 3: Minimal control commands are command-system visible

Interactive-only controls will be represented by structured command metadata or a command-system adapter, even if their implementation remains local to the CLI shell. Side-effecting or readiness commands must continue through `command-system` and platform contracts.

interactive-only controls 将通过结构化 command metadata 或 command-system adapter 表达，即使实现仍保留在 CLI shell 本地。具有副作用或 readiness commands 必须继续通过 `command-system` 和 platform contracts。

Alternative considered: parse slash commands as anonymous strings inside the loop. Rejected because future help projection, plugins, and VSCode/server parity need command identities and host support metadata.

备选方案：在 loop 内把 slash commands 当作匿名字符串解析。拒绝原因：未来 help projection、plugins、VSCode/server parity 都需要 command identity 与 host support metadata。

### Decision 4: Cancellation is host-control first, runtime abort second

The initial implementation will track the active invocation with an `AbortController` or equivalent runtime cancellation handle. `/cancel` and SIGINT cancel the active turn when one exists; otherwise they do not terminate the whole shell unless the user sends exit/EOF or repeats a terminal interrupt according to the implementation policy.

初始实现会通过 `AbortController` 或等价 runtime cancellation handle 跟踪当前 invocation。存在 active turn 时，`/cancel` 与 SIGINT 会取消当前 turn；否则不会直接退出整个 shell，除非用户发送 exit/EOF 或根据实现策略重复 terminal interrupt。

Alternative considered: make Ctrl+C always exit. Rejected because coding agents frequently need to cancel one long-running tool/model step without losing the terminal session.

备选方案：让 Ctrl+C 永远退出。拒绝原因：coding agents 经常需要取消一个长时间运行的 tool/model step，而不是丢失整个终端会话。

### Decision 5: Tests drive the minimum product contract

The first implementation must include unit tests for parsing/rendering, integration tests for runtime event consumption, golden replay for event parity, and e2e tests for prompt, help, exit, and cancellation paths. Live provider tests remain optional and out of scope.

第一版实现必须包含 parsing/rendering unit tests、runtime event consumption integration tests、event parity golden replay，以及 prompt、help、exit、cancellation 路径的 e2e tests。live provider tests 仍为可选且不在本范围。

Alternative considered: rely on manual terminal testing. Rejected because this product is infrastructure and must fail in CI before regressions reach users.

备选方案：依赖人工终端测试。拒绝原因：这是基础设施产品，必须在 regression 触达用户前由 CI 失败暴露。

## Risks / Trade-offs

- [Risk] Minimal renderer may feel plain compared with Claude/Codex. → Mitigation: explicitly scope rich TUI to R6 and ensure this renderer is stable, scriptable, and protocol-aligned.
- [风险] minimal renderer 相比 Claude/Codex 可能显得朴素。→ 缓解：明确把 rich TUI 放到 R6，确保当前 renderer 稳定、可脚本化、与 protocol 对齐。
- [Risk] Interactive defaults can break scripts if `deepseek` with no args blocks on stdin. → Mitigation: only auto-start interactive mode when terminal flags prove interactive use; non-TTY no-arg usage should print help or fail fast.
- [风险] 如果无参数 `deepseek` 阻塞 stdin，可能破坏脚本。→ 缓解：只有 terminal flags 证明是交互使用时才默认启动 interactive mode；非 TTY 无参数应输出 help 或快速失败。
- [Risk] Cancellation behavior can diverge from future protocol control messages. → Mitigation: model cancellation around correlation ids and runtime abort signals so it can later map to protocol control messages without user-facing change.
- [风险] cancellation behavior 可能与未来 protocol control messages 分叉。→ 缓解：围绕 correlation ids 与 runtime abort signals 建模 cancellation，使其后续可映射到 protocol control messages 而不改变用户行为。
- [Risk] Command parsing can grow into a second command framework. → Mitigation: slash/control commands must have explicit command metadata and route side-effecting work through `command-system`.
- [风险] command parsing 可能膨胀成第二套 command framework。→ 缓解：slash/control commands 必须有显式 command metadata，具备副作用的工作必须通过 `command-system`。

## Migration Plan

1. Add the OpenSpec and tests first. / 先增加 OpenSpec 与测试。
2. Implement the interactive runner behind an explicit `interactive` command. / 在显式 `interactive` command 后实现 interactive runner。
3. Enable no-arg TTY default only after scripted non-TTY behavior is covered. / 只有在脚本化 non-TTY 行为被覆盖后，才启用无参数 TTY 默认入口。
4. Keep headless/readiness command behavior unchanged. / 保持 headless/readiness command 行为不变。

Rollback is simple: keep `interactive` disabled or hidden while preserving headless CLI commands.

回滚方式简单：禁用或隐藏 `interactive`，同时保留 headless CLI commands。
