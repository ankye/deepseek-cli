## ADDED Requirements

### Requirement: File Search Results Are Navigable Targets / 文件搜索结果是可导航 Target

The vi-inspired CLI composition model SHALL represent workspace file search results as quickfix-style result-list items with typed `file` targets that can be navigated, focused, added to reference sets, and projected later.

Vi-inspired CLI composition model 必须将 workspace file search results 表示为 quickfix-style result-list items，且每个 item 带 typed `file` target，可被导航、聚焦、加入 reference sets，并在之后投影。

#### Scenario: File result item preserves file target / 文件结果项保留 File Target

- **WHEN** a file search result list is created
- **THEN** each result item stores a stable item id, display label, ordering, and a target with `kind=file` plus path metadata
- **中文** 当 file search result list 被创建时，每个 result item 必须保存 stable item id、display label、ordering，以及包含 `kind=file` 与 path metadata 的 target。

#### Scenario: Add current file result creates file reference / 当前文件结果加入引用

- **WHEN** the user focuses a file result-list item and invokes `/palette refs add current`
- **THEN** the active reference set receives a `kind=file` reference item preserving the focused file target and path metadata, without reading file content
- **中文** 当用户聚焦 file result-list item 并调用 `/palette refs add current` 时，active reference set 必须收到保留该 file target 与 path metadata 的 `kind=file` reference item，且不读取 file content。

#### Scenario: File result navigation uses jump history / 文件结果导航使用 Jump History

- **WHEN** the user navigates between file result-list items
- **THEN** active target, active item id, and jump history update through the same typed action resolution used by other result lists
- **中文** 当用户在 file result-list items 之间导航时，active target、active item id 与 jump history 必须通过其他 result lists 使用的同一 typed action resolution 更新。
