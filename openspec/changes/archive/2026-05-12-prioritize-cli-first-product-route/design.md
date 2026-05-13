## Context

The current roadmap correctly treats DeepSeek as a contract-first platform with one runtime kernel and many hosts. The product sequencing, however, still reads as if CLI, VSCode, server, SDK, multi-agent, and rich UX can advance in parallel once the foundation exists. That is architecturally possible but product-risky: early users will judge the tool through one surface, and spreading polish across many adapters can leave every surface feeling unfinished.

当前路线图正确地把 DeepSeek 定义为契约先行平台：一个 runtime kernel 服务多个 host。但产品排序仍容易被理解成只要基础完成，CLI、VSCode、server、SDK、多 Agent 和 rich UX 就可以并行推进。架构上可行，但产品上风险很高：早期用户主要通过一个界面评价工具，过早分散打磨会导致每个界面都不够成熟。

The new route keeps the platform architecture intact but changes the product focus: CLI becomes the primary product surface until it passes explicit daily-use gates. VSCode, server, SDK, browser/native, team sync, and enterprise surfaces remain as thin adapters or reserved landing zones that consume CLI-proven protocol events and workflows later.

新路线保持平台架构不变，但调整产品焦点：CLI 成为主产品面，直到通过明确的日常使用门禁。VSCode、server、SDK、browser/native、team sync 和 enterprise surfaces 继续作为薄适配器或预留落点，后续消费 CLI 已验证的 protocol events 和 workflows。

## Goals / Non-Goals

**Goals:**

- Make CLI the first polished, user-facing product surface. / 让 CLI 成为第一个打磨成熟的用户产品面。
- Define promotion gates for moving a capability from CLI to VSCode/server/SDK/native hosts. / 定义能力从 CLI 推广到 VSCode/server/SDK/native hosts 的门禁。
- Reorder near-term OpenSpecs toward CLI reliability, interactive UX, permissions, diagnostics, extension management, and release readiness. / 将近期 OpenSpec 顺序调整到 CLI 可靠性、交互体验、权限、诊断、扩展管理和发布就绪。
- Preserve contract-first host separation: CLI polish must still sit on shared runtime, protocol, command, policy, and capability contracts. / 保持契约先行 host 分离：CLI 打磨仍必须建立在共享 runtime、protocol、command、policy 和 capability contracts 上。
- Keep non-CLI hosts alive as adapter skeletons and future landing zones. / 保持非 CLI host 作为适配器骨架和未来落点。

**Non-Goals:**

- Do not remove VSCode, server, SDK, remote, or native host architecture. / 不删除 VSCode、server、SDK、remote 或 native host 架构。
- Do not let CLI import runtime internals or bypass platform contracts. / 不允许 CLI 导入 runtime internals 或绕过平台契约。
- Do not implement a rich TUI in this planning change. / 本规划变更不实现 rich TUI。
- Do not change package boundaries or runtime APIs in this change. / 本变更不修改 package boundaries 或 runtime API。

## Decisions

### Decision: CLI becomes the primary product track

The roadmap will introduce a CLI-first track that comes after the foundation and before broader host expansion. This track owns product polish for run/chat flows, local readiness, permissions, slash commands, session resume/fork, extension management, MCP/plugin auth boundaries, output readability, diagnostics, and packaging.

路线图将新增 CLI-first 主线，位于 foundation 之后、广泛 host expansion 之前。该主线负责 run/chat flow、本地可用性、权限、斜杠命令、session resume/fork、扩展管理、MCP/plugin auth boundaries、输出可读性、诊断和打包发布。

Alternative considered: continue promoting R4 IDE/server immediately after R3. Rejected because VSCode/server would inherit immature CLI interaction semantics and force multiple approval/rendering workflows before one surface is proven.

备选方案：R3 后立即推进 R4 IDE/server。该方案被拒绝，因为 VSCode/server 会继承尚未成熟的 CLI 交互语义，并在一个端尚未验证前制造多套 approval/rendering workflows。

### Decision: Other hosts are promoted only after CLI gates

VSCode, server, SDK, browser/native, and team surfaces will be sequenced as promotion work. A capability may move beyond CLI only after the CLI implementation has protocol event fixtures, policy/audit evidence, deterministic tests, documented UX behavior, and at least one acceptance smoke path.

