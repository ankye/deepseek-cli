## Context

The project now has an explicit platform abstraction and deterministic fake adapters, but several future product areas will stress the current model: WSL path translation, PowerShell versus POSIX shell semantics, search provider selection, secure credential storage, native features such as voice/clipboard/url handlers, and remote/server hosts without a local shell.

项目现在已有明确的平台抽象和 deterministic fake adapters，但多个未来产品方向会冲击当前模型：WSL path translation、PowerShell 与 POSIX shell semantics、search provider selection、secure credential storage、voice/clipboard/url handlers 等 native features，以及没有 local shell 的 remote/server hosts。

The important lesson from the reference implementation is not to copy its code, but to avoid scattering platform decisions across product code. DeepSeek CLI should treat platform behavior as a governed capability surface with explicit contracts, diagnostics, and tests.

参考实现给我们的重点不是复制代码，而是避免平台判断散落在产品代码中。DeepSeek CLI 应把平台行为视为受治理的 capability surface，通过明确 contracts、diagnostics 和 tests 管理。

## Goals / Non-Goals

**Goals:**

- Define a platform capability matrix that includes macOS, Windows, Linux, WSL, CI/no-native, and remote/no-local-shell modes.
- 定义覆盖 macOS、Windows、Linux、WSL、CI/no-native 和 remote/no-local-shell modes 的平台能力矩阵。
- Split platform behavior into injectable providers: shell, process, search, path, filesystem metadata, secure storage, native capability probes, and file watcher.
- 把平台行为拆成可注入 providers：shell、process、search、path、filesystem metadata、secure storage、native capability probes 和 file watcher。
- Make unsupported or unsafe platform behavior fail closed with structured diagnostics.
- 让 unsupported 或 unsafe platform behavior 以 structured diagnostics fail closed。
- Add lint and tests so direct platform branching and governed primitive bypasses are caught before review.
- 增加 lint 和 tests，让 direct platform branching 和 governed primitive bypasses 在 review 前被捕获。

**Non-Goals:**

- Do not implement full OS keychain storage in this change; define the adapter contract and diagnostics first.
- 本变更不实现完整 OS keychain storage；先定义 adapter contract 和 diagnostics。
- Do not implement rich TUI shell UX, terminal setup flows, voice, clipboard, or browser/native host product features.
- 本变更不实现复杂 TUI shell UX、terminal setup flows、voice、clipboard 或 browser/native host 产品功能。
- Do not replace the runtime scheduler or policy engine; this change only makes platform inputs explicit to those systems.
- 本变更不替换 runtime scheduler 或 policy engine；只让 platform inputs 对这些系统显式可见。

## Decisions

### Decision: Platform Capability Matrix Is A First-Class Contract

Platform detection will produce a structured `PlatformDescriptor` with OS family, environment kind, shell availability, native capability availability, filesystem semantics, and degraded flags. WSL is not just Linux; it must be represented as a distinct environment kind because path translation, file IO performance, and Windows interop differ.

平台检测将输出结构化 `PlatformDescriptor`，包含 OS family、environment kind、shell availability、native capability availability、filesystem semantics 和 degraded flags。WSL 不能只当作 Linux；它必须作为独立 environment kind 表示，因为 path translation、file IO performance 和 Windows interop 不同。

Alternative considered: keep using `process.platform` plus ad hoc checks. Rejected because it forces each host and package to rediscover the same behavior.

备选方案：继续使用 `process.platform` 加零散 checks。拒绝原因是会迫使每个 host 和 package 重复发现同一平台行为。

### Decision: Semantic Providers Before Shell Commands

Search, file discovery, config path resolution, and process execution will remain semantic operations. Provider selection may choose `rg`, PowerShell `Select-String`, POSIX grep, or JavaScript fallback, but callers receive structured result metadata rather than depending on the concrete command.

Search、file discovery、config path resolution 和 process execution 继续保持语义化操作。Provider selection 可以选择 `rg`、PowerShell `Select-String`、POSIX grep 或 JavaScript fallback，但调用方接收 structured result metadata，而不是依赖具体命令。

Alternative considered: expose command templates to callers. Rejected because it leaks platform behavior upward and weakens policy/sandbox checks.

