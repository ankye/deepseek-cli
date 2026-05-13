## ADDED Requirements

### Requirement: Text Search Results Are Navigable Targets / 文本搜索结果是可导航 Target

The vi-inspired CLI composition model SHALL represent workspace text search matches as quickfix-style result-list items with typed file targets, line metadata, bounded preview text, and provenance that can be navigated, focused, added to reference sets, and projected later.

Vi-inspired CLI composition model 必须将 workspace text search matches 表示为 quickfix-style result-list items，且带 typed file targets、line metadata、有界 preview text 和 provenance，可被导航、聚焦、加入 reference sets，并在之后投影。

#### Scenario: Text result item preserves line metadata / 文本结果项保留行信息

- **WHEN** a text search result list is created
- **THEN** each result item stores a stable item id, display label, ordering, a `kind=file` target with path metadata, and metadata for line number, search text, preview, and search provider
- **中文** 当 text search result list 被创建时，每个 result item 必须保存 stable item id、display label、ordering、带 path metadata 的 `kind=file` target，以及 line number、search text、preview 和 search provider metadata。

#### Scenario: Add current text result creates file reference / 当前文本结果加入文件引用

- **WHEN** the user focuses a text search result-list item and invokes `/palette refs add current`
- **THEN** the active reference set receives a `kind=file` reference item preserving the focused file target and line provenance, without reading additional file content
- **中文** 当用户聚焦 text search result-list item 并调用 `/palette refs add current` 时，active reference set 必须收到保留该 file target 与 line provenance 的 `kind=file` reference item，且不读取额外 file content。

#### Scenario: Text result navigation uses jump history / 文本结果导航使用 Jump History

- **WHEN** the user navigates between text search result-list items
- **THEN** active target, active item id, and jump history update through the same typed action resolution used by other result lists
- **中文** 当用户在 text search result-list items 之间导航时，active target、active item id 与 jump history 必须通过其他 result lists 使用的同一 typed action resolution 更新。
