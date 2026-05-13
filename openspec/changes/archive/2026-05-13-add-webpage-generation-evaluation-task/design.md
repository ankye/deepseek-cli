## Context

The evaluation framework can now plan task-completion runs and probe Codex as an opt-in external baseline. It still needs product-representative tasks that are closer to what users ask coding agents to do. Webpage generation is a good next task because it requires file creation, visual structure, responsiveness, and basic interaction without depending on live services.

评估框架现在可以规划 task-completion runs，并以 opt-in 方式 probe Codex external baseline。它还需要更接近用户真实请求的产品代表性任务。网页生成是合适的下一个任务，因为它要求创建文件、组织视觉结构、响应式布局与基础交互，同时不依赖 live services。

## Goals / Non-Goals

**Goals:**

- Add a deterministic webpage-generation evaluation task.
- Validate generated artifacts with a local script.
- Check for essential implementation signals: HTML entry, CSS, JavaScript interaction, accessibility/viewport metadata, and no remote CDN dependency.

- 新增 deterministic webpage-generation evaluation task。
- 使用本地脚本校验生成产物。
- 检查核心实现信号：HTML entry、CSS、JavaScript interaction、accessibility/viewport metadata，以及没有 remote CDN dependency。

**Non-Goals:**

- Do not visually judge screenshots in this slice.
- Do not run Codex or another external baseline on the task yet.
- Do not require a specific framework.

- 本切片不做截图视觉评分。
- 还不让 Codex 或其他 external baseline 执行该任务。
- 不要求特定 framework。

## Decisions

### Decision: Full Mode First

The webpage-generation task is added as `mode: "full"` so it does not expand smoke evaluation until execution isolation, artifact collection, and visual scoring are in place.

webpage-generation task 先加入 `mode: "full"`，这样在 execution isolation、artifact collection 与 visual scoring 到位前不会扩大 smoke evaluation。

### Decision: Artifact Checker Is Framework-Agnostic

The validation script accepts a generated directory and checks static output shape rather than a framework-specific build. This keeps the task portable across plain HTML, React, Vue, or other toolchains.

validation script 接收 generated directory 并检查静态输出形态，而不是绑定特定 framework build。这样任务可适配 plain HTML、React、Vue 或其他工具链。

## Risks / Trade-offs

- [Risk] Static checks do not guarantee visual quality. -> Mitigation: treat this as first gate; screenshot and Playwright scoring can follow later.
- [Risk] Agents can satisfy checks with shallow output. -> Mitigation: task prompt and later rubric should add domain-specific visual/content requirements.

- [Risk] 静态检查不能保证视觉质量。-> 缓解：把它作为第一道门；后续增加 screenshot 与 Playwright scoring。
- [Risk] agent 可能用浅层输出满足检查。-> 缓解：task prompt 与后续 rubric 增加领域化视觉/内容要求。
