## ADDED Requirements

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
