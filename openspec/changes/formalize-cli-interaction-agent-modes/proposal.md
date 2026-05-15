## Why

DeepSeek CLI is already growing beyond a single prompt-to-answer command: it has chat, palette navigation, PageIndex recall, evidence-first behavior, session resume/fork, approvals, revert, and an initial agent-spawn tool. The next product step must formalize interaction modes and agent modes as first-class, replayable contracts so the CLI becomes a multi-round evidence and verification system rather than a linear generator.

DeepSeek CLI 已经不再只是单条 prompt 到单条 answer：当前已有 chat、palette navigation、PageIndex recall、evidence-first、session resume/fork、approval、revert 和初始 agent-spawn tool。下一步必须把 interaction modes 与 agent modes 变成一等、可回放的契约，使 CLI 成为多轮证据与验证系统，而不是单线生成器。

Reference review of `参考/claude-code-2.1.88` shows the shape of a mature Agent CLI: explicit planning/auto/permission/remote/vim/coordinator-like modes, background workers, worker continuation/stop, mode-aware prompts, and guarded command surfaces. It also shows pitfalls to avoid: mode state patched through mutable environment variables, workers missing parent conversation context, over-delegation for trivial tasks, unverifiable worker results, and permission propagation complexity.

对 `参考/claude-code-2.1.88` 的参考审阅显示，成熟 Agent CLI 的形态包括显式 planning/auto/permission/remote/vim/coordinator-like modes、后台 worker、worker continuation/stop、mode-aware prompts 和受控 command surfaces。同时也暴露了需要提前规避的坑：通过可变环境变量修补 mode state、worker 缺少父会话上下文、琐碎任务过度委派、worker result 不可验证、permission propagation 复杂化。

## What Changes

- Add a first-class CLI interaction mode model covering one-shot, chat, interactive TUI, command/palette, result-list navigation, approval, review/diff, background task, headless/CI, remote/future host, and degraded terminal modes.
- 新增一等 CLI interaction mode model，覆盖 one-shot、chat、interactive TUI、command/palette、result-list navigation、approval、review/diff、background task、headless/CI、remote/future host 与 degraded terminal modes。
- Add a first-class agent mode orchestration model covering default single-agent, evidence/research, planner, implementer, verifier/reviewer, coordinator, worker/subagent, repair, and synthesis/reconciliation modes.
- 新增一等 agent mode orchestration model，覆盖 default single-agent、evidence/research、planner、implementer、verifier/reviewer、coordinator、worker/subagent、repair 与 synthesis/reconciliation modes。
- Require top-tier Agent CLI workflow to be a multi-round loop: classify intent, collect evidence, plan when needed, implement through governed capabilities, verify independently, repair when safe, reconcile results, and persist replayable evidence.
- 要求顶级 Agent CLI workflow 成为多轮闭环：classify intent、collect evidence、必要时 plan、通过受治理能力 implement、独立 verify、安全时 repair、reconcile results，并持久化可回放 evidence。
- Persist mode state and transitions in session/runtime events rather than hidden process globals or mutable environment state.
- 将 mode state 与 transitions 持久化到 session/runtime events，而不是隐藏的 process globals 或可变环境状态。
- Extend agent-management from definition/instance skeletons toward product-facing roles, delegation decisions, continuation/stop semantics, scoped scratchpad/checkpoint policy, and result routing.
- 将 agent-management 从 definition/instance skeleton 扩展到面向产品的 roles、delegation decisions、continuation/stop semantics、scoped scratchpad/checkpoint policy 与 result routing。
- Tie mode and agent selection to prompt assembly, permission/tool projection, command visibility, session resume/fork, and regression evidence.
- 将 mode 与 agent selection 绑定到 prompt assembly、permission/tool projection、command visibility、session resume/fork 与 regression evidence。
- Add completion matrix and acceptance requirements so the team can see which mode surfaces are complete, partial, or planned.
- 增加完成度矩阵与验收要求，让团队能明确看到哪些 mode surfaces 已完成、部分完成或待规划。

## Capabilities

### New Capabilities

