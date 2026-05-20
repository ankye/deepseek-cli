# secret-sandbox-hardening Specification

## Purpose
Define secret and sandbox hardening requirements for credential redaction, forbidden bypasses, sandbox metadata, and safe test fixtures.

定义 secret and sandbox hardening 对 credential redaction、forbidden bypasses、sandbox metadata 与安全 test fixtures 的要求。

## Requirements
### Requirement: Platform Secret And Sandbox Hardening Contract / 平台 Secret 与 Sandbox Hardening 契约

DeepSeek SHALL enforce secret classification, redaction, sandbox selection, and fail-closed behavior through shared platform contracts before model exposure or side-effect execution.

DeepSeek 必须通过共享平台契约，在 model exposure 或 side-effect execution 前执行 secret classification、redaction、sandbox selection 和 fail-closed behavior。

#### Scenario: Secret-like content is classified before exposure / Secret-like 内容暴露前被分类

- **WHEN** model context, tool evidence, protocol output, runtime event data, session data, cache data, or host output contains secret-like content
- **THEN** the system classifies, redacts, excludes, rewrites, or rejects it before it crosses the next boundary
- **中文** 当 model context、tool evidence、protocol output、runtime event data、session data、cache data 或 host output 包含 secret-like content 时，系统必须在其跨越下一个边界前执行 classify、redact、exclude、rewrite 或 reject。

#### Scenario: Side effect requires sandbox decision / 副作用要求 Sandbox 决策

- **WHEN** a capability declares filesystem write, process, network, environment, or native side effects
- **THEN** policy selects an explicit sandbox decision before scheduler execution
- **中文** 当 capability 声明 filesystem write、process、network、environment 或 native side effects 时，policy 必须在 scheduler execution 前选择显式 sandbox decision。

### Requirement: Redacted Audit Evidence / 脱敏审计证据

Secret and sandbox decisions SHALL emit replayable redacted audit evidence.

secret 与 sandbox decisions 必须发出可 replay 的 redacted audit evidence。

#### Scenario: Denied secret operation records reason / 被拒绝 Secret 操作记录原因

- **WHEN** policy denies or rewrites an operation because of secret exposure
- **THEN** audit evidence records stable reason code, redacted subject, redacted resource, decision, sandbox profile, and trace metadata
- **中文** 当 policy 因 secret exposure 拒绝或 rewrite 一个 operation 时，audit evidence 必须记录 stable reason code、redacted subject、redacted resource、decision、sandbox profile 和 trace metadata。

### Requirement: Sandbox Matrix Is Deterministic / Sandbox 矩阵确定性

Sandbox enforcement SHALL produce deterministic decisions across supported fake host/platform modes.

sandbox enforcement 必须在 supported fake host/platform modes 中产生确定性 decisions。

#### Scenario: Degraded host fails closed / 降级 Host 安全失败

- **WHEN** a host lacks shell, secure storage, writable filesystem, network capability, or native capability required by an invocation
- **THEN** policy denies or rewrites the invocation with typed evidence before execution
- **中文** 当 host 缺少 invocation 所需的 shell、secure storage、writable filesystem、network capability 或 native capability 时，policy 必须在 execution 前用 typed evidence deny 或 rewrite invocation。
