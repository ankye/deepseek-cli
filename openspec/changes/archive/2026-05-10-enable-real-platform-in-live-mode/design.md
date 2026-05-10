## Context

`enable-live-agent-tool-execution` landed the tool-call loop, typed feedback DTOs, read-only projection, preflight hardening, and a gated live smoke. A real live run against the DeepSeek API then surfaced two production blockers in quick succession:

1. Tool schema names used dots (`core.file.read`) which the OpenAI chat-completions API rejected with a 400. Fixed in commit `7c45943` via `toSafeToolName`/`resolveCapabilityId`.
2. Under `--live`, the CLI still injected `FakePlatformRuntime`, so every model tool call read and wrote against an in-memory `/workspace` that shared no data with the user's real filesystem. The loop completes, but every file-touching tool returns `Fake file not found`, and the user sees `agent.loop.failed`.

The first issue was caught by running the live check once; the second was caught immediately after. Both show that "live = deterministic deps + real model" is not a useful product surface. Live must mean live at the platform boundary, not just at the provider boundary.

`enable-live-agent-tool-execution` 已落地工具调用循环、typed feedback DTO、read-only projection、preflight 强化和 gated live smoke。真实 live 跑 DeepSeek API 立刻暴露两个生产阻塞点：

1. Tool schema 名字带点（`core.file.read`）被 OpenAI chat-completions API 400 拒绝。已在 commit `7c45943` 通过 `toSafeToolName` / `resolveCapabilityId` 修复。
2. `--live` 下 CLI 仍然注入 `FakePlatformRuntime`，导致每次模型工具调用都在内存 `/workspace` 中读写，和用户真实文件系统没有任何共享。Loop 会完成，但任何触文件工具都返回 `Fake file not found`，用户看到 `agent.loop.failed`。

第一个跑一次 live 就暴露了；第二个紧跟着暴露。这两个问题都说明"live = deterministic deps + real model"不是有用的产品面。Live 必须在 platform 边界也 live，不仅仅是 provider 边界。

## Goals / Non-Goals

**Goals:**

- `deepseek run --live` and `deepseek chat --live` use the real Node.js filesystem, process provider, shell, and workspace metadata path for tool execution.
- The deterministic factory stays unchanged so unit, contract, integration, golden, matrix, and e2e suites keep their current behavior.
- Live and deterministic dependency factories live in one place (`@deepseek/testing-regression/fakes` or a sibling helper) so future hosts (VSCode extension, future server) do not reconstruct the wiring.
- Regression evidence covers a real-FS tool turn end-to-end under deterministic models plus the existing gated live smoke.
- Failure to resolve real filesystem paths surfaces as typed tool feedback with status `failed` and diagnostics, not as a surprising `Fake file not found` string.

- `deepseek run --live` 与 `deepseek chat --live` 在工具执行时使用真实 Node.js 文件系统、process provider、shell 和 workspace metadata path。
- Deterministic factory 保持不变，unit、contract、integration、golden、matrix 和 e2e 套件行为不变。
- Live 与 deterministic 依赖 factory 都集中在一处（`@deepseek/testing-regression/fakes` 或兄弟 helper），未来 host（VSCode extension、server）不用重新搭线。
- 回归证据覆盖一次 deterministic model 驱动的真实 FS 工具回合端到端，以及原有 gated live smoke。
- 真实文件系统路径解析失败时，必须以 typed tool feedback（status `failed` + diagnostics）呈现，而不是神秘的 `Fake file not found` 字符串。

**Non-Goals:**

- Do not swap `bus`, `workflow`, `scheduler`, `sessions`, `policy`, `sandbox`, `usage`, `context`, `hooks`, `skills`, `mcp`, `plugins`, `capabilities`, `observability`, or `regression` into alternate live implementations; these stay deterministic because the live surface under this change is filesystem + real model, not multi-process kernel state.
- Do not introduce a daemon or background server; live runs are still in-process.
- Do not persist sessions across CLI invocations. Session persistence is a separate concern.
- Do not add new CLI flags beyond the existing `--live`. The live dependency bundle is the side effect of `--live`; no second switch.
- Do not unify deterministic and live factories into a single configurable one yet. Keep them as two explicit factories so live-specific bugs stay easy to spot in diff.

