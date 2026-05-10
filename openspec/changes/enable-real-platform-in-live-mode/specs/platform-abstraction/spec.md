## MODIFIED Requirements

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
