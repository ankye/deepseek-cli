## Context

DeepSeek currently has a working core tool set and strict package scorecards, but the capability model still centers on individual tools. That makes early progress measurable, yet it does not express baseline parity with mature agent CLIs where filesystem, patching, shell, agents, web, browser, MCP, media, design, memory, scheduling, and workflow composition are separate product surfaces.

DeepSeek 当前已有可运行的 core tool set 与严格 package scorecards，但能力模型仍围绕单个工具。这能度量早期进展，却无法表达与成熟 Agent CLI 的 baseline parity；成熟产品中 filesystem、patching、shell、agents、web、browser、MCP、media、design、memory、scheduling 与 workflow composition 都是独立产品面。

The reference tree under `参考/claude-code-2.1.88` is useful as capability-shape input: it shows that mature CLIs expose many surfaces beyond read/edit/shell, including task workers, plan mode, worktrees, MCP resources, skills, LSP, REPL, cron/sleep, and browser/desktop style commands. OpenSpec must not copy that implementation. The DeepSeek catalog should describe our own host-agnostic contracts.

`参考/claude-code-2.1.88` 只作为能力形态输入：它说明成熟 CLI 不只包含 read/edit/shell，还包含 task workers、plan mode、worktrees、MCP resources、skills、LSP、REPL、cron/sleep 与 browser/desktop 类命令。OpenSpec 不得复制参考实现；DeepSeek catalog 必须描述我们自己的 host-agnostic contracts。

## Goals / Non-Goals

**Goals:**

- Define 16 domains and 64 scoring families as the first baseline parity target.
- 将 16 个 domains 与 64 个 scoring families 定义为第一版 baseline parity 目标。
- Make every model-visible capability, MCP projection, skill/hook/plugin contribution, and future native connector declare a family.
- 让每个 model-visible capability、MCP projection、skill/hook/plugin contribution 与未来 native connector 都声明 family。
- Score family absence as zero while allowing implemented, planned, unavailable, and not-applicable states to be reported separately.
- 缺失 family 按零分，同时分别报告 implemented、planned、unavailable 与 not-applicable 状态。
- Treat tool chaining as governed runtime pipelines with typed artifacts and evidence, not private executor-to-executor calls.
- 将工具衔接视为受治理 runtime pipelines，使用 typed artifacts 与 evidence，而不是 executor-to-executor 私下调用。
- Extend live coverage from single tool invocation to representative family tasks.
- 将 live coverage 从单工具调用扩展到代表性 family tasks。

**Non-Goals:**

- Do not implement all 64 families in this change.
- 本变更不实现全部 64 个 families。
- Do not create placeholder tools for planned or absent families; only executable capabilities may appear as tool entries.
- 不为 planned 或 absent families 创建占位工具；只有可执行 capability 才能作为 tool entry 出现。
- Do not make all missing families release blockers immediately.
- 不立即把所有缺失 families 变成 release blockers。
- Do not copy reference CLI code, prompts, command names, telemetry, or product-specific internals.
- 不复制参考 CLI 的代码、prompts、命令名、telemetry 或产品内部细节。
- Do not allow shell pipes to become the platform orchestration model.
- 不允许 shell pipe 成为平台编排模型。

## Decisions

### Decision: Use Domains For Navigation And Families For Scoring

The catalog has two levels:

- `domain`: a broad product area for docs, UI grouping, and summaries.
- `family`: the strict scoring unit with stable id, maturity, risk, operation profiles, host requirements, and rubric id.

Catalog first version:

| Domain | Families |
| --- | --- |
| Workspace I/O | `file.read`, `file.list`, `workspace.glob`, `asset.view-local` |
| Search and code intelligence | `search.text`, `search.symbol`, `code.diagnostics-lsp`, `notebook.read` |
| Mutation and patching | `file.write`, `file.edit`, `patch.apply`, `revert.undo` |
| Shell and process | `shell.run`, `process.output`, `process.kill`, `repl.execute` |
| Git and build | `git.status-diff`, `git.history-branch`, `build.test-lint-typecheck`, `package.manager` |
| Planning and control | `plan.todo`, `mode.plan-auto-review`, `user.input`, `approval.permission` |
| Pipeline and composition | `pipeline.sequence`, `pipeline.parallel`, `pipeline.artifact-routing`, `pipeline.stream` |
| Agents and tasks | `agent.spawn`, `agent.message-continue`, `agent.wait-result`, `agent.stop-close` |
| Web and public data | `web.search`, `web.fetch`, `web.extract`, `web.data-lookup` |
| Browser automation | `browser.navigate`, `browser.interact`, `browser.inspect`, `browser.screenshot` |
| MCP connectors | `mcp.server-lifecycle`, `mcp.tool-call`, `mcp.resource-read`, `mcp.prompt` |
| Extensions and local commands | `skill.list-activate`, `hook.list-run`, `plugin.install-verify`, `command.palette-slash` |
| Media and images | `image.generate`, `image.edit`, `image.search-stock`, `image.inspect` |
| Design and canvas | `design.document-state`, `design.node-query`, `design.batch-edit`, `design.export-snapshot` |
| Memory, context, and session | `memory.read-write`, `context.project-index`, `session.resume-fork`, `compact.summary` |
| Remote, scheduling, and observability | `remote.runtime`, `worktree.environment`, `schedule.sleep-cron`, `observability.trace-budget` |

