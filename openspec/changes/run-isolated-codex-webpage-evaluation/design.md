## Context

`deepseek diagnostics evaluate` currently plans task runs and can probe a configured external baseline, but it does not execute tasks or compare DeepSeek CLI against Codex and Claude with owned evidence. The first executable lane should be narrow: the existing webpage-generation task is deterministic enough to validate local artifacts without requiring browser automation.

`deepseek diagnostics evaluate` 当前只规划 task runs，并可探测已配置 external baseline，但还不会执行任务，也不会用自有证据对比 DeepSeek CLI、Codex 与 Claude。第一条可执行通道应保持收窄：现有 webpage-generation task 可以用本地产物检查器确定性校验，不需要先引入浏览器自动化。

## Goals / Non-Goals

**Goals:**
- Compare `deepseek-cli`, `codex`, and `claude-code` under the same task id, prompt summary, time budget, checker, and artifact rules.
- Execute only when explicitly requested by `--execute-task <task-id>` and, for external tools, `--allow-external-baseline`.
- Run every executable baseline in an isolated temp workspace, never in the repository root.
- Record metrics that explain gaps: first-run success, check pass rate, correction count, command failures, elapsed time, generated file counts, bytes, structure score, diagnostics, and bounded output previews.
- Record instrumentation events for run lifecycle, workspace creation, prompt delivery, command execution, checker execution, artifact scanning, and evidence writes so metrics can be derived from evidence.
- Treat unavailable tools or missing credentials as evidence, not crashes.

**Non-Goals:**
- No broad autonomous execution for every catalog task in this change.
- No destructive permission bypass for Codex or Claude.
- No claim that one product is globally better based on one task.
- No copying external reference implementation details into OpenSpec artifacts.

**目标：**
- 在同一 task id、prompt summary、time budget、checker 与 artifact rules 下对比 `deepseek-cli`、`codex`、`claude-code`。
- 只有显式传入 `--execute-task <task-id>` 时执行；external tools 还必须传入 `--allow-external-baseline`。
- 每个可执行 baseline 都在隔离临时 workspace 中运行，绝不在仓库根目录运行。
- 记录能解释差距的 metrics：首轮成功、check pass rate、纠错次数、命令失败次数、耗时、生成文件数、字节数、结构分、诊断与有界输出预览。
- 记录 run lifecycle、workspace creation、prompt delivery、command execution、checker execution、artifact scanning 与 evidence writes 的 instrumentation events，使 metrics 能从证据推导。
- 工具不可用或凭据缺失要记录为证据，而不是使评测崩溃。

**非目标：**
- 本变更不开放 catalog 中所有任务的广义自动执行。
- 不对 Codex 或 Claude 使用破坏性 permission bypass。
- 不基于单个任务断言某个产品全局更强。
- 不把外部参考实现细节复制进 OpenSpec artifacts。

## Decisions

1. **Use a multi-baseline comparison record.**
   The summary will include baseline aggregates and gap findings derived from task-run records. This keeps raw run evidence and product-level conclusions separate.

   **采用多 baseline 对比记录。** summary 将包含从 task-run records 推导出的 baseline aggregates 与 gap findings，使原始运行证据和产品层结论分离。

2. **Keep execution task-scoped.**
   `--execute-task eval.webpage.generation` is the first supported execution path. Other tasks remain planned or deferred until each gets a safe fixture and checker.

   **执行按 task 收窄。** `--execute-task eval.webpage.generation` 是第一条支持的执行路径。其他任务在具备安全 fixture 与 checker 前保持 planned 或 deferred。

3. **Use adapter-specific safe defaults.**
   Codex uses `codex exec` with workspace-write sandbox and no repo-root cwd. Claude uses `claude -p` with non-persistent output and non-bypass permission mode. DeepSeek uses the current local CLI entrypoint, optionally live in later work.

   **使用适配器安全默认值。** Codex 使用带 workspace-write sandbox 且 cwd 不在 repo root 的 `codex exec`。Claude 使用非持久输出与非 bypass 权限模式的 `claude -p`。DeepSeek 使用当前本地 CLI entrypoint，后续再扩展 live 模式。

4. **Expose structure metrics as first-class evidence.**
   Webpage generation is not just pass/fail. Generated file counts, source/asset split, byte distribution, and structure score help identify whether an agent dumps everything into one file or creates maintainable artifacts.

   **把结构指标作为一等证据。** 网页生成不只看通过/失败。生成文件数、source/asset 分布、字节分布与 structure score 可以判断 agent 是否把所有内容塞进一个文件，或产出更可维护的结构。

5. **Instrument first, score second.**
   Command success rate, first-run success, correction signals, and structure score must be derived from event records, process results, checker output, and artifact scans. Manual review can calibrate future rubrics, but it is not the source of truth for comparison statistics.

   **先插桩，再评分。** 命令成功率、首轮成功、纠错信号与结构分必须来自 event records、process results、checker output 与 artifact scans。人工评审可以校准未来 rubric，但不是对比统计的事实来源。

## Risks / Trade-offs

- **External CLI command shape changes** -> Keep command adapters configurable and record probe failures as diagnostics.
- **外部 CLI 参数变化** -> 命令适配器保持可配置，并把 probe failure 记录为 diagnostics。

- **Single-task bias** -> Label webpage generation as first executable lane and continue expanding the catalog before product claims.
- **单任务偏差** -> 明确网页生成只是第一条可执行通道，产品结论前继续扩充 catalog。

- **DeepSeek current CLI may fail without live credentials or tool-writing behavior** -> Treat this as a real product gap and record it, rather than hiding it.
- **当前 DeepSeek CLI 没有 live 凭据或工具写文件能力时可能失败** -> 将其作为真实产品差距记录，而不是隐藏。

- **Heuristic correction metrics are imperfect for external tools** -> Use bounded stdout/stderr signals now and add native event adapters later.
- **external tools 的启发式纠错指标不完美** -> 当前先使用有界 stdout/stderr 信号，后续增加原生事件适配器。
