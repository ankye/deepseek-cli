# cross-platform-runtime Specification

## Purpose

Define the platform capability matrix and semantic provider contracts that make DeepSeek CLI deterministic across macOS, Windows, Linux, WSL, CI/no-native, and remote/no-local-shell hosts.

定义平台能力矩阵与语义化 provider 契约，使 DeepSeek CLI 在 macOS、Windows、Linux、WSL、CI/no-native 和 remote/no-local-shell hosts 上保持确定性。

## Requirements

### Requirement: Platform Capability Matrix / 平台能力矩阵

The system SHALL define a first-class platform capability matrix for local macOS, local Windows, local Linux, WSL, CI/no-native, and remote/no-local-shell execution environments.

系统必须为 local macOS、local Windows、local Linux、WSL、CI/no-native 和 remote/no-local-shell execution environments 定义一等 platform capability matrix。

#### Scenario: WSL is represented distinctly / WSL 被独立表示

- **WHEN** platform detection runs inside WSL
- **THEN** the platform descriptor records Linux OS compatibility and WSL environment semantics separately
- **AND** path translation, search timeout, and Windows interop behavior can be tested independently
- **中文** 当 platform detection 在 WSL 内运行时，platform descriptor 必须分别记录 Linux OS compatibility 和 WSL environment semantics，并允许 path translation、search timeout 和 Windows interop behavior 独立测试。

#### Scenario: Remote host has no local shell / 远程 host 无本地 shell

- **WHEN** a server or remote runtime host does not expose a local shell
- **THEN** the platform matrix marks shell execution unavailable and returns structured diagnostics for shell-dependent capabilities
- **中文** 当 server 或 remote runtime host 不暴露 local shell 时，platform matrix 必须标记 shell execution unavailable，并为依赖 shell 的 capabilities 返回 structured diagnostics。

### Requirement: Semantic Platform Providers / 语义化平台 Provider

The system SHALL expose shell, process, search, path, filesystem metadata, secure storage, native capability, and file watcher behavior through semantic platform providers instead of direct OS-specific calls from upper layers.

系统必须通过语义化 platform providers 暴露 shell、process、search、path、filesystem metadata、secure storage、native capability 和 file watcher behavior，而不是让上层直接调用 OS-specific APIs。

#### Scenario: Search provider selection is reported / Search provider selection 被报告

- **WHEN** text search runs on any supported platform
- **THEN** the result records the selected provider, fallback chain, timeout policy, and degradation reason when applicable
- **中文** 当 text search 在任意支持平台运行时，结果必须记录 selected provider、fallback chain、timeout policy 和适用时的 degradation reason。

#### Scenario: Native capability is probed / Native capability 被探测

- **WHEN** a feature needs voice, clipboard, URL handler, image processing, or another native capability
- **THEN** it consumes a platform capability probe result instead of importing native modules directly
- **中文** 当功能需要 voice、clipboard、URL handler、image processing 或其他 native capability 时，必须消费 platform capability probe result，而不是直接 import native modules。

### Requirement: Fail-Closed Platform Diagnostics / 平台诊断 Fail-Closed

The system SHALL fail closed with structured diagnostics when a platform path, shell, process, search, secure-storage, native capability, or watcher behavior is unsupported, unsafe, or unavailable.

当 platform path、shell、process、search、secure-storage、native capability 或 watcher behavior 不支持、不安全或不可用时，系统必须以 structured diagnostics fail closed。

#### Scenario: Unsafe path is rejected / 不安全路径被拒绝

- **WHEN** platform path resolution detects traversal, ambiguous drive-relative paths, home-relative expansion, or path escape outside the governed root
- **THEN** no fallback path is constructed by upper layers
- **AND** callers receive a structured platform error with redaction metadata
- **中文** 当 platform path resolution 检测到 traversal、ambiguous drive-relative paths、home-relative expansion 或路径逃逸 governed root 时，上层不得构造 fallback path，调用方必须收到带 redaction metadata 的 structured platform error。

#### Scenario: Unsupported native capability is rejected / 不支持 native capability 被拒绝

- **WHEN** a requested native capability is unavailable on the active platform
- **THEN** platform providers return an unavailable diagnostic and no native module is loaded
- **中文** 当请求的 native capability 在当前平台不可用时，platform providers 必须返回 unavailable diagnostic，并且不得加载 native module。
