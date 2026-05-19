## Context

The previous plugin work established declarative built-in manifests, lifecycle/API contracts, and host-owned owner route readiness. The product gap is now interaction: the workbench can explain plugin contributions, but it does not yet turn a selected plugin action into a real host dispatch with result-list, activity, and replay evidence.

前一轮插件工作已经建立声明式 built-in manifests、生命周期/API 契约，以及 host-owned owner route readiness。现在的产品缺口在交互：workbench 可以解释 plugin contributions，但还没有把用户选择的插件动作转成真实 host dispatch，并产生 result-list、activity 与 replay evidence。

## Goals / Non-Goals

**Goals:**
- Add an interactive plugin execution plane owned by `src/apps/cli`.
- Make implemented built-in owner routes executable from TUI/palette-facing host APIs.
- Record each execution as a structured artifact that can feed workbench state, tests, diagnostics, and future replay.
- Use Repo Navigator as the first end-to-end sample: files, grep, deferred recall/project-index, result lists, and inspector/reference handoff metadata.
- Preserve the plugin boundary: plugin manifests remain declarative and never receive host execution callbacks.

**目标：**
- 在 `src/apps/cli` 增加 interactive plugin execution plane。
- 让 implemented built-in owner routes 能从 TUI/palette-facing host APIs 执行。
- 每次执行都记录为结构化 artifact，可供 workbench state、tests、diagnostics 与未来 replay 使用。
- 以 Repo Navigator 做第一个端到端样板：files、grep、deferred recall/project-index、result lists 与 inspector/reference handoff metadata。
- 保持插件边界：plugin manifests 继续声明式，不接收 host execution callbacks。

**Non-Goals:**
- Do not implement third-party marketplace execution in this change.
- Do not move owner adapter implementations into `src/plugins/builtin`.
- Do not introduce a separate plugin UI runtime outside the existing TUI workbench.
- Do not turn deferred PageIndex/project-index routes into direct dispatch yet; they remain explicit product states.

**非目标：**
- 本变更不实现三方 marketplace execution。
- 不把 owner adapter implementations 移入 `src/plugins/builtin`。
- 不在现有 TUI workbench 外另起插件 UI runtime。
- 不把 deferred PageIndex/project-index routes 直接变成 dispatch；它们继续作为显式产品状态。

## Decisions

### Decision: Host Execution Plane

Add a CLI host module that translates a plugin contribution, command id, or route id into a `PluginWorkbenchExecutionRecord`. The module calls `dispatchBuiltInPluginOwnerRoute`, never plugin metadata callbacks.

增加 CLI host 模块，将 plugin contribution、command id 或 route id 转换为 `PluginWorkbenchExecutionRecord`。该模块调用 `dispatchBuiltInPluginOwnerRoute`，绝不调用 plugin metadata callbacks。

Alternatives considered:
- Execute directly inside `command-system`: rejected because `command-system` must remain host-agnostic.
- Execute inside `src/plugins/builtin`: rejected because built-in plugins must stay declarative.

### Decision: Execution Records Are Product State

Execution records become the common object for TUI activity, result-list attachment, JSON/JSONL output, extension diagnostics, and future replay. Records include route, status, input preview, diagnostics, result summary, result-list id, reference target count, duration bucket, and redaction metadata.

Execution records 成为 TUI activity、result-list attachment、JSON/JSONL output、extension diagnostics 与未来 replay 的共同对象。记录包含 route、status、input preview、diagnostics、result summary、result-list id、reference target count、duration bucket 与 redaction metadata。

### Decision: Workbench Stores Recent Executions

The chat TUI snapshot carries a bounded recent execution list. The workbench projects this into activity feed and plugin shelf summaries. Result-list payloads from executions are merged into the existing composition snapshot.

Chat TUI snapshot 携带有界 recent execution list。Workbench 将它投影到 activity feed 与 plugin shelf summaries。Execution 产生的 result-list payload 会合并进现有 composition snapshot。

### Decision: Repo Navigator Leads The Pattern

Repo Navigator receives the deepest tests and product polish first. Its files/grep routes attach result lists; recall/project-index remain deferred with fallback guidance and diagnostics. This gives future file-manager and jump-navigator plugins a concrete pattern.

Repo Navigator 先获得最完整测试与产品打磨。files/grep routes 会附加 result lists；recall/project-index 保持 deferred，并给出 fallback guidance 与 diagnostics。这为后续 file-manager 与 jump-navigator plugins 提供具体范式。

## Risks / Trade-offs

- [Risk] Interactive execution can blur dry-run vs real execution. -> Mitigation: keep `command-system` dry-run inert and add host-only execution records with explicit `dryRun: false`.
- [风险] 交互执行可能混淆 dry-run 与 real execution。-> 缓解：`command-system` dry-run 继续惰性，host-only execution records 显式标记 `dryRun: false`。
- [Risk] Workbench state could grow too large. -> Mitigation: keep recent records bounded and attach only redacted summaries plus existing result-list structures.
- [风险] Workbench state 可能膨胀。-> 缓解：recent records 有界，只附加脱敏 summary 与既有 result-list structures。
- [Risk] Deferred routes may feel broken. -> Mitigation: deferred records include fallback command and diagnostics and are rendered as recognized-but-not-directly-dispatchable states.
- [风险] Deferred routes 可能被用户理解为坏了。-> 缓解：deferred records 包含 fallback command 与 diagnostics，并渲染成“已识别但暂不可直接调度”的状态。

## Migration Plan

1. Add execution record types and host execution helpers.
2. Wire TUI state/workbench projection to recent execution records.
3. Wire palette-facing execution helpers and JSON/JSONL rendering.
4. Add Repo Navigator-focused interaction tests, then broaden to git/check/context smoke dispatch.
5. Keep existing route readiness behavior stable for callers that only inspect metadata.

## Open Questions

- Whether the next change should make file-manager and jump-navigator first-class built-in plugins, or first extend Repo Navigator into file preview and jump history.
- 后续是先让 file-manager/jump-navigator 成为一等 built-in plugins，还是先把 Repo Navigator 扩到 file preview 与 jump history。
