## Context

The repository already models plugins as manifests and contributions in `platform-contracts`, and the current first-party plugin pack ships four built-in plugins from `src/packages/first-party-dev-plugins`. That implementation is intentionally inert and routes execution through owner subsystems, but it keeps all plugin definitions, builder logic, validation, projection, and reasoning normalization in one file.

仓库已经在 `platform-contracts` 中建模 plugin manifests 与 contributions，目前一方插件包从 `src/packages/first-party-dev-plugins` 交付四个内置插件。该实现保持惰性并通过 owner subsystems 路由执行，但所有 plugin definitions、builder logic、validation、projection 与 reasoning normalization 仍集中在一个文件中。

## Goals / Non-Goals

**Goals:**
- Introduce a stable `@deepseek/plugin-api` package that plugin authors can use without importing runtime, CLI, or implementation internals.
- Introduce `src/plugins/builtin` as the official built-in plugin source, with one plugin directory per bundled plugin.
- Keep existing `@deepseek/first-party-dev-plugins` public exports source-compatible by turning it into a facade over the new built-in plugin workspace.
- Preserve deterministic plugin ids, sorted output, manifest shape, permissions, contribution counts, and inert projection behavior.
- Make the directory layout ready for future file manager and jump navigator plugins.

**Non-Goals:**
- Do not add marketplace, registry installation, remote update, or arbitrary third-party plugin execution.
- Do not add full executable file-manager or jump-navigator behavior in this refactor.
- Do not let plugins directly import CLI TUI internals, Node process/filesystem APIs, model SDKs, or runtime-private modules.
- Do not change user-visible CLI behavior beyond package organization.

## Decisions

### Directory Plan

```
src/packages/plugin-api/
  src/
    index.ts
    builders.ts

src/plugins/builtin/
  package.json
  src/
    index.ts
    registry.ts
    shared/
      define-builtin-plugin.ts
    plugins/
      context-compactor/
        contributions/
          commands.ts
          tui.ts
          reasoning.ts
        manifest.ts
        index.ts
      dev-checks/
      git-review/
      repo-navigator/

src/packages/first-party-dev-plugins/
  src/
    implementation.ts   # compatibility facade
    index.ts            # stable public exports
```

`plugin-api` owns author-facing helper functions and type re-exports. `src/plugins/builtin` owns official built-in plugin declarations. `first-party-dev-plugins` remains the compatibility package consumed by current CLI, tests, and command-system integration.

`plugin-api` 负责插件作者可见 helper 与类型导出。`src/plugins/builtin` 负责官方内置插件声明。`first-party-dev-plugins` 继续作为当前 CLI、测试与 command-system 集成使用的兼容包。

Plugins are grouped by product capability first, then by surface-specific contribution files inside each plugin. A plugin such as file manager or jump navigator should own its capability directory and expose `contributions/tui.ts`, `contributions/commands.ts`, `contributions/targets.ts`, or future `contributions/vscode.ts` files as needed. The top-level `src/plugins/builtin` directory must not be split into `tui`, `cli`, or `vscode` roots because those cuts would scatter one product capability across multiple ownership trees.

插件目录先按产品能力分组，再在每个插件内部按 surface-specific contribution files 拆分。例如 file manager 或 jump navigator 应拥有自己的能力目录，并按需暴露 `contributions/tui.ts`、`contributions/commands.ts`、`contributions/targets.ts` 或未来的 `contributions/vscode.ts`。顶层 `src/plugins/builtin` 不应拆成 `tui`、`cli` 或 `vscode` 根目录，因为那样会把一个产品能力切散到多个责任树。

### Decision: Make `plugin-api` declarative first

The first API surface exposes builders such as `definePlugin`, `defineBuiltinPlugin`, `command`, `paletteEntry`, `resultListProvider`, `keymap`, `rendererHint`, and `reasoningContribution`. These helpers return plain data that satisfies platform contracts. They do not provide a runtime context, TUI layout API, shell API, filesystem API, or model execution API.

第一版 API 只暴露 `definePlugin`、`defineBuiltinPlugin`、`command`、`paletteEntry`、`resultListProvider`、`keymap`、`rendererHint` 与 `reasoningContribution` 等 builder。这些 helper 返回满足 platform contracts 的普通数据，不提供 runtime context、TUI layout API、shell API、filesystem API 或 model execution API。

Alternative considered: expose a richer plugin runtime SDK immediately. Rejected because governed execution, approval, credentials, and audit boundaries must mature before executable third-party plugins receive runtime handles.

### Decision: Built-in plugins are normal manifests

Built-in plugins use the same manifest shape as future external plugins, with `source="built-in"` and deterministic integrity metadata. The built-in plugin registry returns manifests and normalized TUI/command/reasoning contributions without executing plugin code or owner commands.

内置插件使用与未来外部插件相同的 manifest shape，包含 `source="built-in"` 与确定性 integrity metadata。内置插件 registry 只返回 manifests 与归一化后的 TUI/command/reasoning contributions，不执行 plugin code 或 owner commands。

Alternative considered: keep built-in plugins as hardcoded command-system records. Rejected because it would not exercise the plugin system we need to productize.

### Decision: Keep compatibility through `first-party-dev-plugins`

Existing imports should continue to work. The old package becomes a stable facade over `@deepseek/builtin-plugins`, and implementation details move behind package public exports.

现有 imports 必须继续工作。旧包变成 `@deepseek/builtin-plugins` 之上的稳定 facade，implementation details 迁到 package public exports 后面。

Alternative considered: update all consumers to import `@deepseek/builtin-plugins` immediately. Rejected because a compatibility layer lowers migration risk and preserves current acceptance evidence.

## Risks / Trade-offs

- [Risk] Workspace package path under `src/plugins/*` may require lint or package-name convention updates. -> Mitigation: add the workspace explicitly and run existing boundary/typecheck/lint evidence.
- [风险] `src/plugins/*` workspace 路径可能需要 lint 或 package-name convention 更新。-> 缓解：显式加入 workspace，并运行现有 boundary/typecheck/lint 证据。
- [Risk] Moving definitions can accidentally change sorted output or contribution metadata. -> Mitigation: keep parity tests around manifest snapshots, contribution counts, and deterministic ids.
- [风险] 迁移 definitions 可能意外改变排序输出或 contribution metadata。-> 缓解：保留 manifest snapshot、contribution counts 与 deterministic ids 的等价测试。
- [Risk] Plugin authors may treat `plugin-api` as execution authority. -> Mitigation: keep first version declarative and document that execution routes through owner subsystems.
- [风险] 插件作者可能把 `plugin-api` 误认为 execution authority。-> 缓解：第一版保持声明式，并明确 execution 通过 owner subsystems 路由。

## Migration Plan

1. Add `@deepseek/plugin-api` and expose declarative builders plus type re-exports.
2. Add `@deepseek/builtin-plugins` under `src/plugins/builtin` and migrate existing four built-in plugin definitions into per-plugin directories.
3. Replace `first-party-dev-plugins` internals with a compatibility facade that delegates to the new built-in plugin registry.
4. Add parity tests for manifests, snapshots, TUI contributions, command contributions, reasoning contributions, and invalid manifest validation.
5. Run OpenSpec validation, typecheck, lint, boundary checks, and focused tests.

## Open Questions

- Should future executable plugin runtime APIs live in `plugin-api/runtime` or a separate `plugin-runtime-api` package once governed execution is ready?
- 当受治理执行成熟后，未来可执行 plugin runtime APIs 应该放在 `plugin-api/runtime`，还是拆成独立的 `plugin-runtime-api` package？
