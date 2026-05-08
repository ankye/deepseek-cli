## ADDED Requirements

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
