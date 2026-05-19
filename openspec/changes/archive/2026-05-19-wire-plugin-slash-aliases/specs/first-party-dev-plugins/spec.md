## ADDED Requirements

### Requirement: First-party plugin slash projections include argument awareness
First-party built-in plugin TUI and owner-route projections SHALL expose enough declarative metadata for host surfaces to inject slash aliases and identify whether a slash alias requires user arguments.

一方内置插件 TUI 与 owner-route projections 必须暴露足够的声明式 metadata，使 host surfaces 能注入 slash aliases，并识别某个 slash alias 是否需要用户参数。

#### Scenario: Owner route fallback advertises placeholders
- **WHEN** a first-party built-in plugin command alias maps to an owner route that requires a query, path, node id, or target id
- **THEN** the TUI projection metadata includes the owner route fallback command with its placeholder, while remaining free of executable handler metadata
- **中文** 当一方内置插件 command alias 映射到需要 query、path、node id 或 target id 的 owner route 时，TUI projection metadata 必须包含带 placeholder 的 owner route fallback command，同时不得包含 executable handler metadata。

#### Scenario: Complete aliases remain submit-ready
- **WHEN** a first-party built-in plugin command alias maps to an owner route that requires no additional user arguments
- **THEN** the TUI projection can be accepted as a complete local slash command without adding synthetic placeholders
- **中文** 当一方内置插件 command alias 映射到不需要额外用户参数的 owner route 时，TUI projection 可作为完整 local slash command 被接受，且不得添加 synthetic placeholder。

#### Scenario: Slash alias registry is declarative
- **WHEN** the CLI builds the injected plugin slash command registry
- **THEN** it uses plugin owner route descriptors and aliases without importing plugin-private handlers, callbacks, model clients, filesystem primitives, process primitives, or hook callbacks
- **中文** 当 CLI 构建 injected plugin slash command registry 时，必须使用 plugin owner route descriptors 与 aliases，且不得 import plugin-private handlers、callbacks、model clients、filesystem primitives、process primitives 或 hook callbacks。
