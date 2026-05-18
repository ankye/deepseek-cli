## 1. Contracts / 契约

- [x] 1.1 `platform-contracts/src/runtime.ts` `RuntimeEventKind` 新增 `hooks.invoked` 与 `model.blocked`。
- [x] 1.2 `HookInvocationRequest` / `HookInvocationResult` 字段足够(现有契约已完整,无需改)。
- [x] 1.3 `CoreCodingToolName` 增加 `hook.list`。

## 2. Runtime Wiring / Runtime 接线

- [x] 2.1 `agent-loop.ts` 新增 `fireHooks` helper,在 `turn.started` 之后 `projectAgentLoopContext` 之前发 `user-input.before`;block → `agent.loop.failed` + `reason: "blocked-by-hook"`。
- [x] 2.2 每次 iteration 的 `model.requested` 之前发 `model-call.before`;block → `model.blocked` + `agent.loop.failed`。
- [x] 2.3 每次 iteration 的 model 事件流结束后发 `model-call.after`。
- [x] 2.4 tool preflight 通过后、`kernel.execute` 之前发 `tool-execution.before`;block → 合成 `model.tool.result` 带 `status: "denied"` + 继续循环。
- [x] 2.5 tool terminal 之后发 `tool-execution.after`。
- [x] 2.6 每次 invokeHooks 完成 emit `hooks.invoked` event。
- [x] 2.7 `fireHooks` helper 抽出,五处复用。

## 3. Core Tool / 核心工具

- [x] 3.1 `core-coding-tools/src/shared/ids.ts` 加 `hookList`。
- [x] 3.2 新建 `tools/hook-list/index.ts`:调用 `deps.hooks.listHooks(point?)`;`ExtendedCoreCodingToolsDependencies.hooks?` 可选。
- [x] 3.3 `registerCoreCodingTools`/`registerCoreCodingToolsForRuntime` 透传 `hooks`。
- [x] 3.4 `tools/hook-list/` 加进 `coreToolDefinitions`。

## 4. CLI User Hooks / CLI 用户钩子

- [x] 4.1 `@deepseek/runtime/src/user-hooks.ts` 新增 `loadUserHooks(workspaceRoot, deps, platform)`:读 `<workspaceRoot>/.deepseek/hooks.json`,对每项构造 `HookHandler`(子进程 spawn + JSON stdio);读失败静默降级。放在 `@deepseek/runtime` 里避开 CLI 直接调 `hooks.registerHook` 的 governed-execution lint。
- [x] 4.2 `createCliAgentRuntime` 构造 deps 后、`registerRuntimeCoreTools` 之前调 `loadUserHooks`,`console.warn` 吞 error。

## 5. Spec Deltas / 规范增量

- [x] 5.1 `hook-system` spec 加 Requirement:Runtime Fires Canonical Hook Lifecycle Points(5 个 scenario:五点触发 + 三种 block 语义 + observe-only failure)。
- [x] 5.2 `runtime-event-loop` spec 加 Requirement:Runtime Invokes Lifecycle Hooks(同样 5 个 scenario)。

## 6. Tests / 测试

- [x] 6.1 `tests/contracts/hook-wiring.test.ts` 5 case 全绿:observation 五点触发、tool-execution block 拒绝工具 + 继续 loop、user-input block 杀 turn、model-call block emit `model.blocked`、continue 策略失败不影响 turn。
- [x] 6.2 `tests/integration/hook-user-file-loading.test.ts` 2 case:`.deepseek/hooks.json` 注册 user hook 被正确调用、缺失静默降级。
- [x] 6.3 `scripts/hook-stub.mjs` 最小 hook 子进程 fixture。
- [x] 6.4 全量 `npm test` 307 pass + 4 skip 零回归。更新 `runtime.test.ts`、`tests/e2e/headless-cli-and-vscode.test.ts`、`tests/golden/live-tool-execution-replay.test.ts`、`tests/golden/minimal-chat-cli-replay.test.ts`、`tests/contracts/core-coding-tools-contracts.test.ts` 的事件顺序断言。

## 7. Docs / 文档

- [x] 7.1 `docs/development/testing-and-acceptance.md` 新增「Hooks / 钩子」小节。

## 8. Verification / 验证

- [x] 8.1 `npm run typecheck`。
- [x] 8.2 `npm run lint`(240 files / 16 rules)。
- [x] 8.3 `node scripts/check-boundaries.mjs`(27 packages)。
- [x] 8.4 `npm test`(307 pass + 4 skip)。
- [x] 8.5 `npm run smoke:live:e2e`(env-gated)。
- [x] 8.6 刷新 `tests/acceptance/latest/`。
- [x] 8.7 `openspec validate wire-hook-invocations-into-runtime --strict` + `openspec validate --specs --strict`。
