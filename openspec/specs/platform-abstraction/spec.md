# platform-abstraction Specification

## Purpose
Define platform abstraction requirements for host-neutral filesystem, process, shell, environment, placeholder adapters, and deterministic fakes.

定义 platform abstraction 对 host-neutral filesystem、process、shell、environment、placeholder adapters 与 deterministic fakes 的要求。

## Requirements
### Requirement: Platform Runtime Contract

The platform runtime SHALL expose filesystem, process, shell, search, secure-storage, watcher, and descriptor primitives through a single `PlatformRuntime` interface, and hosts running against live model providers SHALL bind a real host-backed `PlatformRuntime` so runtime capability execution touches the real filesystem and real process providers rather than a fake in-memory filesystem.

平台运行时必须通过统一的 `PlatformRuntime` 接口暴露 filesystem、process、shell、search、secure storage、watcher 和 descriptor 原语；运行 live model provider 的 host 必须绑定真实 host-backed `PlatformRuntime`，让 runtime capability 执行落到真实文件系统和真实 process provider 上，而不是 fake 内存文件系统。

#### Scenario: Live host binds real platform runtime / Live host 绑定真实平台运行时

- **WHEN** a host wires runtime dependencies for a live model provider run
- **THEN** the `platform`, `workspaceState`, and `codeIntelligence` dependencies all construct against a `NodePlatformRuntime` or equivalent real-host implementation, not against `FakePlatformRuntime`
- **中文** 当 host 为 live model provider 线路组装 runtime 依赖时，`platform`、`workspaceState` 和 `codeIntelligence` 必须全部基于 `NodePlatformRuntime` 或等价真实 host 实现构造，不得基于 `FakePlatformRuntime`。

#### Scenario: Real platform read/write/list touches real filesystem / 真实平台读写列表落到真实文件系统

- **WHEN** a runtime capability invokes `platform.readFile`, `platform.writeFile`, or `platform.listDirectory` while bound to a real platform runtime
- **THEN** the operation targets the real host filesystem rooted at the workspace path, and a missing real file returns a typed platform error rather than a fake-filesystem error string
- **中文** 当 runtime capability 在真实 platform runtime 下调用 `platform.readFile`、`platform.writeFile` 或 `platform.listDirectory` 时，操作必须落到以 workspace 为根的真实 host 文件系统，且缺失的真实文件必须返回 typed platform error，不得返回 fake 文件系统错误字符串。

### Requirement: Semantic Command Resolution

The platform layer SHALL expose semantic operations such as `searchText`, `findFiles`, and `runProcess` so upper layers do not hardcode platform-specific commands.

platform layer 必须暴露 `searchText`、`findFiles` 和 `runProcess` 等语义化操作，避免上层硬编码平台相关命令。

#### Scenario: Text search on Windows without grep

- **WHEN** upper layers request `searchText` on Windows
- **THEN** the command resolver uses `rg` when available
- **AND** otherwise can use PowerShell `Select-String` or a deterministic JavaScript fallback
- **AND** upper layers do not call `grep` directly

#### Scenario: Text search on Unix-like systems

- **WHEN** upper layers request `searchText` on macOS or Linux
- **THEN** the command resolver uses `rg` when available
- **AND** otherwise can use POSIX `grep` or a deterministic JavaScript fallback

#### Scenario: File discovery uses fallback chain

- **WHEN** upper layers request `findFiles`
- **THEN** the command resolver can use `rg --files`, a platform directory walker, or a deterministic fallback according to availability and policy

### Requirement: Safe Process Invocation

The platform layer SHALL prefer argv-array process execution and SHALL require explicit shell profile selection when shell semantics are needed.

platform layer 必须优先使用 argv-array process execution；只有明确需要 shell semantics 时才选择 shell profile。

#### Scenario: Run process without shell string composition

- **WHEN** a capability executor runs a command with executable and arguments
- **THEN** the platform process runner receives executable and argv separately
- **AND** it does not require shell string concatenation