Alternative considered: keep eight product groups. Rejected because broad groups make absent abilities invisible and let unrelated capabilities compensate for each other.

备选方案：保持八个产品大类。拒绝原因是粗分类会隐藏缺失能力，并允许不相关能力互相抵分。

### Decision: Capability Manifests Carry Family Metadata

Every projectable or executable capability will carry `toolFamily`, `toolDomain`, `maturity`, `riskClass`, `operationProfiles`, `hostRequirements`, and `scorecardRubricId`. For MCP, plugin, skill, hook, and future connector surfaces, the projection must include equivalent metadata even if the underlying source is external.

每个可投影或可执行 capability 都携带 `toolFamily`、`toolDomain`、`maturity`、`riskClass`、`operationProfiles`、`hostRequirements` 与 `scorecardRubricId`。MCP、plugin、skill、hook 与未来 connector 即使来源外部，也必须在投影中包含等价 metadata。

Alternative considered: infer family from capability id prefixes. Rejected because external connectors and future host features need explicit classification.

备选方案：从 capability id 前缀推断 family。拒绝原因是外部 connector 与未来 host features 需要显式分类。

### Decision: Tool Source Layout Follows Domain And Family Ownership

The current `src/packages/core-coding-tools/src/tools/<tool>/` flat layout should be removed as part of the first implementation slice. Built-in tool implementations should move directly to:

```text
src/packages/core-coding-tools/src/
  catalog/
    families.ts
    mappings.ts
  families/
    workspace-io/
      file-read/
      file-list/
      workspace-glob/
      asset-view-local/
    mutation-patching/
      file-write/
      file-edit/
      patch-apply/
      revert-undo/
    shell-process/
      shell-run/
      process-output/
      process-kill/
      repl-execute/
    pipeline-composition/
      sequence/
      parallel/
      artifact-routing/
      stream/
  shared/
    tool-kit.ts
    family-metadata.ts
```

Connector-owned families should stay in owner packages and project through the catalog instead of being forced into `core-coding-tools`:

- `mcp.*` stays in `mcp-gateway`.
- `agent.*` stays split between `agent-management`, runtime, and core model-visible wrappers.
- `skill.*`, `hook.*`, and `plugin.*` stay in their existing packages.
- `browser.*`, `image.*`, and `design.*` can land either as native packages or MCP profile packages, but must still emit catalog family metadata.

当前 `src/packages/core-coding-tools/src/tools/<tool>/` 平铺结构应在第一轮实现中直接移除。内置工具实现迁移到 `families/<domain>/<family>/`。Connector-owned families 留在所属 package，通过 catalog 投影，不强塞进 `core-coding-tools`。

Alternative considered: keep a flat directory or leave compatibility re-export shims under `tools/`. Rejected because family-level scorecards, ownership, and migration will become brittle once browser, media, design, and pipeline tools arrive, and shims would create two places for future developers to look.

备选方案：继续平铺目录，或在 `tools/` 下保留兼容 re-export shims。拒绝原因是 browser、media、design 与 pipeline 工具进入后，family-level scorecards、ownership 与 migration 都会变脆；shim 也会制造两个需要维护的位置。

### Decision: Tool Pipelines Are Runtime-Owned

Tool executors must not call other tool executors directly. A pipeline is a runtime-owned plan of steps where each step consumes typed input, artifact references, or evidence records produced by previous steps. The runtime records policy/preflight decisions for every step and routes bounded model feedback when needed.

工具 executor 不得直接调用其他工具 executor。Pipeline 是 runtime 拥有的 step plan；每一步消费 typed input、artifact references 或前序 step 产生的 evidence records。runtime 必须记录每一步的 policy/preflight decision，并在需要时路由 bounded model feedback。

Shell pipes are allowed only inside the `shell.run` family when policy allows shell semantics. They are opaque process behavior, not a substitute for typed tool composition.

Shell pipe 只在 `shell.run` family 内、且 policy 允许 shell semantics 时存在。它们属于不透明 process behavior，不能替代 typed tool composition。

Alternative considered: allow tool result stdout to feed another tool automatically. Rejected because it bypasses schema validation, redaction, permissions, and replay.

备选方案：允许工具 stdout 自动喂给另一个工具。拒绝原因是它会绕过 schema validation、redaction、permissions 与 replay。

### Decision: Score Family Coverage Separately From Task Completion

Each family scorecard reports:

