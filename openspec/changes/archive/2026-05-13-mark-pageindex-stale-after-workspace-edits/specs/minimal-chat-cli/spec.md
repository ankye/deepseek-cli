## ADDED Requirements

### Requirement: PageIndex Marks Recall Stale After Workspace Edits / PageIndex 在工作区编辑后标记 Recall 为 Stale

The chat PageIndex SHALL downgrade `fresh` recall evidence to `stale` when existing workspace checkpoint evidence proves that a later workspace edit happened in the same chat session after the recalled page turn.

当已有 workspace checkpoint evidence 能证明同一 chat session 中 recalled page turn 之后发生过 workspace edit 时，chat PageIndex 必须将 `fresh` recall evidence 降级为 `stale`。

#### Scenario: Later same-session edit makes earlier recall stale / 同 Session 后续编辑使早期 Recall 变 Stale

- **WHEN** a chat session records a PageIndex page for an earlier prompt turn and a later turn creates workspace checkpoint evidence in the same session
- **THEN** `/palette recall <query>` renders the earlier PageIndex result with `freshnessStatus=stale` in result metadata, explain output, and any projected recall reference
- **中文** 当 chat session 为较早 prompt turn 记录 PageIndex page，且后续 turn 在同一 session 中创建 workspace checkpoint evidence 时，`/palette recall <query>` 必须在 result metadata、explain output 与后续 projected recall reference 中将该早期 PageIndex result 渲染为 `freshnessStatus=stale`。

#### Scenario: No proven later edit preserves freshness / 无可证明后续编辑时保持 Freshness

- **WHEN** a PageIndex page has runtime-sourced `fresh` evidence and no later same-session workspace checkpoint can be ordered after that page
- **THEN** recall preserves `fresh` rather than inventing staleness
- **中文** 当 PageIndex page 具有 runtime-sourced `fresh` evidence，且没有可排序到该 page 之后的同 session workspace checkpoint 时，recall 必须保留 `fresh`，不得虚构 stale。

#### Scenario: Unknown freshness is not promoted / Unknown Freshness 不被提升

- **WHEN** a legacy or malformed PageIndex page has `freshnessStatus=unknown`
- **THEN** workspace edit staleness adjustment does not upgrade it to `fresh` or reinterpret it as verified current evidence
- **中文** 当 legacy 或 malformed PageIndex page 具有 `freshnessStatus=unknown` 时，workspace edit staleness adjustment 不得将其升级为 `fresh`，也不得将其重新解释为 verified current evidence。

#### Scenario: Workspace recall avoids cross-session guessing / Workspace Recall 避免跨 Session 猜测

- **WHEN** workspace-scoped PageIndex pages are loaded from workspace storage but local chat history cannot prove turn ordering against workspace checkpoint evidence
- **THEN** recall preserves the page freshness status already stored on the page instead of marking it stale by timestamp guesswork
- **中文** 当 workspace-scoped PageIndex pages 从 workspace storage 加载，但本地 chat history 无法证明其与 workspace checkpoint evidence 的 turn ordering 时，recall 必须保留 page 已存储的 freshness status，不得通过 timestamp guesswork 标记 stale。
