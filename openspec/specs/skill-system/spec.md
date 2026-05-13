# skill-system Specification

## Purpose
Define the governed DeepSeek skill model for reusable knowledge, progressive context loading, trust isolation, execution normalization, and deterministic regression behavior.

定义 DeepSeek 受治理的 skill 模型，用于可复用知识、渐进式上下文加载、信任隔离、执行规范化和确定性回归行为。
## Requirements
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

### Requirement: Canonical SkillSystem V1 API

The platform SHALL expose only canonical skills v1 APIs for manifest validation, skill registration, summary listing, skill loading, activation, and context projection.

平台必须只暴露 canonical skills v1 APIs，用于 manifest validation、skill registration、summary listing、skill loading、activation 和 context projection。

#### Scenario: Generic legacy skill APIs are rejected

- **WHEN** platform contracts or skill implementations define generic `register`, `activate`, or `list` methods on `SkillSystem` or `InMemorySkillSystem`
- **THEN** architecture lint and contract tests fail before the change can pass default verification
- **中文** 当 platform contracts 或 skill implementations 在 `SkillSystem` 或 `InMemorySkillSystem` 上定义泛化的 `register`、`activate` 或 `list` 方法时，architecture lint 与 contract tests 必须在默认验证通过前失败。

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
- **THEN** the regression harness verifies stable skill manifest schema, summary projection, activation result, context segments, privacy/redaction metadata, and replay fingerprints without live plugins, catalogs, network, or host APIs
- **中文** 当 skill regression scenario 使用 deterministic fakes replay 时，regression harness 必须验证 stable skill manifest schema、summary projection、activation result、context segments、privacy/redaction metadata 和 replay fingerprints，且不依赖 live plugins、catalogs、network 或 host APIs。

### Requirement: Skill Execution Normalization

The skill system SHALL normalize skill-backed execution into governed execution envelopes unless the skill is context-only and only contributes bounded prompt or context projection.

skill system 必须将 skill-backed execution 规范化为 governed execution envelopes，除非该 skill 是 context-only 且只贡献有界 prompt 或 context projection。

#### Scenario: Context-only skill avoids scheduling

- **WHEN** a skill only contributes bounded instructions, examples, or context references
- **THEN** it can remain in the projection pipeline without scheduler work while preserving provenance, redaction, compatibility, and budget metadata

#### Scenario: Tool-backed skill is governed

- **WHEN** a skill executes code, invokes a tool, runs a workflow, mutates memory/cache/workspace, calls MCP, or requires sandbox controls
- **THEN** it creates a governed execution envelope and follows policy, approval, sandbox, scheduler, bus, audit, and replay rules

### Requirement: Skill System `listSummaries` Returns Sorted Enumeration / SkillSystem.listSummaries 返回排序枚举

The `SkillSystem.listSummaries()` method SHALL return all registered skills as a readonly `SkillSummary[]` sorted by `manifest.name` ascending (Unicode code-point order), so hosts and agents can discover what is registered deterministically without invoking activation.

`SkillSystem.listSummaries()` 必须返回所有已注册 skill 的只读 `SkillSummary[]`,按 `manifest.name` 升序(Unicode 码点序)排序,使 host 与 agent 能在不触发激活的前提下以确定顺序发现已注册 skill。

#### Scenario: listSummaries returns empty for a fresh registry / 新注册表返回空

- **WHEN** a fresh `SkillSystem` instance has no skills registered
- **THEN** `listSummaries()` SHALL return an empty readonly array without throwing
- **中文** 当 `SkillSystem` 实例没有注册 skill 时,`listSummaries()` 必须返回空 readonly 数组,不得抛错。

#### Scenario: listSummaries reflects registered skills in sorted order / 反映已注册 skill 且有序

- **WHEN** the skill system has N registered skills registered in arbitrary order
- **THEN** `listSummaries()` SHALL return exactly N `SkillSummary` entries sorted by `manifest.name` ascending, and each entry SHALL carry the normalized `id`, `name`, `version`, `trust`, `loadingState`
- **中文** 当 skill system 以任意顺序注册了 N 个 skill 时,`listSummaries()` 必须精确返回 N 条 `SkillSummary`,按 `manifest.name` 升序,每条包含归一化的 `id`、`name`、`version`、`trust`、`loadingState`。

### Requirement: Agent Discovery And Activation Of Skills Via Tools / Agent 通过 Tool 发现与激活 Skill

The platform SHALL expose the skill registry to agents through two governed tools: a read-only `core.skill.list` that enumerates registered skills and a side-effect-free `core.skill.activate` that triggers explicit activation of an in-memory skill entry, returning a compact summary without inlining full context segment text.

平台必须通过两个受治理 tool 把 skill 注册表暴露给 agent:只读的 `core.skill.list` 用于枚举已注册 skill,无副作用的 `core.skill.activate` 用于触发对内存 skill 条目的显式激活,返回紧凑 summary,不得把完整 context segment 文本内联进 tool result。

#### Scenario: skill.list is read-only and enumerates skills / skill.list 只读枚举

- **WHEN** an agent invokes `core.skill.list`
- **THEN** the tool calls `deps.skills.listSummaries()`, returns `{count, skills}` metadata without activating any skill or modifying runtime state, and has `sideEffect: "read"` in its manifest
- **中文** 当 agent 调用 `core.skill.list` 时,该 tool 必须调用 `deps.skills.listSummaries()`,返回 `{count, skills}` metadata,不得激活任何 skill 或修改 runtime state,manifest `sideEffect` 必须为 `"read"`。

