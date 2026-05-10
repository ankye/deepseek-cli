## Why

`deepseek run --live` and `deepseek chat --live` today swap only the `models` dependency into a real `DeepSeekOpenAIProvider`; every other runtime dependency still comes from `createDeterministicRuntimeDependencies()`, which injects `FakePlatformRuntime`. The fake platform keeps its own in-memory filesystem, so a live DeepSeek tool call like `core.file.read { path: "README.md" }` always resolves against `/workspace/README.md` in the fake FS, never the user's real repository. Real file reads fail with `Fake file not found: D:/work/deepseek-cli/README.md`, the runtime emits `agent.loop.failed`, and the CLI's primary "live coding agent" promise does not hold.

当前 `deepseek run --live` 与 `deepseek chat --live` 只把 `models` 换成真实的 `DeepSeekOpenAIProvider`，其它 runtime 依赖仍然来自 `createDeterministicRuntimeDependencies()`，里面装的是 `FakePlatformRuntime`。Fake platform 维护自己的内存文件系统，所以 live DeepSeek 工具调用 `core.file.read { path: "README.md" }` 永远解析到 fake FS 里的 `/workspace/README.md`，而不是用户真实仓库。真实文件读取会失败 `Fake file not found`，runtime 发出 `agent.loop.failed`，CLI 的"live coding agent"核心承诺无法兑现。

## What Changes

- Add a dedicated `createLiveCliDependencies` factory that composes live `NodePlatformRuntime`, a real-FS–backed `InMemoryWorkspaceStateManager`, and the real-platform `DeterministicCodeIntelligenceService` alongside the live `DeepSeekOpenAIProvider`. Keep bus, workflow, scheduler, sessions, policy, sandbox, usage, context, hooks, skills, MCP, plugins, capability registry, observability, and regression as deterministic defaults because the live promise is about real filesystem and a real model, not multi-process kernel state.
- Change `createCliAgentRuntime` in `src/apps/cli/src/index.ts` to call the live factory when `options.live` is true, and keep the existing deterministic factory when live is false.
- Extend the gated live tool smoke test and add a new deterministic e2e that runs against `tests/fixtures/fake-workspace/` via the real `NodePlatformRuntime`, proving that `core.file.read`, `core.file.list`, and `core.file.edit` resolve against the real filesystem rather than the fake one.
- Document the new live dependency surface, the remaining deterministic defaults, and the new gated `DEEPSEEK_LIVE_E2E_TESTS=1` script for operators.
- No breaking changes to deterministic callers (tests, tools-smoke, headless runtime). The deterministic factory stays as-is; live is an opt-in additive factory.

- 新增 `createLiveCliDependencies` factory，组合真实的 `NodePlatformRuntime`、基于真实 FS 的 `InMemoryWorkspaceStateManager` 和真实平台驱动的 `DeterministicCodeIntelligenceService`，与 live `DeepSeekOpenAIProvider` 搭配。其它依赖（bus、workflow、scheduler、sessions、policy、sandbox、usage、context、hooks、skills、MCP、plugins、capability registry、observability、regression）保留 deterministic 默认值，因为 live 承诺聚焦真实文件系统 + 真实模型，不是多进程 kernel 状态。
- 在 `src/apps/cli/src/index.ts` 的 `createCliAgentRuntime` 中，当 `options.live` 为 true 时调用 live factory；false 时保持现有 deterministic factory。
- 扩展 gated live tool smoke test，并新增一个 deterministic e2e，利用真实 `NodePlatformRuntime` 针对 `tests/fixtures/fake-workspace/` 运行，证明 `core.file.read`、`core.file.list`、`core.file.edit` 都解析到真实文件系统。
- 文档更新 live 依赖面、保留 deterministic 的依赖清单、以及新 gated `DEEPSEEK_LIVE_E2E_TESTS=1` 脚本。
- 对 deterministic 调用方（tests、tools-smoke、headless runtime）零破坏改动。deterministic factory 保持原样；live 是 opt-in 附加 factory。

## Capabilities

### Modified Capabilities

- `platform-abstraction`: Require live CLI runs to project `NodePlatformRuntime` instead of `FakePlatformRuntime`, including real filesystem read/write/list, real process resolution, and real shell resolution gated by platform descriptor.
- `command-system`: Require the CLI `run` and `chat` commands under `--live` to wire the live platform-backed dependency bundle so model tool intents reach real workspace state.

## Impact

- `src/apps/cli/src/index.ts`: new live factory and conditional wiring.
- `src/packages/testing-regression/src/fakes/index.ts`: expose a minimal live dependency factory helper that live hosts (CLI, future VSCode) can compose against without reconstructing every fake.
- `tests/e2e/`: new deterministic real-FS e2e driving the CLI against `tests/fixtures/fake-workspace/` via the live factory.
- `tests/live/deepseek-agent-tool-live-smoke.test.ts`: tighten the gated assertion so it asserts a non-`Fake file not found` tool result.
- `docs/development/testing-and-acceptance.md`: document the new live dependency contract and the new smoke script.
- `package.json`: add `smoke:live:e2e` wiring.