备选方案：向调用方暴露 command templates。拒绝原因是会向上泄漏平台行为，并削弱 policy/sandbox checks。

### Decision: Shell Execution Requires Explicit Shell Profile

Any operation that requires shell syntax must declare a shell profile such as `bash`, `powershell`, or `none`, plus policy metadata. The default process path remains argv-array execution with `shell: false`.

任何需要 shell syntax 的操作都必须声明 `bash`、`powershell` 或 `none` 等 shell profile，并附带 policy metadata。默认 process path 继续使用 argv-array execution 和 `shell: false`。

Alternative considered: infer shell from OS. Rejected because Windows users may use Git Bash, WSL users may require Linux shell behavior, and server hosts may have no local shell.

备选方案：从 OS 推断 shell。拒绝原因是 Windows 用户可能使用 Git Bash，WSL 用户可能需要 Linux shell 行为，server hosts 可能没有 local shell。

### Decision: Native And Secure Storage Are Capability Probes

Native features and secure storage must be exposed as capability probes with status `available`, `degraded`, or `unavailable`. Product features should consume probes and fail with actionable diagnostics instead of probing native modules directly.

Native features 和 secure storage 必须以 capability probes 暴露，状态为 `available`、`degraded` 或 `unavailable`。产品功能应消费 probes 并以 actionable diagnostics 失败，而不是直接探测 native modules。

Alternative considered: let each feature load its own native dependency. Rejected because native dependency failures are platform-specific and hard to test uniformly.

备选方案：让每个 feature 自行加载 native dependency。拒绝原因是 native dependency failures 具有平台特异性，难以统一测试。

## Risks / Trade-offs

- [Risk] More contracts before product behavior can slow feature delivery. -> Mitigation: define small provider interfaces and deterministic fakes first, then implement real providers incrementally.
- [风险] 产品行为前增加更多 contracts 可能拖慢功能交付。-> 缓解：先定义小型 provider interfaces 和 deterministic fakes，再逐步实现真实 providers。
- [Risk] Provider selection can become complex. -> Mitigation: expose selected provider and fallback reason in every result for audit and tests.
- [风险] Provider selection 可能变复杂。-> 缓解：每个 result 都暴露 selected provider 和 fallback reason，用于 audit 和 tests。
- [Risk] Remote/server hosts may not map cleanly to local platform assumptions. -> Mitigation: include `remote/no-local-shell` as a first-class matrix mode from the start.
- [风险] Remote/server hosts 可能无法套用 local platform assumptions。-> 缓解：从一开始把 `remote/no-local-shell` 作为一等 matrix mode。

## Migration Plan

1. Add platform descriptor, provider result metadata, shell/search/process/path/native/secure-storage contracts.
2. Extend `NodePlatformRuntime` and fake adapters to report capability matrix and fail-closed diagnostics.
3. Add matrix fixtures for macOS, Windows, Linux, WSL, CI/no-native, and remote/no-local-shell.
4. Add lint rules for direct OS branching and direct platform primitive access outside platform owner packages.
5. Update readiness/doctor to report platform matrix and fallback diagnostics.

迁移计划：

1. 增加 platform descriptor、provider result metadata、shell/search/process/path/native/secure-storage contracts。
2. 扩展 `NodePlatformRuntime` 和 fake adapters，报告 capability matrix 和 fail-closed diagnostics。
3. 增加 macOS、Windows、Linux、WSL、CI/no-native 和 remote/no-local-shell matrix fixtures。
4. 增加 lint rules，禁止 platform owner packages 之外 direct OS branching 和 direct platform primitive access。
5. 更新 readiness/doctor，报告 platform matrix 和 fallback diagnostics。

## Open Questions

- Should the first real secure-storage provider use OS keychain directly or stay environment-only until a dedicated auth storage change?
- 第一版真实 secure-storage provider 应直接使用 OS keychain，还是在专门 auth storage change 前保持 environment-only？
- Should WSL be represented as `os: linux` plus `environmentKind: wsl`, or as a separate OS family?
- WSL 应表示为 `os: linux` 加 `environmentKind: wsl`，还是独立 OS family？
