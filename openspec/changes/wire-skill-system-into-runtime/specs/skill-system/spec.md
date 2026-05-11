## ADDED Requirements

### Requirement: Skill System Exposes Enumeration / Skill System 暴露枚举

The `SkillSystem` contract SHALL expose a `listSkills()` method returning all registered skills as `SkillSummary[]` sorted by manifest name, parallel to `HookSystem.listHooks` and `CapabilityRegistry.listModelVisible`, so hosts and agents can discover what is registered without invoking activation.

`SkillSystem` 契约必须暴露 `listSkills()` 方法,返回所有已注册 skill 的 `SkillSummary[]`,按 manifest name 排序,与 `HookSystem.listHooks` 和 `CapabilityRegistry.listModelVisible` 对齐,使 host 与 agent 能在不触发激活的前提下发现已注册 skill。

#### Scenario: listSkills returns empty for a fresh registry / 新注册表返回空

- **WHEN** a fresh `SkillSystem` instance has no skills registered
- **THEN** `listSkills()` SHALL return an empty readonly array without throwing
- **中文** 当 `SkillSystem` 实例没有注册 skill 时,`listSkills()` 必须返回空 readonly 数组,不得抛错。

#### Scenario: listSkills reflects registered skills / 反映已注册 skill

- **WHEN** the skill system has N registered skills
- **THEN** `listSkills()` SHALL return exactly N `SkillSummary` entries,sorted by `manifest.name` ascending,and each entry SHALL carry the normalized `id`, `name`, `version`, `trust`, `loadingState`
- **中文** 当 skill system 注册了 N 个 skill 时,`listSkills()` 必须精确返回 N 条 `SkillSummary`,按 `manifest.name` 升序,每条包含归一化的 `id`、`name`、`version`、`trust`、`loadingState`。

### Requirement: Agent Discovery And Activation Of Skills Via Tools / Agent 通过 Tool 发现与激活 Skill

The platform SHALL expose the skill registry to agents through two governed tools: a read-only `core.skill.list` that enumerates registered skills and a process-side-effect `core.skill.activate` that triggers explicit activation, returning a compact summary without inlining full context segment text.

平台必须通过两个受治理 tool 把 skill 注册表暴露给 agent:只读的 `core.skill.list` 用于枚举已注册 skill,带进程副作用的 `core.skill.activate` 用于触发显式激活,返回紧凑 summary,不得把完整 context segment 文本内联进 tool result。

#### Scenario: skill.list is read-only and enumerates skills / skill.list 只读枚举

- **WHEN** an agent invokes `core.skill.list`
- **THEN** the tool calls `deps.skills.listSkills()`, returns `{count, skills}` metadata without activating any skill or modifying runtime state, and has `sideEffect: "read"` in its manifest
- **中文** 当 agent 调用 `core.skill.list` 时,该 tool 必须调用 `deps.skills.listSkills()`,返回 `{count, skills}` metadata,不得激活任何 skill 或修改 runtime state,manifest `sideEffect` 必须为 `"read"`。

#### Scenario: skill.activate triggers explicit activation / skill.activate 触发显式激活

- **WHEN** an agent invokes `core.skill.activate` with a valid `name`
- **THEN** the tool calls `deps.skills.activateSkill({name, trigger: "explicit", context, sessionId})` and returns `{status, name, segmentCount, loadingState, estimatedTokens}` derived from the activation result,without inlining full segment text
- **中文** 当 agent 以合法 `name` 调用 `core.skill.activate` 时,该 tool 必须调用 `deps.skills.activateSkill({name, trigger: "explicit", context, sessionId})`,并从激活结果派生 `{status, name, segmentCount, loadingState, estimatedTokens}` 返回,不得内联完整 segment 文本。

#### Scenario: skill.activate for unknown skill fails typed / 激活未知 skill 返回 typed failure

- **WHEN** an agent invokes `core.skill.activate` with a name not registered in the skill system
- **THEN** the tool returns a typed `SKILL_NOT_FOUND` diagnostic rather than throwing or synthesizing fake activation
- **中文** 当 agent 以未注册的 name 调用 `core.skill.activate` 时,该 tool 必须返回 typed `SKILL_NOT_FOUND` diagnostic,不得抛错或合成假激活。
