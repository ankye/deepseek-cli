## ADDED Requirements

### Requirement: Basic TUI Is A Chat Interaction Projection / 基础 TUI 是 Chat 交互投影

The basic line TUI SHALL be a renderer/input projection of canonical `chat` interaction mode, not a new runtime execution mode.

基础行式 TUI 必须是 canonical `chat` interaction mode 的 renderer/input 投影，而不是新的 runtime execution mode。

#### Scenario: Basic TUI preserves chat mode / 基础 TUI 保留 Chat Mode

- **WHEN** text TTY chat renders prompt/status affordances
- **THEN** the canonical interaction mode remains `chat`, and local status exposes renderer/input/degradation evidence without changing runtime execution semantics
- **中文** 当 text TTY chat 渲染 prompt/status affordances 时，canonical interaction mode 必须保持为 `chat`，且本地状态暴露 renderer/input/degradation evidence，不改变 runtime execution semantics。

#### Scenario: Rich TUI remains a later mode projection / Rich TUI 保持后续 Mode 投影

- **WHEN** future work adds full-screen panels, review-diff panes, approval queues, or plugin-contributed visual surfaces
- **THEN** those surfaces must consume the same canonical interaction mode and action events rather than creating host-only hidden state
- **中文** 当未来增加 full-screen panels、review-diff panes、approval queues 或 plugin-contributed visual surfaces 时，这些 surface 必须消费同一 canonical interaction mode 与 action events，而不是创建 host-only hidden state。
