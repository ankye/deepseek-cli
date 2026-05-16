## ADDED Requirements

### Requirement: Local Family Tools Are Concrete / 本地 Family 工具必须真实
Core coding tools SHALL implement all DeepSeek-owned local families with concrete executors, including `workspace.glob`, `asset.view-local`, `notebook.read`, `patch.apply`, `revert.undo`, `repl.execute`, `git.history-branch`, `package.manager`, and local wrappers for owner-package capabilities where appropriate.

core coding tools 必须用真实 executor 实现所有 DeepSeek-owned local families，包括 `workspace.glob`、`asset.view-local`、`notebook.read`、`patch.apply`、`revert.undo`、`repl.execute`、`git.history-branch`、`package.manager`，以及适当的 owner-package capability wrappers。

#### Scenario: Core catalog has no empty local implementation family / Core Catalog 无空本地实现 Family
- **WHEN** `coreToolManifests()` and the tool family catalog are loaded
- **THEN** every local built-in family owned by `core-coding-tools` has a capability id, executor, model-visible projection, and test evidence
- **中文** 当加载 `coreToolManifests()` 与 tool family catalog 时，每个由 `core-coding-tools` 拥有的本地 built-in family 必须拥有 capability id、executor、model-visible projection 与测试证据。

### Requirement: Patch Apply Is Multi-Hunk And Transactional / Patch Apply 支持 Multi-Hunk 与事务
The `patch.apply` capability SHALL apply unified multi-hunk patches with precondition validation, affected-file accounting, bounded diagnostics, and rollback or checkpoint evidence.

`patch.apply` capability 必须应用 unified multi-hunk patches，并包含 precondition validation、affected-file accounting、有界 diagnostics 与 rollback 或 checkpoint evidence。

#### Scenario: Failed patch does not mutate workspace / Patch 失败不修改 Workspace
- **WHEN** a patch hunk precondition fails
- **THEN** no target file is mutated and the result reports the failed hunk with bounded evidence
- **中文** 当 patch hunk 前置条件失败时，不得修改目标文件，并且结果必须用有界证据报告失败 hunk。

### Requirement: Local Asset And Notebook Output Is Bounded / 本地 Asset 与 Notebook 输出有界
Asset and notebook capabilities SHALL detect supported file types, bound previews, preserve binary safety, and redact unsafe metadata.

asset 与 notebook capabilities 必须识别支持的文件类型、限制 preview、保持 binary safety，并脱敏不安全 metadata。

#### Scenario: Large notebook is truncated safely / 大 Notebook 安全截断
- **WHEN** `notebook.read` reads a notebook exceeding output limits
- **THEN** it returns a cell summary with truncation metadata instead of unbounded cell content
- **中文** 当 `notebook.read` 读取超过输出限制的 notebook 时，它必须返回带截断元数据的 cell summary，而不是无界 cell content。
