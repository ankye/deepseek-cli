## Why

`@deepseek/hook-system` 有完整的 423 行 `InMemoryHookSystem` 实现、规范里列了 18 个 lifecycle point（`model-call.before/after`、`tool-execution.before/after`、`user-input.before/after`、`file-edit.before/after` 等），契约测试也跑过了。但 `@deepseek/runtime` 和 `@deepseek/core-coding-tools` **没有一处调用 `deps.hooks.invokeHooks(...)`**。整个 hook 体系处于「注册好了没人触发」的状态。

The `@deepseek/hook-system` ships a 423-line `InMemoryHookSystem` with 18 defined lifecycle points, but `@deepseek/runtime` and `@deepseek/core-coding-tools` never call `deps.hooks.invokeHooks`. The system is registered but never fires.

后果：

- 用户写了 user-level hook（例如「每次 tool 执行前记录到审计 log」「model 调用前把敏感词替换」）没有任何触发路径。
- `block` / `rollback-requested` 的 failure policy 没法真正拦截任何动作。
- Claude CLI / Cursor 类竞品都靠 PreToolUse / PostToolUse hook 让用户接审计、合规、自定义 guardrail，我们这部分完全空白。
- 规范要求 `runtime SHALL invoke hooks at model-call and tool-execution lifecycle points` —— 没有实现违反规范。

Consequences: user-registered hooks never fire; `block` / `rollback-requested` policies have no attachment point; competitor CLIs hand off audit / compliance / guardrail logic to PreToolUse / PostToolUse; the spec requires this wiring.

这个 change pack 把 hook 真正接进 runtime 的五个关键位置，并补配套的 lint / 规范 / 测试。

## What Changes

- `@deepseek/runtime/src/agent-loop.ts` 在五处插入 `deps.hooks.invokeHooks`：
  - `user-input.before`：turn 开始前，input payload 是 `{prompt, sessionId}`。
  - `model-call.before`：每次 iteration dispatch 到 `deps.models.stream` 之前，payload 是 `{iteration, model, messageCount, visibleToolCount}`。
  - `model-call.after`：iteration 结束（model finished/done/error）之后，payload 是 `{iteration, assistantTextDelta, toolRequested}`。
  - `tool-execution.before`:tool intent 通过 preflight 之后、`kernel.execute` 之前,payload 是 `{toolName, capabilityId, input, toolCallId}`。
  - `tool-execution.after`:tool execution 终态之后,payload 是 `{toolName, capabilityId, terminalKind, outputPreview}`。
- **Block 语义**：任一 hook 返回 `HookInvocationResult.status === "blocked"` 时：
  - `user-input.before` 阻塞：整个 turn 失败，发 `agent.loop.failed` 带 `reason: "blocked-by-hook"`。
  - `model-call.before` 阻塞：跳过这一次 model 调用，emit `model.blocked` 事件并进入 `agent.loop.failed`。
  - `tool-execution.before` 阻塞:该 tool 被跳过,synthesize 一个 tool result feedback（`status: "denied"`）回灌 model,让 agent 继续循环。
- **observe-only 默认**：所有未显式声明 `failurePolicy: "block"` 的 hook 走 `continue` 语义；失败不影响主流程。
- 新增 `hooks.invoked` runtime event:每次 invokeHooks 完成发一个事件,包含 `{point, status, hookCount, terminal}`。
- CLI `runChatCommand` / `runOneShotCommand` 在 runtime 构造后读 `<workspace>/.deepseek/hooks.json` 文件（可选），逐个走 `deps.hooks.registerHook(manifest, handler)` 注册 user-scoped hook。handler 从 manifest 的 `transport.command` + `args` 启动子进程（复用 `NodePlatformRuntime.spawnMcpServer` 路径），stdin 接 hook input JSON、stdout 读 hook output JSON。失败时安静降级（hook 自己 `failurePolicy: "continue"`）。
- 新增 `core.hook.list` tool（走 `deps.hooks.listHooks` 或 `projectOrder`），方便 agent 自检当前启用了哪些 hook。
- 规范 delta：
  - `runtime-event-loop`：新增 `Requirement: Runtime Invokes Lifecycle Hooks`。
  - `hook-system`：把「SHALL invoke at model-call / tool-execution points」从「预期 runtime 接」升级为「runtime MUST 在这五个点触发；block 结果 MUST 使 turn 失败或 tool 跳过」，列出精确 block 行为。

## Impact

- 受影响规范：`runtime-event-loop` + `hook-system`。
- 受影响代码：
  - `@deepseek/runtime/src/agent-loop.ts`:五个 invocation 点 + `hooks.invoked` 事件 + `model.blocked` 事件。
  - `@deepseek/platform-contracts`:RuntimeEventKind 新增 `hooks.invoked` 与 `model.blocked`。
  - `@deepseek/core-coding-tools`:新增 `tools/hook-list/` + `core.hook.list` id。
  - `src/apps/cli/src/index.ts`:新增 `loadUserHooks(workspaceRoot, deps, platform)` 辅助,在 runtime 装配后调用。
  - `NodePlatformRuntime.spawnMcpServer` 已存在,复用启动子进程;hook handler 把它包一层读写 JSON。
- 新增测试:
  - `tests/contracts/hook-wiring.test.ts`:
    - observation hook 在 tool-execution.before 被触发并观察 payload。
    - block policy 的 hook 在 tool-execution.before 返回 blocked → tool 被 skip,返回 `denied` feedback。
    - user-input.before 的 block → `agent.loop.failed` with `reason: "blocked-by-hook"`。
    - model-call.before 的 block → `model.blocked` emitted。
  - `tests/integration/hook-user-file-loading.test.ts`:写一个临时 `.deepseek/hooks.json` 让 CLI 装载,验证对应 hook 被调用。
- 向后兼容:没有 hook 时行为完全不变(现有 300 个测试全绿)。
- 文档:`docs/development/testing-and-acceptance.md` 新增「Hooks / 钩子」小节,解释 5 个接线点 + block 语义 + `.deepseek/hooks.json` 格式。

## Non-Goals

- 不做 `file-edit.before/after`(现在 file.write/edit 没有独立 event,需要再单独接),留到下个 change pack。
- 不做 `session.before/after` / `skill-activation.*` / `workflow-step.*` / `plugin-lifecycle.*` / `host-render.*` 其他 13 个 point —— 与 R1 工作面不关键,留到需求驱动时再接。
- 不做 hook marketplace / discovery,也不做 `.deepseek/hooks.json` 的 schema 热重载。
- 不把 hook 做成独立进程沙箱(`HookIsolationMode: "sandboxed"` 保留在接口,实际实现与 `in-process-observe-only` 一致)。
