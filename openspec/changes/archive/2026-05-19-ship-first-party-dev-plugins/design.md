## Context

`deepseek chat` now has a production, vi-inspired TUI framework with deterministic contribution diagnostics. The platform also has contracts for plugins, extensions, command composition, palette actions, lossless context memory, and governed runtime capabilities. What is missing for release is a trusted first-party plugin pack that turns those contracts into useful developer workflows without expanding into arbitrary third-party plugin execution.

`deepseek chat` 现在已有 production、vi-inspired TUI framework，并具备确定性的 contribution diagnostics。平台也已经有 plugins、extensions、command composition、palette actions、lossless context memory 与 governed runtime capabilities 的合同。上线前缺的是一个可信的一方插件包，把这些合同转成开发者实际会用的工作流，同时不扩大到任意第三方插件执行。

## Goals / Non-Goals

**Goals:**

- Ship a small built-in development plugin pack that is useful immediately in CLI and chat.
- Keep first-party plugin registration declarative and side-effect free.
- Route every executable plugin action through an owning command, capability, policy, approval, or host boundary.
- Make `@deepseek/plugin-context-compactor` the canonical first-release interface for lossless context compaction.
- Expose plugin metadata through help, palette, TUI summaries, extension management, JSON/JSONL, and release diagnostics.
- Add tests proving deterministic projection, redaction, command routing, and no accidental plugin-private execution.

- 交付一个小型 built-in development plugin pack，让 CLI 与 chat 立即可用。
- 保持一方插件 registration 声明式且无副作用。
- 每个可执行 plugin action 都必须通过 owning command、capability、policy、approval 或 host boundary。
- 将 `@deepseek/plugin-context-compactor` 作为第一版无损上下文压缩的标准入口。
- 通过 help、palette、TUI summaries、extension management、JSON/JSONL 与 release diagnostics 暴露插件元数据。
- 增加测试，证明 projection 确定、redaction 生效、command routing 正确且没有意外 plugin-private execution。

**Non-Goals:**

- No third-party plugin marketplace, remote registry, signed package distribution, or automatic update channel.
- No arbitrary shell plugin or user-defined command string execution.
- No browser automation plugin in the first release.
- No automatic permanent-memory writes from context compaction.
- No full-screen/raw-key TUI renderer work beyond consuming existing TUI contribution metadata.

- 不做第三方 plugin marketplace、remote registry、signed package distribution 或 automatic update channel。
- 不做 arbitrary shell plugin 或 user-defined command string execution。
- 第一版不加入 browser automation plugin。
- context compaction 不自动写入 permanent memory。
- 不新增 full-screen/raw-key TUI renderer，只消费已有 TUI contribution metadata。

## Decisions

1. Add a host-agnostic first-party plugin pack package.

   Create a shared package such as `@deepseek/first-party-dev-plugins` under `src/packages/*` that exports the built-in plugin manifests, contribution metadata, command descriptors, permissions, side-effect metadata, and diagnostics. The package remains implementation-light: it does not call Node process APIs, read files, invoke git, or execute npm scripts.

   Alternative considered: define the plugin pack inside `src/apps/cli`. That would ship faster, but it would make VSCode/server reuse harder and would violate the “thin app adapter” direction. The shared package keeps identities, manifests, and composition metadata reusable while leaving execution to owning subsystems.

   新增一个 host-agnostic first-party plugin pack package。可在 `src/packages/*` 下创建 `@deepseek/first-party-dev-plugins`，导出内置 plugin manifests、contribution metadata、command descriptors、permissions、side-effect metadata 与 diagnostics。该包保持 implementation-light：不调用 Node process APIs、不读文件、不调用 git，也不执行 npm scripts。

   备选方案是在 `src/apps/cli` 中定义插件包。这样更快，但会削弱 VSCode/server 复用，并违背 thin app adapter 方向。共享包让 identities、manifests 与 composition metadata 可复用，执行仍交给 owner subsystem。