- `cli-interaction-modes`: Explicit, host-agnostic CLI mode state, transitions, degraded terminal behavior, command visibility, and session persistence.
- `cli-interaction-modes`：显式、host-agnostic 的 CLI mode state、transitions、降级终端行为、command visibility 与 session persistence。
- `agent-mode-orchestration`: Agent role/mode taxonomy, coordinator-worker workflow, delegation/continuation/stop decisions, independent verification, result reconciliation, and mode-aware tool/context scopes.
- `agent-mode-orchestration`：Agent role/mode taxonomy、coordinator-worker workflow、delegation/continuation/stop decisions、独立验证、result reconciliation 与 mode-aware tool/context scopes。

### Modified Capabilities

- `agent-management`: Extend agent definitions and instances with product roles, mode bindings, delegation metadata, continuation/stop lifecycle, scoped scratchpad/checkpoint policy, and result provenance.
- `agent-management`：扩展 agent definitions 与 instances，加入 product roles、mode bindings、delegation metadata、continuation/stop lifecycle、scoped scratchpad/checkpoint policy 与 result provenance。
- `agent-loop`: Require a multi-phase, evidence-driven turn lifecycle rather than a single model dispatch path when task complexity or factual sensitivity requires it.
- `agent-loop`：当任务复杂或事实敏感时，要求 turn lifecycle 进入多阶段 evidence-driven 流程，而不是单次 model dispatch。
- `minimal-chat-cli`: Add mode commands/status, mode-aware local slash controls, and explicit rules preventing mode/control inputs from leaking to the model.
- `minimal-chat-cli`：增加 mode commands/status、mode-aware local slash controls，并明确禁止 mode/control 输入泄漏到 model。
- `vi-inspired-cli-composition`: Align vi-inspired composition modes with the broader CLI interaction mode state machine.
- `vi-inspired-cli-composition`：让 vi-inspired composition modes 与更广义的 CLI interaction mode state machine 对齐。
- `session-resume-fork`: Persist and replay interaction mode, agent mode, delegation lineage, and mode transition metadata across resume/fork.
- `session-resume-fork`：在 resume/fork 中持久化并回放 interaction mode、agent mode、delegation lineage 与 mode transition metadata。
- `testing-regression`: Add golden, contract, matrix, and adversarial fixtures for mode transitions, delegation, verification, continuation, stop, and replay.
- `testing-regression`：增加 mode transitions、delegation、verification、continuation、stop 与 replay 的 golden、contract、matrix 和 adversarial fixtures。
- `cli-task-completion-evaluation`: Score multi-round operating quality, independent verification quality, repair quality, and unsupported delegation claims, not only final artifact existence.
- `cli-task-completion-evaluation`：评估 multi-round operating quality、independent verification quality、repair quality 与 unsupported delegation claims，而不只看最终产物是否存在。

## Impact

- Affected packages: `src/packages/platform-contracts`, `src/packages/agent-management`, `src/packages/runtime`, `src/packages/runtime-message-bus`, `src/packages/communication-protocol`, `src/packages/prompt-assembly`, `src/packages/core-coding-tools`, `src/packages/testing-regression`, and `src/apps/cli`.
- 影响包：`src/packages/platform-contracts`、`src/packages/agent-management`、`src/packages/runtime`、`src/packages/runtime-message-bus`、`src/packages/communication-protocol`、`src/packages/prompt-assembly`、`src/packages/core-coding-tools`、`src/packages/testing-regression` 与 `src/apps/cli`。
- Affected product surfaces: `deepseek run`, `deepseek chat`, palette/revert/session commands, future `/mode` and `/agent` local controls, diagnostics/evaluation output, and generated acceptance evidence.
- 影响产品面：`deepseek run`、`deepseek chat`、palette/revert/session commands、未来 `/mode` 与 `/agent` local controls、diagnostics/evaluation output 与生成的 acceptance evidence。
- Existing architecture remains directionally correct: host adapters stay thin, contracts stay implementation-free, runtime owns execution, command/palette stay local, and shared packages own orchestration. The adjustment is to make mode and agent orchestration explicit in shared contracts instead of leaving it implicit in CLI code or prompt text.
- 现有架构方向正确：host adapters 保持轻薄，contracts 不含实现，runtime 拥有执行，command/palette 保持本地，共享 packages 拥有 orchestration。本次调整是把 mode 与 agent orchestration 显式放进共享契约，而不是隐含在 CLI 代码或 prompt 文本里。
