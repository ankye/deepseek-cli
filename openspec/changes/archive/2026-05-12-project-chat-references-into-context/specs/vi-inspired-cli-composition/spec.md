## ADDED Requirements

### Requirement: File References Are First-Class Reference Items / 文件引用是一等引用项

The vi-inspired CLI composition model SHALL represent user-added file paths as file reference items that can be inspected, focused, and projected later without immediate content reads.

Vi-inspired CLI composition model 必须将用户添加的 file paths 表示为 file reference items，可被 inspect、focus，并在后续投影，而不会立即读取内容。

#### Scenario: File reference item preserves path target / 文件引用项保留 Path Target

- **WHEN** a user adds a file path to references
- **THEN** the reference item stores `kind=file`, a structured target with path metadata, display label, provenance, order, and redaction metadata
- **中文** 当用户将 file path 加入 references 时，该 reference item 必须保存 `kind=file`、带 path metadata 的 structured target、display label、provenance、order 与 redaction metadata。

#### Scenario: File reference focus uses same reference model / 文件引用聚焦使用同一引用模型

- **WHEN** a user focuses a file reference by id, index, target id, or `current`
- **THEN** the existing reference focus behavior applies without reading file content or losing other reference items
- **中文** 当用户通过 id、index、target id 或 `current` 聚焦 file reference 时，必须复用现有 reference focus 行为，不读取文件内容，也不丢失其他 reference items。
