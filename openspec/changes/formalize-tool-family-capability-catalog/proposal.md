## Why

DeepSeek now has live coverage for the first 20 core tools, but that number is not a competitive capability model. Mature agent CLIs are organized around tool families, execution modes, connector surfaces, and evidence quality; without a canonical catalog, scores can look high while entire classes such as patch application, browser automation, image generation, notebook/REPL work, and design MCP remain absent.

DeepSeek 现在已经为第一批 20 个 core tools 建立了 live coverage，但“20 个工具”不是有竞争力的能力模型。成熟 Agent CLI 以 tool families、execution modes、connector surfaces 与 evidence quality 组织能力；如果没有 canonical catalog，分数会看起来很高，但 `apply_patch`、browser automation、image generation、notebook/REPL、design MCP 等整类能力仍可能缺失。

## What Changes

- Introduce a canonical tool family capability catalog with 16 domains and 64 first-version scoring families. Domains are navigation only; family coverage is the scoring denominator.
- 新增 canonical tool family capability catalog，第一版包含 16 个 domains 与 64 个 scoring families。Domain 只用于导航；family coverage 才是评分分母。
- Define these first-version domains and families:
  - Workspace I/O: `file.read`, `file.list`, `workspace.glob`, `asset.view-local`.
  - Search and code intelligence: `search.text`, `search.symbol`, `code.diagnostics-lsp`, `notebook.read`.
  - Mutation and patching: `file.write`, `file.edit`, `patch.apply`, `revert.undo`.
  - Shell and process: `shell.run`, `process.output`, `process.kill`, `repl.execute`.
  - Git and build: `git.status-diff`, `git.history-branch`, `build.test-lint-typecheck`, `package.manager`.
  - Planning and control: `plan.todo`, `mode.plan-auto-review`, `user.input`, `approval.permission`.
  - Pipeline and composition: `pipeline.sequence`, `pipeline.parallel`, `pipeline.artifact-routing`, `pipeline.stream`.
  - Agents and tasks: `agent.spawn`, `agent.message-continue`, `agent.wait-result`, `agent.stop-close`.
  - Web and public data: `web.search`, `web.fetch`, `web.extract`, `web.data-lookup`.
  - Browser automation: `browser.navigate`, `browser.interact`, `browser.inspect`, `browser.screenshot`.
  - MCP connectors: `mcp.server-lifecycle`, `mcp.tool-call`, `mcp.resource-read`, `mcp.prompt`.
  - Extensions and local commands: `skill.list-activate`, `hook.list-run`, `plugin.install-verify`, `command.palette-slash`.
  - Media and images: `image.generate`, `image.edit`, `image.search-stock`, `image.inspect`.
  - Design and canvas: `design.document-state`, `design.node-query`, `design.batch-edit`, `design.export-snapshot`.
  - Memory, context, and session: `memory.read-write`, `context.project-index`, `session.resume-fork`, `compact.summary`.
  - Remote, scheduling, and observability: `remote.runtime`, `worktree.environment`, `schedule.sleep-cron`, `observability.trace-budget`.
- 定义以上第一版 domains 与 families：Workspace I/O、Search and code intelligence、Mutation and patching、Shell and process、Git and build、Planning and control、Pipeline and composition、Agents and tasks、Web and public data、Browser automation、MCP connectors、Extensions and local commands、Media and images、Design and canvas、Memory/context/session、Remote/scheduling/observability，共 64 个评分家族。
- Require every model-visible tool or connector to declare its family, lifecycle maturity, risk class, host requirements, and scoring rubric id.
- 要求每个 model-visible tool 或 connector 声明其 family、lifecycle maturity、risk class、host requirements 与 scoring rubric id。
- Reorganize tool implementation source around domain/family ownership: built-in tools should move toward `families/<domain>/<family>/`, connector profiles toward owner packages, and diagnostics/evaluation toward catalog-driven fixtures.
- 围绕 domain/family ownership 重组工具实现源码：内置工具应逐步迁移到 `families/<domain>/<family>/`，connector profiles 放在所属包，diagnostics/evaluation 使用 catalog-driven fixtures。
- Split "core tools" from "complete tool baseline": core tools remain the minimal deterministic local coding subset; baseline parity requires family coverage and strict evidence across the catalog.
- 将“core tools”和“complete tool baseline”拆开：core tools 仍是最小确定性本地编码子集；baseline parity 必须按 catalog 覆盖工具家族并提供严格证据。
- Treat planned, absent, unavailable, and unassessed families as catalog targets, not tool implementations; only concrete executable capabilities count as tools.
- 将 planned、absent、unavailable 与 unassessed families 视为 catalog targets，而不是工具实现；只有真实可执行 capability 才算 tool。
- Add strict tool-family scorecards: absent family is `0`, missing evidence is `0`, partial behavior is `0`, and only proved pass criteria contribute.
- 增加严格 tool-family scorecards：缺失家族为 `0`，缺失证据为 `0`，部分行为为 `0`，只有被证明通过的 criteria 才得分。
- Extend live model/tool coverage from per-tool checks to per-family task scenarios, including model call emission, preflight, permission/sandbox decision, execution, feedback, and end-task verification.
- 将 live model/tool coverage 从逐工具检查扩展到逐工具家族任务场景，覆盖 model call emission、preflight、permission/sandbox decision、execution、feedback 与 end-task verification。
- Treat reference implementations only as capability-shape input. OpenSpec requirements must describe DeepSeek's own contracts and must not copy reference implementation details.
- 参考实现只作为能力形态输入。OpenSpec requirements 必须描述 DeepSeek 自身契约，不得复制参考实现细节。