2. Treat built-in plugins as trusted manifests, not privileged code.

   Built-in first-party plugins use source `built-in`, stable integrity, compatibility ranges, and explicit permissions. Being first-party allows default enablement in the release profile, but does not allow the plugin package to mutate runtime internals or bypass command/capability governance.

   Alternative considered: special-case first-party plugins as hard-coded CLI features. That would be simpler short-term but would fail to exercise plugin provenance, permission diff, projection, and TUI contribution paths before third-party extensibility arrives.

   将内置插件视为可信 manifest，而不是特权代码。内置一方插件使用 `built-in` source、稳定 integrity、compatibility ranges 与显式 permissions。一方身份允许在 release profile 下默认启用，但不允许 plugin package 修改 runtime internals 或绕过 command/capability governance。

   备选方案是把一方插件特殊处理为硬编码 CLI 功能。短期更简单，但无法在第三方扩展到来前验证 plugin provenance、permission diff、projection 与 TUI contribution 路径。

3. Keep developer checks predeclared and bounded.

   `@deepseek/plugin-dev-checks` contributes known verification actions such as OpenSpec validation, typecheck, lint, tests, boundary checks, and CLI build. It must not accept arbitrary command fragments. Each action resolves to a typed governed command descriptor with a fixed command id, fixed cwd policy, timeout, side-effect level, and output redaction rules.

   Alternative considered: expose a generic shell-runner plugin. That is too broad for first release and would require a stronger policy/sandbox story than the current first-party plugin pack needs.

   开发检查保持预声明且有界。`@deepseek/plugin-dev-checks` 贡献 OpenSpec validation、typecheck、lint、tests、boundary checks 与 CLI build 等已知验证动作。它不能接收任意 command fragments。每个动作解析为 typed governed command descriptor，包含固定 command id、固定 cwd policy、timeout、side-effect level 与 output redaction rules。

   备选方案是提供 generic shell-runner plugin。第一版风险面太大，需要比当前一方插件包更强的 policy/sandbox 设计。

4. Make context compaction reversible by construction.

   `@deepseek/plugin-context-compactor` must use `LosslessContextManager` as the source of truth. Summaries are compact pointers with `coversNodeIds`, not replacements. Commands such as `/context grep`, `/context describe`, `/context expand`, `/context summarize`, `/context budget`, and `/context pin` return bounded structured results and can feed palette references.

   Alternative considered: use a lossy model-generated session summary as the plugin output. That would be cheaper to display, but it would remove auditability and make old tool evidence hard to recover. The first release must prefer recoverability over maximum compression ratio.

   上下文压缩必须从结构上可逆。`@deepseek/plugin-context-compactor` 必须以 `LosslessContextManager` 为事实源。summary 是带 `coversNodeIds` 的 compact pointer，而不是替换原始内容。`/context grep`、`/context describe`、`/context expand`、`/context summarize`、`/context budget` 与 `/context pin` 返回有界 structured results，并可进入 palette references。

   备选方案是输出 lossy model-generated session summary。展示成本更低，但会损失 auditability，也让旧 tool evidence 难以恢复。第一版必须优先 recoverability，而不是最大压缩率。

5. Use one projection path for CLI, palette, and TUI.

   The plugin pack contributes command, palette entry, result-list provider, keymap, and render-hint metadata through existing composition records. CLI help, `/palette`, TUI startup/status, and JSON/JSONL extension management all consume the same records and provenance. Execution is separate from projection.

   Alternative considered: let each surface render plugin-specific help text. That creates drift and weakens structured testing. A shared projection path keeps release diagnostics and UI aligned.

   CLI、palette 与 TUI 使用同一 projection path。插件包通过现有 composition records 贡献 command、palette entry、result-list provider、keymap 与 render-hint metadata。CLI help、`/palette`、TUI startup/status 与 JSON/JSONL extension management 都消费同一批 records 与 provenance。执行与 projection 分离。

   备选方案是每个 surface 自己渲染 plugin-specific help text。这样会产生漂移，并削弱结构化测试。同一 projection path 可让 release diagnostics 与 UI 保持一致。

