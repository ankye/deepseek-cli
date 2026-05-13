## ADDED Requirements

### Requirement: Chat Palette Control Regression Coverage / Chat Palette 控制回归覆盖

The regression suite SHALL cover chat-local palette, keymap, and palette action slash controls across text and structured output modes.

Regression suite 必须覆盖 text 与 structured output modes 下的 chat-local palette、keymap 和 palette action slash controls。

#### Scenario: Chat palette controls are tested / Chat Palette Controls 被测试
- **WHEN** CLI host tests run scripted chat input containing `/palette` and `/keymap`
- **THEN** tests assert local output records and no model/runtime event submission for those lines
- **中文** 当 CLI host tests 运行包含 `/palette` 与 `/keymap` 的 scripted chat input 时，测试必须断言本地输出 records，且这些行不提交 model/runtime event。

#### Scenario: Chat palette action failures are tested / Chat Palette Action 失败被测试
- **WHEN** CLI host tests run scripted chat input containing an unknown palette action target
- **THEN** tests assert typed diagnostics and no unstructured host exception
- **中文** 当 CLI host tests 运行包含未知 palette action target 的 scripted chat input 时，测试必须断言 typed diagnostics，且没有非结构化 host exception。

#### Scenario: Chat help includes palette controls / Chat Help 包含 Palette 控制被测试
- **WHEN** CLI host tests run `/help`
- **THEN** tests assert `/palette`, `/palette action`, and `/keymap` are listed
- **中文** 当 CLI host tests 运行 `/help` 时，测试必须断言列出了 `/palette`、`/palette action` 和 `/keymap`。
