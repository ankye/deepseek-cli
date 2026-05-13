## Context

The project now treats the CLI as the first polished product surface, but "better than Claude Code or Codex" cannot be established by public leaderboard links alone. Public benchmarks change over time, usually measure a base model or a benchmark harness, and rarely capture our product-specific strengths such as local context recall, permission UX, reversible edits, evidence refresh, extension governance, and cross-platform terminal behavior.

项目现在把 CLI 作为第一个打磨成熟的产品面，但“比 Claude Code 或 Codex 更强”不能只靠公开 leaderboard 链接证明。公开 benchmark 会变化，通常衡量的是基础模型或 benchmark harness，也很少覆盖我们的产品特性，例如本地上下文回溯、权限 UX、可逆编辑、证据刷新、扩展治理与跨平台终端体验。

## Goals / Non-Goals

**Goals:**

- Define an internal benchmark protocol for real CLI task completion.
- Compare DeepSeek CLI against named external baselines through the same task catalog, constraints, scoring rubric, and evidence schema.
- Separate public benchmark references from DeepSeek-owned product acceptance evidence.
- Capture enough trace data to explain why a run solved, partially solved, or failed a task.
- Make evaluation safe by default: no arbitrary shell, no live provider usage unless explicitly enabled, no raw secret capture, and no external CLI invocation without opt-in.

- 定义真实 CLI task completion 的内部 benchmark protocol。
- 通过相同 task catalog、constraints、scoring rubric 与 evidence schema，对比 DeepSeek CLI 与具名外部 baselines。
- 区分公开 benchmark references 与 DeepSeek-owned 产品验收证据。
- 捕获足够 trace data，解释一次运行为什么 solved、partial 或 failed。
- 默认保持安全：不任意 shell、不默认 live provider、不捕获 raw secret、不在未 opt-in 时调用外部 CLI。

**Non-Goals:**

- Do not claim public leaderboard supremacy as a release gate.
- Do not scrape or vendor external benchmark datasets into the repository.
- Do not automate use of external proprietary CLIs unless a maintainer explicitly configures the executable, credentials, and allowed scope.
- Do not make the first implementation a distributed benchmark service; keep it local and replayable.

- 不把公开 leaderboard 第一名作为 release gate。
- 不抓取或 vendoring 外部 benchmark datasets 到仓库。
- 不自动使用外部专有 CLI，除非维护者显式配置 executable、credentials 与 allowed scope。
- 第一版不做分布式 benchmark service；保持本地可回放。

## Decisions

### Decision: Product Evidence Beats Public Leaderboards

The evaluation report will include an optional "public benchmark references" section, but pass/fail and competitive claims must come from internal runs under `tests/evaluation/` and `tests/acceptance/latest/`.

评估报告可以包含可选的 “public benchmark references” 区域，但 pass/fail 与竞品对比声明必须来自 `tests/evaluation/` 与 `tests/acceptance/latest/` 下的内部运行证据。

Alternative considered: quote the latest SWE-bench or Terminal-Bench score directly in the roadmap. That creates stale claims and does not measure CLI-specific behavior.

备选方案：在路线图里直接引用最新 SWE-bench 或 Terminal-Bench 分数。这样会产生易过期声明，也无法衡量 CLI-specific behavior。

### Decision: Task Catalog Uses Product-Representative Fixtures

The task catalog will include deterministic tasks across bug fix, multi-file refactor, failing test repair, docs/spec update, command-line workflow, context recall, reversible edit, extension/MCP safety, and release-readiness evidence. Each task defines the starting fixture, prompt, allowed tools, time budget, expected checks, and scoring rubric.

任务目录会覆盖确定性任务：bug fix、多文件重构、失败测试修复、docs/spec 更新、命令行工作流、上下文回溯、可逆编辑、extension/MCP safety 与 release-readiness evidence。每个任务定义 starting fixture、prompt、allowed tools、time budget、expected checks 与 scoring rubric。

Alternative considered: use only benchmark-imported issues. That would help model comparison, but it would miss the product mechanics we are deliberately building.

备选方案：只使用 benchmark-imported issues。它有助于模型比较，但会漏掉我们正在刻意打造的产品机制。

### Decision: Baselines Are Adapters, Not Hard Dependencies

