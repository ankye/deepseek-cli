## ADDED Requirements

### Requirement: Every Family Has Representative Task Evidence / 每个 Family 有代表性任务证据
CLI task completion evaluation SHALL include representative task fixtures for all 64 first-version families and SHALL report required, available, used, unsupported, and failed families per task.

CLI task completion evaluation 必须为全部 64 个第一版 families 包含代表性 task fixtures，并按任务报告 required、available、used、unsupported 与 failed families。

#### Scenario: Design task cannot pass with text only / Design 任务不能只靠文本通过
- **WHEN** a task requires `design.export-snapshot`
- **THEN** completion requires a design export artifact and cannot pass from descriptive text alone
- **中文** 当任务需要 `design.export-snapshot` 时，completion 必须要求 design export artifact，不能只靠描述性文本通过。

### Requirement: Family Parity Matrix Is Acceptance Evidence / Family Parity Matrix 是验收证据
Diagnostics SHALL emit a 64-family parity matrix with implementation, static contract, replayed/live execution, task outcome, safety, and provider-native support separated.

diagnostics 必须输出 64-family parity matrix，并分开报告 implementation、static contract、replayed/live execution、task outcome、safety 与 provider-native support。

#### Scenario: Fake-first coverage is visible / Fake-First 覆盖可见
- **WHEN** default diagnostics evaluate runs without live credentials
- **THEN** fake-first families show replayed execution evidence without being labeled live provider support
- **中文** 当默认 diagnostics evaluate 在没有 live credentials 时运行，fake-first families 必须显示 replayed execution evidence，但不得被标记为 live provider support。
