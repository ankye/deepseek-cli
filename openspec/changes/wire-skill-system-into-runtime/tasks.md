## 1. Contracts

- [ ] 1.1 `platform-contracts/src/skill.ts`:`SkillSystem` 接口加 `listSkills(): Promise<readonly SkillSummary[]>`。
- [ ] 1.2 `platform-contracts/src/core-tools.ts`:`CoreCodingToolName` 加 `skill.list` / `skill.activate`。

## 2. Skill System

- [ ] 2.1 `@deepseek/skill-system` `InMemorySkillSystem.listSkills()` 实现,返回按 name 字母序排序的 SkillSummary 数组。

## 3. Core Tools

- [ ] 3.1 `core-coding-tools/src/shared/ids.ts` 加 `skillList` / `skillActivate`。
- [ ] 3.2 新建 `tools/skill-list/index.ts`:read-only,调 `deps.skills.listSkills()`,返回 `{count, skills}` summary。
- [ ] 3.3 新建 `tools/skill-activate/index.ts`:process side-effect,调 `deps.skills.activateSkill({name, trigger:"explicit", context:{}, sessionId})`,返回 `{status, name, segmentCount, loadingState, estimatedTokens}`;不返回 segment full text。
- [ ] 3.4 `ExtendedCoreCodingToolsDependencies` 加可选 `skills?: SkillSystem`。
- [ ] 3.5 两个工具加进 `coreToolDefinitions`。
- [ ] 3.6 `registerRuntimeCoreTools` 的 Pick 补 `skills`。

## 4. Tests

- [ ] 4.1 `tests/contracts/skill-tools.test.ts`:
  - `skill.list` 空 → `count:0`。
  - 注册 2 skill → `skill.list` 返回 2 项。
  - `skill.activate` 已注册 → `status:"activated"`。
  - `skill.activate` 未注册 → `status:"not-found"` / tool failure。
- [ ] 4.2 更新 `tests/contracts/core-coding-tools-contracts.test.ts` 的 manifest id 数组(加 2 项)。
- [ ] 4.3 全量 `npm test` 零回归。

## 5. Spec Deltas

- [ ] 5.1 `skill-system` spec 加 Requirement:Skill System Exposes listSkills;Canonical Skill Discovery Tool(`core.skill.list`);Canonical Skill Activation Tool(`core.skill.activate`)。
- [ ] 5.2 `core-coding-tools` spec 加 Requirement:Skill Discovery And Activation Tools。

## 6. Docs

- [ ] 6.1 `docs/development/testing-and-acceptance.md` 新增「Skills / 技能」小节。

## 7. Verification

- [ ] 7.1 `npm run typecheck`。
- [ ] 7.2 `npm run lint`。
- [ ] 7.3 `node scripts/check-boundaries.mjs`。
- [ ] 7.4 `npm test`(307 → 311+)。
- [ ] 7.5 `openspec validate wire-skill-system-into-runtime --strict` + `openspec validate --specs --strict`。
- [ ] 7.6 刷新 `tests/acceptance/latest/`。
