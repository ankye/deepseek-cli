## ADDED Requirements

### Requirement: Palette And Action Regression Coverage / 面板与动作回归覆盖

The regression suite SHALL cover command palette projection, minimal vi keymap mapping, keymap conflict diagnostics, result-list action resolution, jump/reference updates, and no-owner-execution behavior.

Regression suite 必须覆盖 command palette projection、minimal vi keymap mapping、keymap conflict diagnostics、result-list action resolution、jump/reference updates 和不执行 owner 的行为。

#### Scenario: Palette projection parity is tested / 面板投影一致性被测试
- **WHEN** composition records are projected to palette entries and command result lists
- **THEN** tests assert stable ids, ordering, target metadata, source trust, permissions, side effects, redaction, diagnostics, and reference pit fixture ids
- **中文** 当 composition records 投影到 palette entries 和 command result lists 时，测试必须断言 stable ids、ordering、target metadata、source trust、permissions、side effects、redaction、diagnostics 和 reference pit fixture ids。

#### Scenario: Result-list action state is tested / 结果列表动作状态被测试
- **WHEN** result-list navigation or `add-to-reference-set` actions are resolved
- **THEN** tests assert active target changes, result-list focus changes, reference set updates, and jump history updates without workspace mutation
- **中文** 当 result-list navigation 或 `add-to-reference-set` actions 被解析时，测试必须断言 active target changes、result-list focus changes、reference set updates 和 jump history updates，且不修改 workspace。

#### Scenario: Vi profile conflicts are tested / Vi Profile 冲突被测试
- **WHEN** conflicting keymap contributions are validated
- **THEN** tests assert deterministic conflict diagnostics and no silent host-specific override
- **中文** 当 conflicting keymap contributions 被校验时，测试必须断言 deterministic conflict diagnostics，且没有静默 host-specific override。