#### Scenario: Shell execution declares shell profile

- **WHEN** a capability requires shell syntax such as pipes, redirects, or command expansion
- **THEN** it declares the requested shell profile and policy metadata before execution

### Requirement: Cross-Platform Path and Filesystem Semantics

The platform layer SHALL normalize path, newline, executable bit, symlink, case sensitivity, file metadata, and workspace root behavior behind shared contracts.

platform layer 必须通过共享 contracts 统一 path、newline、executable bit、symlink、case sensitivity、file metadata 和 workspace root behavior。

#### Scenario: Normalize workspace path

- **WHEN** upper layers provide a workspace-relative or absolute path
- **THEN** the path adapter resolves it according to the active platform and workspace root policy

#### Scenario: Report filesystem capability

- **WHEN** a platform does not support a filesystem feature consistently
- **THEN** the platform adapter reports the capability or limitation through structured availability metadata

### Requirement: Capability Availability Reporting

The platform layer SHALL report command availability, fallback decisions, shell availability, filesystem limitations, and platform feature flags to policy, audit, and runtime metadata.

platform layer 必须把 command availability、fallback decisions、shell availability、filesystem limitations 和 platform feature flags 报告给 policy、audit 和 runtime metadata。

#### Scenario: Record fallback decision

- **WHEN** `searchText` falls back from `rg` to another implementation
- **THEN** the fallback reason and selected implementation are available for runtime events or audit records

#### Scenario: Deny unavailable command

- **WHEN** a requested platform command is unavailable and no allowed fallback exists
- **THEN** the platform layer returns a structured unavailable error instead of executing an unsafe substitute

### Requirement: Host and Sandbox Integration

CLI, VSCode, capability executors, and sandbox adapters SHALL use platform contracts for host behavior and platform-specific execution instead of duplicating OS branches.

CLI、VSCode、capability executors 和 sandbox adapters 必须通过 platform contracts 处理 host behavior 和平台相关执行，不能重复实现 OS branches。

#### Scenario: CLI uses platform host metadata

- **WHEN** the CLI initializes a runtime
- **THEN** it passes cwd, environment, terminal capability, signal behavior, and platform adapter metadata through shared contracts

#### Scenario: Sandbox uses platform adapter

- **WHEN** sandbox execution needs process or filesystem behavior
- **THEN** it delegates platform-specific execution details to the platform adapter while enforcing sandbox policy

### Requirement: Tool Input Platform Normalization

The platform abstraction layer SHALL provide deterministic helpers for normalizing model-produced tool inputs that contain paths, command names, search engines, shell assumptions, or platform-dependent syntax.

platform abstraction layer 必须提供 deterministic helpers，用于归一化 model-produced tool inputs 中的 paths、command names、search engines、shell assumptions 或 platform-dependent syntax。

#### Scenario: Normalize path for active platform

- **WHEN** preflight receives a workspace-relative path from a model tool call
- **THEN** the platform layer can normalize separators, remove harmless prefixes, resolve against workspace root, and report whether the result stays inside the workspace

#### Scenario: Prefer semantic operations over shell commands

- **WHEN** a model tool call asks for grep-like search, file discovery, or process execution
- **THEN** preflight can map it to semantic platform operations such as `searchText`, `findFiles`, or argv-array `runProcess` instead of preserving platform-specific shell syntax

#### Scenario: Report unavailable platform feature

- **WHEN** a normalized tool input depends on unavailable platform behavior and no safe fallback exists
- **THEN** the platform layer returns structured diagnostics so preflight can reject before execution

### Requirement: Readiness Platform Checks / 可用性平台检查

The platform abstraction layer SHALL expose deterministic readiness checks for Node version, OS metadata, cwd/workspace accessibility, command availability, path behavior, and ignored local files.

platform abstraction layer 必须暴露 deterministic readiness checks，覆盖 Node version、OS metadata、cwd/workspace accessibility、command availability、path behavior 和 ignored local files。

#### Scenario: Platform readiness is structured / 平台可用性结构化

