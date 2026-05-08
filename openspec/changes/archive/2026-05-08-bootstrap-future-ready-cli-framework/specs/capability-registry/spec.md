## ADDED Requirements

### Requirement: Capability Manifest

The system SHALL define a capability manifest containing identity, kind, version, source metadata, lifecycle state, input schema, output schema, side-effect level, permission requirements, context behavior, compatibility range, enablement state, and runtime binding.

系统必须定义 capability manifest，包含 identity、kind、version、source metadata、lifecycle state、input schema、output schema、side-effect level、permission requirements、context behavior、compatibility range、enablement state 和 runtime binding。

#### Scenario: Register valid capability

- **WHEN** a valid capability manifest and executor are registered
- **THEN** the registry accepts the capability and makes it discoverable by id

#### Scenario: Reject invalid capability

- **WHEN** a capability manifest is missing required identity or schema fields
- **THEN** the registry rejects the capability with a validation error

### Requirement: Capability Kinds

The registry SHALL support a capability kind model that can represent tools now and reserve compatible categories for prompts, hooks, MCP tools, resources, renderers, LSP capabilities, and agent handoff capabilities. Agent definitions are governed by the agent management layer.

registry 必须支持 capability kind model，当前可表达 tools，并为 prompts、hooks、MCP tools、resources、renderers、LSP capabilities 和 agent handoff capabilities 保留兼容类别。agent definitions 由 agent management layer 管理。

#### Scenario: Register tool capability

- **WHEN** a built-in tool capability is registered
- **THEN** the registry records it with kind `tool`

### Requirement: Model Tool Projection

The registry SHALL provide a projection from registered tool capabilities to model-visible tool schemas.

registry 必须提供从已注册 tool capabilities 到模型可见 tool schemas 的投影。

#### Scenario: Project registered tools

- **WHEN** the runtime asks for model-visible tools
- **THEN** the registry returns schemas for enabled tool capabilities only

### Requirement: Executor Lookup

The registry SHALL resolve a model tool call to the corresponding executor and validated input.

registry 必须把 model tool call 解析到对应 executor 和经过校验的 input。

#### Scenario: Resolve tool call

- **WHEN** a model tool call references a registered capability id
- **THEN** the registry returns the matching executor and parsed input

### Requirement: Capability Lifecycle and Enablement

The registry SHALL track source, trust status, lifecycle state, compatibility range, and enablement state for each capability before it can be projected to models or executed.

registry 必须为每个 capability 跟踪 source、trust status、lifecycle state、compatibility range 和 enablement state，之后才能投影给模型或执行。

#### Scenario: Disabled capability is not projected

- **WHEN** a registered capability is disabled, incompatible, untrusted, or deprecated beyond the allowed policy
- **THEN** the registry does not include it in model-visible tool projections

#### Scenario: Capability metadata is available for audit

- **WHEN** a capability is executed
- **THEN** source, version, trust status, lifecycle state, and enablement metadata are available to policy and audit boundaries
