## ADDED Requirements

### Requirement: Tool Input Platform Normalization

The platform abstraction layer SHALL provide deterministic helpers for normalizing model-produced tool inputs that contain paths, command names, search engines, shell assumptions, or platform-dependent syntax.

platform abstraction layer 必须提供 deterministic helpers，用于归一化 model-produced tool inputs 中的 paths、command names、search engines、shell assumptions 或 platform-dependent syntax。

#### Scenario: Normalize path for active platform

- **WHEN** preflight receives a workspace-relative path from a model tool call
- **THEN** the platform layer can normalize separators, remove harmless prefixes, resolve against workspace root, and report whether the result stays inside the workspace

#### Scenario: Prefer semantic operations over shell commands

- **WHEN** a model tool call asks for grep-like search, file discovery, or process execution
- **THEN** preflight can map it to semantic platform operations such as `searchText`, `findFiles`, or argv-array `runProcess` instead of preserving platform-specific shell syntax

#### Scenario: Report unavailable platform feature

- **WHEN** a normalized tool input depends on unavailable platform behavior and no safe fallback exists
- **THEN** the platform layer returns structured diagnostics so preflight can reject before execution
