## MODIFIED Requirements

### Requirement: First-Class Skill Package

The platform SHALL define a first-class skill package model for reusable domain knowledge, prompt instructions, context providers, tool bindings, workflow templates, memory/cache hooks, and regression fixtures.

平台必须定义一等 skill package model，用于承载可复用领域知识、prompt instructions、context providers、tool bindings、workflow templates、memory/cache hooks 和 regression fixtures。

#### Scenario: Register valid skill package

- **WHEN** a skill package manifest includes identity, version, description, activation metadata, compatibility range, permissions, context behavior, and regression metadata
- **THEN** the skill system validates and registers it as a governed skill package with schema version, validation diagnostics, redaction metadata, and progressive loading metadata
- **中文** 当 skill package manifest 包含 identity、version、description、activation metadata、compatibility range、permissions、context behavior 和 regression metadata 时，skill system 必须校验并注册为 governed skill package，且包含 schema version、validation diagnostics、redaction metadata 和 progressive loading metadata。

#### Scenario: Reject incomplete skill package

- **WHEN** a skill package is missing required identity, compatibility, activation, permission, or context metadata
- **THEN** the skill system rejects it with a structured validation error and does not expose it for activation or context projection
- **中文** 当 skill package 缺少 required identity、compatibility、activation、permission 或 context metadata 时，skill system 必须以 structured validation error 拒绝，并且不得暴露给 activation 或 context projection。

### Requirement: Skill Discovery, Trust, and Enablement

The skill system SHALL discover skills from built-in, user, workspace, extension, and future catalog sources, and SHALL apply trust, policy, compatibility, and enablement checks before a skill can affect runtime behavior.

skill system 必须从 built-in、user、workspace、extension 和未来 catalog sources 发现 skills，并且必须在 skill 影响 runtime behavior 前应用 trust、policy、compatibility 和 enablement checks。

#### Scenario: Untrusted workspace skill is inert

- **WHEN** a workspace skill is discovered without established trust
- **THEN** the skill remains inert and cannot inject instructions, expose tools, register hooks, execute workflows, or project context segments
- **中文** 当 workspace skill 被发现但尚未建立 trust 时，该 skill 必须保持 inert，不能 inject instructions、expose tools、register hooks、execute workflows 或 project context segments。

#### Scenario: Trusted built-in skill is enabled by profile

- **WHEN** a built-in skill matches the active profile, compatibility range, and policy
- **THEN** the skill can be enabled and made available to agent, context, workflow, and capability layers through bounded summaries and activation metadata
- **中文** 当 built-in skill 匹配 active profile、compatibility range 和 policy 时，该 skill 可以启用，并通过 bounded summaries 与 activation metadata 提供给 agent、context、workflow 和 capability layers。

### Requirement: Progressive Skill Loading and Projection

The skill system SHALL load skill manifests eagerly but SHALL load large instructions, examples, resources, and executors only when routing, context relevance, or explicit invocation requires them.

skill system 必须 eager load skill manifests，但只有在 routing、context relevance 或 explicit invocation 需要时才加载大型 instructions、examples、resources 和 executors。

#### Scenario: Skill summary is projected before full content

- **WHEN** the runtime asks for available skills during a turn
- **THEN** the skill system provides bounded skill summaries, activation hints, compatibility metadata, loading status, and capability metadata before loading full skill content
- **中文** 当 runtime 在一个 turn 中请求 available skills 时，skill system 必须先提供 bounded skill summaries、activation hints、compatibility metadata、loading status 和 capability metadata，而不是加载 full skill content。

#### Scenario: Relevant skill content is loaded on demand

- **WHEN** context routing selects a skill as relevant to the active task
- **THEN** the skill system loads only the required instruction, resource, and binding segments within context budget and policy limits
- **中文** 当 context routing 将某个 skill 选为 active task 相关时，skill system 只加载 context budget 与 policy limits 内所需的 instruction、resource 和 binding segments。

### Requirement: Skill Invocation and Execution Modes

The skill system SHALL support explicit host invocation, agent/profile activation, workflow step activation, and model-routed activation, with execution modes for context-only skills, tool-backed skills, workflow-backed skills, and sandboxed executor skills.

skill system 必须支持 explicit host invocation、agent/profile activation、workflow step activation 和 model-routed activation，并支持 context-only skills、tool-backed skills、workflow-backed skills 和 sandboxed executor skills 等 execution modes。

#### Scenario: Context-only skill augments prompt projection

- **WHEN** a context-only skill is activated for a turn
- **THEN** it contributes governed instruction and context segments with provenance, redaction, compatibility, budget, and replay metadata without receiving direct filesystem, process, network, or workspace mutation access
- **中文** 当 context-only skill 为某个 turn 激活时，它只能贡献带 provenance、redaction、compatibility、budget 和 replay metadata 的受治理 instruction/context segments，不得获得 direct filesystem、process、network 或 workspace mutation access。

#### Scenario: Side-effecting skill uses policy and sandbox

- **WHEN** a skill execution can mutate filesystem, process, network, environment, workspace, memory, or cache state
- **THEN** the execution is routed through policy, approval, sandbox, audit, concurrency, and runtime message bus boundaries
- **中文** 当 skill execution 可能修改 filesystem、process、network、environment、workspace、memory 或 cache state 时，该 execution 必须经过 policy、approval、sandbox、audit、concurrency 和 runtime message bus boundaries。

### Requirement: Skill Evolution and Regression

The skill system SHALL integrate with the evolution engine and regression harness for versioning, feature gates, migrations, deprecations, rollback, golden traces, and scenario suites.

skill system 必须接入 evolution engine 和 regression harness，支持 versioning、feature gates、migrations、deprecations、rollback、golden traces 和 scenario suites。

#### Scenario: Skill scenario replays deterministically

- **WHEN** a skill regression scenario is replayed with deterministic fakes
- **THEN** the regression harness verifies stable skill manifest schema, summary projection, activation result, context segments, privacy/redaction metadata, and replay fingerprints without live plugins, catalogs, network, or host APIs
- **中文** 当 skill regression scenario 使用 deterministic fakes replay 时，regression harness 必须验证 stable skill manifest schema、summary projection、activation result、context segments、privacy/redaction metadata 和 replay fingerprints，且不依赖 live plugins、catalogs、network 或 host APIs。