The runner will model baselines as adapters: `deepseek-cli`, `external-cli`, and `manual-import`. External baselines such as Claude Code or Codex are configured locally and disabled by default. The report records baseline identity, version command output if available, redaction metadata, and unavailable/deferred status when not configured.

runner 会把 baselines 建模为 adapters：`deepseek-cli`、`external-cli` 与 `manual-import`。Claude Code 或 Codex 等外部 baseline 由本地配置，默认关闭。报告记录 baseline identity、可用时的 version command output、redaction metadata，以及未配置时的 unavailable/deferred 状态。

Alternative considered: bake hard-coded `claude` and `codex` commands into tests. That would make deterministic tests depend on local tools, credentials, network, and vendor behavior.

备选方案：把固定 `claude` 与 `codex` 命令写进测试。这会让确定性测试依赖本地工具、凭证、网络与供应商行为。

### Decision: Score Both Outcome And Operating Quality

The primary score is task completion: `solved`, `partial`, `failed`, or `invalid`. Secondary metrics include test pass delta, patch size, safety violations, retries, user interventions, elapsed time, token/cost estimate, context recall quality, revert/recovery use, and evidence completeness.

主分数是 task completion：`solved`、`partial`、`failed` 或 `invalid`。次级指标包括 test pass delta、patch size、safety violations、retries、user interventions、elapsed time、token/cost estimate、context recall quality、revert/recovery use 与 evidence completeness。

Alternative considered: a single win-rate score. That hides whether failures come from model reasoning, context loss, terminal UX, safety blocks, or release/evidence workflow gaps.

备选方案：只做单一 win-rate。它会隐藏失败来源到底是模型推理、上下文丢失、终端 UX、安全拦截还是 release/evidence workflow 缺口。

### Decision: Evidence Is Local, Redacted, And Replayable

Each evaluation run writes a JSON summary, JSONL per-task records, sanitized stdout/stderr snippets, final patch metadata, and check outputs. Evidence belongs under `tests/acceptance/latest/` for release summaries and under `tests/evaluation/runs/` for detailed local runs.

每次评估运行写入 JSON summary、JSONL per-task records、sanitized stdout/stderr snippets、final patch metadata 与 check outputs。release summaries 放在 `tests/acceptance/latest/`，详细本地运行放在 `tests/evaluation/runs/`。

Alternative considered: store only markdown summaries. Markdown is useful for humans but weak for CI, trend analysis, and regression detection.

备选方案：只存 markdown summaries。Markdown 适合人工阅读，但不利于 CI、趋势分析与回归检测。

## Risks / Trade-offs

- [Risk] External CLI results are noisy because vendor tools, models, and network behavior change. -> Mitigation: record version/config, separate deterministic internal evidence from opt-in external comparisons, and never make unavailable baselines block local release.
- [Risk] Benchmarks can incentivize overfitting. -> Mitigation: keep a public stable subset plus a rotating private/local fixture subset and report both.
- [Risk] Evaluation tasks may become expensive. -> Mitigation: provide `--dry-run`, `--smoke`, and `--full` modes, mirroring diagnostics refresh.
- [Risk] Captured transcripts may include sensitive data. -> Mitigation: reuse observability redaction, avoid raw secret capture, and store bounded snippets with metadata.
- [Risk] Competitive claims can become stale. -> Mitigation: require report timestamps and evidence ids when roadmap or release docs compare against Claude Code or Codex.

- [Risk] 外部 CLI 结果有噪声，因为 vendor tools、models 与 network behavior 会变化。-> 缓解：记录 version/config，区分 deterministic internal evidence 与 opt-in external comparisons，且 unavailable baselines 不阻塞本地 release。
- [Risk] benchmark 可能诱导过拟合。-> 缓解：保留公开稳定子集，同时维护 rotating private/local fixture subset，并分别报告。
- [Risk] evaluation tasks 可能成本较高。-> 缓解：提供 `--dry-run`、`--smoke` 与 `--full` 模式，类似 diagnostics refresh。
- [Risk] 捕获 transcript 可能含敏感信息。-> 缓解：复用 observability redaction，不捕获 raw secret，保存 bounded snippets 与 metadata。
- [Risk] 竞品声明容易过期。-> 缓解：路线图或 release docs 对比 Claude Code/Codex 时必须带 report timestamp 与 evidence ids。
