## Context

DeepSeek CLI already has the R0 platform pieces needed for safe tool execution: `RuntimeKernel`, execution envelopes, capability registry, policy/sandbox, scheduler, platform abstraction, runtime message bus, deterministic fakes, and provider/tool-intent preflight. What is missing is the first product-visible set of coding tools that can act on a repository through those boundaries.

DeepSeek CLI 已具备安全工具执行所需的 R0 平台部件：`RuntimeKernel`、execution envelopes、capability registry、policy/sandbox、scheduler、platform abstraction、runtime message bus、deterministic fakes，以及 provider/tool-intent preflight。当前缺失的是第一组用户可见的 coding tools，让系统能通过这些边界真正操作仓库。

The key product requirement is not merely adding filesystem helpers. The tools must prove that future Claude/Codex-class workflows can be composed from governed, replayable, host-neutral capabilities.

核心产品要求不只是增加 filesystem helpers。工具必须证明未来 Claude/Codex 级 workflow 可以由受治理、可 replay、host-neutral 的 capabilities 组合出来。

## Goals / Non-Goals

**Goals:**

- Register the first built-in coding tools as executable capabilities with stable manifests and model-visible schemas.
- 将第一批内置 coding tools 注册为 executable capabilities，并提供稳定 manifests 与 model-visible schemas。
- Implement read, write, edit, glob, search, shell/process, git status/diff, test command, and todo/plan through the governed runtime path.
- 通过受治理 runtime path 实现 read、write、edit、glob、search、shell/process、git status/diff、test command 和 todo/plan。
- Make file mutation transactional: preconditions, affected paths, rollback metadata, result summaries, and post-edit evidence.
- 让文件修改具备事务语义：preconditions、affected paths、rollback metadata、result summaries 和 post-edit evidence。
- Keep platform-specific behavior in `platform-abstraction` and policy decisions in `policy-sandbox`.
- 将平台差异留在 `platform-abstraction`，将策略决策留在 `policy-sandbox`。
- Add deterministic tests that prove the minimum R1 coding loop: read, edit, test, summarize evidence.
- 增加确定性测试，证明最小 R1 coding loop：read、edit、test、summary evidence。

**Non-Goals:**

- Do not implement a full interactive TUI in this change.
- 本变更不实现完整交互式 TUI。
- Do not implement autonomous multi-turn model planning or full model-driven tool loop in this change.
- 本变更不实现自主多轮模型规划或完整 model-driven tool loop。
- Do not implement plugin/skill/MCP tool contribution in this change; built-in tools establish the contract first.
- 本变更不实现 plugin/skill/MCP tool contribution；先用 built-in tools 建立契约。
- Do not implement full sandbox enforcement for every OS; use existing policy/platform contracts and deterministic coverage.
- 本变更不实现每个 OS 的完整 sandbox enforcement；使用现有 policy/platform contracts 和 deterministic coverage。

## Decisions

### Decision: Core Tools Are A Dedicated Built-In Capability Package

Core coding tools will live in a dedicated package, likely `@deepseek/core-coding-tools`, with no host imports. It owns tool manifests, input/output schemas, executor implementations, registration helpers, and package-local unit tests. Runtime and CLI consume it only through package exports and registry registration.

核心 coding tools 放在独立 package 中，建议为 `@deepseek/core-coding-tools`，且不导入 host API。它负责 tool manifests、input/output schemas、executor implementations、registration helpers 和 package-local unit tests。runtime 与 CLI 只通过 package exports 和 registry registration 使用它。

Alternative considered: put tools directly in `runtime`. Rejected because runtime should own execution, not tool semantics; otherwise tools, model loop, and kernel lifecycle will become coupled.

备选方案：把工具直接放入 `runtime`。拒绝原因是 runtime 应拥有执行管线，而不是工具语义；否则工具、model loop 和 kernel lifecycle 会耦合。

### Decision: Every Tool Uses Platform Semantics

File and search tools use `PlatformRuntime` methods such as workspace path resolution, read/write, find files, search text, process provider, and path translation. Shell and test tools use argv-array execution by default and require explicit shell profile only for shell syntax.

文件和搜索工具使用 `PlatformRuntime` 的 workspace path resolution、read/write、find files、search text、process provider 和 path translation 等语义化方法。shell 与 test tools 默认使用 argv-array execution，只有 shell syntax 场景才要求显式 shell profile。

Alternative considered: call `fs`, `child_process`, `rg`, or `git` directly from tools. Rejected because it bypasses cross-platform policy, diagnostics, and lintable boundaries.

备选方案：工具直接调用 `fs`、`child_process`、`rg` 或 `git`。拒绝原因是会绕过跨平台策略、诊断和可 lint 的边界。

### Decision: Edit Tool Uses Workspace Transactions