- **WHEN** doctor or verify-install requests platform readiness
- **THEN** the platform layer returns structured check results with stable ids, severity, metadata, and suggested actions
- **中文** 当 doctor 或 verify-install 请求 platform readiness 时，platform layer 必须返回带 stable ids、severity、metadata 和 suggested actions 的 structured check results。

#### Scenario: Command availability uses platform resolver / 命令可用性使用平台 resolver

- **WHEN** readiness checks validate commands such as node, npm, git, or rg
- **THEN** they use platform command resolution and report fallback decisions rather than hardcoding OS-specific shell commands
- **中文** 当 readiness checks 校验 node、npm、git 或 rg 等命令时，必须使用 platform command resolution 并报告 fallback decisions，而不是硬编码 OS-specific shell commands。

### Requirement: Config And Credential Path Semantics / 配置与凭证路径语义

The platform abstraction layer SHALL expose cross-platform user config paths, workspace metadata paths, path normalization, file permission metadata, and atomic write behavior for config and credential-adjacent persistence.

platform abstraction layer 必须为 config 和 credential-adjacent persistence 暴露跨平台 user config paths、workspace metadata paths、path normalization、file permission metadata 和 atomic write behavior。

#### Scenario: User config path is platform-aware / 用户配置路径感知平台

- **WHEN** config requests the user-level DeepSeek config location
- **THEN** platform-abstraction returns a normalized path appropriate for Windows, macOS, Linux, or fake test adapters and includes source metadata for diagnostics
- **中文** 当 config 请求 user-level DeepSeek config location 时，platform-abstraction 必须返回适用于 Windows、macOS、Linux 或 fake test adapters 的 normalized path，并包含用于 diagnostics 的 source metadata。

#### Scenario: Workspace metadata path stays inside workspace / workspace 元数据路径留在 workspace 内

- **WHEN** readiness or config requests the workspace metadata path
- **THEN** platform-abstraction resolves it inside the active workspace root and rejects traversal, ambiguous drive-relative paths, home-relative expansion, or paths outside the workspace
- **中文** 当 readiness 或 config 请求 workspace metadata path 时，platform-abstraction 必须把它解析到 active workspace root 内，并拒绝 traversal、ambiguous drive-relative paths、home-relative expansion 或 workspace 外路径。

### Requirement: Atomic Local Persistence / 原子本地持久化

The platform abstraction layer SHALL provide atomic local persistence primitives for non-secret config and metadata files with deterministic fake behavior for tests.

platform abstraction layer 必须为 non-secret config 和 metadata files 提供 atomic local persistence primitives，并为 tests 提供 deterministic fake behavior。

#### Scenario: Atomic write avoids partial documents / 原子写避免部分文档

- **WHEN** a config or metadata write fails midway
- **THEN** platform-abstraction preserves the previous valid document or returns a structured failure without leaving a partially written target
- **中文** 当 config 或 metadata write 中途失败时，platform-abstraction 必须保留之前的 valid document，或返回 structured failure，且不得留下 partially written target。

#### Scenario: Permission diagnostics are structured / 权限诊断结构化

- **WHEN** platform-abstraction detects unsupported permission hardening, read-only files, inaccessible directories, or insecure local fallback storage
- **THEN** it returns structured diagnostics with platform id, path metadata, severity, redaction metadata, and suggested actions
- **中文** 当 platform-abstraction 检测到 unsupported permission hardening、read-only files、inaccessible directories 或 insecure local fallback storage 时，必须返回包含 platform id、path metadata、severity、redaction metadata 和 suggested actions 的 structured diagnostics。

### Requirement: Platform Descriptor Contract / 平台描述符契约

The platform abstraction layer SHALL expose a platform descriptor containing OS family, environment kind, architecture, shell availability, search providers, secure-storage status, native capability probes, filesystem semantics, and degraded-mode flags.

