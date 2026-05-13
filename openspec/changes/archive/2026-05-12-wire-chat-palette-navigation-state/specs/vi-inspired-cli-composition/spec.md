## ADDED Requirements

### Requirement: Slash-Driven Result Navigation Precedes Raw Mode / Slash 驱动结果导航先于 Raw Mode

The vi-inspired CLI composition rollout SHALL expose result-list navigation and reference updates through bounded local slash controls before requiring raw terminal key handling.

Vi-inspired CLI composition rollout 必须先通过有边界的本地 slash controls 暴露 result-list navigation 与 reference updates，再要求 raw terminal key handling。

#### Scenario: Slash command maps to vi-style action / Slash Command 映射到 Vi 风格 Action
- **WHEN** a user invokes a local slash navigation command such as `/palette next`
- **THEN** the command maps to the same typed action model used by vi-minimal keymap entries
- **中文** 当用户调用 `/palette next` 等本地 slash navigation command 时，该 command 必须映射到 vi-minimal keymap entries 使用的同一 typed action model。

#### Scenario: Raw-mode absence does not block composition / 缺少 Raw Mode 不阻塞组合模型
- **WHEN** the terminal does not support reliable raw key handling
- **THEN** the user can still navigate result lists and update reference sets through slash controls with the same state semantics
- **中文** 当 terminal 不支持可靠 raw key handling 时，用户仍必须能通过 slash controls 导航 result lists 并更新 reference sets，且 state semantics 一致。
