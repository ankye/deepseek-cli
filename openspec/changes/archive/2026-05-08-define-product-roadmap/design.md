## Context

The reference source under `参考/claude-code-2.1.88/src` shows the product reality more clearly than any single overview document. It has explicit directories for CLI, commands, tools, QueryEngine, services, MCP, plugins, skills, hooks, tasks, remote, server, bridge, vim, voice, keybindings, memory, sync, policy limits, update UI, tips, and enterprise-style settings. This confirms that the competitive product surface is broad: a coding agent must become a host-neutral runtime, extensibility platform, safety system, context/memory system, collaboration system, and product UX shell.

`参考/claude-code-2.1.88/src` 下的参考源码比单一概览文档更能反映产品真实形态。它明确包含 CLI、commands、tools、QueryEngine、services、MCP、plugins、skills、hooks、tasks、remote、server、bridge、vim、voice、keybindings、memory、sync、policy limits、update UI、tips 和 enterprise-style settings 等目录。这说明竞品产品面很宽：coding agent 必须逐步成为 host-neutral runtime、extensibility platform、safety system、context/memory system、collaboration system 和 product UX shell。

DeepSeek already has a future-ready foundation: runtime kernel, model gateway, provider/preflight work, capability registry, workflow/concurrency, policy/sandbox, platform abstraction, testing regression, CLI/VSCode seams, plugin/skill/hook/MCP landing zones, memory/cache, usage, remote, distribution, and evolution. What is missing is a product roadmap that orders these capabilities into shippable nodes and prevents random feature construction. The roadmap must also make first-run readiness, credentials, diagnostics, privacy, code intelligence, SDK/API stability, model capability governance, and host UX refinements explicit instead of leaving them as implied subfeatures.

DeepSeek 已经具备 future-ready foundation：runtime kernel、model gateway、provider/preflight、capability registry、workflow/concurrency、policy/sandbox、platform abstraction、testing regression、CLI/VSCode seams、plugin/skill/hook/MCP landing zones、memory/cache、usage、remote、distribution 和 evolution。当前缺的是产品路线图，用于把这些能力排序成可交付节点，避免随机做功能。路线图还必须显式覆盖 first-run readiness、credentials、diagnostics、privacy、code intelligence、SDK/API stability、model capability governance 和 host UX refinements，不能让它们隐含在大功能下面。

## Goals / Non-Goals

**Goals:**

- Define a canonical roadmap from foundation to competitive product parity and beyond.
- 定义从 foundation 到 competitive product parity 再到未来演进的 canonical roadmap。
- Make the roadmap traceable to reference source capability domains without copying reference implementation boundaries.
- 让路线图可追溯到参考源码能力域，但不复制参考实现边界。
- Define node-by-node acceptance gates and regression expectations.
- 定义按节点推进的 acceptance gates 和 regression expectations。
- Make every future OpenSpec change declare roadmap node, launch level, owner package, test level, and dependency node.
- 让后续每个 OpenSpec change 都声明 roadmap node、launch level、owner package、test level 和 dependency node。
- Require future changes to declare risk class, data/privacy class, host surfaces, protocol impact, feature flag, and migration/rollback when applicable.
- 要求后续 change 在适用时声明 risk class、data/privacy class、host surfaces、protocol impact、feature flag 和 migration/rollback。
- Provide a `docs/product/product-roadmap.md` document that engineers can use to decide what to build next.
- 提供 `docs/product/product-roadmap.md`，作为工程推进下一步的依据。

**Non-Goals:**

- Do not implement every roadmap feature in this change.
- 本变更不实现所有路线图功能。
- Do not import, commit, or publish reference source code or reference directory content.
- 不导入、提交或发布参考源码或参考目录内容。
- Do not copy Claude/Codex product names, UI text, or internal code boundaries as DeepSeek requirements.
- 不把 Claude/Codex 产品名、UI 文案或内部代码边界复制成 DeepSeek requirements。
- Do not block currently active implementation changes such as `add-deepseek-ai-provider`.
- 不阻塞当前活跃实现变更，例如 `add-deepseek-ai-provider`。

## Decisions

### Decision: Roadmap nodes are product outcomes, not package names

