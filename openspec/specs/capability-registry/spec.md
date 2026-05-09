# capability-registry Specification

## Purpose
TBD - created by archiving change bootstrap-future-ready-cli-framework. Update Purpose after archive.
## Requirements
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

### Requirement: Capability Execution Metadata

The capability registry SHALL require executable capabilities to declare execution kind, side-effect level, trust boundary, permissions, resource requirements, timeout defaults, retry safety, idempotency requirements, sandbox requirement, host support, compatibility range, and replay policy before projection or execution.

capability registry 必须要求 executable capabilities 在 projection 或 execution 前声明 execution kind、side-effect level、trust boundary、permissions、resource requirements、timeout defaults、retry safety、idempotency requirements、sandbox requirement、host support、compatibility range 和 replay policy。

#### Scenario: Missing execution metadata blocks executable projection

- **WHEN** a capability has an executor but lacks execution constraint metadata
- **THEN** the registry does not project it as model-visible or executable and returns a structured validation error

#### Scenario: Context-only capability remains lightweight

- **WHEN** a capability only contributes bounded context or schema projection without execution
- **THEN** it can be registered as projectable without scheduler metadata but still records provenance and compatibility metadata

### Requirement: Built-In Executable Capability Registration

The capability registry SHALL support registration of built-in executable capabilities with metadata, constraints, schemas, and executor bindings.

capability registry 必须支持 built-in executable capabilities 的注册，包含 metadata、constraints、schemas 和 executor bindings。

#### Scenario: Register deterministic built-in capability

- **WHEN** the runtime package initializes its built-in capability set
- **THEN** the registry contains at least one deterministic built-in executable capability that can prove the full kernel pipeline

#### Scenario: Reject duplicate capability id

- **WHEN** a second capability is registered with an existing capability id and incompatible version metadata
- **THEN** the registry rejects the registration with a typed registry error

### Requirement: Registry Lookup for Kernel Execution

The capability registry SHALL expose lookup APIs that return executable capability definitions without allowing hosts to run executors directly.

capability registry 必须暴露 lookup APIs 返回 executable capability definitions，但不允许 hosts 直接运行 executors。

#### Scenario: Kernel resolves executor

- **WHEN** the runtime kernel resolves a registered executable capability
- **THEN** it receives the executor binding and constraint metadata needed for governed execution

#### Scenario: Host receives metadata only

- **WHEN** CLI, VSCode, or another host lists capabilities
- **THEN** it receives projection-safe metadata and not a direct primitive execution path

### Requirement: Immutable Host Capability Projection

The capability registry SHALL return immutable metadata-only projections to host adapters and model-visible lists.

capability registry 必须向 host adapters 和 model-visible lists 返回 immutable metadata-only projections。

#### Scenario: Host mutation cannot alter registry

- **WHEN** a host mutates a returned capability manifest or nested schema object
- **THEN** the registry's stored manifest and future projections remain unchanged

#### Scenario: Projection excludes executor binding

- **WHEN** a host lists or reads capability metadata
- **THEN** it cannot access executor functions or kernel-only executable bindings

### Requirement: Kernel-Only Executor Resolution

Executable capability binding resolution SHALL be limited to approved kernel execution owners and primitive owner packages.

executable capability binding resolution 必须限制在 approved kernel execution owners 和 primitive owner packages 内。

#### Scenario: Host cannot resolve executable

- **WHEN** CLI, VSCode, or future server host code attempts to resolve a capability executor directly
- **THEN** architecture lint fails with a stable rule id

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