#### Scenario: skill.activate triggers explicit activation / skill.activate 触发显式激活

- **WHEN** an agent invokes `core.skill.activate` with a valid `name`
- **THEN** the tool calls `deps.skills.activateSkill({name, trigger: "explicit", context, sessionId})` and returns `{status, name, segmentCount, loadingState, estimatedTokens}` derived from the activation result, without inlining full segment text
- **中文** 当 agent 以合法 `name` 调用 `core.skill.activate` 时,该 tool 必须调用 `deps.skills.activateSkill({name, trigger: "explicit", context, sessionId})`,并从激活结果派生 `{status, name, segmentCount, loadingState, estimatedTokens}` 返回,不得内联完整 segment 文本。

#### Scenario: skill.activate for unknown skill fails typed / 激活未知 skill 返回 typed failure

- **WHEN** an agent invokes `core.skill.activate` with a name not registered in the skill system
- **THEN** the tool returns a typed `SKILL_NOT_FOUND` diagnostic rather than throwing or synthesizing fake activation
- **中文** 当 agent 以未注册的 name 调用 `core.skill.activate` 时,该 tool 必须返回 typed `SKILL_NOT_FOUND` diagnostic,不得抛错或合成假激活。

### Requirement: Runtime Emits `skill.activated` Event On Successful Activation / 成功激活时 runtime 发出 skill.activated 事件

When `core.skill.activate` returns `status === "activated"`, the runtime SHALL emit a `skill.activated` runtime event (observable via the agent-loop event stream and persisted via the session/bus/observability adapter) with payload `{name, status, segmentCount, loadingState}`, parallel to how `hooks.invoked` is emitted after hook invocation.

当 `core.skill.activate` 返回 `status === "activated"` 时,runtime 必须发出一个 `skill.activated` runtime event(通过 agent-loop 事件流可观测,并经由 session/bus/observability 适配器持久化),payload 为 `{name, status, segmentCount, loadingState}`,与 `hooks.invoked` 在 hook 调用之后的发射方式对齐。

#### Scenario: skill.activated event is observable on successful activation / 成功激活触发 skill.activated 事件

- **WHEN** `core.skill.activate` yields `status: "activated"` for a registered skill
- **THEN** exactly one `skill.activated` runtime event SHALL appear on the agent-loop event stream with `data.name` matching the activated skill and `data.segmentCount` matching the activation result
- **中文** 当 `core.skill.activate` 对已注册 skill 返回 `status: "activated"` 时,agent-loop 事件流必须精确产出一条 `skill.activated` runtime event,`data.name` 与被激活 skill 对齐,`data.segmentCount` 与激活结果对齐。

#### Scenario: skill.activated event is NOT emitted on failure / 激活失败不发射

- **WHEN** `core.skill.activate` returns `not-found`, `inert`, or `rejected`
- **THEN** no `skill.activated` runtime event SHALL be emitted
- **中文** 当 `core.skill.activate` 返回 `not-found` / `inert` / `rejected` 时,不得发射 `skill.activated` runtime event。

### Requirement: CLI Skill Management Projection / CLI Skill 管理投影

The skill system SHALL provide summaries and activation results that CLI extension management can render without inlining full context segment text by default.

Skill system 必须提供 summaries 与 activation results，供 CLI extension management 渲染，默认不得内联完整 context segment text。

#### Scenario: Skill list is compact / Skill 列表紧凑
- **WHEN** CLI extension management lists skills
- **THEN** it renders stable skill id, name, version, source, trust, enabled state, loading state, execution modes, permissions, and redaction metadata from `SkillSummary`
- **中文** 当 CLI extension management 列出 skills 时，必须从 `SkillSummary` 渲染 stable skill id、name、version、source、trust、enabled state、loading state、execution modes、permissions 和 redaction metadata。

#### Scenario: Skill activation omits full content / Skill 激活省略完整内容
- **WHEN** CLI extension management activates a skill
- **THEN** the output includes activation status, summary, segment count, estimated tokens, diagnostics, replay fingerprint, and redaction metadata without printing full context segment text unless a future explicit inspect mode is added
- **中文** 当 CLI extension management 激活 skill 时，输出必须包含 activation status、summary、segment count、estimated tokens、diagnostics、replay fingerprint 和 redaction metadata，且除非未来增加显式 inspect mode，否则不得打印完整 context segment text。

### Requirement: Skill Composition Projection / Skill 组合投影

Skill summaries SHALL be projectable as composition records for explicit activation, context projection, and user-visible discovery without loading full skill content by default.

Skill summaries 必须可作为 composition records 投影，用于 explicit activation、context projection 和 user-visible discovery，默认不加载完整 skill content。

#### Scenario: Skill summary projects inert target / Skill 摘要投影惰性 Target
- **WHEN** a registered skill is projected into composition
- **THEN** the record includes skill id/name, activation aliases, execution modes, permissions, trust, loading state, target id, and redaction metadata without context segment content
- **中文** 当已注册 skill 被投影到 composition 时，record 必须包含 skill id/name、activation aliases、execution modes、permissions、trust、loading state、target id 和 redaction metadata，且不包含 context segment content。

#### Scenario: Side-effecting skill is not model-visible by default / 副作用 Skill 默认模型不可见
- **WHEN** a skill declares tool, workflow, or sandboxed executor modes
- **THEN** model-visible projection excludes it unless an owning tool or workflow contract exposes a governed callable command
- **中文** 当 skill 声明 tool、workflow 或 sandboxed executor modes 时，model-visible projection 默认排除它，除非 owner tool 或 workflow contract 暴露受治理 callable command。
