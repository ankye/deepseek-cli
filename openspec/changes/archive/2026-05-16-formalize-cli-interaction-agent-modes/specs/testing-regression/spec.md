## ADDED Requirements

### Requirement: Mode Contract Tests / Mode 契约测试

Regression SHALL include contract tests for interaction mode, agent mode, transitions, work orders, worker results, and reasoning effort normalization.

Regression 必须包含 interaction mode、agent mode、transitions、work orders、worker results 与 reasoning effort normalization 的 contract tests。

#### Scenario: DTOs remain additive / DTO 保持可加性
- **WHEN** mode or orchestration DTOs are serialized and deserialized
- **THEN** unknown additive fields are preserved or ignored according to compatibility metadata without breaking older fixtures
- **中文** 当 mode 或 orchestration DTOs 被 serialized 与 deserialized 时，unknown additive fields 必须根据 compatibility metadata 被保留或忽略，且不得破坏旧 fixtures。

#### Scenario: DeepSeek effort mapping is tested / DeepSeek Effort 映射被测试
- **WHEN** a DeepSeek reasoning effort request is normalized
- **THEN** tests verify user-facing effort, provider-specific value, unsupported values, and diagnostics are recorded separately from loop budgets
- **中文** 当 DeepSeek reasoning effort request 被归一化时，tests 必须验证 user-facing effort、provider-specific value、unsupported values 与 diagnostics，并确认它们与 loop budgets 分开记录。

### Requirement: Golden Replay For Mode Decisions / Mode 决策 Golden Replay

Golden replay SHALL cover mode transitions, evidence loops, delegation, verification, worker continuation, worker stop, repair, and synthesis ordering.

Golden replay 必须覆盖 mode transitions、evidence loops、delegation、verification、worker continuation、worker stop、repair 与 synthesis ordering。

#### Scenario: Replay detects ordering drift / Replay 检测顺序漂移
- **WHEN** a mode-aware task golden trace is replayed
- **THEN** normalized event ordering shows classification before evidence, evidence before factual model dispatch, implementation before verification, and verification before final success
- **中文** 当 mode-aware task golden trace 被 replay 时，normalized event ordering 必须显示 classification 在 evidence 前、evidence 在 factual model dispatch 前、implementation 在 verification 前、verification 在 final success 前。

#### Scenario: Worker result is not user prompt / Worker 结果不是 User Prompt
- **WHEN** a worker completes in a golden trace
- **THEN** replay expects a typed worker-result event and fails if raw worker output is represented as unclassified user prompt text
- **中文** 当 worker 在 golden trace 中完成时，replay 必须期待 typed worker-result event；若 raw worker output 被表示为未分类 user prompt text，则失败。

### Requirement: Adversarial Mode Fixtures / 对抗性 Mode Fixtures

Regression SHALL include adversarial fixtures for mode mismatch, lazy delegation, over-delegation, missing verification, unsafe scratchpad, and unsupported reasoning effort.

Regression 必须包含 mode mismatch、lazy delegation、over-delegation、missing verification、unsafe scratchpad 与 unsupported reasoning effort 的对抗性 fixtures。

#### Scenario: Lazy delegation fixture fails / 惰性委派 Fixture 失败
- **WHEN** a worker work order lacks concrete context and only refers to prior findings or recent discussion
- **THEN** the fixture expects a typed rejection before worker launch
- **中文** 当 worker work order 缺少具体上下文，只引用 prior findings 或 recent discussion 时，fixture 必须期待 worker launch 前出现 typed rejection。

#### Scenario: Missing verification fixture is partial or failed / 缺失验证 Fixture 为部分或失败
- **WHEN** a non-trivial task completes without independent verification evidence
- **THEN** evaluation marks it partial or failed according to policy rather than full success
- **中文** 当非琐碎任务在没有 independent verification evidence 的情况下完成时，evaluation 必须按 policy 标记为 partial 或 failed，而不是 full success。

### Requirement: Cross-Platform Interaction Matrix / 跨平台交互矩阵

Regression SHALL test interaction mode behavior across representative terminal and host profiles.

Regression 必须跨代表性 terminal 与 host profiles 测试 interaction mode 行为。

#### Scenario: Degraded profiles preserve command semantics / 降级 Profile 保留命令语义
- **WHEN** tests run in CI, redirected JSONL, no-color, Windows PowerShell-like, macOS Terminal-like, and Linux Terminal-like profiles
- **THEN** local controls, result-list navigation, approvals, mode status, and runtime event rendering preserve semantics without ANSI leakage in structured modes
- **中文** 当 tests 在 CI、redirected JSONL、no-color、Windows PowerShell-like、macOS Terminal-like 与 Linux Terminal-like profiles 运行时，local controls、result-list navigation、approvals、mode status 与 runtime event rendering 必须保留语义，且 structured modes 不泄漏 ANSI。
