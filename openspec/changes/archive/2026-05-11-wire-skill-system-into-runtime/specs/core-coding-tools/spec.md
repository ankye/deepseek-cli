## ADDED Requirements

### Requirement: Skill Discovery And Activation Tools / Skill 发现与激活工具

The core coding tools SHALL expose `core.skill.list` and `core.skill.activate` so agents can discover registered skills and trigger explicit activation through governed tool invocations. Both tools SHALL route through the runtime-injected `SkillSystem` rather than reaching into any private registry.

核心 coding tools 必须暴露 `core.skill.list` 与 `core.skill.activate`,使 agent 能通过受治理的 tool invocation 发现已注册 skill 并触发显式激活。两个 tool 必须经由 runtime 注入的 `SkillSystem`,不得访问任何私有注册表。

#### Scenario: skill.list enumerates registered skills without activation / skill.list 枚举不激活

- **WHEN** `core.skill.list` is invoked
- **THEN** the tool calls `deps.skills.listSummaries()`, returns the count and per-skill `{id, name, version, trust, loadingState}` summaries, and does not trigger any activation side effect
- **中文** 当 `core.skill.list` 被调用时,tool 必须调用 `deps.skills.listSummaries()`,返回数量与每个 skill 的 `{id, name, version, trust, loadingState}` summary,且不触发任何激活副作用。

#### Scenario: skill.activate performs explicit activation and returns a compact result / skill.activate 执行显式激活并返回紧凑结果

- **WHEN** `core.skill.activate` is invoked with `name`
- **THEN** the tool calls `deps.skills.activateSkill({name, trigger: "explicit", context, sessionId})` and returns `{status, name, segmentCount, loadingState, estimatedTokens}`,omitting the full segment text to bound token footprint
- **中文** 当 `core.skill.activate` 被调用并带 `name` 时,tool 必须调用 `deps.skills.activateSkill({name, trigger: "explicit", context, sessionId})`,返回 `{status, name, segmentCount, loadingState, estimatedTokens}`,不得包含 segment 完整文本,以限制 token 占用。

#### Scenario: skill tools fail closed without SkillSystem / 无 SkillSystem 时 tool 安全失败

- **WHEN** either `core.skill.list` or `core.skill.activate` is invoked while `deps.skills` is undefined
- **THEN** the tool returns a typed `SKILL_SYSTEM_UNAVAILABLE` diagnostic and does not throw
- **中文** 当 `deps.skills` 未定义时,`core.skill.list` 或 `core.skill.activate` 必须返回 typed `SKILL_SYSTEM_UNAVAILABLE` diagnostic,不得抛错。