VSCode、server、SDK、browser/native 和 team surfaces 将作为推广工作排序。一个能力只有在 CLI 实现具备 protocol event fixtures、policy/audit evidence、deterministic tests、已记录 UX behavior 和至少一条 acceptance smoke path 后，才能推广到 CLI 之外。

Alternative considered: define host parity as an architectural obligation for every feature. Rejected because parity too early turns every feature into a multi-host project and slows the first usable product.

备选方案：要求每个功能天然 host parity。该方案被拒绝，因为过早 parity 会把每个功能都变成多端项目，拖慢第一个可用产品。

### Decision: CLI polish remains host-edge work

Rich output, status line, command palette, keybindings, history search, prompts, and install/onboarding messaging belong at the CLI host edge. They should consume runtime events, command results, and policy decisions rather than adding execution ownership to `src/apps/cli`.

丰富输出、状态栏、command palette、快捷键、历史搜索、prompt 与安装/onboarding 文案属于 CLI host edge。它们应消费 runtime events、command results 和 policy decisions，而不是让 `src/apps/cli` 获得执行所有权。

Alternative considered: build a terminal-specific runtime path for speed. Rejected because it would violate the one-kernel contract and make later host promotion harder.

备选方案：为终端快速构建专用 runtime path。该方案被拒绝，因为它会违反 one-kernel contract，并使后续 host promotion 更难。

### Decision: Large CLI capabilities require directory plans

The existing package map is a good foundation, but it is not automatically enough for the full CLI product. Before heavy CLI features land, future OpenSpecs should include a directory plan that names owner packages, subdirectories, public exports, private modules, fixtures, and split triggers for central files. This is especially important for CLI entrypoints, package `index.ts` files, policy/approval code, command composition, MCP, plugins, and tool evidence.

现有 package map 是良好基础，但不会自动足以承接完整 CLI 产品。在重型 CLI 功能落地前，后续 OpenSpec 应包含目录计划，明确 owner packages、子目录、公开导出、私有模块、fixtures 和中心文件拆分触发条件。这对 CLI entrypoints、package `index.ts`、policy/approval code、command composition、MCP、plugins 和 tool evidence 尤其重要。

Alternative considered: rely only on existing package names and refactor later. Rejected because the reference CLI shows that mature CLI products naturally accumulate large entry files and multi-purpose interfaces unless directory boundaries are enforced early.

备选方案：只依赖现有 package 名称，后续再重构。该方案被拒绝，因为参考 CLI 显示，成熟 CLI 产品如果不尽早强制目录边界，会自然积累大型入口文件和多用途接口。

### Decision: Reference pitfalls become negative fixtures

Claude CLI's workaround-heavy areas should become DeepSeek regression assets. Before polishing equivalent workflows, DeepSeek should add negative fixtures for bypass permissions, headless trust semantics, shell parser mismatch, path canonicalization, MCP/plugin config precedence, remote session identity compatibility, environment snapshotting, and diagnostics redaction.

Claude CLI 中 workaround 较多的领域应变成 DeepSeek 的回归资产。在打磨等价 workflow 前，DeepSeek 应为 bypass permissions、headless trust semantics、shell parser mismatch、path canonicalization、MCP/plugin config precedence、remote session identity compatibility、environment snapshotting 和 diagnostics redaction 增加负向 fixtures。

Alternative considered: discover these issues naturally during implementation. Rejected because the reference already exposes the failure classes; waiting would waste the advantage of studying it.

备选方案：在实现过程中自然发现这些问题。该方案被拒绝，因为参考实现已经暴露了失败类型；继续等待会浪费研究它带来的优势。

### Decision: R4 becomes a promotion phase, not the next immediate product phase

R4 IDE/server remains important, but the roadmap should state that it follows the CLI product gate. Work such as `implement-vscode-event-projection`, `implement-local-runtime-server`, and `implement-public-runtime-sdk-and-control-api` should be scheduled after CLI interaction, permission, extension, and diagnostics semantics are stable enough to project.

R4 IDE/server 仍然重要，但路线图应声明它位于 CLI 产品门禁之后。`implement-vscode-event-projection`、`implement-local-runtime-server`、`implement-public-runtime-sdk-and-control-api` 等工作应在 CLI 交互、权限、扩展和诊断语义稳定后再排期。

