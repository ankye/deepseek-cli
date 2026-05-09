## Context

The repository already has `platform-contracts/src/skill.ts`, `src/packages/skill-system`, and an R3 `skill-system` spec. The current implementation only stores manifests and activates trusted skills by name. R3 needs a stronger v1 that can be safely consumed by CLI, VSCode, server, and future plugin/MCP layers.

仓库已有 `platform-contracts/src/skill.ts`、`src/packages/skill-system` 和 R3 `skill-system` spec。当前实现只存储 manifest，并按名称激活 trusted skill。R3 需要更强的 v1，让 CLI、VSCode、server 以及未来 plugin/MCP 层可以安全消费。

## Goals / Non-Goals

**Goals:**

- Add versioned contracts for skill manifest validation, content summaries, context segments, activation results, and loading metadata.
- Enforce trust and enablement rules so untrusted skills are inert.
- Provide progressive loading with summary-first behavior and on-demand full content loading.
- Support context-only skills that contribute bounded instructions/resources into context projection.
- Preserve future execution rules: tool-backed or side-effecting skills must later enter governed execution envelopes.
- Add deterministic tests across package, contracts, integration, golden replay, compatibility, and matrix suites.

**目标：**

- 增加 skill manifest validation、content summaries、context segments、activation results 和 loading metadata 的版本化契约。
- 强制 trust 与 enablement rules，使 untrusted skills 保持 inert。
- 提供 summary-first progressive loading，并按需加载 full content。
- 支持 context-only skills，将有界 instructions/resources 贡献到 context projection。
- 保留未来执行规则：tool-backed 或有副作用的 skills 后续必须进入 governed execution envelopes。
- 增加覆盖 package、contracts、integration、golden replay、compatibility 和 matrix suites 的确定性测试。

**Non-Goals:**

- Executing arbitrary skill code.
- Installing skills from a marketplace.
- Plugin packaging, lockfiles, or signed distribution.
- MCP connector integration.
- Host UI for browsing skills.

**非目标：**

- 执行任意 skill code。
- 从 marketplace 安装 skills。
- plugin packaging、lockfiles 或 signed distribution。
- MCP connector integration。
- skill 浏览 Host UI。

## Decisions

1. **V1 supports context-only skills first.**

   A v1 skill can contribute instructions, examples, and resources as bounded context segments. It cannot execute code or side-effecting tools directly. Future tool-backed skills will reuse the manifest and activation model but must create governed execution envelopes.

   **中文：** v1 先支持 context-only skills。v1 skill 可以把 instructions、examples 和 resources 作为有界 context segments 贡献出来。它不能直接执行代码或有副作用工具。未来 tool-backed skills 会复用 manifest 与 activation model，但必须创建 governed execution envelopes。

2. **Progressive loading is observable and testable.**

   `list()` and summary APIs expose only compact metadata. `activate()` records whether full content was loaded. Tests assert that full instructions are not loaded until activation or explicit projection.

   **中文：** progressive loading 必须可观察、可测试。`list()` 与 summary APIs 只暴露紧凑 metadata。`activate()` 记录 full content 是否被加载。测试断言 full instructions 不会在 activation 或 explicit projection 前加载。

3. **Untrusted skills are registered but inert.**

   Registration stores manifest metadata for diagnostics, but untrusted skills cannot activate, project context, inject instructions, or request future tools. This keeps workspace/user skills visible without letting them affect runtime behavior.

   **中文：** untrusted skills 会被注册但保持 inert。注册会保存 manifest metadata 供 diagnostics 使用，但 untrusted skills 不能 activate、project context、inject instructions 或请求未来 tools。这样 workspace/user skills 可见，但不能影响 runtime behavior。

4. **Skill context uses existing ContextGraph boundaries.**

   Skill segments become regular context-compatible evidence with source `skill-system`, provenance, compatibility, redaction, and budget metadata. No parallel prompt injection path is added.

   **中文：** skill context 使用现有 ContextGraph 边界。skill segments 会成为兼容 context 的证据，包含 source `skill-system`、provenance、compatibility、redaction 和 budget metadata。不新增平行 prompt injection path。

## Risks / Trade-offs

- [Risk] Skills can become a backdoor prompt injection channel. -> Mitigation: v1 only allows trusted context-only segments with bounded length, redaction metadata, provenance, and regression tests.
- [风险] Skills 可能成为 prompt injection 后门。-> 缓解：v1 只允许 trusted context-only segments，并要求 length bound、redaction metadata、provenance 和 regression tests。

- [Risk] Over-modeling skills before plugins/MCP exist could create churn. -> Mitigation: keep v1 additive and focused on manifest, loading, and context projection.
- [风险] 在 plugins/MCP 成熟前过度建模 skills 可能造成返工。-> 缓解：v1 保持 additive，只聚焦 manifest、loading 和 context projection。

- [Risk] Secret-like content can appear in examples/resources. -> Mitigation: redact skill segments before activation result and projection; add no-raw-secret tests.
- [风险] examples/resources 中可能出现 secret-like content。-> 缓解：activation result 与 projection 前脱敏 skill segments；增加 no-raw-secret tests。

## Migration Plan

This is additive. Existing callers can continue using `register`, `activate`, and `list`. New v1 methods add validation, summaries, context projection, and activation diagnostics.

这是 additive 变更。现有调用方可继续使用 `register`、`activate` 和 `list`。新的 v1 methods 增加 validation、summaries、context projection 和 activation diagnostics。

Rollback strategy: keep the in-memory registry but disable context projection by returning no segments for all skills.

回滚策略：保留 in-memory registry，但通过对所有 skills 返回空 segments 来禁用 context projection。
