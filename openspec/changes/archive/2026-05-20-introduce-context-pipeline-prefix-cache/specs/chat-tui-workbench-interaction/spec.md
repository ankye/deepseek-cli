## ADDED Requirements

### Requirement: Cache-Aware Statusline / 缓存感知状态栏

The CLI/TUI statusline SHALL display bounded cache and context telemetry from the context pipeline, including cache hit rate, selected model, thinking mode, context size, and context budget pressure.

CLI/TUI 状态栏必须展示来自 context pipeline 的有界 cache 与 context telemetry，包括缓存命中率、当前模型、思考模式、上下文大小与 context budget pressure。

#### Scenario: Statusline shows model and cache telemetry / 状态栏展示模型与缓存遥测

- **WHEN** a chat or run session has pipeline/model telemetry
- **THEN** the statusline renders model id or profile, thinking mode, cache hit rate or unavailable state, selected context tokens, and budget pressure in a compact bounded format
- **中文** 当 chat 或 run session 具备 pipeline/model telemetry 时，状态栏必须用紧凑有界格式渲染 model id 或 profile、思考模式、缓存命中率或 unavailable 状态、selected context tokens 与预算压力。

#### Scenario: Statusline telemetry is local only / 状态栏遥测仅本地投影

- **WHEN** the statusline refreshes
- **THEN** it reads existing telemetry state and MUST NOT trigger model calls, context retrieval, provider requests, or raw context rendering
- **中文** 当状态栏刷新时，它只能读取既有 telemetry state，且不得触发 model calls、context retrieval、provider requests 或 raw context rendering。

#### Scenario: Narrow layout remains useful / 窄布局仍然有用

- **WHEN** terminal width is narrow or unknown
- **THEN** the statusline preserves at least model, thinking mode, cache state, and context token count while truncating labels deterministically
- **中文** 当 terminal width 较窄或未知时，状态栏必须至少保留 model、thinking mode、cache state 与 context token count，并以确定性方式截断标签。
