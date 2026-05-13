## Context

`deepseek diagnostics release` now produces structured local evidence for package metadata, build output, acceptance files, package surface safety, support-bundle policy, and release verification commands. That is strong evidence, but it is still optimized for diagnostics consumers rather than a human or CI job asking a simpler question: "Can this CLI proceed toward publish dry-run, and what blocks it?"

`deepseek diagnostics release` 现在已经为 package metadata、build output、acceptance files、package surface safety、support-bundle policy 与 release verification commands 产出结构化本地证据。这些证据足够强，但它更偏 diagnostics consumer，而不是直接回答人或 CI 的问题：“这个 CLI 现在能否进入 publish dry-run，阻塞点是什么？”

## Goals / Non-Goals

**Goals:**

- Add a read-only `diagnostics verify` command that summarizes release readiness into `ready`, `blocked`, or `warn`.
- Reuse `collectReleaseReadinessEvidence()` so release and verify output cannot drift.
- Include blocking checks, warning checks, missing evidence paths, required command plan, dry-run command, and next action in text, JSON, and JSONL.
- Keep the command deterministic, local, redacted, and terminal-control-free in structured output.

- 新增只读 `diagnostics verify` 命令，将 release readiness 汇总成 `ready`、`blocked` 或 `warn`。
- 复用 `collectReleaseReadinessEvidence()`，避免 release 与 verify 输出漂移。
- 在 text、JSON 与 JSONL 中包含 blocking checks、warning checks、missing evidence paths、required command plan、dry-run command 与 next action。
- 命令保持确定性、本地、脱敏，并且 structured output 不含 terminal controls。

**Non-Goals:**

- Do not run `npm publish`, `npm publish --dry-run`, full tests, live model calls, network calls, or provider SDKs.
- Do not replace `diagnostics release`; `verify` is a decision-oriented projection over the same evidence.
- Do not add a new package or external dependency.

- 不运行 `npm publish`、`npm publish --dry-run`、完整测试、live model calls、网络调用或 provider SDKs。
- 不替代 `diagnostics release`；`verify` 是同一证据上的决策型 projection。
- 不新增 package 或外部依赖。

## Decisions

### Decision: Model verify as a diagnostics command

`verify` belongs under `diagnostics` because it reads and renders release evidence. It does not belong under `readiness` because readiness commands are broader local install/config/auth checks, while this command is a release gate projection.

`verify` 归属 `diagnostics`，因为它读取并渲染 release evidence。它不放在 `readiness` 下，因为 readiness commands 更偏本地 install/config/auth 检查，而本命令是 release gate projection。

Alternative considered: add a top-level `release verify` command. That would create a new command family before release channels exist and duplicate diagnostics rendering rules.

备选方案：新增顶层 `release verify` 命令。这样会在 release channels 成熟前引入新命令族，并重复 diagnostics rendering rules。

### Decision: Add a small additive DTO

Add `ReleaseVerificationSummary` to platform contracts so the decision record is shared and JSON-serializable. The DTO stores derived check ids and paths, not host handles or filesystem objects.

在 platform contracts 中新增 `ReleaseVerificationSummary`，使决策记录共享且 JSON-serializable。该 DTO 存储派生 check ids 与 paths，不包含 host handles 或 filesystem objects。

Alternative considered: inline the summary only in CLI result types. That would make later CI/server/host projection re-learn the same release decision model.

备选方案：只在 CLI result types 中内联 summary。这会让后续 CI/server/host projection 重新学习同一套 release decision model。

### Decision: Read-only command plan

The command plan lists required commands and the next recommended command, but it does not execute them. This keeps `diagnostics verify` fast, deterministic, offline, and safe to run repeatedly.

command plan 会列出 required commands 与下一条推荐命令，但不会执行它们。这让 `diagnostics verify` 快速、确定、离线，并且可重复安全运行。

Alternative considered: run selected fast checks automatically. That would blur diagnostics with execution and make output depend on local environment speed and side effects.

备选方案：自动运行部分快速检查。这会混淆 diagnostics 与 execution，并让输出依赖本地环境速度与副作用。

## Risks / Trade-offs

- [Risk] Users may expect `verify` to run all tests. -> Mitigation: text and docs state it is a release evidence verifier and include the explicit command plan. / 用户可能期待 `verify` 运行所有测试。-> 缓解：text 与 docs 明确它是 release evidence verifier，并列出 command plan。
- [Risk] Release diagnostics and verify summaries could drift. -> Mitigation: both are derived from `collectReleaseReadinessEvidence()` and covered by parity tests. / release diagnostics 与 verify summary 可能漂移。-> 缓解：两者都从 `collectReleaseReadinessEvidence()` 派生，并由 parity tests 覆盖。
- [Risk] Missing acceptance evidence can hide under a passing package surface. -> Mitigation: warnings are first-class and include missing paths plus refresh guidance. / 缺失 acceptance evidence 可能被 package surface pass 掩盖。-> 缓解：warnings 是一等字段，包含 missing paths 与刷新建议。