platform abstraction layer 必须暴露 platform descriptor，包含 OS family、environment kind、architecture、shell availability、search providers、secure-storage status、native capability probes、filesystem semantics 和 degraded-mode flags。

#### Scenario: Descriptor is host-neutral / 描述符 host-neutral

- **WHEN** CLI, VSCode, server, or tests request platform metadata
- **THEN** they receive the same descriptor shape and do not duplicate OS detection logic
- **中文** 当 CLI、VSCode、server 或 tests 请求 platform metadata 时，它们必须收到同一 descriptor shape，且不得重复实现 OS detection logic。

### Requirement: Explicit Shell Provider Selection / 显式 Shell Provider 选择

The platform abstraction layer SHALL require explicit shell provider selection for shell-syntax execution and SHALL keep argv-array process execution as the default.

platform abstraction layer 必须在 shell-syntax execution 场景中要求显式 shell provider selection，并把 argv-array process execution 保持为默认路径。

#### Scenario: Shell profile is declared / Shell profile 被声明

- **WHEN** a capability requires pipes, redirects, expansion, shell history, or shell-specific syntax
- **THEN** it declares a shell profile and policy context before execution
- **中文** 当 capability 需要 pipes、redirects、expansion、shell history 或 shell-specific syntax 时，必须在执行前声明 shell profile 和 policy context。

### Requirement: Provider Result Metadata / Provider 结果元数据

Platform provider operations SHALL return selected provider, fallback reason, timeout policy, and degraded-mode metadata for audit, readiness, and regression tests.

Platform provider operations 必须返回 selected provider、fallback reason、timeout policy 和 degraded-mode metadata，用于 audit、readiness 和 regression tests。

#### Scenario: Fallback is observable / Fallback 可观测

- **WHEN** search falls back from `rg` to PowerShell, POSIX grep, or JavaScript scanning
- **THEN** the selected provider and fallback reason are present in the result metadata
- **中文** 当 search 从 `rg` fallback 到 PowerShell、POSIX grep 或 JavaScript scanning 时，result metadata 必须包含 selected provider 和 fallback reason。

### Requirement: Sandbox Capability Descriptor / Sandbox Capability Descriptor

The platform abstraction SHALL expose deterministic sandbox capability metadata for filesystem, process, shell, network, environment, native, secure storage, and degraded host state.

platform abstraction 必须为 filesystem、process、shell、network、environment、native、secure storage 和 degraded host state 暴露 deterministic sandbox capability metadata。

#### Scenario: Fake platform declares unavailable shell / Fake Platform 声明 Shell 不可用

- **WHEN** a fake remote/no-local-shell platform is used in tests
- **THEN** platform metadata declares shell unavailable and policy can deny or rewrite shell-dependent invocations deterministically
- **中文** 当 tests 使用 fake remote/no-local-shell platform 时，platform metadata 必须声明 shell unavailable，policy 可以确定性 deny 或 rewrite shell-dependent invocations。

#### Scenario: Read-only filesystem is visible to policy / 只读文件系统对 Policy 可见

- **WHEN** a fake or real platform reports read-only workspace state
- **THEN** policy receives that metadata before allowing filesystem write invocations
- **中文** 当 fake 或 real platform 报告 read-only workspace state 时，policy 必须在允许 filesystem write invocations 前收到该 metadata。

### Requirement: Placeholder Platform Implementations / 占位平台实现

The `@deepseek/platform-abstraction` package SHALL expose deterministic placeholder implementations of the `PluginManager`, `ExtensionManager`, `EvolutionEngine`, `RemoteRuntimeConnectivity`, and `DistributionUpdateManager` platform contracts so that runtime assembly, testing harnesses, and future host adapters can compose a fully-populated `RuntimeDependencies` without depending on standalone stub packages.

`@deepseek/platform-abstraction` 包必须提供 `PluginManager`、`ExtensionManager`、`EvolutionEngine`、`RemoteRuntimeConnectivity`、`DistributionUpdateManager` 五个平台契约的确定性占位实现，使 runtime 组装、测试夹具、未来的 host adapter 都能组出完整的 `RuntimeDependencies`，而不需要依赖独立的 stub 包。

