## ADDED Requirements

### Requirement: Platform-Aware Execution Policy / 平台感知执行策略

The policy and sandbox layer SHALL evaluate platform descriptor, shell profile, process provider, native capability, search provider, and secure-storage status before allowing governed execution.

policy and sandbox layer 必须在允许 governed execution 前评估 platform descriptor、shell profile、process provider、native capability、search provider 和 secure-storage status。

#### Scenario: Shell execution requires policy context / Shell 执行要求策略上下文

- **WHEN** a governed invocation requests shell-syntax execution
- **THEN** policy receives the declared shell profile, platform descriptor, sandbox profile, cwd, environment scope, timeout, and resource locks before scheduler submission
- **中文** 当 governed invocation 请求 shell-syntax execution 时，policy 必须在 scheduler submission 前收到 declared shell profile、platform descriptor、sandbox profile、cwd、environment scope、timeout 和 resource locks。

#### Scenario: Native capability cannot bypass sandbox / Native capability 不能绕过 sandbox

- **WHEN** a capability requests voice, clipboard, URL handler, image processing, or another native capability
- **THEN** policy evaluates the native capability probe and sandbox decision before any native module is loaded
- **中文** 当 capability 请求 voice、clipboard、URL handler、image processing 或其他 native capability 时，policy 必须在加载任何 native module 前评估 native capability probe 和 sandbox decision。

### Requirement: Degraded Platform Decision Events / 降级平台决策事件

The policy and sandbox layer SHALL emit redacted decision events when platform behavior is unavailable, degraded, denied, or rewritten.

policy and sandbox layer 必须在 platform behavior unavailable、degraded、denied 或 rewritten 时发出 redacted decision events。

#### Scenario: Missing shell is denied with audit / 缺失 shell 带审计拒绝

- **WHEN** a remote/no-local-shell host receives a shell-dependent invocation
- **THEN** policy denies or rewrites the invocation with a typed event and audit record
- **中文** 当 remote/no-local-shell host 收到 shell-dependent invocation 时，policy 必须用 typed event 和 audit record deny 或 rewrite invocation。