The reference code has many directories, but roadmap nodes should describe user/product outcomes: headless coding turn, safe file editing, interactive terminal agent, IDE projection, extensible capability ecosystem, remote daemon, collaboration/task graph, enterprise governance, product UX polish. Packages remain implementation details under each node.

参考代码有大量目录，但路线图节点应描述用户/产品结果：headless coding turn、safe file editing、interactive terminal agent、IDE projection、extensible capability ecosystem、remote daemon、collaboration/task graph、enterprise governance、product UX polish。packages 是每个节点下的实现细节。

Alternative considered: mirror the reference directory tree. Rejected because it would import competitor history and coupling into our plan.

备选方案：镜像参考目录树。该方案被拒绝，因为它会把竞品历史包袱和耦合关系带入我们的计划。

### Decision: Use three lenses for each node

Each roadmap node will define:

1. Product scope: user-visible capability and target hosts.
2. Platform scope: owner contracts/packages and integration boundaries.
3. Acceptance scope: tests, golden traces, e2e smoke, docs, and launch gate.

每个路线图节点定义三层：product scope、platform scope、acceptance scope。这样可以避免只写功能愿景而没有工程验收。

### Decision: Product readiness is a first-class R1 concern

R1 is not just a model/tool loop. It must include the local readiness path that lets a user install, initialize, configure, authenticate, diagnose, and control privacy settings without relying on live provider access by default. These commands still use platform contracts, credential references, command-system routing, and redacted diagnostic events.

R1 不只是 model/tool loop。它必须包含本地可用性路径，让用户可以在默认不依赖 live provider access 的情况下完成 install、init、configure、authenticate、diagnose 和 privacy settings 控制。这些 commands 仍必须通过 platform contracts、credential references、command-system routing 和 redacted diagnostic events。

### Decision: Credentials, privacy, and observability are staged

Personal provider credentials belong in R0/R1 because the first real CLI cannot work without safe API-key or auth setup. MCP/plugin connector credentials belong in R3, and organization-managed credentials belong in R7. Observability is enabled through redacted local traces and diagnostics first, with privacy opt-out and no raw secret persistence as non-negotiable acceptance rules.

personal provider credentials 属于 R0/R1，因为第一个真实 CLI 离不开安全的 API-key 或 auth setup。MCP/plugin connector credentials 属于 R3，organization-managed credentials 属于 R7。observability 先通过脱敏本地 traces 和 diagnostics 启用，并把 privacy opt-out 与 raw secret 不持久化作为不可妥协的验收规则。

### Decision: SDK/API and code intelligence are product milestones

Code intelligence is assigned to R2 because diagnostics, symbols, references, and language-aware edit evidence materially improve coding safety. Public runtime SDK/control API is assigned to R4 because IDE, server, and remote hosts need stable versioned schemas rather than private adapters.

code intelligence 分配到 R2，因为 diagnostics、symbols、references 和 language-aware edit evidence 会实质提升 coding safety。public runtime SDK/control API 分配到 R4，因为 IDE、server 和 remote hosts 需要稳定的版本化 schemas，而不是私有 adapters。

### Decision: Parity is staged, not one milestone

Competitive parity is split into stages:

- R0 Foundation: strict runtime kernel, provider gateway, tool preflight, architecture lint, deterministic regression.
- R1 MVP Coding Agent: headless and basic interactive coding loop with safe file/search/edit/shell tools plus local readiness commands.
- R2 Context and Safety: ContextGraph, memory/cache, compact, sandbox, secret guard, usage budget, diagnostics/privacy, and code intelligence.
- R3 Extensibility: skills, commands, hooks, MCP, plugins with lockfile and policy.
- R4 IDE and Server: VSCode projection, local daemon/server, remote connectivity, protocol stability, and public runtime SDK/control API.
- R5 Multi-Agent Engineering: task graph, subagents, worktree/overlay, merge/review/test evidence.
- R6 Product UX and Collaboration: TUI polish, keybindings/vim, notifications, voice, browser/native host, team memory, sync, update UX.
- R7 Enterprise and Ecosystem: managed policy, marketplace governance, signed plugins, audit, live evals, release channels.

competitive parity 是分阶段的，而不是一个里程碑。

