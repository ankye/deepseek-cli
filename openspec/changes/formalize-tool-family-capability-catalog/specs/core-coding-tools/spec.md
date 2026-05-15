## ADDED Requirements

### Requirement: Core Tools Map Into Catalog Families / Core Tools 映射到 Catalog Families
Built-in core coding tools SHALL map each existing core capability id to one or more canonical tool families without removing absent catalog families from the denominator.

内置 core coding tools 必须把每个现有 core capability id 映射到一个或多个 canonical tool families，且不得从分母中移除缺失 catalog families。

#### Scenario: Existing shell tools map to process families / 现有 Shell 工具映射到 Process Families
- **WHEN** the catalog evaluates `core.shell.run`, `core.shell.output`, and `core.shell.kill`
- **THEN** they map to `shell.run`, `process.output`, and `process.kill` respectively
- **中文** 当 catalog 评估 `core.shell.run`、`core.shell.output` 与 `core.shell.kill` 时，它们必须分别映射到 `shell.run`、`process.output` 与 `process.kill`。

### Requirement: Built-In Tools Use Family-Owned Source Layout / 内置工具使用 Family-Owned 源码布局
Built-in core tool implementations SHALL live under `src/packages/core-coding-tools/src/families/<domain>/<family>/` and SHALL NOT keep implementation or compatibility shim directories under `src/packages/core-coding-tools/src/tools/`.

内置 core tool 实现必须位于 `src/packages/core-coding-tools/src/families/<domain>/<family>/`，不得在 `src/packages/core-coding-tools/src/tools/` 下保留实现或兼容 shim 目录。

#### Scenario: Old tools directory is absent / 旧 Tools 目录不存在
- **WHEN** repository structure checks inspect `src/packages/core-coding-tools/src`
- **THEN** no `tools/` implementation tree exists and model-visible built-in tool registration imports from `families/<domain>/<family>/`
- **中文** 当 repository structure checks 检查 `src/packages/core-coding-tools/src` 时，不得存在 `tools/` implementation tree，并且 model-visible built-in tool registration 必须从 `families/<domain>/<family>/` 导入。

### Requirement: Patch Family Is Separate From File Edit / Patch Family 独立于 File Edit
The `patch.apply` family SHALL require multi-hunk patch semantics, precondition validation, affected-file accounting, and rollback evidence; exact string edit or whole-file write alone SHALL NOT satisfy it.

`patch.apply` family 必须要求 multi-hunk patch semantics、precondition validation、affected-file accounting 与 rollback evidence；仅 exact string edit 或 whole-file write 不得满足它。

#### Scenario: Exact edit does not satisfy patch / 精确编辑不满足 Patch
- **WHEN** only `core.file.edit` exists and no patch capability exists
- **THEN** `file.edit` may pass but `patch.apply` remains absent or unassessed with zero score
- **中文** 当只存在 `core.file.edit` 而没有 patch capability 时，`file.edit` 可以通过，但 `patch.apply` 必须保持 absent 或 unassessed 且为零分。

### Requirement: Core Tool Absence Is Reported / Core Tool 缺口必须报告
Core coding tool diagnostics SHALL report catalog families that are not implemented by built-in tools, including browser, media, design, notebook/REPL, pipeline, and scheduling families.

core coding tool diagnostics 必须报告 built-in tools 尚未实现的 catalog families，包括 browser、media、design、notebook/REPL、pipeline 与 scheduling families。

#### Scenario: Missing design tool is visible / 缺失 Design Tool 可见
- **WHEN** no design/canvas capability is registered
- **THEN** diagnostics reports `design.document-state`, `design.node-query`, `design.batch-edit`, and `design.export-snapshot` as absent or planned
- **中文** 当没有注册 design/canvas capability 时，diagnostics 必须报告 `design.document-state`、`design.node-query`、`design.batch-edit` 与 `design.export-snapshot` 为 absent 或 planned。

#### Scenario: Missing family is not a fake tool / 缺失 Family 不是假工具
- **WHEN** a built-in family is planned but no executable capability exists
- **THEN** `core-coding-tools` keeps the family visible in diagnostics but does not add a placeholder entry under the family tool list
- **中文** 当某个 built-in family 已规划但没有可执行 capability 时，`core-coding-tools` 必须在 diagnostics 中保持该 family 可见，但不得在 family tool list 中添加占位条目。
