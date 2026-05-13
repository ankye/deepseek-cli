## ADDED Requirements

### Requirement: Release Readiness Checks / 发布就绪检查

Local readiness SHALL include release-readiness checks for CLI package metadata, package surface, expected verification commands, acceptance evidence pointers, and ignored forbidden paths.

local readiness 必须包含 CLI package metadata、package surface、expected verification commands、acceptance evidence pointers 和 ignored forbidden paths 的 release-readiness checks。

#### Scenario: Verify install includes release metadata / Verify Install 包含发布元数据

- **WHEN** `deepseek verify-install` runs
- **THEN** the result includes package name, version, executable name, bin target, publish access, expected package files, generated bundle status, and release verification commands as redacted metadata
- **中文** 当 `deepseek verify-install` 运行时，result 必须以脱敏 metadata 包含 package name、version、executable name、bin target、publish access、expected package files、generated bundle status 和 release verification commands。

#### Scenario: Doctor includes release readiness summary / Doctor 包含发布就绪摘要

- **WHEN** `deepseek doctor` runs offline
- **THEN** it includes deterministic release readiness checks without calling live provider, npm registry, plugin marketplace, or remote update services
- **中文** 当 `deepseek doctor` 离线运行时，它必须包含 deterministic release readiness checks，且不调用 live provider、npm registry、plugin marketplace 或 remote update services。

### Requirement: Support Bundle Awareness / 支持包感知

Local readiness SHALL surface whether local diagnostic bundles are available and whether external diagnostic export is denied by default.

local readiness 必须展示 local diagnostic bundles 是否可用，以及 external diagnostic export 是否默认拒绝。

#### Scenario: Privacy readiness mentions support bundle policy / Privacy Readiness 提及支持包策略

- **WHEN** `deepseek privacy` or diagnostics release readiness runs
- **THEN** metadata reports local diagnostic persistence, support bundle availability, external export denial reason, and redaction class
- **中文** 当 `deepseek privacy` 或 diagnostics release readiness 运行时，metadata 必须报告 local diagnostic persistence、support bundle availability、external export denial reason 和 redaction class。

### Requirement: Readiness Evidence Items Are Addressable / 可用性证据项可寻址

Readiness results SHALL expose stable check ids and evidence item ids suitable for quickfix-style diagnostics lists.

readiness results 必须暴露稳定 check ids 和 evidence item ids，适用于 quickfix-style diagnostics lists。

#### Scenario: Failed or warned checks can become targets / 失败或警告检查可成为 Target

- **WHEN** a readiness check returns warn or fail
- **THEN** its id, label, status, message, metadata, and suggested actions are stable enough for CLI diagnostics to reference without rerunning the check
- **中文** 当 readiness check 返回 warn 或 fail 时，它的 id、label、status、message、metadata 和 suggested actions 必须足够稳定，使 CLI diagnostics 可引用它而不重新运行检查。