#### Scenario: Default platform placeholders are importable from platform-abstraction

- **WHEN** consumer code imports `InMemoryPluginManager`, `InMemoryExtensionManager`, `InMemoryEvolutionEngine`, `NoopRemoteRuntimeConnectivity`, or `StaticDistributionUpdateManager`
- **THEN** the import resolves from `@deepseek/platform-abstraction` and returns a class whose runtime behavior matches the prior standalone package exports, preserving method signatures, return values, and redaction characteristics
- **中文** 当消费代码 import `InMemoryPluginManager`、`InMemoryExtensionManager`、`InMemoryEvolutionEngine`、`NoopRemoteRuntimeConnectivity`、`StaticDistributionUpdateManager` 中任一符号时，必须从 `@deepseek/platform-abstraction` 解析得到类，其运行时行为、方法签名、返回值、redaction 特性与合并前的独立包导出保持一致。

#### Scenario: Placeholders do not shadow real platform providers

- **WHEN** a consumer wires `RuntimeDependencies` using `NodePlatformRuntime` or another non-placeholder platform provider from `@deepseek/platform-abstraction`
- **THEN** the placeholders for `PluginManager`, `ExtensionManager`, `EvolutionEngine`, `RemoteRuntimeConnectivity`, and `DistributionUpdateManager` are supplied only when the consumer explicitly instantiates them; nothing in `platform-abstraction` auto-installs the placeholders over a caller-provided implementation
- **中文** 当消费者使用 `NodePlatformRuntime` 或 `platform-abstraction` 的其他非占位 provider 组装 `RuntimeDependencies` 时，五个占位实现仅在消费者显式实例化时提供；`platform-abstraction` 不得自动用占位覆盖调用者已传入的实现。

#### Scenario: Public surface preserves the contracts unchanged

- **WHEN** downstream code relies on the `PluginManager`, `ExtensionManager`, `EvolutionEngine`, `RemoteRuntimeConnectivity`, or `DistributionUpdateManager` interfaces
- **THEN** consolidation does not alter the shape of those interfaces in `@deepseek/platform-contracts`; only the implementation location changes, and the interfaces remain the normative contract
- **中文** 当下游代码依赖 `PluginManager`、`ExtensionManager`、`EvolutionEngine`、`RemoteRuntimeConnectivity`、`DistributionUpdateManager` 任一接口时，合并不得改变 `@deepseek/platform-contracts` 中这些接口的形状；仅实现位置变化，接口仍是规范契约。

### Requirement: Path Canonicalization Pit Fixtures / 路径规范化坑位 Fixtures

Platform path resolution SHALL include deterministic negative fixtures for cross-platform path canonicalization bypass classes.

platform path resolution 必须包含针对跨平台 path canonicalization 绕过类别的确定性负向 fixtures。

#### Scenario: Unsafe path syntaxes are rejected / 不安全路径语法被拒绝

- **WHEN** workspace path resolution receives home expansion, null bytes, drive-relative paths, UNC paths, trailing dot or space variants, shell expansion syntax, or glob-like write targets
- **THEN** the platform rejects the path with a typed redacted error before filesystem mutation
- **中文** 当 workspace path resolution 收到 home expansion、null bytes、drive-relative paths、UNC paths、trailing dot 或 space 变体、shell expansion syntax 或 glob-like write targets 时，platform 必须在 filesystem mutation 前用类型化脱敏错误拒绝该路径。

#### Scenario: Safe relative paths remain accepted / 安全相对路径保持可用

- **WHEN** workspace path resolution receives a normal relative path inside the governed workspace root
- **THEN** the platform returns a safe resolved path with root, relative path, diagnostics, and redaction metadata
- **中文** 当 workspace path resolution 收到位于 governed workspace root 内的正常相对路径时，platform 必须返回包含 root、relative path、diagnostics 和 redaction metadata 的 safe resolved path。
