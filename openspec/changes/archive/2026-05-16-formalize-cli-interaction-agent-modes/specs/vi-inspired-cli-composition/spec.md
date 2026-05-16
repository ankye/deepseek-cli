## ADDED Requirements

### Requirement: Composition Modes Align With Interaction Modes / 组合模式对齐交互模式

The vi-inspired composition model SHALL map its local modes onto the canonical CLI interaction mode state machine.

Vi-inspired composition model 必须将其 local modes 映射到 canonical CLI interaction mode state machine。

#### Scenario: Result-list mode maps to interaction mode / Result-list Mode 映射到交互模式
- **WHEN** palette, search, PageIndex recall, diagnostics, approval queues, or revert previews create a navigable result list
- **THEN** the composition snapshot mode and canonical interaction mode both identify result-list behavior with the same active target and result-list id
- **中文** 当 palette、search、PageIndex recall、diagnostics、approval queues 或 revert previews 创建可导航 result list 时，composition snapshot mode 与 canonical interaction mode 必须都以相同 active target 与 result-list id 标识 result-list behavior。

#### Scenario: Command-entry mode stays local / Command-entry Mode 保持本地
- **WHEN** a user enters palette, keymap, mode, agent, or approval controls
- **THEN** the controls resolve through local composition actions and do not enter model-visible prompt history
- **中文** 当用户输入 palette、keymap、mode、agent 或 approval controls 时，这些 controls 必须通过 local composition actions 解析，不得进入 model-visible prompt history。

### Requirement: Raw-Key Mode Is Optional / Raw-Key Mode 可选

Raw terminal key handling SHALL be an optional renderer/input profile over the same action model, not a prerequisite for vi-inspired navigation.

Raw terminal key handling 必须是同一 action model 上的可选 renderer/input profile，而不是 vi-inspired navigation 的前置条件。

#### Scenario: Slash controls preserve semantics / Slash 控制保留语义
- **WHEN** raw key handling is unavailable or disabled
- **THEN** slash-driven controls still update active target, result-list focus, reference sets, and jump history with identical structured action results
- **中文** 当 raw key handling 不可用或被禁用时，slash-driven controls 仍必须以相同 structured action results 更新 active target、result-list focus、reference sets 与 jump history。

#### Scenario: Keymap profile declares mode support / Keymap Profile 声明 Mode 支持
- **WHEN** a keymap contribution is registered
- **THEN** it declares the interaction/composition modes where the binding is valid and receives deterministic conflict diagnostics when overlapping with another binding
- **中文** 当 keymap contribution 被注册时，必须声明该 binding 有效的 interaction/composition modes，并在与其他 binding 重叠时收到确定性 conflict diagnostics。
