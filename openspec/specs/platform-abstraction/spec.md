# platform-abstraction Specification

## Purpose
TBD - created by archiving change bootstrap-future-ready-cli-framework. Update Purpose after archive.
## Requirements
### Requirement: Platform Runtime Contract

The system SHALL define a platform abstraction layer for macOS, Windows, Linux, and fake test adapters that exposes filesystem, path, process, shell, environment, command resolution, text search, file discovery, and capability availability through shared contracts.

系统必须定义面向 macOS、Windows、Linux 和 fake test adapters 的 platform abstraction layer，通过共享 contracts 暴露 filesystem、path、process、shell、environment、command resolution、text search、file discovery 和 capability availability。

#### Scenario: Runtime receives platform dependency

- **WHEN** the runtime or a capability executor needs platform behavior
- **THEN** it receives a `PlatformRuntime` or narrower platform contract through dependency injection
- **AND** it does not branch directly on `process.platform` for core behavior

#### Scenario: Fake platform adapter supports tests

- **WHEN** tests construct runtime or capability executors
- **THEN** they can use a fake platform adapter with deterministic command availability and filesystem behavior

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

