## Context

The built-in plugin directory now owns plugin manifests and contribution descriptors, while CLI adapters own concrete command execution. Repo navigator already has partial execution for `files` and `grep`, but plugin command descriptors do not prove that every declared command has a host route.

内置插件目录现在拥有 manifest 与 contribution descriptors，CLI adapters 拥有具体命令执行。Repo navigator 已经部分实现 `files` 与 `grep`，但 plugin command descriptors 还不能证明每个声明命令都有 host route。

## Goals / Non-Goals

**Goals:**
- Provide one deterministic owner route registry for all built-in plugin command IDs.
- Validate complete coverage for context, checks, repo, and git built-in plugins.
- Dispatch implemented command IDs through existing host adapters.
- Surface deferred routes as first-class readiness metadata instead of silent placeholders.
- Keep plugins declarative and handler-free.

**目标：**
- 为所有 built-in plugin commandId 提供一个确定性的 owner route registry。
- 校验 context、checks、repo 与 git built-in plugins 的完整覆盖。
- 已实现 commandId 通过现有 host adapters 调度。
- 将 deferred routes 作为一等 readiness metadata 暴露，而不是静默占位。
- 保持插件声明式，不放 handler。

**Non-Goals:**
- Do not move CLI adapter code into `src/plugins/builtin`.
- Do not allow plugin-private execution callbacks.
- Do not implement external marketplace plugin execution.

**非目标：**
- 不把 CLI adapter 代码迁入 `src/plugins/builtin`。
- 不允许 plugin-private execution callbacks。
- 不实现外部 marketplace plugin execution。

## Decisions

### Decision: Host-Owned Route Registry

`src/apps/cli` owns a built-in plugin owner route registry. It imports built-in plugin manifests, extracts command descriptors, and maps each `commandId` to a typed route descriptor.

`src/apps/cli` 拥有内置插件 owner route registry。它导入 built-in plugin manifests，提取 command descriptors，并把每个 `commandId` 映射到 typed route descriptor。

Route status:
- `implemented`: host can dispatch the command now.
- `deferred`: command is valid but owned by a future/current indirect surface.
- `unsupported`: command is recognized but intentionally blocked.

### Decision: Dispatch Uses Existing Adapters

Implemented routes call existing adapter functions such as `resolveRepoNavigator`, `resolveGitReview`, `resolveDevCheck`, and `runContextCompactorCommand`. The registry does not bypass command-system or platform boundaries.

已实现 route 调用现有 adapter functions，如 `resolveRepoNavigator`、`resolveGitReview`、`resolveDevCheck` 与 `runContextCompactorCommand`。Registry 不绕过 command-system 或 platform boundaries。

### Decision: Deferred Is Product State

`repo.navigator.recall` and `repo.navigator.project-index` remain deferred until PageIndex/project index are fully routed, but deferred status is visible in registry, diagnostics, and tests.

`repo.navigator.recall` 与 `repo.navigator.project-index` 在 PageIndex/project index 完整接入前保持 deferred，但 deferred 状态必须在 registry、diagnostics 与 tests 中可见。

### Decision: TUI Remains Host-Governed

TUI keymaps and palette entries point to plugin contributions but do not execute directly. The host uses owner route readiness to decide whether to execute, defer, or explain.

TUI keymaps 与 palette entries 指向 plugin contributions，但不直接执行。Host 使用 owner route readiness 决定 execute、defer 或 explain。

## Risks / Trade-offs

- [Risk] Registry duplicates some route knowledge from parse adapters. -> Mitigation: tests assert every built-in commandId is covered and dispatch paths use shared resolver functions.
- [风险] Registry 会重复部分 parse adapter route knowledge。-> 缓解：测试断言每个 built-in commandId 都被覆盖，并且 dispatch path 使用共享 resolver functions。
- [Risk] Deferred routes could look like completed features. -> Mitigation: deferred status is explicit in diagnostics and product output.
- [风险] deferred routes 可能被误认为已完成。-> 缓解：diagnostics 与产品输出明确标记 deferred。
