## Why

DeepSeek CLI now has real local persistence, live verification, and a growing platform abstraction, but cross-platform differences are still represented as coarse OS branches and deterministic fallbacks. The next framework step is to make platform behavior explicit, testable, and injectable before shell execution, search, secure storage, native capabilities, and WSL-specific behavior become product-critical.

DeepSeek CLI 现在已经具备真实本地持久化、live verification 和逐步扩展的平台抽象，但跨平台差异仍主要表现为粗粒度 OS 分支和 deterministic fallback。下一步框架工作需要在 shell execution、search、secure storage、native capabilities 和 WSL 行为进入产品关键路径前，把平台行为定义成显式、可测试、可注入的能力。

## What Changes

- Add a platform capability matrix for macOS, Windows, Linux, WSL, CI, and remote/server hosts.
- 增加 macOS、Windows、Linux、WSL、CI 和 remote/server hosts 的平台能力矩阵。
- Define platform service contracts for shell provider resolution, process execution semantics, search provider selection, path translation, permission diagnostics, secure storage capability, native capability probes, and file watcher behavior.
- 定义 shell provider resolution、process execution semantics、search provider selection、path translation、permission diagnostics、secure storage capability、native capability probes 和 file watcher behavior 的平台服务契约。
- Require platform APIs to fail closed when paths, commands, credentials, or native capabilities are unsupported or unsafe.
- 要求平台 API 在 path、command、credential 或 native capability 不支持或不安全时 fail closed。
- Add deterministic fake platform matrices that cover Windows, macOS, Linux, WSL, CI/no-native, and remote/no-local-shell modes.
- 增加 deterministic fake platform matrix，覆盖 Windows、macOS、Linux、WSL、CI/no-native 和 remote/no-local-shell modes。
- Route future CLI/VSCode/server host adapters through the same platform capability discovery and diagnostics contract instead of each host building its own platform checks.
- 让未来 CLI/VSCode/server host adapters 通过同一套 platform capability discovery 和 diagnostics contract，而不是各自实现平台检查。
- Add architecture lint rules that prevent direct OS branching, direct process execution, direct search binary invocation, and direct secure-storage/native capability access outside approved platform-owner packages.
- 增加 architecture lint rules，禁止 approved platform-owner packages 之外直接 OS branching、直接 process execution、直接 search binary invocation，以及直接访问 secure-storage/native capability。

## Capabilities

### New Capabilities

- `cross-platform-runtime`: Platform capability matrix, shell/search/process/native/secure-storage abstraction contracts, and deterministic host-mode behavior.
- `cross-platform-runtime`: 平台能力矩阵、shell/search/process/native/secure-storage 抽象契约，以及 deterministic host-mode behavior。

### Modified Capabilities

- `platform-abstraction`: Extend platform runtime requirements from basic paths/process/search into explicit provider selection, WSL handling, native capability probes, secure-storage diagnostics, and fail-closed path/command behavior.
- `platform-abstraction`: 将 platform runtime requirements 从基础 path/process/search 扩展为显式 provider selection、WSL handling、native capability probes、secure-storage diagnostics 和 fail-closed path/command behavior。
- `testing-regression`: Add fake platform matrices, platform provider fixtures, and regression requirements for unsupported/degraded platform behavior.
- `testing-regression`: 增加 fake platform matrices、platform provider fixtures，以及 unsupported/degraded platform behavior 的 regression requirements。
- `policy-sandbox`: Add platform-aware process/shell execution policy checks so shell providers and native capabilities cannot bypass sandbox decisions.
- `policy-sandbox`: 增加 platform-aware process/shell execution policy checks，确保 shell providers 和 native capabilities 不能绕过 sandbox decisions。

## Impact

- Affects `@deepseek/platform-contracts`, `@deepseek/platform-abstraction`, `@deepseek/testing-regression`, `@deepseek/policy-sandbox`, CLI readiness/doctor diagnostics, architecture lint rules, and future VSCode/server host integration.
- 影响 `@deepseek/platform-contracts`、`@deepseek/platform-abstraction`、`@deepseek/testing-regression`、`@deepseek/policy-sandbox`、CLI readiness/doctor diagnostics、architecture lint rules，以及未来 VSCode/server host integration。
- No direct product UI changes are required in this change; the output is platform contracts, deterministic adapters, diagnostics, and tests.
- 本变更不要求直接产品 UI 改动；产出是 platform contracts、deterministic adapters、diagnostics 和 tests。