- `catalogPresence`: family exists in catalog.
- `implementationStatus`: implemented, planned, absent, unavailable, deprecated.
- `staticContractScore`: schemas, manifests, metadata, tests.
- `liveToolScore`: model emitted the tool or family operation, preflight accepted/repaired, runtime executed, result was returned.
- `taskOutcomeScore`: representative task completed and verified.
- `safetyScore`: permission, sandbox, redaction, timeout, and failure behavior.

Only passed criteria contribute. Missing, partial, failed, and unassessed criteria contribute zero. `not_applicable` is excluded only when a family is outside a host/product edition by explicit catalog policy.

每个 family scorecard 输出 `catalogPresence`、`implementationStatus`、`staticContractScore`、`liveToolScore`、`taskOutcomeScore` 与 `safetyScore`。只有通过的 criteria 得分；missing、partial、failed、unassessed 均为零。只有 catalog policy 明确说明某 family 不属于某 host/product edition 时，`not_applicable` 才能排除。

Alternative considered: aggregate by domain only. Rejected because a domain score can hide missing high-value families such as `patch.apply` or `browser.screenshot`.

备选方案：只按 domain 聚合。拒绝原因是 domain 分数会隐藏 `patch.apply` 或 `browser.screenshot` 等高价值 family 缺失。

### Decision: Baseline Parity Is A Matrix, Not A Promise That Everything Exists

The first catalog does not claim all 64 families are implemented. It requires each family to be visible as implemented, planned, absent, unavailable, or not-applicable. Planned or absent families keep an empty tool list until a concrete executable capability exists. Competitive parity reports must show total families, implemented families, live-covered families, task-covered families, and strict objective score.

第一版 catalog 不声称 64 个 families 全部已实现。它要求每个 family 都可见为 implemented、planned、absent、unavailable 或 not-applicable。planned 或 absent family 在真实可执行 capability 出现前必须保持空 tool list。竞争 parity 报告必须显示 total families、implemented families、live-covered families、task-covered families 与 strict objective score。

Alternative considered: only add families when implemented. Rejected because that repeats the current problem: missing categories disappear from the denominator.

备选方案：只在实现时加入 family。拒绝原因是这会重复当前问题：缺失类别从分母里消失。

## Risks / Trade-offs

- [Risk] The catalog feels large for v1. -> Mitigation: implementation can be phased; scoring remains honest because absent families are explicit.
- [风险] catalog 对 v1 来说显得很大。-> 缓解：实现可以分阶段；缺失 family 显式存在，因此评分诚实。
- [Risk] External connectors have inconsistent schemas. -> Mitigation: MCP/plugin projections must normalize into family metadata before model projection.
- [风险] 外部 connectors schema 不一致。-> 缓解：MCP/plugin projections 在模型投影前必须归一化 family metadata。
- [Risk] Pipeline composition can become a hidden scripting engine. -> Mitigation: runtime owns pipeline steps, every step has policy/preflight/evidence, and executors cannot call each other directly.
- [风险] Pipeline composition 可能变成隐藏脚本引擎。-> 缓解：runtime 拥有 pipeline steps，每一步都有 policy/preflight/evidence，executor 不能互调。
- [Risk] Scores may initially drop sharply. -> Mitigation: this is desired; the purpose is to reveal missing parity instead of smoothing it away.
- [风险] 分数初期可能大幅下降。-> 缓解：这是预期效果；目标是暴露缺失 parity，而不是把它抹平。

## Migration Plan

1. Add catalog and scorecard contract types in `platform-contracts`.
2. Add the 16-domain/64-family fixture and map existing 20 core tool ids to families.
3. Add registry validation for family metadata.
4. Add scorecard collection that marks unmapped or absent families as zero.
5. Add pipeline contract records for sequence, parallel, artifact routing, and stream routing.
6. Extend live coverage evidence to record family-level task scenarios.
7. Surface family matrix in diagnostics and acceptance evidence.

1. 在 `platform-contracts` 增加 catalog 与 scorecard contract types。
2. 增加 16-domain/64-family fixture，并把现有 20 个 core tool ids 映射到 families。
3. 增加 registry 对 family metadata 的校验。
4. 增加 scorecard collection，将未映射或缺失 families 计为零。
5. 增加 sequence、parallel、artifact routing 与 stream routing 的 pipeline contract records。
6. 扩展 live coverage evidence，记录 family-level task scenarios。
7. 在 diagnostics 与 acceptance evidence 中输出 family matrix。

Rollback is additive: keep existing 20 core tool behavior and remove the new catalog/scorecard output from diagnostics.

回滚路径是 additive：保留现有 20 个 core tools 行为，从 diagnostics 中移除新增 catalog/scorecard 输出。

## Open Questions

- Should `browser.*`, `image.*`, and `design.*` first land as native core tools, MCP profiles, or both?
- `browser.*`、`image.*` 与 `design.*` 第一阶段应作为 native core tools、MCP profiles，还是二者都支持？
- Should parity thresholds be global, or should CLI, VSCode, server, and remote hosts each have a separate edition matrix?
- parity thresholds 应全局统一，还是 CLI、VSCode、server 与 remote hosts 分别拥有 edition matrix？
