## Context

The CLI is the lead product surface. Existing work already provides split CLI host folders, readiness commands, observability bundles, approval UX, and reference pit fixtures. The remaining gap is product trust before release: users need one deterministic way to inspect local readiness, produce a redacted support bundle, and verify the CLI package surface before daily use or npm publish.

CLI 是当前主产品面。现有工作已经提供拆分后的 CLI host folders、readiness commands、observability bundles、approval UX 和 reference pit fixtures。剩余缺口是发布前产品信任：用户需要一种确定性的方式来检查本地可用性、生成脱敏支持包，并在日常使用或 npm publish 前验证 CLI package surface。

## Goals / Non-Goals

**Goals:**

- Add a CLI diagnostics command surface over existing readiness and observability contracts. / 在现有 readiness 与 observability contracts 之上增加 CLI diagnostics command surface。
- Make support bundles local, bounded, redacted, JSON/JSONL-capable, and privacy-decision aware. / 让 support bundles 保持 local、bounded、redacted、支持 JSON/JSONL，并带 privacy decision。
- Make `doctor` and `verify-install` report release readiness evidence including package surface expectations and acceptance evidence pointers. / 让 `doctor` 和 `verify-install` 报告 release readiness evidence，包括 package surface expectations 与 acceptance evidence pointers。
- Keep CLI as a host adapter: command-system and observability own data contracts; CLI renders and wires. / 保持 CLI 为 host adapter：command-system 与 observability 拥有数据契约；CLI 只负责渲染和接线。
- Add deterministic contract, CLI, e2e, and regression tests. / 增加 deterministic contract、CLI、e2e 和 regression tests。

**Non-Goals:**

- Do not implement extension management, MCP/plugin auth flows, signed marketplace distribution, or update UI. / 不实现 extension management、MCP/plugin auth flows、signed marketplace distribution 或 update UI。
- Do not upload support bundles externally; external targets remain denied unless future policy explicitly enables them. / 不外传 support bundles；external targets 在未来 policy 显式开启前保持 denied。
- Do not change runtime execution semantics or provider behavior. / 不改变 runtime execution semantics 或 provider behavior。
- Do not add a full TUI diagnostics screen. / 不增加 full TUI diagnostics screen。

## Decisions

### Decision: Diagnostics command is a CLI adapter over readiness and observability

`src/apps/cli/src/diagnostics` will assemble local readiness results, package evidence, acceptance pointers, and a diagnostic bundle using `@deepseek/command-system` and `@deepseek/observability`. CLI parsing exposes this through `deepseek diagnostics bundle|release|doctor`.

`src/apps/cli/src/diagnostics` 将使用 `@deepseek/command-system` 与 `@deepseek/observability` 组装 local readiness results、package evidence、acceptance pointers 和 diagnostic bundle。CLI parsing 通过 `deepseek diagnostics bundle|release|doctor` 暴露该能力。

Alternative considered: add all diagnostics behavior into `doctor`. Rejected because support bundle generation, release readiness, and doctor checks have different output shapes and privacy decisions.

备选方案：把所有 diagnostics 行为塞进 `doctor`。该方案被拒绝，因为 support bundle generation、release readiness 和 doctor checks 的 output shapes 与 privacy decisions 不同。

### Decision: Release readiness is evidence, not publishing

This pack validates package metadata, expected tarball surface, ignored forbidden paths, acceptance evidence references, and build/smoke command pointers. It does not publish, sign, or upload artifacts.

本包校验 package metadata、expected tarball surface、ignored forbidden paths、acceptance evidence references 和 build/smoke command pointers。它不 publish、sign 或 upload artifacts。

Alternative considered: run `npm publish --dry-run` inside the command. Rejected for deterministic default behavior and because packaging evidence can be tested without npm network or registry assumptions.

备选方案：在 command 内运行 `npm publish --dry-run`。该方案被拒绝，因为默认行为应保持 deterministic，且 package evidence 可以在不依赖 npm network 或 registry 假设的情况下测试。

### Decision: Support bundles include synthetic local evidence and denied external export decision

The CLI diagnostics bundle will emit local bundle evidence from the observability sink and include a denied external export privacy decision by default. This proves support material is redacted and external transfer is not attempted.

CLI diagnostics bundle 会从 observability sink 输出 local bundle evidence，并默认包含 denied external export privacy decision。这能证明 support material 已脱敏且不会尝试 external transfer。

Alternative considered: expose only raw observability bundle output. Rejected because users need product-level context around what was checked and why export was denied.

备选方案：只暴露 raw observability bundle output。该方案被拒绝，因为用户需要产品级上下文来理解检查内容和 export denied 的原因。

### Decision: Keep artifacts bilingual and reference-pit driven

All new planning and behavior text remains bilingual. Diagnostics redaction and environment snapshot concerns cite `pit.diagnostic-redaction.support-bundle` and `pit.env-snapshot.immutable-startup`; forbidden path hygiene reuses the existing reference path rules.

所有新增规划与行为文本保持双语。diagnostics redaction 与 environment snapshot 关注点引用 `pit.diagnostic-redaction.support-bundle` 和 `pit.env-snapshot.immutable-startup`；禁入路径卫生复用现有参考路径规则。

