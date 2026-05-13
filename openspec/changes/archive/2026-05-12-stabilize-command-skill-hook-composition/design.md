## Context

The CLI-first product now has runtime-owned run/chat, readiness, diagnostics, approvals, plugin lockfiles, MCP gateway, skills, hooks, and extension management. The next scaling risk is semantic overlap: slash commands, skills, hooks, plugin commands, MCP prompts/tools, and workflow suggestions can all look like "commands" to a user or host, but they have different owners, side effects, permissions, and execution boundaries.

CLI-first 产品现在已经具备 runtime-owned run/chat、readiness、diagnostics、approvals、plugin lockfiles、MCP gateway、skills、hooks 和 extension management。下一个规模风险是语义重叠：slash commands、skills、hooks、plugin commands、MCP prompts/tools 和 workflow suggestions 对用户或 host 来说都像 "commands"，但它们拥有不同 owner、side effects、permissions 和 execution boundaries。

## Goals / Non-Goals

**Goals:**

- Add a versioned composition record model for command/skill/hook/MCP/plugin/workflow contributions. / 增加 versioned composition record model，用于 command/skill/hook/MCP/plugin/workflow contributions。
- Provide deterministic projection APIs for CLI help, chat slash commands, user-visible extension commands, and model-visible safe commands. / 提供确定性 projection APIs，用于 CLI help、chat slash commands、user-visible extension commands 和 model-visible safe commands。
- Reject duplicate command names/aliases and unsafe model-visible side-effect projections before they reach runtime or CLI renderers. / 在进入 runtime 或 CLI renderers 前拒绝重复 command names/aliases 和不安全的 model-visible side-effect projections。
- Preserve owner subsystem and provenance so projection does not imply execution authority. / 保留 owner subsystem 与 provenance，确保 projection 不等于 execution authority。
- Keep `src/packages/command-system/src/index.ts` as an export surface and place implementation in focused modules. / 保持 `src/packages/command-system/src/index.ts` 为导出面，并把实现放入聚焦模块。

**Non-Goals:**

- Do not build a full command palette, Vim keymap UI, or fuzzy finder. / 不构建 full command palette、Vim keymap UI 或 fuzzy finder。
- Do not execute workflow graphs, hooks, MCP tools, or plugin commands from the composition projection. / 不从 composition projection 执行 workflow graphs、hooks、MCP tools 或 plugin commands。
- Do not promote this UX to VSCode/server in this pack. / 本包不将该 UX 推广到 VSCode/server。
- Do not implement marketplace, signed distribution, or enterprise managed policy. / 不实现 marketplace、signed distribution 或 enterprise managed policy。

## Decisions

### Decision: Composition records are inert metadata

Add `CommandCompositionRecord` and related DTOs in `@deepseek/platform-contracts`. A record names the contribution kind, owner subsystem, source kind/id, target id, permissions, side-effect level, host/model visibility, input/output schema, redaction, compatibility, and reference pit ids. Projection returns records, not handlers.

在 `@deepseek/platform-contracts` 中增加 `CommandCompositionRecord` 及相关 DTO。record 命名 contribution kind、owner subsystem、source kind/id、target id、permissions、side-effect level、host/model visibility、input/output schema、redaction、compatibility 和 reference pit ids。Projection 返回 records，而不是 handlers。

Alternative considered: reuse `CommandManifest` only. Rejected because skills, hooks, MCP prompts, and workflow suggestions are not all executable commands, and overloading command manifests would blur ownership.

备选方案：只复用 `CommandManifest`。拒绝原因是 skills、hooks、MCP prompts 和 workflow suggestions 并不全是可执行 commands，过度复用 command manifests 会模糊 owner。

### Decision: Command manifests get composition metadata, but execution remains separate

`CommandManifest` gains optional source/owner/permissions/compatibility/projection metadata. `CommandSystem.invoke()` still invokes registered command handlers only; composition projection never executes handlers.

`CommandManifest` 增加可选 source/owner/permissions/compatibility/projection metadata。`CommandSystem.invoke()` 仍只调用已注册 command handlers；composition projection 绝不执行 handlers。

Alternative considered: merge command system and extension registry. Rejected because plugin/MCP/skill lifecycle owners already exist and should not be absorbed into command-system.

备选方案：合并 command system 与 extension registry。拒绝原因是 plugin/MCP/skill lifecycle owner 已经存在，不应被 command-system 吸收。

### Decision: Deterministic collision policy

Composition registry rejects duplicate primary names and aliases within the same projection scope unless one contribution is explicitly disabled or hidden by policy metadata. Error records cite stable diagnostics and do not silently pick a winner.

Composition registry 会拒绝同一 projection scope 中重复的 primary names 和 aliases，除非某个 contribution 被显式 disable 或被 policy metadata 隐藏。Error records 使用稳定 diagnostics，不会静默选择赢家。

Alternative considered: priority-based override. Rejected for R3 because silent override is exactly the reference pit class we want to avoid; managed precedence belongs to future policy enforcement.

备选方案：基于 priority override。R3 拒绝该方案，因为静默 override 正是需要规避的参考坑位；managed precedence 属于未来 policy enforcement。

### Decision: Model-visible projection is fail-closed

Only records with `modelVisible: true`, `sideEffect: "none" | "read"`, trusted or built-in provenance, and explicit output schemas can enter model-visible projection. Side-effecting commands, hooks, plugin lifecycle actions, and raw MCP calls remain user/host-visible only until an owning subsystem creates a governed execution envelope.