## Capabilities

### New Capabilities

- `tool-family-capability-catalog`: Canonical domain/family taxonomy, family metadata, maturity levels, operation profiles, parity baseline, and model-visible projection rules.
- `tool-family-capability-catalog`：canonical domain/family taxonomy、family metadata、maturity levels、operation profiles、parity baseline 与 model-visible projection rules。
- `tool-family-scorecards`: Strict per-family scoring, evidence requirements, aggregate baseline metrics, and live task coverage rules.
- `tool-family-scorecards`：严格逐工具家族评分、证据要求、聚合 baseline metrics 与 live task coverage rules。

### Modified Capabilities

- `capability-registry`: Capability manifests must carry tool family metadata, maturity, risk, host requirements, and scorecard rubric references.
- `capability-registry`：Capability manifests 必须携带 tool family metadata、maturity、risk、host requirements 与 scorecard rubric references。
- `core-coding-tools`: Existing core tool ids must be mapped into the catalog, and missing baseline families such as patch, browser, media, design MCP, notebook/REPL, and scheduling must be explicitly absent or planned rather than hidden.
- `core-coding-tools`：现有 core tool ids 必须映射到 catalog；`patch`、browser、media、design MCP、notebook/REPL、scheduling 等缺失 baseline families 必须明确为 absent 或 planned，不能被隐藏。
- `mcp-gateway`: MCP tools, resources, and prompts must project through family profiles, including generic MCP and specialized browser/design/media connector profiles.
- `mcp-gateway`：MCP tools、resources 与 prompts 必须通过 family profiles 投影，包括 generic MCP 以及 browser/design/media 等 specialized connector profiles。
- `agent-management`: Agent scopes must be able to allow or deny tools by family, risk, connector trust, and host requirement, not only by individual capability id.
- `agent-management`：Agent scopes 必须能按 family、risk、connector trust 与 host requirement 允许或拒绝工具，而不只按单个 capability id。
- `workflow-orchestration`: Tool chaining must be represented as governed runtime pipelines with typed artifact routing, not as executor-to-executor private calls.
- `workflow-orchestration`：工具衔接必须表示为受治理 runtime pipelines 与 typed artifact routing，而不是 executor-to-executor 私下调用。
- `model-gateway`: Provider capability metadata must record whether the active provider supports tool calls, server-side tools, web, image/media, structured output, and required continuation semantics.
- `model-gateway`：Provider capability metadata 必须记录 active provider 是否支持 tool calls、server-side tools、web、image/media、structured output 与所需 continuation semantics。
- `cli-task-completion-evaluation`: Task completion evaluation must expose per-family task success and unsupported-family failures rather than only final output existence.
- `cli-task-completion-evaluation`：Task completion evaluation 必须暴露逐工具家族 task success 与 unsupported-family failures，而不只判断最终输出是否存在。
- `testing-regression`: Regression suites must include catalog contracts, projection tests, score math tests, live family coverage fixtures, and parity matrix snapshots.
- `testing-regression`：Regression suites 必须包含 catalog contracts、projection tests、score math tests、live family coverage fixtures 与 parity matrix snapshots。

## Impact

- Affected packages: `src/packages/platform-contracts`, `src/packages/capability-registry`, `src/packages/core-coding-tools`, `src/packages/tool-intent-preflight`, `src/packages/model-gateway`, `src/packages/runtime`, `src/packages/agent-management`, `src/packages/mcp-gateway`, `src/packages/testing-regression`, and `src/apps/cli`.
- 影响包：`src/packages/platform-contracts`、`src/packages/capability-registry`、`src/packages/core-coding-tools`、`src/packages/tool-intent-preflight`、`src/packages/model-gateway`、`src/packages/runtime`、`src/packages/agent-management`、`src/packages/mcp-gateway`、`src/packages/testing-regression` 与 `src/apps/cli`。
- Affected outputs: capability manifests, model-visible tool projection, diagnostics, live coverage evidence, package/tool scorecards, acceptance matrices, and future release readiness summaries.
- 影响输出：capability manifests、model-visible tool projection、diagnostics、live coverage evidence、package/tool scorecards、acceptance matrices 与未来 release readiness summaries。
- The change is additive. It does not require all 64 families to be implemented immediately, but it requires absent families to score as absent and prevents incomplete coverage from appearing as parity.
- 本变更是 additive。不要求立即实现全部 64 个工具家族，但要求缺失家族按 absent 计分，并防止不完整覆盖看起来像 parity。
