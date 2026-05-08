## ADDED Requirements

### Requirement: Expanded Platform Matrix Regression / 扩展平台矩阵回归

The testing framework SHALL include deterministic fake platform matrix coverage for macOS, Windows, Linux, WSL, CI/no-native, and remote/no-local-shell modes.

testing framework 必须为 macOS、Windows、Linux、WSL、CI/no-native 和 remote/no-local-shell modes 提供 deterministic fake platform matrix coverage。

#### Scenario: Matrix covers degraded hosts / 矩阵覆盖降级 host

- **WHEN** matrix tests run
- **THEN** they cover hosts with unavailable native features, unavailable secure storage, unavailable shell, and provider fallback behavior
- **中文** 当 matrix tests 运行时，必须覆盖 native features unavailable、secure storage unavailable、shell unavailable 和 provider fallback behavior 的 host。

### Requirement: Platform Bypass Lint Regression / 平台绕过 Lint 回归

The testing framework SHALL include architecture lint regression tests that reject direct OS branching, direct process execution, direct search binary invocation, direct secure-storage access, and direct native capability loading outside approved platform-owner packages.

testing framework 必须包含 architecture lint regression tests，拒绝 approved platform-owner packages 之外的 direct OS branching、direct process execution、direct search binary invocation、direct secure-storage access 和 direct native capability loading。

#### Scenario: Direct platform primitive fails lint / 直接平台 primitive 触发 lint

- **WHEN** a non-owner package imports process execution, OS detection, search binaries, secure storage APIs, or native modules directly
- **THEN** lint fails with stable rule ids and actionable messages
- **中文** 当非 owner package 直接 import process execution、OS detection、search binaries、secure storage APIs 或 native modules 时，lint 必须以 stable rule ids 和 actionable messages 失败。

### Requirement: Fail-Closed Platform Fixtures / 平台 Fail-Closed Fixtures

The testing framework SHALL provide fixtures for unsupported paths, unsafe path traversal, missing shell, missing search provider, missing native capability, missing secure storage, and WSL path translation.

testing framework 必须提供 unsupported paths、unsafe path traversal、missing shell、missing search provider、missing native capability、missing secure storage 和 WSL path translation 的 fixtures。

#### Scenario: Review finding becomes regression / Review finding 变为回归测试

- **WHEN** a platform boundary bug is found during review
- **THEN** a matrix or lint regression test is added before the change can be archived
- **中文** 当 review 中发现 platform boundary bug 时，必须在 archive 前增加 matrix 或 lint regression test。
