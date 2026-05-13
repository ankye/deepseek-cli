## ADDED Requirements

### Requirement: Workspace PageIndex Uses Mutation Watermarks / Workspace PageIndex 使用变更水位线

The chat PageIndex SHALL persist and evaluate a workspace mutation watermark for workspace-scoped PageIndex pages so cross-session recall can distinguish fresh evidence from evidence captured before later workspace edits.

Chat PageIndex 必须为 workspace-scoped PageIndex pages 持久化并评估 workspace mutation watermark，使跨 session recall 能区分 fresh evidence 与后续 workspace edits 之前捕获的 evidence。

#### Scenario: Workspace page records checkpoint watermark / Workspace Page 记录 Checkpoint 水位线

- **WHEN** the chat shell persists workspace PageIndex pages and workspace checkpoint evidence is available
- **THEN** each persisted workspace page carries `evidenceQuality.workspaceCheckpointWatermark` equal to the current workspace checkpoint count at persistence time
- **中文** 当 chat shell 持久化 workspace PageIndex pages 且 workspace checkpoint evidence 可用时，每个持久化 workspace page 必须携带 `evidenceQuality.workspaceCheckpointWatermark`，其值等于持久化时当前 workspace checkpoint count。

#### Scenario: Later workspace mutation makes workspace recall stale / 后续 Workspace 变更使 Workspace Recall 变 Stale

- **WHEN** a later chat session loads a workspace PageIndex page whose checkpoint watermark is lower than the current workspace checkpoint count
- **THEN** workspace recall renders that page with `freshnessStatus=stale` in result metadata, explain output, and projected recall references
- **中文** 当后续 chat session 加载的 workspace PageIndex page 的 checkpoint watermark 低于当前 workspace checkpoint count 时，workspace recall 必须在 result metadata、explain output 与 projected recall references 中将该 page 渲染为 `freshnessStatus=stale`。

#### Scenario: Equal workspace watermark preserves fresh / 相同 Workspace 水位线保持 Fresh

- **WHEN** a workspace PageIndex page has runtime-sourced `fresh` evidence and its checkpoint watermark equals the current workspace checkpoint count
- **THEN** workspace recall preserves `fresh`
- **中文** 当 workspace PageIndex page 具有 runtime-sourced `fresh` evidence，且其 checkpoint watermark 等于当前 workspace checkpoint count 时，workspace recall 必须保留 `fresh`。

#### Scenario: Missing workspace watermark is unknown / 缺失 Workspace 水位线为 Unknown

- **WHEN** a workspace PageIndex page lacks `workspaceCheckpointWatermark` and current workspace checkpoint evidence exists
- **THEN** workspace recall marks the page freshness as `unknown` rather than preserving unverifiable `fresh`
- **中文** 当 workspace PageIndex page 缺少 `workspaceCheckpointWatermark` 且当前存在 workspace checkpoint evidence 时，workspace recall 必须将 page freshness 标记为 `unknown`，不得保留无法验证的 `fresh`。
