## ADDED Requirements

### Requirement: Self-Repair Regression Coverage / 自修复回归覆盖

The regression suite SHALL cover deterministic self-repair scenarios from failure classification through repair attempt, verification, and terminal decision.

regression suite 必须覆盖从 failure classification 到 repair attempt、verification 与 terminal decision 的确定性 self-repair scenarios。

#### Scenario: Tool failure repair replay is tested / 工具失败修复 Replay 被测试
- **WHEN** a deterministic runtime fixture triggers a repairable tool or artifact failure
- **THEN** regression tests assert classification, repair plan evidence, governed tool execution, verification result, terminal summary, and stable replay ordering
- **中文** 当 deterministic runtime fixture 触发可修复 tool 或 artifact failure 时，regression tests 必须断言 classification、repair plan evidence、受治理工具执行、verification result、terminal summary 与稳定 replay ordering。

#### Scenario: Non-repairable failure replay is tested / 不可修复失败 Replay 被测试
- **WHEN** a deterministic fixture triggers missing credentials, policy denial, approval-required, unsafe path, or external-service unavailable failure
- **THEN** regression tests assert the repair loop stops or escalates without workspace mutation and records a typed non-repairable reason
- **中文** 当 deterministic fixture 触发 missing credentials、policy denial、approval-required、unsafe path 或 external-service unavailable failure 时，regression tests 必须断言 repair loop 在不修改 workspace 的情况下停止或升级，并记录 typed non-repairable reason。

### Requirement: Self-Repair Evidence Contract Tests / 自修复证据契约测试

Contract tests SHALL validate self-repair DTOs, runtime events, observability records, evaluation metrics, redaction metadata, and schema versioning.

contract tests 必须验证 self-repair DTOs、runtime events、observability records、evaluation metrics、redaction metadata 与 schema versioning。

#### Scenario: Repair DTOs require schema and redaction / 修复 DTO 要求 Schema 与脱敏
- **WHEN** self-repair DTOs or events are serialized in tests
- **THEN** every public artifact includes schema version, stable ids, typed status, redaction metadata, compatibility metadata, and no raw secret fixture values
- **中文** 当 self-repair DTOs 或 events 在测试中序列化时，每个公共 artifact 必须包含 schema version、stable ids、typed status、redaction metadata、compatibility metadata，且不含 raw secret fixture values。

#### Scenario: Golden replay detects decision drift / Golden Replay 检测决策漂移
- **WHEN** self-repair golden traces are replayed
- **THEN** the harness detects drift in classification, repair policy decision, attempt ordering, verification ladder, stop reason, or redaction summary
- **中文** 当 self-repair golden traces 被 replay 时，harness 必须检测 classification、repair policy decision、attempt ordering、verification ladder、stop reason 或 redaction summary 的漂移。

### Requirement: Self-Repair Evaluation Fixtures / 自修复评估 Fixtures

The testing framework SHALL provide fixtures that intentionally fail first and require bounded correction before the task can be scored as solved.

testing framework 必须提供会先失败、并要求有界纠正后任务才能评分为 solved 的 fixtures。

#### Scenario: Failing webpage fixture requires repair / 失败网页 Fixture 要求修复
- **WHEN** the webpage-generation repair fixture is run
- **THEN** the initial artifact check fails deterministically and the task can only be scored solved after the generated webpage is repaired and the checker passes
- **中文** 当 webpage-generation repair fixture 运行时，初始 artifact check 必须确定性失败，且只有生成网页被修复并通过 checker 后，该任务才能评分为 solved。

#### Scenario: Failing code fixture requires targeted repair / 失败代码 Fixture 要求目标修复
- **WHEN** a code fixture intentionally triggers a typecheck, lint, import, or boundary failure
- **THEN** the task can only be scored solved after the targeted check passes and unrelated files remain outside the allowed changed-scope evidence
- **中文** 当 code fixture 有意触发 typecheck、lint、import 或 boundary failure 时，只有 targeted check 通过且无关文件保持在 allowed changed-scope evidence 外，该任务才能评分为 solved。
