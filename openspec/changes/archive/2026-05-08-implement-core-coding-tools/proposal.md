## Why

DeepSeek CLI now has a governed runtime kernel, DeepSeek provider gateway, persistent local readiness, and hardened cross-platform platform layer. The next product milestone is to turn the platform into a usable coding agent by adding the first real governed coding tools: read, write, edit, glob, search, shell/process, git status/diff, test command, and todo/plan.

DeepSeek CLI 现在已经具备受治理的 runtime kernel、DeepSeek provider gateway、持久化本地 readiness，以及加固后的跨平台 platform layer。下一个产品里程碑是把平台变成真正可用的 coding agent：增加第一批真实受治理 coding tools，包括 read、write、edit、glob、search、shell/process、git status/diff、test command 和 todo/plan。

## What Changes

- Add a built-in core coding tools package that registers executable capabilities through the capability registry.
- 增加 built-in core coding tools package，通过 capability registry 注册 executable capabilities。
- Add governed file tools for reading files, writing files, applying exact edits/patches, and listing files.
- 增加受治理文件工具，支持 read files、write files、exact edits/patches 和 file listing。
- Add semantic search and glob tools that use the platform search/filesystem providers rather than direct shell commands.
- 增加 semantic search 和 glob tools，使用 platform search/filesystem providers，而不是直接 shell commands。
- Add shell/process and test-command tools that require explicit platform provider metadata, policy context, timeouts, resource locks, and audit events before scheduling.
- 增加 shell/process 与 test-command tools，在 scheduling 前必须声明 platform provider metadata、policy context、timeouts、resource locks 和 audit events。
- Add git status/diff tools as read-only semantic operations with safe fallback diagnostics.
- 增加 git status/diff tools，作为 read-only semantic operations，并提供安全 fallback diagnostics。
- Add todo/plan tool support for structured planning state without bypassing runtime events.
- 增加 todo/plan tool 支持，用 structured planning state 表达计划状态，且不绕过 runtime events。
- Add tool projection so model-visible schemas can be generated from registered capabilities.
- 增加 tool projection，使 model-visible schemas 可从已注册 capabilities 生成。
- Add E2E and golden coverage for a minimal coding turn: read a file, apply an edit, run a test command, and summarize evidence.
- 增加 E2E 和 golden 覆盖一个最小 coding turn：读取文件、应用编辑、运行测试命令并总结证据。

## Capabilities

### New Capabilities

- `core-coding-tools`: Built-in governed coding tools, schemas, execution semantics, diagnostics, and tool-result contracts. / 内置受治理 coding tools、schemas、execution semantics、diagnostics 和 tool-result contracts。

### Modified Capabilities

- `capability-registry`: Require core tool projection and executable metadata sufficient for model-visible tool schemas. / 要求核心工具投影和 executable metadata 足够生成 model-visible tool schemas。
- `capability-execution-governance`: Require all core tools to enter the runtime envelope, policy, scheduler, platform, bus, audit, and regression pipeline. / 要求所有核心工具进入 runtime envelope、policy、scheduler、platform、bus、audit 和 regression pipeline。
- `workspace-state-management`: Require file edits to be represented as workspace edit transactions with preconditions and rollback metadata. / 要求文件编辑以带 preconditions 和 rollback metadata 的 workspace edit transactions 表达。
- `testing-regression`: Require contract, matrix, golden, integration, and e2e tests for core coding tools. / 要求核心 coding tools 提供 contract、matrix、golden、integration 和 e2e tests。

## Impact

- Affects `@deepseek/platform-contracts`, a new or existing core tool implementation package, `@deepseek/runtime`, `@deepseek/capability-registry`, `@deepseek/workspace-state-management`, `@deepseek/platform-abstraction`, `@deepseek/policy-sandbox`, `@deepseek/testing-regression`, CLI smoke/e2e tests, golden replay, and architecture lint.
- 影响 `@deepseek/platform-contracts`、新增或现有 core tool implementation package、`@deepseek/runtime`、`@deepseek/capability-registry`、`@deepseek/workspace-state-management`、`@deepseek/platform-abstraction`、`@deepseek/policy-sandbox`、`@deepseek/testing-regression`、CLI smoke/e2e tests、golden replay 和 architecture lint。
- The change must not make default tests depend on live model providers, network access, OS keychains, or real editor hosts.
- 本变更不得让默认测试依赖 live model providers、network access、OS keychains 或真实 editor hosts。
- The first implementation may use deterministic fixture prompts and direct capability invocations before full model-driven tool calling is connected, but the tool contracts must be model-projectable from day one.
- 第一版实现可以先使用 deterministic fixture prompts 和直接 capability invocations，在完整 model-driven tool calling 接入前验证闭环；但工具契约必须从第一天起可投影给模型。
