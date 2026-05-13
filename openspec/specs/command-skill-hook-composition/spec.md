# command-skill-hook-composition Specification

## Purpose
TBD - created by archiving change stabilize-command-skill-hook-composition. Update Purpose after archive.
## Requirements
### Requirement: Canonical Composition Records / 规范组合记录

The platform SHALL represent command, skill, hook, MCP, plugin, extension, and workflow contributions as versioned inert composition records before projecting them to CLI help, chat slash commands, model-visible command lists, or future host command palettes.

平台必须先把 command、skill、hook、MCP、plugin、extension 和 workflow contributions 表示为版本化、惰性的 composition records，然后再投影到 CLI help、chat slash commands、model-visible command lists 或未来 host command palettes。

#### Scenario: Composition record has ownership metadata / 组合记录包含归属元数据
- **WHEN** a contribution is normalized for projection
- **THEN** the record includes schema version, contribution kind, owner subsystem, source kind/id, target id, display name, aliases, permissions, side-effect level, provenance, compatibility, redaction, and reference pit fixture ids
- **中文** 当 contribution 被归一化用于 projection 时，record 必须包含 schema version、contribution kind、owner subsystem、source kind/id、target id、display name、aliases、permissions、side-effect level、provenance、compatibility、redaction 和 reference pit fixture ids。

#### Scenario: Projection does not execute / 投影不执行
- **WHEN** CLI help, chat command discovery, model projection, or extension management requests composition records
- **THEN** the composition layer returns inert metadata and does not invoke command handlers, activate skills, run hooks, call MCP tools, apply plugin lifecycle actions, or execute workflows
- **中文** 当 CLI help、chat command discovery、model projection 或 extension management 请求 composition records 时，composition layer 必须返回惰性 metadata，不得调用 command handlers、激活 skills、运行 hooks、调用 MCP tools、应用 plugin lifecycle actions 或执行 workflows。

### Requirement: Deterministic Projection Filters / 确定性投影过滤

The composition layer SHALL provide deterministic projection filters for user-visible, host-visible, model-visible, and result-list-visible records.

Composition layer 必须为 user-visible、host-visible、model-visible 和 result-list-visible records 提供确定性 projection filters。

#### Scenario: Model-visible projection is fail-closed / 模型可见投影安全失败
- **WHEN** a record is side-effecting, untrusted, missing schema metadata, missing output schema, or marked host-only
- **THEN** model-visible projection excludes it with typed diagnostics rather than exposing it as a callable command
- **中文** 当 record 有副作用、不可信、缺少 schema metadata、缺少 output schema 或标记为 host-only 时，model-visible projection 必须用 typed diagnostics 排除它，而不是暴露为 callable command。

#### Scenario: User-visible projection is stable / 用户可见投影稳定
- **WHEN** user-visible records are projected
- **THEN** ordering is stable by group, source trust, source kind, display name, and target id
- **中文** 当投影 user-visible records 时，排序必须按 group、source trust、source kind、display name 和 target id 稳定。

### Requirement: Collision Rejection / 碰撞拒绝

The composition layer SHALL reject duplicate primary names and aliases within the same projection scope unless the conflict is resolved by explicit disabled/hidden policy metadata.

Composition layer 必须拒绝同一 projection scope 内重复的 primary names 和 aliases，除非冲突通过显式 disabled/hidden policy metadata 解决。

#### Scenario: Duplicate alias fails typed / 重复别名返回类型化失败
- **WHEN** two enabled records expose the same alias in the same projection scope
- **THEN** projection returns a typed `COMPOSITION_ALIAS_COLLISION` diagnostic naming both target ids and does not silently choose a winner
- **中文** 当两个 enabled records 在同一 projection scope 暴露相同 alias 时，projection 必须返回 typed `COMPOSITION_ALIAS_COLLISION` diagnostic，列出两个 target ids，且不得静默选择赢家。

#### Scenario: Disabled duplicate is ignored / 已禁用重复项被忽略
- **WHEN** one conflicting record is disabled or hidden by policy metadata
- **THEN** projection may exclude that record and continue without collision
- **中文** 当冲突记录之一被 disabled 或被 policy metadata 隐藏时，projection 可以排除该 record 并继续，不报 collision。

### Requirement: Result-List Targets / 结果列表 Target

Composition records SHALL expose typed result-list targets so vi-inspired actions and future command palettes can operate on structured targets rather than rendered prose.

Composition records 必须暴露类型化 result-list targets，使 vi-inspired actions 和未来 command palettes 能操作 structured targets，而不是 rendered prose。

#### Scenario: Target ids are typed / Target ID 类型化
- **WHEN** composition records are projected
- **THEN** each record includes target kind and target id such as `command:<id>`, `skill:<name>`, `hook:<id>`, `mcp-prompt:<qualifiedName>`, `plugin-command:<id>`, or `workflow:<id>`
- **中文** 当投影 composition records 时，每条 record 必须包含 target kind 与 target id，例如 `command:<id>`、`skill:<name>`、`hook:<id>`、`mcp-prompt:<qualifiedName>`、`plugin-command:<id>` 或 `workflow:<id>`。

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
