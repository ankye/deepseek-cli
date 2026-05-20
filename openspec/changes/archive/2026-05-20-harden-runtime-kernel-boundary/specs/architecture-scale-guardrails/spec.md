## ADDED Requirements

### Requirement: Runtime Kernel Guardrails / Runtime Kernel 护栏

Architecture guardrails SHALL enforce runtime kernel dependency boundaries and central-file pressure thresholds.

架构护栏必须执行 runtime kernel 依赖边界与中心文件压力阈值。

#### Scenario: Kernel boundary check is part of lint / Kernel 边界检查纳入 lint

- **WHEN** `npm run lint` or release readiness scans architecture rules
- **THEN** it reports runtime kernel imports that violate app, host, provider, test, private subsystem, or owner-package boundaries
- **中文** 当 `npm run lint` 或 release readiness 扫描架构规则时，必须报告违反 app、host、provider、test、private subsystem 或 owner-package 边界的 runtime kernel imports。

#### Scenario: Central runtime file pressure is visible / 中心 Runtime 文件压力可见

- **WHEN** runtime kernel files exceed configured size, dependency, or ownership thresholds
- **THEN** guardrails report the file, threshold, likely owner-package extraction target, severity, and follow-up action
- **中文** 当 runtime kernel 文件超过配置的规模、依赖或 ownership 阈值时，护栏必须报告文件、阈值、可能的 owner-package 抽取目标、严重度与后续动作。
