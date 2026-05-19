## Context

The built-in plugin pack currently covers context, checks, git review, and repository search. Earlier product discussion called out file manager and jump navigation as first-class built-ins, both to improve the developer experience and to exercise the plugin system with realistic native plugins.

当前 built-in plugin pack 覆盖 context、checks、git review 与 repository search。前面的产品讨论已经将 file manager 与 jump navigation 定为一等内置插件，既提升开发体验，也用真实原生插件打磨插件系统。

## Goals / Non-Goals

**Goals:**
- Add file manager and jump navigator as separate plugin directories under `src/plugins/builtin/src/plugins`.
- Provide command, palette, keymap, result-list provider, renderer hint, and reasoning contributions for each.
- Implement read-only owner routes through CLI host adapters.
- Keep symbol jump explicitly deferred until code intelligence route dispatch is wired into this execution plane.
- Update tests and readiness expectations from 4/20 to the new pack size.

**目标：**
- 在 `src/plugins/builtin/src/plugins` 下为 file manager 与 jump navigator 增加独立插件目录。
- 为每个插件提供 command、palette、keymap、result-list provider、renderer hint 与 reasoning contributions。
- 通过 CLI host adapters 实现只读 owner routes。
- 在 code intelligence route dispatch 接入本执行面前，明确将 symbol jump 保持 deferred。
- 将测试与 readiness 预期从 4/20 更新到新的插件包规模。

**Non-Goals:**
- Do not implement write/move/delete file operations in this change.
- Do not add a second plugin UI runtime or separate TUI extension system.
- Do not wire full semantic symbol search yet.

**非目标：**
- 本变更不实现 write/move/delete file operations。
- 不引入第二套 plugin UI runtime 或独立 TUI extension system。
- 暂不接入完整 semantic symbol search。

## Decisions

### Decision: Read-Only First Release

File manager ships read-only commands first: list files, preview one file, and collect file references. This makes it safe to expose as an implemented plugin while preserving the path to future write operations behind approval/sandbox work.

File manager 第一版先交付只读命令：列文件、预览单文件、收集文件引用。这样可以安全地作为 implemented plugin 暴露，同时为未来通过 approval/sandbox 加入写操作保留路径。

### Decision: Jump Navigator Uses Fast Workspace Primitives

Jump navigator uses `findFiles` and `searchText` for file/text jump, while symbol jump is recognized but deferred to code intelligence. This gives immediate value without inventing a second index provider route.

Jump navigator 使用 `findFiles` 与 `searchText` 实现 file/text jump，同时将 symbol jump 识别为 deferred 到 code intelligence。这样能立即提供价值，同时不发明第二套 index provider route。

### Decision: Host-Owned Adapters Mirror Repo Navigator

New adapters return structured result objects with result lists, reference targets, diagnostics, suggested actions, and redaction metadata. Owner route dispatch adds the new result types to the existing union.

新 adapters 返回结构化结果对象，包含 result lists、reference targets、diagnostics、suggested actions 与 redaction metadata。Owner route dispatch 将新结果类型加入现有 union。

## Risks / Trade-offs

- [Risk] File manager can imply write capability. -> Mitigation: name commands and metadata as read-only and keep side effects as `read`.
- [风险] File manager 名称可能暗示写能力。-> 缓解：commands 与 metadata 明确只读，并保持 side effects 为 `read`。
- [Risk] Jump navigator can duplicate Repo Navigator. -> Mitigation: position it as quick target activation and jump history preparation, while Repo Navigator remains broad repository search.
- [风险] Jump navigator 可能与 Repo Navigator 重叠。-> 缓解：将它定位为快速 target activation 与 jump history 准备，而 Repo Navigator 保持广义 repository search。

## Migration Plan

1. Add OpenSpec delta and validate.
2. Add plugin directories and registry wiring.
3. Add CLI host adapters and owner route definitions.
4. Update tests for pack counts, route counts, implemented/deferred behavior, and execution records.
5. Run typecheck, lint, boundary checks, focused tests, and full regression if needed.
