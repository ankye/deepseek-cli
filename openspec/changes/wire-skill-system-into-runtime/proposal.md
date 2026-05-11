## Why

`@deepseek/skill-system` 有完整的 369 行 `InMemorySkillSystem` 实现、规范里列了 `validateManifest` / `loadSkill` / `activateSkill` / `projectContext` 四个 API,但 runtime、CLI、core-coding-tools 里**没有一处调用**。跟刚刚接上的 hook 一样,属于「实现完整但没接线」。

The `@deepseek/skill-system` ships a 369-line `InMemorySkillSystem` with full API surface (validateManifest, loadSkill, activateSkill, projectContext), but nothing in runtime / CLI / core-coding-tools calls it. Same shape of drift as the hook system before the last change pack.

后果:
- 用户写了 skill 也没触发路径,除非在自家脚本里 new `InMemorySkillSystem` 手工调。
- Claude CLI 的 Skill tool 是重要 workflow 入口 —— agent 可以按需加载 skill 把 instructions 注入到 context,我们缺失。
- `@deepseek/context-engine` 有 skill 投影的代码 bridge 但从未被 agent 侧触发。

Consequences: user-authored skills never activate; agents cannot load on-demand skill instructions; context-engine's skill bridge is dead code from the agent perspective.

## What Changes

- 新增 `core.skill.list` tool(read-only):调用 `deps.skills.activateSkill({trigger:"explicit", name:""})` 风格不合适,改走 `deps.skills.projectContext({name, sessionId, trigger:"context-relevance", maxSegments:0})`。比较理想是 `listSkills()`。 **Skill system 契约没有 list 方法**,这里加一个对等的 `listSkills(): Promise<readonly SkillSummary[]>`(在 `SkillSystem` 接口 + `InMemorySkillSystem` 里都实现)。
- 新增 `core.skill.activate` tool:调 `deps.skills.activateSkill({name, trigger:"explicit", context:{...}})`。返回 `contextSegments` 数组概要,agent 可以看到注入内容;如果 `skill.activations` 成功,runtime 把 segments 的 instruction 拼成一条 system message 追加到后续 turn 的 `messages`。
- 在 runtime 的 `RuntimeDependencies` 不动,通过 agent-loop 的一次 `activateSkill` → `messages.unshift` 即可(agent 主动发起,无隐式)。
- emit 新 runtime event `skill.activated`,payload:`{name, status, segmentCount, loadingState}`。
- Spec delta:`skill-system` 新增一个 `listSkills` requirement + 一条「explicit activation is agent-visible via tool」requirement。
- Spec delta:`core-coding-tools` 新增 `skill.list` / `skill.activate` 两条 requirement。

## Impact

- 受影响规范:`skill-system`(新 `listSkills` API + agent-visible activation)、`core-coding-tools`(新 2 个 tool)。
- 受影响代码:
  - `@deepseek/platform-contracts`:`SkillSystem` 加 `listSkills()`;`RuntimeEventKind` 加 `skill.activated`;`CoreCodingToolName` 加 `skill.list` + `skill.activate`。
  - `@deepseek/skill-system`:`InMemorySkillSystem.listSkills()` 实现。
  - `@deepseek/core-coding-tools`:`tools/skill-list/`、`tools/skill-activate/` 两个新文件夹 + 注册。
  - `@deepseek/runtime`:`registerRuntimeCoreTools` Pick 加 `skills`;no agent-loop changes(skill 激活完全由 agent 通过 tool 触发,不动主 loop)。
- 测试:`tests/contracts/skill-tools.test.ts`(4 case:listSkills 空列表、activate 成功返回 segments、activate 未知 skill 返回 not-found、failure 路径)。
- 零回归:没有 skill 注册时,新 tool 返回空/not-found,原 307 测试保持。
- Docs:`docs/development/testing-and-acceptance.md` 新增「Skills / 技能」小节。

## Non-Goals

- 不把 skill 激活做成隐式触发(`trigger:"context-relevance"` 的自动注入留到后续)。
- 不把 skill 的 `contextSegments` 自动 merge 到 agent messages(让 agent 自己决定怎么用 tool 返回的 content)。
- 不做 skill marketplace / discovery。
- 不做 `.deepseek/skills/` 自动扫描注册 —— 这次只做 contract 接线 + tool surface,user-scoped skill 的 CLI loader 独立 change pack。
