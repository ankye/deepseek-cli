## ADDED Requirements

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
