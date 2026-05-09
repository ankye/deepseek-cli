## 1. Contracts And Workspace Package / 契约与工作区包

- [x] 1.1 Add core tool ids, input/output DTOs, evidence DTOs, diagnostics, and edit transaction contracts to `@deepseek/platform-contracts`. / 在 `@deepseek/platform-contracts` 增加 core tool ids、input/output DTOs、evidence DTOs、diagnostics 和 edit transaction contracts。
- [x] 1.2 Add `@deepseek/core-coding-tools` workspace package with public exports, package metadata, dependency boundaries, and scaffold tests. / 增加 `@deepseek/core-coding-tools` workspace package，包含 public exports、package metadata、dependency boundaries 和 scaffold tests。
- [x] 1.3 Update workspace dependency policy and lint conventions so only approved owner packages can access filesystem/process/platform primitives needed by core tools. / 更新 workspace dependency policy 和 lint conventions，使只有 approved owner packages 可访问核心工具需要的 filesystem/process/platform primitives。

## 2. Tool Manifests And Registration / 工具 Manifest 与注册

- [x] 2.1 Define stable capability manifests and schemas for read, write, edit, list/glob, search, shell.run, git.status, git.diff, test.run, and todo.plan. / 为 read、write、edit、list/glob、search、shell.run、git.status、git.diff、test.run 和 todo.plan 定义稳定 capability manifests 与 schemas。
- [x] 2.2 Implement a registration helper that registers all enabled core tools into the capability registry with executor bindings. / 实现 registration helper，将所有启用的 core tools 与 executor bindings 注册到 capability registry。
- [x] 2.3 Add model-visible projection tests proving enabled core tools expose schemas while executor bindings remain kernel-only. / 增加 model-visible projection tests，证明已启用核心工具暴露 schemas，且 executor bindings 仍只属于 kernel。

## 3. File, Search, And Edit Tools / 文件、搜索与编辑工具

- [x] 3.1 Implement read and list/glob tools using platform workspace path resolution, bounded previews, stable ordering, and replay-safe evidence. / 使用 platform workspace path resolution、bounded previews、stable ordering 和 replay-safe evidence 实现 read 与 list/glob tools。
- [x] 3.2 Implement semantic search using platform search providers and provider metadata. / 使用 platform search providers 和 provider metadata 实现 semantic search。
- [x] 3.3 Implement write and exact edit tools with precondition checks, rollback metadata, affected paths, post-edit evidence, and no mutation on failure. / 实现 write 与 exact edit tools，包含 precondition checks、rollback metadata、affected paths、post-edit evidence，并确保失败不修改文件。

## 4. Process, Git, Test, And Plan Tools / 进程、Git、测试与计划工具

- [x] 4.1 Implement shell.run through platform process/shell providers with explicit timeout, cwd, environment scope, output bounding, and typed unavailable diagnostics. / 通过 platform process/shell providers 实现 shell.run，包含显式 timeout、cwd、environment scope、output bounding 和 typed unavailable diagnostics。
- [x] 4.2 Implement git.status and git.diff as read-only evidence tools with structured diagnostics for missing git or non-repository workspaces. / 将 git.status 和 git.diff 实现为 read-only evidence tools，并为 missing git 或 non-repository workspaces 提供 structured diagnostics。
- [x] 4.3 Implement test.run as a semantic wrapper over governed process execution with test intent metadata, timeout, output bounding, and result summary. / 将 test.run 实现为受治理 process execution 的语义 wrapper，包含 test intent metadata、timeout、output bounding 和 result summary。
- [x] 4.4 Implement todo.plan as replay-safe structured plan state without host-owned execution state. / 将 todo.plan 实现为 replay-safe structured plan state，避免 host-owned execution state。

## 5. Runtime And Host Integration / Runtime 与 Host 集成

- [x] 5.1 Register core tools in deterministic runtime dependencies and provide a runtime bootstrap path for CLI usage. / 在 deterministic runtime dependencies 中注册核心工具，并提供 CLI 使用的 runtime bootstrap path。
- [x] 5.2 Ensure every core tool invocation enters the execution envelope, policy, scheduler, platform context, bus, session, and observability path before executor work. / 确保每个核心工具调用在 executor 工作前进入 execution envelope、policy、scheduler、platform context、bus、session 和 observability path。
- [x] 5.3 Add CLI smoke or test-only command path that can run a deterministic read-edit-test tool sequence through runtime events. / 增加 CLI smoke 或 test-only command path，能通过 runtime events 运行确定性的 read-edit-test 工具序列。

## 6. Tests And Acceptance / 测试与验收

- [x] 6.1 Add package-local unit tests for each tool executor and failure mode. / 为每个 tool executor 与 failure mode 增加 package-local unit tests。
- [x] 6.2 Add contract tests for tool DTOs, manifests, projection, evidence shape, and workspace edit transaction behavior. / 增加 tool DTOs、manifests、projection、evidence shape 和 workspace edit transaction behavior 的 contract tests。
- [x] 6.3 Add integration and golden tests for the minimal coding turn: read file, apply exact edit, run deterministic test command, and return evidence. / 为最小 coding turn 增加 integration 和 golden tests：read file、apply exact edit、run deterministic test command 和 return evidence。
- [x] 6.4 Add matrix tests for fake macOS, Windows, Linux, WSL, CI/no-native, and remote/no-local-shell covering path rejection, search fallback, shell/test unavailable behavior, and output bounding. / 增加 fake macOS、Windows、Linux、WSL、CI/no-native 和 remote/no-local-shell 的 matrix tests，覆盖 path rejection、search fallback、shell/test unavailable behavior 和 output bounding。
- [x] 6.5 Add e2e smoke proving CLI/runtime events can execute the deterministic core tool sequence without live provider access. / 增加 e2e smoke，证明 CLI/runtime events 可以在不访问 live provider 的情况下执行 deterministic core tool sequence。
- [x] 6.6 Run `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:contracts`, `npm run test:integration`, `npm run test:golden`, `npm run test:compatibility`, `npm run test:matrix`, `npm run test:e2e`, and OpenSpec strict validation. / 运行 `npm run typecheck`、`npm run lint`、`npm test`、`npm run test:contracts`、`npm run test:integration`、`npm run test:golden`、`npm run test:compatibility`、`npm run test:matrix`、`npm run test:e2e` 和 OpenSpec strict validation。
