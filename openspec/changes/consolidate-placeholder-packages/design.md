## Context

DeepSeek CLI 仓库的 `src/packages/` 目录当前有 32 个包。其中 5 个包很特殊：

- `@deepseek/plugin-system` — 18 行，`InMemoryPluginManager`
- `@deepseek/extension-system` — 20 行，`InMemoryExtensionManager`
- `@deepseek/evolution-engine` — 22 行，`InMemoryEvolutionEngine`
- `@deepseek/remote-runtime-connectivity` — 15 行，`NoopRemoteRuntimeConnectivity`
- `@deepseek/distribution-update-management` — 22 行，`StaticDistributionUpdateManager`

共 97 行 TypeScript。每个包各自有 `package.json`、`tsconfig.json`、`src/`、（空的）`test/`，并被 `scripts/workspace-packages.mjs`、根 `package.json` 的 workspaces 数组、`runtime` 与 `testing-regression` 的 `package.json` `dependencies` 四处登记。

TS 层面只有 `src/packages/testing-regression/src/fakes/index.ts` 直接 `import` 它们。`runtime` 只是把它们写进 `dependencies`（为了 lint-framework 的包名白名单），并不真正 import。

这种「有名无实」的包在每次加新 lint 规则、refactor、依赖审计时都增加调参成本，还会误导阅读者（看到 32 个包会以为系统真的有 32 个职责边界）。合并是非破坏性代码变化（接口在 `platform-contracts` 不动，类名和行为不变）但是破坏性工作区布局变化（目录消失、包名消失），需要显式 change pack 记录。

There are 32 workspace packages, five of which collectively contain 97 lines of TypeScript implementing the default `InMemory*` / `Noop*` / `Static*` behavior for platform contracts. Their only TS consumer is `testing-regression/src/fakes/index.ts`; the rest of the repo carries them only in `dependencies` manifests to satisfy lint-framework whitelists. This is "in name only" — consolidation is overdue.

## Goals / Non-Goals

**Goals:**

- 5 个占位包的源码一行不改地移入 `platform-abstraction/src/placeholders/`。
- 公共 API 稳定：`import { InMemoryPluginManager } from "@deepseek/platform-abstraction"` 等 5 个类名仍然可用。
- 包数量真实反映架构边界：从 32 降到 27。
- `workspace-packages.mjs` 文件一次性变短；后续加新 lint 规则少维护 5 行。
- 所有 266+ 测试、lint、boundary、typecheck 继续绿。

- Zero code-behavior change. Same class names, same exported symbols, same interfaces.
- Workspace count shrinks from 32 → 27 so it matches the actual architectural boundaries.
- Future lint/boundary rules save 5 lines of metadata.
- Full gates stay green.

**Non-Goals:**

- 不修改 `platform-contracts` 的 `PluginManager`、`ExtensionManager` 等接口定义 —— 那是 R1 契约，不在本次作用域。
- 不引入新的运行时实现（比如真的 plugin 加载器）—— 这仍然是「R1 占位」。
- 不重命名 `@deepseek/platform-abstraction`。
- 不变动 `NodePlatformRuntime`、`FakePlatformRuntime` 的既有实现或公共 API。

- No changes to `platform-contracts` interfaces.
- No new runtime behavior.
- No rename of `platform-abstraction`.
- No edits to `NodePlatformRuntime` / `FakePlatformRuntime`.

## Decisions

### Decision 1: 合并到 `platform-abstraction`，不新建 `platform-placeholders`

`platform-abstraction` 已经是「默认平台运行时实现」的归宿（NodePlatformRuntime、FakePlatformRuntime、process / fs 接线都在里面）。5 个占位实现与它语义同源 —— 都是平台契约在没有真实后端时的默认实现。合并进去让「默认平台行为全在一个地方」这个直觉成立，而不是分散在 6 个目录。

新建 `@deepseek/platform-placeholders` 包相当于只换个壳，净包数只减 4，也没有语义收益。

`platform-abstraction` is already the home of default platform implementations. Putting 5 more default implementations there is coherent. A new `@deepseek/platform-placeholders` package would only save 4 packages net and would split "default platform behavior" across two directories.

Rejected: 新建 `@deepseek/platform-placeholders`。只换壳，没收益。

Rejected: spinning up a new `platform-placeholders` package — just re-arranges deck chairs.

### Decision 2: 每个占位实现一个文件，而不是塞进一个大文件