## Risks / Trade-offs

- First-party plugin pack becomes a second command system -> Keep manifests and descriptors in the plugin package, but route invocation through the command system and owning packages.
- Dev-check commands accidentally become arbitrary shell -> Use fixed command ids, fixed argument sets, and tests that reject user-controlled shell fragments.
- Context summaries are mistaken for authoritative raw evidence -> Render summary nodes with coverage metadata and require expand before treating old details as authoritative.
- Plugin metadata clutters chat startup -> TUI renders only bounded counts and diagnostics by default; details live in `/plugins`, `/palette`, or `/context status`.
- Permission model feels heavy for built-ins -> Keep it visible anyway so future plugin updates, auth diffs, and third-party plugins use the same muscle memory.

- 一方插件包变成第二套 command system -> plugin package 只保存 manifests 与 descriptors，invocation 必须经过 command system 与 owner packages。
- dev-check commands 意外变成 arbitrary shell -> 使用固定 command ids、固定 arguments，并用测试拒绝用户可控 shell fragments。
- context summaries 被误当成原始证据 -> summary nodes 必须渲染 coverage metadata，并要求 expand 后才能把旧细节当作权威。
- plugin metadata 污染 chat startup -> TUI 默认只渲染有界 counts 与 diagnostics；细节放到 `/plugins`、`/palette` 或 `/context status`。
- built-in 也走 permission model 显得偏重 -> 仍保持可见，确保未来 plugin updates、auth diffs 与 third-party plugins 使用同一套习惯。

## Migration Plan

1. Add the shared first-party plugin pack package and export the four built-in manifests.
2. Register first-party plugin composition records in command/palette/TUI projection without executing plugin owners.
3. Implement governed command adapters for dev checks, repo navigation, git review, and context compaction using existing package boundaries.
4. Add CLI/chat slash aliases and JSON/JSONL renderers backed by structured command results.
5. Extend readiness/release diagnostics and acceptance evidence to include first-party plugin pack status.
6. Run `openspec validate ship-first-party-dev-plugins --strict`, typecheck, lint, tests, boundary checks, build, and targeted contract/integration/golden/matrix suites.

1. 新增共享 first-party plugin pack package，并导出四个内置 manifests。
2. 将一方 plugin composition records 注册进 command/palette/TUI projection，且不执行 plugin owners。
3. 使用现有包边界实现 dev checks、repo navigation、git review 与 context compaction 的 governed command adapters。
4. 增加 CLI/chat slash aliases 与 JSON/JSONL renderer，输出来自 structured command results。
5. 扩展 readiness/release diagnostics 与 acceptance evidence，包含 first-party plugin pack status。
6. 运行 `openspec validate ship-first-party-dev-plugins --strict`、typecheck、lint、tests、boundary checks、build 与定向 contract/integration/golden/matrix suites。

Rollback is straightforward before release: disable the built-in plugin pack registration while leaving existing command, palette, TUI, and lossless context code paths intact.

上线前回滚路径很直接：禁用 built-in plugin pack registration，同时保留现有 command、palette、TUI 与 lossless context 代码路径。

## Open Questions

- Should `/plugins` be introduced as a chat-local alias for extension management in this change, or should plugin details stay under existing `deepseek extension` commands for the first release?
- Should `@deepseek/plugin-git-review` include a dry-run commit-message helper, or keep first release to status/diff/review projections only?
- Should context summary generation remain deterministic at first, or can it call the model once governed summarizer permissions are available?

- 本变更是否引入 `/plugins` 作为 chat-local extension management alias，还是第一版先保留在现有 `deepseek extension` commands 下？
- `@deepseek/plugin-git-review` 是否包含 dry-run commit-message helper，还是第一版只做 status/diff/review projections？
- context summary generation 第一版是否保持 deterministic，还是在 governed summarizer permissions 可用后允许调用模型？
