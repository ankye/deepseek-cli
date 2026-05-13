## ADDED Requirements

### Requirement: Palette Jump Navigation Regression Coverage / Palette 跳转导航回归覆盖

Regression tests SHALL cover typed palette jump back/forward action resolution and chat-local slash controls with deterministic state assertions.

回归测试必须用确定性 state assertions 覆盖 typed palette jump back/forward action resolution 与 chat-local slash controls。

#### Scenario: Contract jump traversal is tested / Contract 跳转遍历被测试

- **WHEN** contract tests resolve `back` and `forward` against a composition snapshot with jump history
- **THEN** tests assert cursor movement, active target updates, matching result-list focus updates, typed failure at bounds, and no owner execution
- **中文** 当 contract tests 基于带 jump history 的 composition snapshot 解析 `back` 与 `forward` 时，测试必须断言 cursor movement、active target updates、matching result-list focus updates、边界 typed failure 和不执行 owner。

#### Scenario: Chat jump controls are tested / Chat 跳转控制被测试

- **WHEN** CLI host tests run scripted chat input containing `/palette`, navigation commands, `/palette back`, `/palette forward`, and `/palette state`
- **THEN** tests assert structured local JSONL records, changed focus, expected jump cursor values, no ANSI controls, and no model/runtime submission for the slash lines
- **中文** 当 CLI host tests 运行包含 `/palette`、navigation commands、`/palette back`、`/palette forward` 与 `/palette state` 的 scripted chat input 时，测试必须断言结构化本地 JSONL records、focus 变化、预期 jump cursor values、无 ANSI controls，以及 slash lines 不提交 model/runtime。

#### Scenario: Empty chat jump is tested / 空 Chat 跳转被测试

- **WHEN** CLI host tests run `/palette back` before any jump history exists
- **THEN** tests assert a typed palette diagnostic and no unstructured host exception
- **中文** 当 CLI host tests 在没有 jump history 前运行 `/palette back` 时，测试必须断言 typed palette diagnostic，且没有非结构化 host exception。
