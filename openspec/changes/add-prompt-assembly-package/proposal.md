## Why

Prompt construction is becoming a strategic subsystem rather than a helper function: it sits between user intent, memory recall, context projection, tool exposure, provider quirks, caching, replay, and evaluation. The current runtime assembles model requests inline, which is workable for the first CLI loop but too brittle for a CLI-first product that must support DeepSeek live generation, PageIndex/ZVec recall, reversible turns, provider comparison, and long-term extensibility.

Prompt construction 正在从 helper function 变成战略级子系统：它连接 user intent、memory recall、context projection、tool exposure、provider quirks、caching、replay 与 evaluation。当前 runtime 以内联方式组装 model requests，足以支撑第一版 CLI loop，但对 CLI-first 产品后续要支持 DeepSeek live generation、PageIndex/ZVec recall、reversible turns、provider comparison 与长期扩展来说过于脆弱。

## What Changes

- Add a dedicated `@deepseek/prompt-assembly` workspace package that owns prompt assembly contracts, pipeline orchestration, section registration, budget fitting, trace/fingerprint generation, and provider-neutral request plans.
- Keep `@deepseek/platform-contracts` as the canonical contract boundary for shared prompt assembly DTOs and events; the new package implements behavior without importing app hosts.
- Move runtime-owned model request assembly out of inline `agent-loop.ts` logic and into the new package through injected dependencies.
- Introduce a flexible, extension-first section pipeline so project instructions, task instructions, PageIndex recall, ZVec recall, file references, code intelligence, tool results, skills, output contracts, and future provider features can be added without editing the core loop.
- Add assembly records and runtime events that expose redacted prompt structure, section inclusion/exclusion reasons, token budget decisions, tool projection decisions, provider adaptation metadata, and stable fingerprints.
- Preserve existing context-engine ownership of retrieval/projection; prompt assembly consumes normalized projection results and never bypasses projection policy.
- Prepare DeepSeek CLI evaluation to measure prompt assembly quality, including context hit rate, section drop reasons, tool exposure, and first-call readiness for webpage generation.

- 新增独立 workspace package `@deepseek/prompt-assembly`，负责 prompt assembly contracts、pipeline orchestration、section registration、budget fitting、trace/fingerprint generation 与 provider-neutral request plans。
- 保持 `@deepseek/platform-contracts` 作为共享 prompt assembly DTOs 与 events 的规范契约边界；新 package 负责实现行为，不导入 app host。
- 将 runtime-owned model request assembly 从 `agent-loop.ts` 内联逻辑迁移到新 package，并通过注入依赖使用。
- 引入灵活、扩展优先的 section pipeline，使 project instructions、task instructions、PageIndex recall、ZVec recall、file references、code intelligence、tool results、skills、output contracts 与未来 provider features 可以在不修改 core loop 的情况下接入。
- 增加 assembly records 与 runtime events，暴露脱敏后的 prompt structure、section include/exclude reasons、token budget decisions、tool projection decisions、provider adaptation metadata 与 stable fingerprints。
- 保留 context-engine 对 retrieval/projection 的所有权；prompt assembly 只消费 normalized projection results，绝不绕过 projection policy。
- 为 DeepSeek CLI evaluation 准备 prompt assembly quality 指标，包括 context hit rate、section drop reasons、tool exposure 与 webpage generation 的 first-call readiness。

## Capabilities

### New Capabilities
- `prompt-assembly`: Provider-neutral prompt assembly package, extension pipeline, assembly records, traceability, and budgeted section composition.

### Modified Capabilities
- `agent-loop`: Runtime model dispatch must consume prompt assembly plans instead of constructing model requests inline.
- `context-engine`: Context projection outputs must be consumable by prompt assembly as typed evidence without adding a second retrieval path.
- `cli-task-completion-evaluation`: Evaluation records must include prompt assembly evidence needed to diagnose task-completion gaps.

## Impact

- New package: `src/packages/prompt-assembly`.
- Affected contracts: `src/packages/platform-contracts/src/prompt-assembly.ts`, model/runtime event exports, and compatibility/versioning tests.
- Affected runtime: `src/packages/runtime/src/agent-loop.ts`, context projection integration, model request dispatch, and event recording.
- Affected CLI diagnostics/evaluation: redacted prompt assembly evidence in JSON/JSONL output and comparison records.
- Affected tests: package unit tests, runtime integration/golden replay tests, boundary lint rules, schema versioning tests, and CLI evaluation tests.
- Architecture impact: package dependency direction must remain `platform-contracts -> prompt-assembly implementation users`; apps must not own prompt assembly logic.
