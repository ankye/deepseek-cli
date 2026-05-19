## Context

The previous change connected `/file` and `/jump` to local chat execution and TUI result-list projection. The remaining gap is discoverability: `/help` and the command bar are the places users already look for available controls, but they do not yet name the new navigation workflows.

上一个变更已经把 `/file` 与 `/jump` 接入 local chat execution 和 TUI result-list projection。剩余缺口是 discoverability：`/help` 与 command bar 是用户查找可用 controls 的入口，但它们还没有展示新的 navigation workflows。

## Goals / Non-Goals

**Goals:**
- Add concise `/help` lines for `/file` and `/jump`.
- Add command bar suggestions for common file and jump workflows.
- Preserve the existing top-ranked startup suggestions, including `/help`, `/context`, history, and reasoning.
- Cover text help and command bar search behavior in tests.

**目标：**
- 为 `/file` 与 `/jump` 增加简洁 `/help` 行。
- 为常用 file 与 jump workflows 增加 command bar suggestions。
- 保持既有 top-ranked startup suggestions，包括 `/help`、`/context`、history 与 reasoning。
- 用测试覆盖 text help 与 command bar search behavior。

**Non-Goals:**
- Do not add new execution routes.
- Do not change file/jump output contracts.
- Do not implement command-bar text editing or execution in this change.

**非目标：**
- 本变更不增加新的执行 routes。
- 不改变 file/jump output contracts。
- 不在本变更实现 command-bar text editing 或 execution。

## Decisions

### Decision: Help Text Names Workflows, Not Internal Routes

`/help` will list user-facing slash forms such as `/file list|preview|refs <query>` and `/jump file|text|symbol <query>`, not internal command ids.

`/help` 会列出面向用户的 slash 形式，例如 `/file list|preview|refs <query>` 与 `/jump file|text|symbol <query>`，而不是内部 command ids。

### Decision: Command Bar Suggestions Are Searchable, Not First-Screen Dominant

Navigation suggestions will be added after the existing core suggestions so the startup command bar stays stable. When users search for `file`, `jump`, or related terms, the filtered command bar surfaces these entries directly.

Navigation suggestions 会排在现有 core suggestions 之后，让 startup command bar 保持稳定。用户搜索 `file`、`jump` 或相关词时，过滤后的 command bar 会直接展示这些 entries。

## Risks / Trade-offs

- [Risk] Too many suggestions make the command bar noisy. -> Mitigation: keep the default top suggestions bounded and rely on search filtering for navigation-specific entries.
- [风险] Suggestions 太多会让 command bar 嘈杂。-> 缓解：保持默认 top suggestions 有界，通过搜索过滤展示 navigation-specific entries。
- [Risk] Help text drifts from executable commands. -> Mitigation: tests assert help contains the same slash forms that are covered by execution tests.
- [风险] Help text 与可执行 commands 漂移。-> 缓解：测试断言 help 包含 execution tests 已覆盖的 slash forms。

## Migration Plan

1. Add navigation slash lines to interactive help text.
2. Add command bar suggestions for file list/preview/refs and jump file/text/symbol.
3. Add tests for `/help` and TUI command bar search filtering.
4. Run OpenSpec validation, typecheck, lint, focused tests, boundary checks, and regression tests as appropriate.