- 不替换 `bus`、`workflow`、`scheduler`、`sessions`、`policy`、`sandbox`、`usage`、`context`、`hooks`、`skills`、`mcp`、`plugins`、`capabilities`、`observability`、`regression`；这次的 live 面是 filesystem + real model，不是多进程 kernel state。
- 不引入 daemon 或后台 server；live 仍是进程内。
- 不跨 CLI 调用持久化 session，session 持久化是另一条 concern。
- 不新增 `--live` 之外的 CLI flag。live 依赖束是 `--live` 的副作用；不搞第二个开关。
- 暂不把 deterministic 和 live factory 合并成一个可配置的；保留两个显式 factory，这样 live 特有 bug 在 diff 中一眼可见。

## Architecture

```text
CLI (--live)
        |
        v
createCliAgentRuntime
        |
        v
createLiveCliDependencies(workspaceRoot)
        |
        +--- platform     = new NodePlatformRuntime()
        +--- workspaceState = new InMemoryWorkspaceStateManager(platform)
        +--- codeIntelligence = new DeterministicCodeIntelligenceService(platform)
        +--- models       = new DeepSeekOpenAIProvider(...)
        +--- (all other deps = createDeterministicRuntimeDependencies())
        |
        v
runAgentLoop (runtime)
        |
        v
kernel.execute -> capability binding -> deps.platform.readFile(real FS)
```

```text
CLI (no --live)
        |
        v
createCliAgentRuntime
        |
        v
createDeterministicRuntimeDependencies()   (unchanged)
```

## Decisions

### Decision 1: Replace only platform-adjacent dependencies in live mode

Live swaps three dependencies: `platform`, `workspaceState`, and `codeIntelligence`. `workspaceState` and `codeIntelligence` both construct against a `PlatformRuntime` and transitively read/write through it, so swapping only `platform` while keeping `workspaceState`/`codeIntelligence` built from the fake platform would leave them pinned to the fake filesystem. The trio must move together.

Live 只替换与 platform 相邻的三个依赖：`platform`、`workspaceState`、`codeIntelligence`。后两者构造时依赖 `PlatformRuntime` 并透过它读写，如果只换 `platform` 而保留用 fake platform 构造的 `workspaceState`/`codeIntelligence`，它们仍然钉死在 fake 文件系统。三者必须一起切换。

Rejected alternative: swap the entire dependency bundle to a "live-everything" factory. This would change deterministic behavior for bus/scheduler/sessions/etc., break existing golden replays, and introduce flakiness without product benefit. The model and the filesystem are the live surfaces users can observe; the rest are internal control-plane state.

拒绝方案：整束换成 live-everything。它会改变 bus/scheduler/sessions 等 deterministic 行为，破坏现有 golden replay，并带来 flakiness，但没有产品收益。模型和文件系统是用户能感知的 live 面，其它是内部控制平面。

### Decision 2: Place the live factory next to the deterministic factory in `@deepseek/testing-regression`

`createLiveCliDependencies` ships in `src/packages/testing-regression/src/fakes/index.ts` next to `createDeterministicRuntimeDependencies`. The name "testing-regression" is historical; the factory code has always been the single place that composes an opinionated `RuntimeDependencies` bundle, whether for tests or for hosts. Keeping both factories together means the CLI, future VSCode extension, and future server all have one import to call.

`createLiveCliDependencies` 放在 `src/packages/testing-regression/src/fakes/index.ts`，紧邻 `createDeterministicRuntimeDependencies`。package 叫 "testing-regression" 是历史名字；这个 factory 代码一直是唯一组合 `RuntimeDependencies` bundle 的地方，无论是测试还是 host。把两个 factory 放一起，CLI、未来 VSCode extension 和 future server 都只需要一次 import。

