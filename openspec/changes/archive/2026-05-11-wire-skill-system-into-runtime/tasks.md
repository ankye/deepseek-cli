## 1. Contracts

- [x] 1.1 `platform-contracts/src/skill.ts`:`SkillSystem` 接口暴露 `listSummaries(): Promise<readonly SkillSummary[]>`(已落地,此任务仅登记契约对齐)。
- [x] 1.2 `platform-contracts/src/core-tools.ts`:`CoreCodingToolName` 加 `skill.list` / `skill.activate`。
- [x] 1.3 `platform-contracts/src/runtime.ts`:`RuntimeEventKind` 加 `skill.activated`。

## 2. Skill System

- [x] 2.1 `@deepseek/skill-system` `InMemorySkillSystem.listSummaries()` 按 `manifest.name` 升序排序(目前返回未排序)。

## 3. Core Tools

- [x] 3.1 `core-coding-tools/src/shared/ids.ts` 加 `skillList` / `skillActivate`。
- [x] 3.2 新建 `tools/skill-list/index.ts`:read-only,调 `deps.skills.listSummaries()`,返回 `{count, skills}` summary。
- [x] 3.3 新建 `tools/skill-activate/index.ts`:declared `sideEffect: "none"`(纯内存激活,不启子进程/不访问 FS),调 `deps.skills.activateSkill({name, trigger:"explicit", context:{}, sessionId})`,返回 `{status, name, segmentCount, loadingState, estimatedTokens}`;不返回 segment full text。
- [x] 3.4 `ExtendedCoreCodingToolsDependencies` 加可选 `skills?: SkillSystem`。
- [x] 3.5 两个工具加进 `coreToolDefinitions`。
- [x] 3.6 `registerRuntimeCoreTools` 的 Pick 补 `skills`。
- [x] 3.7 `skill.activate` 激活成功时,通过 runtime event 桥发出 `skill.activated`,payload `{name, status, segmentCount, loadingState}`。

## 4. Tests

- [x] 4.1 `tests/contracts/skill-tools.test.ts`:
  - `skill.list` 空 → `count:0`。
  - 注册 2 skill → `skill.list` 返回 2 项,且按 `manifest.name` 升序。
  - `skill.activate` 已注册 → `status:"activated"` 且 runtime event `skill.activated` 被观测到。
  - `skill.activate` 未注册 → `status:"not-found"` / tool failure。
- [x] 4.2 更新 `tests/contracts/core-coding-tools-contracts.test.ts` 的 manifest id 数组(加 2 项)。
- [x] 4.3 全量 `npm test` 零回归。

## 5. Spec Deltas

- [x] 5.1 `skill-system` spec 加 Requirement:Skill System `listSummaries` Sorted;Canonical Skill Discovery Tool(`core.skill.list`);Canonical Skill Activation Tool(`core.skill.activate`);Runtime Emits `skill.activated`。
- [x] 5.2 `core-coding-tools` spec 加 Requirement:Skill Discovery And Activation Tools。

## 6. Docs

- [x] 6.1 `docs/development/testing-and-acceptance.md` 新增「Skills / 技能」小节。

## 7. Verification

- [x] 7.1 `npm run typecheck`。
- [x] 7.2 `npm run lint`。
- [x] 7.3 `node scripts/check-boundaries.mjs`。
- [x] 7.4 `npm test`(307 → 311+)。
- [x] 7.5 `openspec validate wire-skill-system-into-runtime --strict` + `openspec validate --specs --strict`。
- [x] 7.6 刷新 `tests/acceptance/latest/`。