5 份实现语义独立（插件、扩展、演进、远程、分发），合到一个文件会让读者需要翻来翻去找接口实现。每个文件 15-30 行，并排放在 `placeholders/` 目录下，搜「InMemoryPluginManager」能直接命中。`src/index.ts` 再导出。

单文件融合对 `git blame` 也不友好：未来把某个实现换成真实实现时，合并 PR 需要同时改其他 4 个无关实现的上下文。

One-file-per-class (15-30 LOC each) keeps grep cleaner and future replacements independent. A merged file would blur `git blame` when a single placeholder graduates into a real implementation.

Rejected: 一个 `placeholders.ts` 大文件。

Rejected: a single `placeholders.ts`.

### Decision 3: 只写 `platform-abstraction` 的 `ADDED` delta，不动 5 份源 spec

5 份 placeholder spec（`plugin-system`、`extension-system`、`evolution-engine`、`remote-runtime-connectivity`、`distribution-update-management`）的 Requirement 都是在描述平台契约（比如「plugin manifest must carry integrity metadata」），和「实现位于哪个 workspace 包」正交。把它们 REMOVE 掉会误伤 R1 规划里的契约要求。正确做法：不动源 spec，只在 `platform-abstraction` 上增加一条 `Placeholder Platform Implementations` Requirement 把实现归属锚定过来。

The five source specs describe contracts (e.g., "plugin manifests carry integrity metadata"), independent of which workspace package hosts the implementation. Removing them would delete R1 contract guidance. Correct pattern: leave source specs alone; add a single `Placeholder Platform Implementations` requirement in `platform-abstraction` that pins the implementation location.

Rejected: 用 REMOVED 把源 spec 的 Requirement 全搬过来。会丢契约语义。

Rejected: `REMOVED` the full source specs. Would lose contract semantics.

### Decision 4: `testing-regression` 的 fakes import 一次性合并成一行

5 个 `import { X } from "@deepseek/Y"` 变成 1 个 `import { InMemoryPluginManager, InMemoryExtensionManager, InMemoryEvolutionEngine, NoopRemoteRuntimeConnectivity, StaticDistributionUpdateManager } from "@deepseek/platform-abstraction"`。保持字母顺序不必强求 —— 这是机械更改。

Merge the 5 imports into a single line from `@deepseek/platform-abstraction`. Alphabetical order not enforced; mechanical change.

## Safety Model

- 接口不变：`platform-contracts` 的 5 个接口维持既有签名。破坏性仅在「包名」这个维度 —— 任何外部消费者（如果存在）需要把 `@deepseek/plugin-system` 改为 `@deepseek/platform-abstraction`，类名和用法不变。
- 工作区只包含 `deepseek-agent-cli`（CLI 可执行包）和内部 `@deepseek/*` 包，没有外部消费者，破坏可控。
- 迁移顺序：先复制源码 → 更新 `testing-regression` import → 更新 workspace 元数据 → 删除 5 个包目录 → 重跑 gates。每一步结束都有可回滚的 commit 点。
- Lint-framework 包名白名单需要更新；如果遗漏，lint 会直接报错，不会偷偷放过。
- 没有运行时副作用：没有网络、没有磁盘、没有权限变化。

- Interfaces unchanged in `platform-contracts`.
- Only the workspace itself consumes the moved packages — no external users.
- Migration is mechanical and staged with rollback points.
- Lint-framework whitelist errors are loud — no silent drift.

## Acceptance Strategy

- **Typecheck**: `npm run typecheck` 必须 0 错。迁移后所有 import 都能解析。
- **Lint**: `npm run lint` 必须通过。16 条 AST 规则、包名白名单同步到 27 包。
- **Boundaries**: `node scripts/check-boundaries.mjs` 必须报「27 packages」。
- **Full test suite**: `npm test` 必须全绿。原来 279 测试（含新加），包数减少不改变用例数。
- **Package count spot check**: `ls src/packages/ | wc -l` 结果为 27。
- **Spec validation**: `openspec validate consolidate-placeholder-packages --strict` 必须通过；`openspec validate --specs --strict` 必须通过（5 个 spec 被移除，`platform-abstraction` spec 吸收）。
- **Smoke**: `smoke:live:e2e` 在无 key 时按现状 skip。

- Typecheck, lint, boundary, full suite all green.
- Package count 27 after merge.
- OpenSpec strict validation passes for both the change and the full spec index.
