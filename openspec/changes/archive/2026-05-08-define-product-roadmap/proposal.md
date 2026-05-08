## Why

DeepSeek CLI is being built as a product platform that must compete with mature coding agents such as Claude Code and Codex, not as a collection of isolated packages. The project needs a source-controlled product roadmap that converts the reference code's real capability map into our own staged milestones, acceptance gates, and future OpenSpec sequence.

DeepSeek CLI 要对标 Claude Code 和 Codex 这类成熟 coding agent，而不是只堆一组孤立 packages。项目需要一份进入版本库的产品路线图，把参考代码里的真实能力版图提炼成我们自己的 staged milestones、acceptance gates 和后续 OpenSpec 顺序。

## What Changes

- Define a product roadmap capability that becomes the canonical planning surface for product phases, milestone gates, launch criteria, and OpenSpec sequencing.
- 定义 product roadmap capability，作为 product phases、milestone gates、launch criteria 和 OpenSpec sequencing 的 canonical planning surface。
- Use `参考/claude-code-2.1.88/src` as the primary evidence source for capability domains such as CLI/TUI/headless, runtime loop, tools, commands, skills, plugins, MCP, hooks, permissions, context, memory, tasks/subagents, remote/server, IDE, voice, vim/keybindings, update, sync, and enterprise policy.
- 以 `参考/claude-code-2.1.88/src` 作为主要证据来源，覆盖 CLI/TUI/headless、runtime loop、tools、commands、skills、plugins、MCP、hooks、permissions、context、memory、tasks/subagents、remote/server、IDE、voice、vim/keybindings、update、sync 和 enterprise policy 等 capability domains。
- Add explicit roadmap landings for local readiness commands, personal credentials, observability/privacy, code intelligence, public SDK/control API, model capability governance, and host UX refinements.
- 为 local readiness commands、personal credentials、observability/privacy、code intelligence、public SDK/control API、model capability governance 和 host UX refinements 增加明确路线图落点。
- Map each competitor-inspired capability into DeepSeek-owned architecture areas rather than copying competitor implementation boundaries.
- 将每个竞品启发能力映射到 DeepSeek 自己的 architecture areas，而不是复制竞品实现边界。
- Define milestone nodes from foundation to MVP, coding agent core, context/safety, extensibility, IDE/server, collaboration, and enterprise/product UX.
- 定义从 foundation 到 MVP、coding agent core、context/safety、extensibility、IDE/server、collaboration、enterprise/product UX 的 milestone nodes。
- Define backlog governance: every future feature OpenSpec must declare roadmap node, product priority, owner package, acceptance level, regression level, and launch gate.
- 定义 backlog governance：后续每个 feature OpenSpec 必须声明 roadmap node、product priority、owner package、acceptance level、regression level 和 launch gate。
- Add a roadmap document under `docs/product/` that the team can use to drive node-by-node implementation.
- 在 `docs/product/` 下增加路线图文档，用于按节点推进实现。

## Capabilities

### New Capabilities / 新增能力

- `product-roadmap`: Canonical product roadmap, milestone sequencing, competitor capability mapping, and OpenSpec planning governance.
- `product-roadmap`: 规范产品路线图、里程碑排序、竞品能力映射和 OpenSpec 规划治理。

### Modified Capabilities / 修改能力

- `framework-acceptance`: Add acceptance gates that tie implementation readiness to roadmap milestones.
- `framework-acceptance`: 增加将实现就绪度与路线图里程碑绑定的验收门禁。
- `command-system`: Align local readiness commands such as init, config, doctor, privacy, install verification, login, and logout with R1 launch readiness.
- `command-system`: 将 init、config、doctor、privacy、install verification、login 和 logout 等本地可用性命令与 R1 发布就绪度对齐。
- `credential-auth-management`: Stage personal credentials in R0/R1, connector credentials in R3, and enterprise credentials in R7.
- `credential-auth-management`: 将 personal credentials 放在 R0/R1，connector credentials 放在 R3，enterprise credentials 放在 R7。
- `model-gateway`: Add model capability governance, migration, fallback, and provider capability fixture expectations.
- `model-gateway`: 增加 model capability governance、migration、fallback 和 provider capability fixture 要求。
- `code-intelligence`: Place language-aware diagnostics, symbols, references, and edit evidence into R2.
- `code-intelligence`: 将 language-aware diagnostics、symbols、references 和 edit evidence 放入 R2。
- `communication-protocol`: Add public runtime SDK/control API sequencing for R4.
- `communication-protocol`: 增加 R4 public runtime SDK/control API 排序要求。
- `testing-regression`: Add roadmap-node regression expectations so each product milestone declares required unit/contract/integration/golden/e2e/live coverage.
- `testing-regression`: 增加路线图节点级回归要求，让每个产品里程碑声明必需的 unit/contract/integration/golden/e2e/live 覆盖。
- `future-capability-landings`: Replace generic reserved landing zones with roadmap-owned landing zones and phase targets.
- `future-capability-landings`: 用路线图归属的 landing zones 和 phase targets 替代泛化预留区。
- `extension-system`: Align extension/plugin/skill/MCP roadmap nodes with product sequencing.
- `extension-system`: 让 extension/plugin/skill/MCP 路线图节点与产品顺序对齐。
- `vscode-extension-adapter`: Align IDE roadmap milestones with CLI/runtime protocol readiness.
- `vscode-extension-adapter`: 让 IDE 路线图里程碑与 CLI/runtime protocol 就绪度对齐。
- `remote-runtime-connectivity`: Align server/daemon/remote roadmap milestones with protocol/session readiness.
- `remote-runtime-connectivity`: 让 server/daemon/remote 路线图里程碑与 protocol/session 就绪度对齐。
- `distribution-update-management`: Align update/release-channel roadmap milestones with product launch gates.
- `distribution-update-management`: 让 update/release-channel 路线图里程碑与产品发布门禁对齐。

## Impact

- Adds planning artifacts and OpenSpec requirements, not broad runtime implementation.
- 增加 planning artifacts 和 OpenSpec requirements，不做大范围 runtime implementation。
- Affects `docs/product`, OpenSpec specs, and future change workflow expectations.
- 影响 `docs/product`、OpenSpec specs 和未来 change workflow expectations。
- The current `add-deepseek-ai-provider` implementation remains separate; this roadmap will reference provider/preflight as an early foundation node but will not archive or rewrite it.
- 当前 `add-deepseek-ai-provider` 实现保持独立；本路线图会把 provider/preflight 作为早期 foundation node 引用，但不会 archive 或重写它。