## Directory Plan / 目录计划

- `src/apps/cli/src/diagnostics/`: CLI-only diagnostics assembly, renderers, and package evidence helpers. / CLI-only diagnostics assembly、renderers 和 package evidence helpers。
- `src/apps/cli/src/commands/parse.ts`: route `diagnostics` subcommands and output flags only. / 只路由 `diagnostics` subcommands 与 output flags。
- `src/apps/cli/src/entry/run-cli.ts`: dispatch diagnostics command to the adapter. / 将 diagnostics command 分发到 adapter。
- `src/packages/platform-contracts/src/readiness.ts`: add implementation-free DTOs only if needed for release/support evidence. / 必要时只增加无实现 DTO。
- `src/packages/command-system/src/implementation.ts`: extend readiness checks with release/package evidence while keeping command ownership. / 扩展 readiness checks 的 release/package evidence，同时保持 command ownership。
- `src/packages/observability/src/index.ts`: keep bundle generation and redaction implementation in observability. / bundle generation 与 redaction implementation 保持在 observability。
- Tests: CLI tests under `src/apps/cli/test`, readiness/diagnostics contract tests under `tests/contracts`, e2e under `tests/e2e`, and any replay/matrix evidence under existing folders. / 测试放在 `src/apps/cli/test`、`tests/contracts`、`tests/e2e` 及现有 replay/matrix 目录。

Split triggers: any CLI diagnostics file approaching 500 lines should split renderers from collectors; `index.ts` files remain export surfaces only.

拆分触发器：任何 CLI diagnostics 文件接近 500 行时，应把 renderers 与 collectors 拆开；`index.ts` 文件只保持导出面。

## Terminal Capability Impact / 终端能力影响

Diagnostics output must be readable in text mode and deterministic in JSON/JSONL. Structured modes must contain no ANSI, prompt glyphs, spinners, cursor control, or alternate-screen state. Narrow and non-TTY profiles should still produce stable line-oriented output.

diagnostics output 必须在 text mode 可读，并在 JSON/JSONL 中保持确定性。structured modes 不得包含 ANSI、prompt glyphs、spinners、cursor control 或 alternate-screen state。窄屏和 non-TTY profiles 仍应产出稳定的 line-oriented output。

## Vi-Inspired Composition Impact / Vi 启发式组合影响

Diagnostics checks and support-bundle records become typed result-list items with stable ids. Later CLI UX can jump to failed checks, inspect bundle records, or replay evidence without rerunning model/tool turns.

diagnostics checks 与 support-bundle records 成为带稳定 id 的 typed result-list items。后续 CLI UX 可以跳转到 failed checks、查看 bundle records 或 replay evidence，而不重新运行 model/tool turns。

## Request/Turn Revert Impact / 请求/回合回退影响

This pack does not revert workspace changes. It preserves diagnostic and approval evidence in immutable bundles so future request/turn revert can cite readiness state, redaction decisions, and release evidence.

本包不回退 workspace changes。它在 immutable bundles 中保留 diagnostic 与 approval evidence，使未来 request/turn revert 可以引用 readiness state、redaction decisions 和 release evidence。

## Risks / Trade-offs

- [Risk] Diagnostics may become a dumping ground for unrelated checks. -> Mitigation: keep release/package evidence separate from future extension management and signed distribution. / [风险] diagnostics 可能变成无关检查的堆放处。-> 缓解：将 release/package evidence 与未来 extension management、signed distribution 分开。
- [Risk] Support bundles could leak local paths or secrets. -> Mitigation: use observability redaction, pit fixtures, and tests that serialize full outputs. / [风险] support bundles 可能泄漏 local paths 或 secrets。-> 缓解：使用 observability redaction、pit fixtures，以及序列化完整输出的测试。
- [Risk] Release readiness could become stale if package metadata changes. -> Mitigation: derive package evidence from package files and keep expected publish surface in tests. / [风险] package metadata 改动后 release readiness 可能过期。-> 缓解：从 package files 派生 package evidence，并在测试中固定 expected publish surface。

## Migration Plan

1. Add OpenSpec and DTO/command contracts. / 增加 OpenSpec 与 DTO/command contracts。
2. Implement diagnostics CLI adapter and release evidence helpers. / 实现 diagnostics CLI adapter 与 release evidence helpers。
3. Extend readiness checks and support-bundle redaction tests. / 扩展 readiness checks 与 support-bundle redaction tests。
4. Update product roadmap/docs and acceptance evidence pointers. / 更新产品路线图/文档和 acceptance evidence pointers。
5. Run OpenSpec validation, typecheck, lint, targeted tests, `npm test`, and boundary checks. / 运行 OpenSpec validation、typecheck、lint、定向测试、`npm test` 和 boundary checks。

Rollback: remove the diagnostics CLI command and release-readiness additions; existing readiness and observability commands remain usable.

回滚：移除 diagnostics CLI command 与 release-readiness additions；现有 readiness 和 observability commands 仍可使用。