Alternative considered: keep R4 before UX polish. Rejected because UX polish is not only visual; it includes approvals, recoverability, local diagnostics, and command ergonomics that define the protocol semantics other hosts must consume.

备选方案：继续把 R4 放在 UX polish 前。该方案被拒绝，因为 UX polish 不只是视觉；它包含 approvals、recoverability、本地诊断和命令人体工学，这些会定义其他 host 需要消费的协议语义。

## Risks / Trade-offs

- [Risk] CLI-first could be mistaken as abandoning platform architecture. -> Mitigation: specs explicitly require shared protocol/runtime contracts and forbid CLI-only execution bypasses.
- [风险] CLI-first 可能被误解为放弃平台架构。-> 缓解：spec 明确要求共享 protocol/runtime contracts，并禁止 CLI-only execution bypass。
- [Risk] VSCode/server momentum slows. -> Mitigation: keep adapter skeletons and protocol compatibility tests, but defer product UX expansion until CLI gates pass.
- [风险] VSCode/server 推进变慢。-> 缓解：保留 adapter skeletons 和 protocol compatibility tests，但把产品 UX 扩展延后到 CLI 门禁后。
- [Risk] CLI polish can become open-ended. -> Mitigation: define concrete CLI acceptance gates: install, auth/config, run/chat, safe edit/test, permissions, session, diagnostics, extension management, packaging, and smoke evidence.
- [风险] CLI 打磨可能无限扩张。-> 缓解：定义具体 CLI 验收门禁：install、auth/config、run/chat、安全 edit/test、权限、session、diagnostics、extension management、packaging 和 smoke evidence。
- [Risk] Host promotion discovers protocol gaps late. -> Mitigation: every CLI-first feature still emits versioned protocol fixtures and golden replay evidence during CLI implementation.
- [风险] 跨端推广时才发现协议缺口。-> 缓解：每个 CLI-first feature 在 CLI 实现阶段就必须产出 versioned protocol fixtures 和 golden replay evidence。
- [Risk] CLI-first accelerates central-file growth. -> Mitigation: add a directory-plan requirement and schedule a split/scale-guardrails pack before heavy permission, diagnostics, and extension UX work.
- [风险] CLI-first 加速中心文件膨胀。-> 缓解：增加目录计划要求，并在重型 permission、diagnostics 和 extension UX 前安排拆分/规模护栏包。
- [Risk] DeepSeek repeats known safety and compatibility pitfalls. -> Mitigation: require reference pit fixtures before accepting security-sensitive CLI workflows.
- [风险] DeepSeek 重复已知安全与兼容坑。-> 缓解：要求安全敏感 CLI workflow 验收前具备参考坑位 fixtures。

## Migration Plan

1. Add CLI-first roadmap requirements and promotion gates. / 增加 CLI-first 路线要求和推广门禁。
2. Update `docs/product/product-roadmap.md` so immediate sequence prioritizes CLI product hardening before R4 host expansion. / 更新 `docs/product/product-roadmap.md`，让近期顺序优先 CLI 产品打磨，再进入 R4 host expansion。
3. Mark VSCode/server/SDK as follow-on projection phases gated by CLI acceptance evidence. / 将 VSCode/server/SDK 标记为受 CLI 验收证据门禁控制的后续投影阶段。
4. Add the CLI reference extraction implementation plan as the capability ledger, directory-planning source, and reference-pit fixture source for future OpenSpecs. / 增加 CLI 参考精华抽离实施方案，作为后续 OpenSpec 的能力总账、目录规划来源和参考坑位 fixture 来源。
5. Validate OpenSpec specs and keep this change planning-only. / 校验 OpenSpec specs，并保持本变更仅限规划。

## Open Questions

- Which CLI UX pack should start first after this route change: rich TUI/statusline, permissions/approval UX, or extension management UX? Current recommendation: permissions/approval UX first, because it affects trust and all later hosts.
- 本路线调整后应先做哪个 CLI UX 包：rich TUI/statusline、permissions/approval UX，还是 extension management UX？当前建议先做 permissions/approval UX，因为它影响信任，也影响后续所有 host。
- Should R4 require one or two CLI releases before promotion? Current recommendation: at least one internal-alpha CLI gate plus one beta candidate smoke.
- R4 是否要求 CLI 先发布一版或两版？当前建议至少一个 internal-alpha CLI gate 加一个 beta candidate smoke。
