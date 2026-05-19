## Context

The previous built-in navigation plugin change added declarative plugin manifests, owner route descriptors, host-owned dispatch, and TUI workbench execution for file manager and jump navigator. The remaining gap is that the route fallback commands are not yet scriptable top-level CLI commands.

上一个 built-in navigation plugin 变更已经为 file manager 与 jump navigator 增加了声明式 plugin manifests、owner route descriptors、host-owned dispatch 与 TUI workbench execution。剩余缺口是 route fallback commands 还不是可脚本化的顶层 CLI commands。

## Goals / Non-Goals

**Goals:**
- Add parser support for `file` and `jump` top-level commands.
- Add CLI runners that reuse existing `resolveFileManager` and `resolveJumpNavigator` adapters.
- Preserve text, JSON, and JSONL renderer parity.
- Keep symbol jump deferred with typed diagnostics.
- Cover command parsing, help text, CLI runner behavior, and adapter behavior with deterministic tests.

**目标：**
- 增加 `file` 与 `jump` 顶层 commands 的 parser 支持。
- 增加复用现有 `resolveFileManager` 与 `resolveJumpNavigator` adapters 的 CLI runners。
- 保持 text、JSON 与 JSONL renderer parity。
- 保持 symbol jump deferred，并返回 typed diagnostics。
- 用确定性测试覆盖 command parsing、help text、CLI runner behavior 与 adapter behavior。

**Non-Goals:**
- Do not add write, move, delete, rename, or open-in-editor file operations.
- Do not implement semantic symbol search in this change.
- Do not introduce plugin-private command handlers.
- Do not add a second plugin UI runtime.

**非目标：**
- 本变更不增加 write、move、delete、rename 或 open-in-editor file operations。
- 本变更不实现 semantic symbol search。
- 不引入 plugin-private command handlers。
- 不增加第二套 plugin UI runtime。

## Decisions

### Decision: Thin CLI Runners Reuse Host Adapters

`runFileManagerCommand` and `runJumpNavigatorCommand` will mirror `runRepoNavigatorCommand`: create the CLI runtime, call the host adapter with `runtime.deps.platform`, render the structured result, and shut down the kernel.

`runFileManagerCommand` 与 `runJumpNavigatorCommand` 会对齐 `runRepoNavigatorCommand`：创建 CLI runtime，使用 `runtime.deps.platform` 调用 host adapter，渲染结构化结果，然后关闭 kernel。

### Decision: Parser Owns Ergonomics, Resolver Owns Semantics

The parser maps `file refs` to the resolver action `references`, and maps missing or unknown subcommands to conservative defaults (`file list`, `jump file`). The resolver remains responsible for missing-query diagnostics and deferred symbol behavior.

Parser 负责把 `file refs` 映射到 resolver action `references`，并把缺失或未知子命令映射到保守默认值（`file list`、`jump file`）。resolver 继续负责 missing-query diagnostics 与 deferred symbol behavior。

### Decision: Help Must Match Executable Entrypoints

CLI help will list `deepseek file ...` and `deepseek jump ...` only after the commands are parseable and dispatched. This keeps fallback guidance honest and prevents documentation-only product claims.

只有在 commands 可 parse 且可 dispatch 之后，CLI help 才列出 `deepseek file ...` 与 `deepseek jump ...`。这能保持 fallback guidance 真实，避免只有文档没有产品入口。

## Risks / Trade-offs

- [Risk] `file` may imply write capabilities. -> Mitigation: only expose list, preview, and refs; keep side effects read-only and no mutation APIs in scope.
- [风险] `file` 可能暗示写能力。-> 缓解：只暴露 list、preview 与 refs；保持 side effects 只读，本变更不加入 mutation APIs。
- [Risk] `jump symbol` can appear implemented. -> Mitigation: parse and render it, but return deferred diagnostics until code intelligence route execution is wired.
- [风险] `jump symbol` 看起来像已实现。-> 缓解：允许 parse 与 render，但在 code intelligence route execution 接入前返回 deferred diagnostics。
- [Risk] Top-level command sprawl. -> Mitigation: expose only the two plugin workflows whose fallback commands and first-party plugin metadata already exist.
- [风险] 顶层命令膨胀。-> 缓解：只暴露已经存在 fallback commands 与 first-party plugin metadata 的两个 plugin workflows。

## Migration Plan

1. Add parser/types/help entries for `file` and `jump`.
2. Add or complete command runners around the existing adapters.
3. Wire `run-cli` dispatch.
4. Add contract tests for parsing, help, text/JSON/JSONL output, and deferred symbol behavior.
5. Run OpenSpec validation, typecheck, focused tests, lint, boundary checks, and regression tests as appropriate.
