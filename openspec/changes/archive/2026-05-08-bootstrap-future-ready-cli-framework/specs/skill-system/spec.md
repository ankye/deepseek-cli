## ADDED Requirements

### Requirement: First-Class Skill Package

The platform SHALL define a first-class skill package model for reusable domain knowledge, prompt instructions, context providers, tool bindings, workflow templates, memory/cache hooks, and regression fixtures.

平台必须定义一等 skill package model，用于承载可复用领域知识、prompt instructions、context providers、tool bindings、workflow templates、memory/cache hooks 和 regression fixtures。

#### Scenario: Register valid skill package

- **WHEN** a skill package manifest includes identity, version, description, activation metadata, compatibility range, permissions, context behavior, and regression metadata
- **THEN** the skill system validates and registers it as a governed skill package

#### Scenario: Reject incomplete skill package

- **WHEN** a skill package is missing required identity, compatibility, activation, permission, or context metadata
- **THEN** the skill system rejects it with a structured validation error

### Requirement: Skill Discovery, Trust, and Enablement

The skill system SHALL discover skills from built-in, user, workspace, extension, and future catalog sources, and SHALL apply trust, policy, compatibility, and enablement checks before a skill can affect runtime behavior.

skill system 必须从 built-in、user、workspace、extension 和未来 catalog sources 发现 skills，并且必须在 skill 影响 runtime behavior 前应用 trust、policy、compatibility 和 enablement checks。

#### Scenario: Untrusted workspace skill is inert

- **WHEN** a workspace skill is discovered without established trust
- **THEN** the skill remains inert and cannot inject instructions, expose tools, register hooks, or execute workflows

#### Scenario: Trusted built-in skill is enabled by profile

- **WHEN** a built-in skill matches the active profile, compatibility range, and policy
- **THEN** the skill can be enabled and made available to agent, context, workflow, and capability layers

### Requirement: Progressive Skill Loading and Projection

The skill system SHALL load skill manifests eagerly but SHALL load large instructions, examples, resources, and executors only when routing, context relevance, or explicit invocation requires them.

skill system 必须 eager load skill manifests，但只有在 routing、context relevance 或 explicit invocation 需要时才加载大型 instructions、examples、resources 和 executors。

#### Scenario: Skill summary is projected before full content

- **WHEN** the runtime asks for available skills during a turn
- **THEN** the skill system provides bounded skill summaries, activation hints, and capability metadata before loading full skill content

#### Scenario: Relevant skill content is loaded on demand

- **WHEN** context routing selects a skill as relevant to the active task
- **THEN** the skill system loads only the required instruction, resource, and binding segments within context budget and policy limits

### Requirement: Skill Invocation and Execution Modes

The skill system SHALL support explicit host invocation, agent/profile activation, workflow step activation, and model-routed activation, with execution modes for context-only skills, tool-backed skills, workflow-backed skills, and sandboxed executor skills.

skill system 必须支持 explicit host invocation、agent/profile activation、workflow step activation 和 model-routed activation，并支持 context-only skills、tool-backed skills、workflow-backed skills 和 sandboxed executor skills 等 execution modes。

#### Scenario: Context-only skill augments prompt projection

- **WHEN** a context-only skill is activated for a turn
- **THEN** it contributes governed instruction and context segments without receiving direct filesystem, process, network, or workspace mutation access

#### Scenario: Side-effecting skill uses policy and sandbox

- **WHEN** a skill execution can mutate filesystem, process, network, environment, workspace, memory, or cache state
- **THEN** the execution is routed through policy, approval, sandbox, audit, concurrency, and runtime message bus boundaries

### Requirement: Skill-Scoped State and Permissions

The skill system SHALL enforce skill-scoped permissions, memory access, cache namespaces, telemetry, and audit records for every skill activation and execution.

skill system 必须对每次 skill activation 和 execution 强制执行 skill-scoped permissions、memory access、cache namespaces、telemetry 和 audit records。

#### Scenario: Skill memory is scope-limited

- **WHEN** a skill reads or writes memory
- **THEN** the memory manager enforces user, project, session, agent, and skill scope rules with provenance and redaction metadata

#### Scenario: Skill cache is invalidated by compatibility

- **WHEN** a skill version, manifest schema, source trust state, or compatibility range changes
- **THEN** skill-scoped cache entries are invalidated or quarantined according to cache policy

### Requirement: Skill Evolution and Regression

The skill system SHALL integrate with the evolution engine and regression harness for versioning, feature gates, migrations, deprecations, rollback, golden traces, and scenario suites.

skill system 必须接入 evolution engine 和 regression harness，支持 versioning、feature gates、migrations、deprecations、rollback、golden traces 和 scenario suites。

#### Scenario: Skill upgrade has compatibility gate

- **WHEN** a skill package is upgraded
- **THEN** the evolution engine checks manifest compatibility, migration requirements, regression metadata, and rollback availability before enabling the new version

#### Scenario: Skill scenario replays deterministically

- **WHEN** a skill regression scenario is replayed with deterministic fakes
- **THEN** the regression harness verifies stable protocol events, runtime bus events, context projections, policy decisions, and skill outputs
