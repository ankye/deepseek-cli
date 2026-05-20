# capability-registry Specification

## Purpose
Define capability registry requirements for manifesting, resolving, projecting, and executing governed capabilities through stable contracts.

定义 capability registry 对 manifest、resolve、projection 与通过稳定 contracts 执行受治理 capabilities 的要求。

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

### Requirement: Capability Family Metadata / Capability 家族元数据
The capability registry SHALL require every model-visible capability projection to include tool domain id, tool family id, risk class, maturity state, operation profiles, host requirements, and scorecard rubric id.

capability registry 必须要求每个 model-visible capability projection 包含 tool domain id、tool family id、risk class、maturity state、operation profiles、host requirements 与 scorecard rubric id。

#### Scenario: Missing family metadata blocks projection / 缺少 Family 元数据阻止投影
- **WHEN** an executable capability lacks a valid catalog family id
- **THEN** the registry rejects model-visible projection with a typed validation diagnostic
- **中文** 当 executable capability 缺少有效 catalog family id 时，registry 必须以 typed validation diagnostic 拒绝 model-visible projection。

### Requirement: Family-Aware Projection Filtering / 感知 Family 的投影过滤
The registry SHALL support filtering model-visible capabilities by family, domain, risk class, connector trust, host requirements, policy, and agent scope.

registry 必须支持按 family、domain、risk class、connector trust、host requirements、policy 与 agent scope 过滤 model-visible capabilities。

#### Scenario: Agent scope denies family / Agent Scope 拒绝 Family
- **WHEN** an active agent scope denies the `browser.*` domain
- **THEN** registry projection excludes all browser family capabilities even if individual capability ids are enabled
- **中文** 当 active agent scope 拒绝 `browser.*` domain 时，即使单个 capability id 已启用，registry projection 也必须排除所有 browser family capabilities。

### Requirement: Capability Id Does Not Imply Family / Capability ID 不隐式等于 Family
The registry SHALL NOT infer tool family solely from capability id prefixes; explicit catalog metadata is required.

registry 不得仅从 capability id 前缀推断 tool family；必须要求显式 catalog metadata。

#### Scenario: External capability declares family / 外部 Capability 声明 Family
- **WHEN** an MCP or plugin tool exposes an id such as `plugin.foo.run`
- **THEN** it must declare its catalog family before it can become model-visible
- **中文** 当 MCP 或 plugin tool 暴露类似 `plugin.foo.run` 的 id 时，它必须先声明 catalog family，之后才能成为 model-visible。

### Requirement: Family-Aware Projection Filtering Is Enforced / 强制 Family-Aware 投影过滤
The registry SHALL filter model-visible capabilities by family id, domain id, risk class, host requirements, connector trust, provider support, policy, and agent scope.

registry 必须按 family id、domain id、risk class、host requirements、connector trust、provider support、policy 与 agent scope 过滤 model-visible capabilities。

#### Scenario: Denied family is excluded / 被拒绝 Family 被排除
- **WHEN** an agent scope denies `image.*`
- **THEN** `image.generate`, `image.edit`, `image.search-stock`, and `image.inspect` capabilities are excluded from model-visible projection
- **中文** 当 agent scope 拒绝 `image.*` 时，`image.generate`、`image.edit`、`image.search-stock` 与 `image.inspect` capabilities 必须从 model-visible projection 中排除。

### Requirement: Concrete Tool Registration Must Be Complete / 真实工具注册必须完整
The registry SHALL reject model-visible executable capability registration when the manifest lacks valid family metadata, output bounds, timeout, risk metadata, or required security fields.

当 manifest 缺少有效 family metadata、output bounds、timeout、risk metadata 或必要 security fields 时，registry 必须拒绝 model-visible executable capability registration。

#### Scenario: Missing timeout blocks projection / 缺少 Timeout 阻止投影
- **WHEN** an executable family tool registers without a timeout policy
- **THEN** the registry returns a stable validation diagnostic and does not expose it to the model
- **中文** 当 executable family tool 注册时没有 timeout policy，registry 必须返回稳定 validation diagnostic，并且不向模型暴露该工具。