### Decision: Every future OpenSpec references roadmap metadata

A future change should include roadmap metadata either in proposal impact or a dedicated section:

```text
Roadmap node: R2 Context and Safety
Launch gate: internal-alpha | alpha | beta | stable
Owner packages: context-engine, memory-cache-management
Required tests: unit, contract, integration, golden, e2e
Dependencies: R1 safe tool execution
Risk class: medium
Data/privacy class: sensitive
Host surfaces: cli, vscode
Protocol impact: additive
Feature flag: required
Migration/rollback: required
```

后续 change 需要声明路线图元数据，方便排序、验收和回归矩阵维护。

### Decision: Reference code informs gaps, not constraints

The reference source confirms product areas, e.g. `voice`, `vim`, `keybindings`, `remote`, `server`, `tasks`, `plugins`, `skills`, `services/teamMemorySync`, `services/settingsSync`, `services/policyLimits`, and `components/AutoUpdater`. We use this to ensure landing zones exist, but our architecture remains runtime-kernel, protocol, capability, policy, and regression-first.

参考源码用于确认产品领域和缺口，但不成为实现约束。

## Risks / Trade-offs

- [Risk] Roadmap becomes too broad and stalls implementation. -> Mitigation: split into ordered nodes and require each implementation change to target one node with small acceptance.
- [风险] 路线图过宽导致执行停滞。-> 缓解：拆成有序节点，每个实现 change 只针对一个节点和明确验收。
- [Risk] Competitor parity language encourages copying. -> Mitigation: specs must use DeepSeek-owned abstractions and forbid copying reference code or boundaries.
- [风险] 对标语言可能诱导复制。-> 缓解：specs 使用 DeepSeek 自有抽象，并禁止复制参考代码或边界。
- [Risk] Product UX nodes arrive before platform safety. -> Mitigation: roadmap dependencies require safety/context/protocol nodes before broad UX/ecosystem launch.
- [风险] 产品 UX 节点早于平台安全。-> 缓解：路线图依赖要求 safety/context/protocol 先于大范围 UX/ecosystem launch。
- [Risk] Multiple active OpenSpecs conflict. -> Mitigation: roadmap change is planning-only and does not archive active implementation changes.
- [风险] 多个活跃 OpenSpec 冲突。-> 缓解：路线图变更只做规划，不 archive 当前实现变更。

## Migration Plan

1. Create `product-roadmap` spec and roadmap governance requirements.
2. Add delta requirements to acceptance, testing, future landings, extension, VSCode, remote, and distribution specs.
3. Add `docs/product/product-roadmap.md` with staged nodes, reference-source evidence, DeepSeek mapping, and next-node backlog.
4. Validate the change and use it as the basis for future node-by-node OpenSpecs.
5. After archive, update future proposal templates or AGENTS guidance to include roadmap metadata.

迁移计划：

1. 创建 `product-roadmap` spec 和路线图治理要求。
2. 向 acceptance、testing、future landings、extension、VSCode、remote 和 distribution specs 增加 delta requirements。
3. 增加 `docs/product/product-roadmap.md`，包含分阶段节点、参考源码证据、DeepSeek 映射和后续节点 backlog。
4. 校验本变更，并将它作为后续按节点推进 OpenSpec 的依据。
5. archive 后更新后续 proposal 模板或 AGENTS 指引，加入路线图元数据。

## Open Questions

- Should R1 prioritize terminal interactive TUI or stronger headless coding first? Current recommendation: headless-safe coding first, then richer TUI.
- R1 应优先 terminal interactive TUI 还是更强的 headless coding？当前建议先 headless-safe coding，再做 richer TUI。
- Should live provider tests enter R1 or R2? Current recommendation: deterministic provider tests in R0/R1, opt-in live suite in R2.
- live provider tests 应进入 R1 还是 R2？当前建议 R0/R1 做 deterministic provider tests，R2 增加 opt-in live suite。
- Should voice/browser/native host be R6 or deferred to ecosystem plugins? Current recommendation: reserve R6 landing zone, implement only after protocol/server maturity.
- voice/browser/native host 应在 R6 还是延后到 ecosystem plugins？当前建议保留 R6 landing zone，在 protocol/server 成熟后实现。
