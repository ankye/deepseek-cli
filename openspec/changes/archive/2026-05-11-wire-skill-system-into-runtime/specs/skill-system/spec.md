## ADDED Requirements

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
