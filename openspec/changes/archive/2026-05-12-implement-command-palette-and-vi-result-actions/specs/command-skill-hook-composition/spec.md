## ADDED Requirements

### Requirement: Composition Records Feed Palette Projection / 组合记录进入面板投影

Command composition records SHALL feed command palette and result-list projections as inert metadata while preserving ownership, provenance, side effects, permissions, and reference pit fixture ids.

Command composition records 必须作为惰性 metadata 输入 command palette 和 result-list projections，并保留 ownership、provenance、side effects、permissions 和 reference pit fixture ids。

#### Scenario: Palette projection preserves composition evidence / 面板投影保留组合证据
- **WHEN** a composition record is converted to a palette entry or result-list item
- **THEN** the derived item contains the record id, target kind/id, owner subsystem, source trust, permissions, side-effect level, redaction metadata, and reference pit fixture ids
- **中文** 当 composition record 转换为 palette entry 或 result-list item 时，派生 item 必须包含 record id、target kind/id、owner subsystem、source trust、permissions、side-effect level、redaction metadata 和 reference pit fixture ids。

#### Scenario: Host-only composition stays host-only / Host-only 组合保持 Host-only
- **WHEN** a host-only composition record is projected into palette data
- **THEN** it may be visible to the host palette but remains excluded from model-visible command projection
- **中文** 当 host-only composition record 投影到 palette data 时，它可以对 host palette 可见，但仍必须从 model-visible command projection 中排除。
