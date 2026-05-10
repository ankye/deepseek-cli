## Why

仓库里有 5 个只含 10-22 行 TypeScript 的包，实现都是 `InMemory*` / `Noop*` / `Static*` 占位：`@deepseek/plugin-system`、`@deepseek/extension-system`、`@deepseek/evolution-engine`、`@deepseek/remote-runtime-connectivity`、`@deepseek/distribution-update-management`。每个包各自带 `package.json`、`tsconfig.json`、`src/index.ts`，全工作区 lint 规则、`workspace-packages.mjs` 依赖图、`runtime` 与 `testing-regression` 的 `dependencies` 清单都得为它们复述一遍元数据，但真实 TS 消费者只有 `testing-regression/src/fakes/index.ts` 这一个文件。

The repo carries 5 packages whose only implementation is a 10-22 line `InMemory*` / `Noop*` / `Static*` class: `plugin-system`, `extension-system`, `evolution-engine`, `remote-runtime-connectivity`, `distribution-update-management`. Each has its own `package.json`, `tsconfig.json`, `src/index.ts`; the workspace lint, `workspace-packages.mjs` dependency graph, and the `runtime` + `testing-regression` manifests all have to restate their metadata — while the only real TS consumer is `testing-regression/src/fakes/index.ts`.

每个占位实现都直接实现了 `platform-contracts` 的接口，语义上属于「平台默认行为」。既然 `@deepseek/platform-abstraction` 已经是「默认平台运行时」的归宿（NodePlatformRuntime、FakePlatformRuntime 都在里面），把这 5 个占位实现并入它自然衔接，不引入新的包。合并后：

- 包数量 32 → 27（净减 5）。
- `workspace-packages.mjs` 从 32 个目录和 66 行 `packageDependencies` 收缩。
- `runtime` 和 `testing-regression` 的 `package.json` 少 5 条重复声明。
- 架构 lint 规则（16 条横切 32 个包）少查 5 个目录。

Every placeholder implements a `platform-contracts` interface and semantically belongs to "default platform behavior". `@deepseek/platform-abstraction` already owns that role (NodePlatformRuntime, FakePlatformRuntime live there), so folding the five stubs in is a natural extension — no new package. After the merge: 32 → 27 packages; `workspace-packages.mjs` shrinks by 5 directories and many dependency lines; `runtime` and `testing-regression` manifests drop 5 duplicated entries each; the 16-rule architecture lint covers 5 fewer directories.

## What Changes

- 把 5 个占位包的 `src/index.ts` 内容整体迁移到 `src/packages/platform-abstraction/src/placeholders/`，每个实现一个文件：`agent-plugin.ts`（`InMemoryPluginManager`）、`agent-extension.ts`（`InMemoryExtensionManager`）、`agent-evolution.ts`（`InMemoryEvolutionEngine`）、`agent-remote.ts`（`NoopRemoteRuntimeConnectivity`）、`agent-distribution.ts`（`StaticDistributionUpdateManager`）。从 `@deepseek/platform-abstraction` 的 `src/index.ts` 再导出所有符号，保持公共 API 稳定。
- **破坏性**：删除 5 个独立包目录（`src/packages/plugin-system/`、`extension-system/`、`evolution-engine/`、`remote-runtime-connectivity/`、`distribution-update-management/`）。根 `package.json` 的 `workspaces` 数组、`scripts/workspace-packages.mjs` 的 `packages` 和 `packageDependencies`、`runtime` 与 `testing-regression` 的 `dependencies` 都要同步修剪。
- 更新唯一的 TS 消费者 `src/packages/testing-regression/src/fakes/index.ts`：5 个 import 统一改为 `from "@deepseek/platform-abstraction"`。
- 更新所有 `appDependencies` / `packageDependencies` 里可能出现的这 5 个名字（实际只在 `runtime` 和 `testing-regression` 的 `packageDependencies` 中）。
- 更新架构 lint 期望列表（`scripts/lint-framework/rules/package-*.mjs` 如果按名字白名单），保证 lint 通过。
- 更新相关规范文档：`openspec/specs/plugin-system`、`extension-system` 等 spec 标题统一表述为「归并于 platform-abstraction」的位置说明，同时保留原 Requirements 语义（它们仍然是平台契约）。
- **非破坏性**：`@deepseek/platform-contracts` 里的 `PluginManager`、`ExtensionManager`、`EvolutionEngine`、`RemoteRuntimeConnectivity`、`DistributionUpdateManager` 接口保持不变；公共类型导出稳定。

- **BREAKING in workspace layout:** 5 package directories are deleted. Their TypeScript contents move to `src/packages/platform-abstraction/src/placeholders/*.ts` (one file per former package) and are re-exported from `@deepseek/platform-abstraction`. Root `package.json` workspaces, `scripts/workspace-packages.mjs`, and the `runtime` + `testing-regression` package manifests drop the 5 names.
- The only TS consumer — `testing-regression/src/fakes/index.ts` — changes its 5 import lines to read from `@deepseek/platform-abstraction`.
- Architecture-lint package-name whitelists and boundary rules are updated to reflect the 27-package workspace.
- `@deepseek/platform-contracts` interfaces (`PluginManager` etc.) stay exactly as they are; public API is preserved.

## Impact

- 受影响规范：`platform-abstraction` 新增一个 `Placeholder Platform Implementations` Requirement，确立五个占位实现归属于该包。`plugin-system`、`extension-system`、`evolution-engine`、`remote-runtime-connectivity`、`distribution-update-management` 五份 spec 保持不变 —— 它们描述的是平台契约（Requirement 粒度），与实现归属于哪个 workspace 包正交，无需改动。
- 受影响代码：
  - `src/packages/platform-abstraction/src/**`：新增 `placeholders/` 子目录 + 5 个文件 + 6 行再导出。
  - `src/packages/testing-regression/src/fakes/index.ts`：5 行 import 整合为 1 行。
  - `src/packages/runtime/package.json` 与 `src/packages/testing-regression/package.json`：删除 5 条 `dependencies`。
  - `package.json`（根）：`workspaces` 数组删除 5 条。
  - `scripts/workspace-packages.mjs`：`packages` 删 5 条；`packageDependencies` 里 `runtime` 和 `testing-regression` 的数组删 5 条；删除 5 条键值对。
  - `scripts/check-boundaries.mjs`/`scripts/lint-framework/**`：如果有名字白名单，更新成 27 包。
- 受影响测试：
  - `tests/contracts/package-boundaries.test.ts`、`tests/matrix/fake-platforms.test.ts` 如果枚举了包名，同步修改。
  - 运行全套测试套件期望零失败，包数从 32 降为 27。
- 文档：`openspec/project.md` 里的「32 packages」表述更新为「27 packages」；`docs/architecture/*.md` 若出现列表需同步。

- Specs: `platform-abstraction` gains a `Placeholder Platform Implementations` requirement pinning the five default implementations to that package. The five former spec files (`plugin-system`, `extension-system`, `evolution-engine`, `remote-runtime-connectivity`, `distribution-update-management`) remain unchanged — they describe platform contracts at requirement granularity, orthogonal to which workspace package hosts the implementation.
- Source code: new `platform-abstraction/src/placeholders/` with 5 files + re-exports; `testing-regression/src/fakes/index.ts` consolidates its imports to one line; root `package.json`, `scripts/workspace-packages.mjs`, and `runtime` + `testing-regression` manifests drop 5 names.
- Tests: any enumerator (`package-boundaries.test.ts`, `fake-platforms.test.ts`) updates to the 27-package count; full suite must pass.
- Docs: `openspec/project.md` package count and any architecture overview listing the packages.
