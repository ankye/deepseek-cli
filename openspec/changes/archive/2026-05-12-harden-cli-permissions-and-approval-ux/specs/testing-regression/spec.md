## ADDED Requirements

### Requirement: Approval UX Regression Fixtures / 审批 UX 回归 Fixtures

The testing-regression layer SHALL provide deterministic fixtures and assertions for CLI approval lifecycle parity, headless fail-closed behavior, reference pit fixture coverage, and replayable approval evidence.

testing-regression layer 必须为 CLI approval lifecycle parity、headless fail-closed behavior、reference pit fixture coverage 和 replayable approval evidence 提供确定性 fixtures 与 assertions。

#### Scenario: Approval parity fixture replays / 审批一致性 Fixture 可 Replay

- **WHEN** approval UX golden or contract tests replay a governed invocation requiring approval
- **THEN** text, JSON, JSONL, chat, and run projections preserve equivalent approval id, decision options, denial reason, audit reference, trace metadata, and redaction metadata
- **中文** 当 approval UX golden 或 contract tests replay 一个需要审批的 governed invocation 时，text、JSON、JSONL、chat 和 run projections 必须保留等价的 approval id、decision options、denial reason、audit reference、trace metadata 和 redaction metadata。

#### Scenario: Reference pit ids are asserted / Reference Pit Ids 被断言

- **WHEN** approval tests cover permission bypass, headless trust, shell parser fallback, path canonicalization, extension permission expansion, or diagnostic redaction
- **THEN** the tests cite the corresponding `pit.*` fixture ids and fail if covered or partial pit ids disappear from evidence
- **中文** 当 approval tests 覆盖 permission bypass、headless trust、shell parser fallback、path canonicalization、extension permission expansion 或 diagnostic redaction 时，tests 必须引用对应 `pit.*` fixture ids，并在 covered 或 partial pit ids 从 evidence 消失时失败。

### Requirement: Approval Terminal Matrix / 审批终端矩阵

Approval UX SHALL be tested across deterministic terminal and execution profiles.

approval UX 必须跨确定性 terminal 与 execution profiles 测试。

#### Scenario: Headless matrix fails closed / Headless 矩阵安全失败

- **WHEN** matrix tests run approval-required work across CI, non-TTY, scripted, redirected output, unsupported raw input, and unknown-width profiles
- **THEN** tests prove the behavior is deterministic fail-closed or uses an explicit injected broker decision, with no workspace mutation on default denial
- **中文** 当 matrix tests 在 CI、non-TTY、scripted、redirected output、unsupported raw input 和 unknown-width profiles 中运行需要审批的 work 时，tests 必须证明行为是确定性 fail-closed 或使用显式 injected broker decision，并且默认 denial 不修改 workspace。