The edit tool will produce a workspace edit transaction with target path, expected old content or patch precondition, proposed replacement, affected ranges, and rollback snapshot. The executor applies changes only after platform path checks and policy approval. The first implementation can support exact string replace and full-file write before supporting complex diff formats.

edit tool 将生成 workspace edit transaction，包含 target path、expected old content 或 patch precondition、proposed replacement、affected ranges 和 rollback snapshot。executor 只有在 platform path checks 与 policy approval 后才应用更改。第一版可以先支持 exact string replace 和 full-file write，再扩展复杂 diff formats。

Alternative considered: let model output arbitrary patches and apply them directly. Rejected because arbitrary patch application is harder to validate, rollback, and replay in the first R1 slice.

备选方案：让模型输出任意 patch 并直接应用。拒绝原因是第一版 R1 中任意 patch 更难校验、回滚和 replay。

### Decision: Shell/Test Tools Are Separate

`shell.run` is the low-level governed process capability. `test.run` is a semantic wrapper that records test intent, command, timeout, cwd, platform provider metadata, and result summary. This lets future policy distinguish general shell commands from project test commands.

`shell.run` 是低层受治理 process capability。`test.run` 是语义化 wrapper，记录 test intent、command、timeout、cwd、platform provider metadata 和 result summary。这样未来 policy 可以区分普通 shell command 与项目 test command。

Alternative considered: only expose a shell tool. Rejected because test execution is product-critical evidence and deserves first-class tracing and policy controls.

备选方案：只暴露 shell tool。拒绝原因是 test execution 是产品关键证据，需要一等 tracing 和 policy controls。

### Decision: Tool Results Are Evidence Objects

Every tool result returns a redacted evidence object: content preview or digest, affected paths, provider metadata, diagnostics, timing, and replay-safe output. Raw large file content and raw command output must be bounded.

每个工具结果都返回脱敏 evidence object：content preview 或 digest、affected paths、provider metadata、diagnostics、timing 和 replay-safe output。大文件原文和命令原始输出必须有边界。

Alternative considered: return raw strings only. Rejected because host rendering, golden replay, and future context projection need structured evidence.

备选方案：只返回 raw strings。拒绝原因是 host rendering、golden replay 和未来 context projection 需要 structured evidence。

## Risks / Trade-offs

- [Risk] Tool scope can expand quickly. -> Mitigation: implement the first slice as bounded built-ins with exact schemas and tests before adding advanced patch formats, code intelligence, or plugin tools.
- [风险] 工具范围可能快速膨胀。-> 缓解：第一阶段只实现有明确 schemas 和 tests 的有限 built-ins，再扩展高级 patch formats、code intelligence 或 plugin tools。
- [Risk] Shell/test execution is inherently risky. -> Mitigation: default deterministic policy can deny process side effects until explicit policy/approval rules allow them; tests verify denial and allowed fake execution paths.
- [风险] shell/test execution 天生有风险。-> 缓解：默认 deterministic policy 可拒绝 process side effects，直到显式 policy/approval rules 允许；测试覆盖拒绝与 fake allowed execution path。
- [Risk] Large outputs can pollute traces. -> Mitigation: enforce output limits, previews, digests, redaction metadata, and golden normalization.
- [风险] 大输出可能污染 traces。-> 缓解：强制 output limits、previews、digests、redaction metadata 和 golden normalization。

## Migration Plan

1. Add tool contracts and result/evidence DTOs to `platform-contracts`.
2. Add `@deepseek/core-coding-tools` package and workspace metadata.
3. Register built-in tool manifests and executors through `capability-registry`.
4. Integrate default core tool registration into deterministic runtime dependencies and CLI bootstrap path.
5. Add contract, unit, integration, matrix, golden, and e2e tests.
6. Keep default tests offline and deterministic; no live model provider is required.

迁移计划：

1. 在 `platform-contracts` 中增加 tool contracts 和 result/evidence DTOs。
2. 增加 `@deepseek/core-coding-tools` package 和 workspace metadata。
3. 通过 `capability-registry` 注册 built-in tool manifests 和 executors。
4. 将默认 core tool registration 接入 deterministic runtime dependencies 与 CLI bootstrap path。
5. 增加 contract、unit、integration、matrix、golden 和 e2e tests。
6. 默认测试保持离线和确定性；不要求 live model provider。

## Open Questions

- Should the first edit tool support unified diff, or only exact replacement and full-file write?
- 第一版 edit tool 应支持 unified diff，还是只支持 exact replacement 和 full-file write？
- Should `shell.run` remain denied by default while `test.run` is allowed under deterministic fake policy?
- `shell.run` 是否默认保持 deny，而 `test.run` 在 deterministic fake policy 下允许？
- Should tool result previews use byte limits, line limits, or both?
- tool result previews 应使用 byte limits、line limits，还是两者都用？
