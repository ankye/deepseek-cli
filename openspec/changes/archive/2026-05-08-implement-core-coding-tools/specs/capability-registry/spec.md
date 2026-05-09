## ADDED Requirements

### Requirement: Core Tool Projection / 核心工具投影

The capability registry SHALL project enabled core coding tools into model-visible tool schemas without exposing executor bindings to hosts or model adapters.

capability registry 必须把已启用 core coding tools 投影为 model-visible tool schemas，且不得向 hosts 或 model adapters 暴露 executor bindings。

#### Scenario: Project model-visible core tools / 投影模型可见核心工具

- **WHEN** model gateway or runtime requests model-visible tools
- **THEN** the registry returns only enabled core tools with schema, description, version, trust, side-effect, and compatibility metadata
- **中文** 当 model gateway 或 runtime 请求 model-visible tools 时，registry 必须只返回已启用核心工具，并包含 schema、description、version、trust、side-effect 和 compatibility metadata。

#### Scenario: Executor remains kernel-only / Executor 只属于 kernel

- **WHEN** CLI, VSCode, or model adapter lists core tools
- **THEN** returned projections cannot call tool executors directly
- **中文** 当 CLI、VSCode 或 model adapter 列出核心工具时，返回的 projections 不得直接调用 tool executors。