Rejected alternative: put the live factory in `src/apps/cli`. That would couple the wiring to a single host; the VSCode extension would have to rebuild it. The CLI package is the last place to stay small because it is the npm publish target.

拒绝方案：放在 `src/apps/cli` 里。那样就把 wiring 耦合到单个 host；VSCode extension 得重建一遍。CLI package 要保持最小，它是 npm 发布目标。

### Decision 3: Preserve existing lint rules

`runtime/no-testing-regression-dependency` already rejects the runtime package from importing testing-regression. That rule stays. Hosts (apps/cli, apps/vscode-extension) already import testing-regression legitimately; they continue to import it to obtain the new live factory. No lint rule changes are needed.

`runtime/no-testing-regression-dependency` 已经禁止 runtime 包 import testing-regression，保留。Host（apps/cli、apps/vscode-extension）本来就合法 import testing-regression；它们继续 import 来获得新的 live factory。不需要改 lint 规则。

### Decision 4: Leave session persistence out of this change

`sessions` stays as `InMemorySessionStore`. Persistent session storage across CLI invocations is a separate product outcome with its own threat model (secret leakage, multi-user, concurrent access) and belongs to a follow-up change, likely under R1 "session resume hardening". Live FS access is the current blocker, and shipping only that keeps this change reviewable.

`sessions` 保持 `InMemorySessionStore`。跨 CLI 调用的会话持久化是另一条产品目标，有独立威胁模型（secret leak、多用户、并发），属于后续变更（可能归入 R1 "session resume hardening"）。Live FS 访问是当前阻塞，只 ship 这一条让变更 reviewable。

## Safety Model

- The real platform uses the same policy, sandbox, and preflight path as the deterministic platform; nothing new bypasses `tool-intent-preflight` or `policy-sandbox`.
- `NodePlatformRuntime` defaults to the detected host OS, architecture, and environment kind; no override flags are exposed from the CLI today.
- File paths from model tool intents must still pass preflight (no traversal, no absolute, no home, no drive-relative, no null byte) before reaching `deps.platform.readFile` / `writeFile`.
- The live smoke assertion is tightened to reject the literal string `Fake file not found` so a future regression (wiring slipping back to the fake platform) fails the test explicitly rather than passing silently.

- 真实 platform 走与 deterministic platform 相同的 policy、sandbox 和 preflight 路径；没有新增绕过 `tool-intent-preflight` 或 `policy-sandbox` 的通道。
- `NodePlatformRuntime` 默认使用宿主 OS、架构和 environment kind；CLI 暂不暴露 override flag。
- 模型工具意图中的文件路径仍需通过 preflight（无 traversal、无 absolute、无 home、无 drive-relative、无 null byte），然后才能到达 `deps.platform.readFile` / `writeFile`。
- Live smoke 的断言收紧：如果出现字面 `Fake file not found`，测试显式失败，避免将来 wiring 回退到 fake platform 时静默通过。

## Acceptance Strategy

- Unit: deterministic factory unchanged; new live factory constructs and passes a shape check for the three swapped dependencies.
- Contract: package boundaries unaffected; existing `npm run test:contracts` stays green.
- Integration: new `tests/integration/live-factory-real-fs.test.ts` drives the CLI loop against `tests/fixtures/fake-workspace/` via the live factory but with a deterministic model gateway, proving real FS reads without requiring credentials.
- Golden: existing golden replays rely on deterministic factory and stay green; no new golden needed because this change does not alter event order.
- Matrix: existing matrix covers preflight path repair across platforms; no new matrix needed.
- E2E: extend `tests/e2e/headless-cli-and-vscode.test.ts` only if the wiring there touches `--live`; otherwise leave e2e unchanged.
- Live gated: `DEEPSEEK_LIVE_AGENT_TOOL_TESTS=1 npm run smoke:live:agent-tools` runs the live factory against the real API. Assertion is tightened.
- Acceptance evidence refreshed for typecheck, lint, boundaries, integration, and full test summary.
