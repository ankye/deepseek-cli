## Context

`@deepseek/skill-system` 结构和实现:

- `InMemorySkillSystem` 369 行,`registerSkill` / `validateManifest` / `activateSkill` / `projectContext` 四个方法都实现了。
- `SkillSystem` 接口有 `validateManifest` / `loadSkill` / `activateSkill` / `projectContext`,**没有 `listSkills`**,所以 agent 没法枚举可用 skill。
- 契约测试(`src/packages/skill-system/test/`)覆盖所有四个方法,都通过。
- runtime、CLI、core-coding-tools 没有一处 `deps.skills.*` 调用。

和 hook 一样的「实现完整但零接线」。

The skill-system has full coverage for registration/validation/activation/projection, zero downstream callers, and no `listSkills` method — so agents can't even enumerate what's registered.

## Goals / Non-Goals

**Goals:**

- 给 agent 两个 tool:`core.skill.list`(枚举已注册 skill)和 `core.skill.activate`(按名字显式激活)。
- 激活成功 emit `skill.activated` runtime event,字段包含 `{name, status, segmentCount}`。
- 给 `SkillSystem` 加 `listSkills(): Promise<readonly SkillSummary[]>` 方法,`InMemorySkillSystem` 实现。
- 零回归:无 skill 注册时新 tool 返回空/not-found。

- Expose skill discovery + activation as first-class tools so the agent can self-serve; add the missing `listSkills` API; emit `skill.activated` events for auditing; keep everything backward-compatible.

**Non-Goals:**

- 不做隐式 `context-relevance` 触发。
- 不自动把 `contextSegments` 注入 message。
- 不做 skill 文件系统 loader(`.deepseek/skills/*.yaml` 等)。
- 不做远程 skill marketplace。

## Decisions

### Decision 1: `listSkills()` 加在 `SkillSystem` 接口

契约已经有 `validateManifest` / `loadSkill` / `activateSkill` / `projectContext`。`listSkills` 是显而易见的缺失 —— hook-system 有 `listHooks`,capability-registry 有 `listModelVisible`,只有 skill-system 没有。补上。

实现对等:`InMemorySkillSystem` 里返回 `[...this.skills.values()].map(summaryFor)`,排序按 `manifest.name`。

### Decision 2: 新增两个 tool 而不是一个组合 tool

分成 `skill.list`(read-only)和 `skill.activate`(带副作用)清晰分权。`list` 的 `sideEffect: "read"`,`activate` 的 `sideEffect: "process"`。policy / sandbox 分级合理。

### Decision 3: activate tool 的返回体 summary + segments count,不是完整 segments

完整 contextSegments 可能很大(skill 的 instruction / examples / resources)。agent 通常只需要知道「激活成功 + 有几段 context」,真要看内容再调 `core.skill.list` 或 `projectContext`(后续加)。当前返回:`{status, name, segmentCount, loadingState, estimatedTokens}`,不返回完整 text。

避免一次 tool call 把 agent 上下文窗口打爆。

### Decision 4: 不改 agent-loop

skill 激活是 agent 主动行为,不是 runtime 自动触发。agent-loop 不引入 pre-activation logic。未来如果做 `context-relevance` 自动激活,再单独接一个 `skill-activation.before` hook point(已有 lifecycle point 枚举)。

## Safety Model

- `skill.activate` 带 `permissions: ["skill:activate"]`,policy/sandbox 可拦截。
- trust 为 `untrusted` 的 skill 在 `InMemorySkillSystem` 里返回 `status: "inert"`,tool 层透传。
- activateSkill 失败(skill 未注册、trust 不够、激活规则未匹配)走 `tool` 的 `failure()` 返回 typed diagnostic,不崩 agent loop。

## Acceptance Strategy

- Contract: `tests/contracts/skill-tools.test.ts` 4+ case:
  - `listSkills` 空 → tool 返回 `count: 0`。
  - `listSkills` 注册 2 个 skill → tool 返回 `count: 2` + 名字。
  - `activate` 已注册 skill → `status: "activated"` + segmentCount ≥ 0 + emit `skill.activated`?(这里不 emit,tool 层返回 status,runtime 不接;或者在 tool 内部拿到 activation result 后 agent-loop 从事件里 derive —— **简化:不 emit runtime event,tool result 本身就是 agent 的观察面**)。
  - `activate` 未注册 skill → `status: "not-found"`,tool 层返回 failure。
- 全量 `npm test` 零回归。
- Spec strict 验证通过。

**修正 Decision**:去掉 `skill.activated` runtime event —— agent 通过 tool result 已经能观察到激活,不需要额外 event 流。降低 change 面。
