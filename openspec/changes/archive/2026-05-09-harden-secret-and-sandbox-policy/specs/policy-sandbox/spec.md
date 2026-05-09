## ADDED Requirements

### Requirement: Secret-Aware Policy Decisions / Secret 感知 Policy 决策

The policy and sandbox layer SHALL evaluate secret exposure metadata before allowing model-visible or side-effecting work.

policy and sandbox layer 必须在允许 model-visible 或 side-effecting work 前评估 secret exposure metadata。

#### Scenario: Secret exposure can deny execution / Secret exposure 可拒绝执行

- **WHEN** an execution envelope declares raw secret exposure or unsafe redaction metadata
- **THEN** policy returns deny or rewrite before scheduler submission
- **中文** 当 execution envelope 声明 raw secret exposure 或 unsafe redaction metadata 时，policy 必须在 scheduler submission 前返回 deny 或 rewrite。

### Requirement: Sandbox Enforcement Matrix / Sandbox Enforcement Matrix

The policy and sandbox layer SHALL evaluate filesystem, process, shell, network, environment, native, timeout, and platform degradation dimensions before scheduler submission.

policy and sandbox layer 必须在 scheduler submission 前评估 filesystem、process、shell、network、environment、native、timeout 和 platform degradation dimensions。

#### Scenario: Process execution requires explicit shell profile / Process 执行要求显式 Shell Profile

- **WHEN** an invocation requests process or shell execution
- **THEN** policy receives shell profile, cwd, environment scope, timeout, output redaction, and platform availability metadata
- **中文** 当 invocation 请求 process 或 shell execution 时，policy 必须收到 shell profile、cwd、environment scope、timeout、output redaction 和 platform availability metadata。

#### Scenario: Filesystem write requires path scope / Filesystem 写入要求路径范围

- **WHEN** an invocation requests filesystem write
- **THEN** policy receives workspace root, normalized path, traversal status, rollback evidence availability, and sandbox profile metadata
- **中文** 当 invocation 请求 filesystem write 时，policy 必须收到 workspace root、normalized path、traversal status、rollback evidence availability 和 sandbox profile metadata。