只有 `modelVisible: true`、`sideEffect: "none" | "read"`、trusted 或 built-in provenance，并带 explicit output schema 的 records 才能进入 model-visible projection。副作用 commands、hooks、plugin lifecycle actions 和 raw MCP calls 在 owner subsystem 创建 governed execution envelope 前只保持 user/host-visible。

Alternative considered: allow model-visible side effects with permission summaries. Rejected because approval/policy must happen at governed execution time, not at projection time.

备选方案：允许带 permission summaries 的 model-visible side effects。拒绝原因是 approval/policy 必须在 governed execution 时发生，而不是 projection 时发生。

## Directory Plan / 目录计划

- `src/packages/platform-contracts/src/command-composition.ts`: implementation-free composition DTOs. / 无实现 composition DTOs。
- `src/packages/platform-contracts/src/command.ts`: additive optional metadata on `CommandManifest`. / 在 `CommandManifest` 上添加可选 metadata。
- `src/packages/command-system/src/composition.ts`: registry, normalization, projection, collision checks. / registry、normalization、projection、collision checks。
- `src/packages/command-system/src/implementation.ts`: register existing interactive/readiness commands with composition metadata and re-export helpers. / 用 composition metadata 注册现有 interactive/readiness commands 并导出 helpers。
- Tests: contract tests under `tests/contracts`, package-local tests under `src/packages/command-system/src`, integration tests only if projection crosses package boundaries. / 测试放在 `tests/contracts`、`src/packages/command-system/src`，若 projection 跨包则放 integration tests。

Split triggers: keep `composition.ts` under 500 lines by splitting normalizers/projection filters when needed; `index.ts` remains exports only.

拆分触发器：`composition.ts` 接近 500 行时拆 normalizers/projection filters；`index.ts` 只保持导出。

## Terminal Capability Impact / 终端能力影响

This pack does not add new terminal interaction. CLI help or future command lists must render from stable records in text/JSON/JSONL without ANSI in structured modes.

本包不增加新的终端交互。CLI help 或未来 command lists 必须从 stable records 渲染 text/JSON/JSONL，structured modes 不含 ANSI。

## Vi-Inspired Composition Impact / Vi 启发式组合影响

Composition records expose typed result-list targets such as `command:<id>`, `skill:<name>`, `hook:<id>`, `mcp-prompt:<qualifiedName>`, and `workflow:<id>`. Later vi-style actions can compose verbs over these targets without parsing display text.

Composition records 暴露类型化 result-list targets，例如 `command:<id>`、`skill:<name>`、`hook:<id>`、`mcp-prompt:<qualifiedName>` 和 `workflow:<id>`。后续 vi-style actions 可以在这些 targets 上组合动作，而不解析显示文本。

## Request/Turn Revert Impact / 请求/回合回退影响

This pack does not revert requests or turns. It records which contribution target initiated a command, skill activation, hook projection, MCP prompt, or workflow suggestion so future revert can cite the contribution source and distinguish projection from execution.

本包不回退 requests 或 turns。它记录 command、skill activation、hook projection、MCP prompt 或 workflow suggestion 的 contribution target，使未来 revert 能引用 contribution source，并区分 projection 与 execution。

## Reference Pit Fixtures / 参考坑位 Fixtures

- `pit.legacy-contribution-normalization.manifest-boundary`: covered by composition records requiring schema version, owner subsystem, and manifest provenance. / 通过要求 schema version、owner subsystem 和 manifest provenance 的 composition records 覆盖。
- `pit.mcp-plugin-precedence.enterprise-deny`: partial; projection preserves source/trust/precedence metadata but managed deny remains future R7 policy. / 部分覆盖；projection 保留 source/trust/precedence metadata，managed deny 保持未来 R7 policy。
- `pit.extension-permission-expansion.permission-diff`: referenced when plugin-contributed commands carry permission metadata. / plugin-contributed commands 携带 permission metadata 时引用。

## Risks / Trade-offs

- [Risk] Composition can become a broad meta-registry. -> Mitigation: projection is inert and execution still belongs to command/skill/hook/MCP/plugin owners. / [风险] composition 可能变成过大的元注册表。-> 缓解：projection 是惰性元数据，执行仍归 command/skill/hook/MCP/plugin owners。
- [Risk] Manifest additions can break existing command tests. -> Mitigation: make contract fields additive and optional, then register existing commands with metadata in implementation. / [风险] manifest 增量可能破坏现有 command tests。-> 缓解：契约字段保持 additive optional，再在实现中给现有 commands 注册 metadata。
- [Risk] Collision policy may reject future valid overrides. -> Mitigation: R3 rejects ambiguity; later managed policy can add explicit override records with audit. / [风险] collision policy 可能拒绝未来合法 override。-> 缓解：R3 先拒绝歧义；后续 managed policy 可增加带 audit 的显式 override records。

## Migration Plan

1. Add DTOs and command manifest metadata. / 增加 DTOs 与 command manifest metadata。
2. Implement command composition registry and projection filters. / 实现 command composition registry 与 projection filters。
3. Register existing readiness/interactive/extension command records. / 注册现有 readiness/interactive/extension command records。
4. Add contract and package tests. / 增加 contract 与 package tests。
5. Update docs and roadmap. / 更新文档与路线图。
6. Run OpenSpec validation, typecheck, lint, targeted tests, npm test if feasible, and boundary checks. / 运行 OpenSpec validation、typecheck、lint、定向测试、可行时 npm test 和 boundary checks。

Rollback: remove composition DTOs/registry and metadata additions; existing command invocation APIs remain compatible because changes are additive.

回滚：移除 composition DTOs/registry 和 metadata additions；现有 command invocation APIs 因为是增量改动仍兼容。
