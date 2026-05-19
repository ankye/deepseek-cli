## ADDED Requirements

### Requirement: Basic TUI Uses Vi-Inspired Composition Frame / 基础 TUI 使用 Vi 启发式组合框架

The basic chat TUI SHALL treat mode, target, action, result-list, jump history, and reference set as the core interaction frame before adding plugin-contributed controls.

基础 chat TUI 必须将 mode、target、action、result-list、jump history 与 reference set 作为核心交互框架，然后再添加 plugin-contributed controls。

#### Scenario: Prompt shell exposes composition state / Prompt Shell 暴露组合状态

- **WHEN** the basic chat shell renders startup status or local control output
- **THEN** it identifies the active interaction/composition profile and keeps local commands mapped to typed actions or typed command results
- **中文** 当基础 chat shell 渲染 startup status 或 local control output 时，必须标识 active interaction/composition profile，并保持 local commands 映射到 typed actions 或 typed command results。

#### Scenario: Plugin controls are declarative follow-up / 插件控制是声明式后续工作

- **WHEN** future plugins add commands, actions, target resolvers, result-list providers, keymap entries, palette entries, or render hints
- **THEN** they must contribute through versioned declarative manifests and deterministic conflict diagnostics over the same vi-inspired composition model
- **中文** 当未来插件添加 commands、actions、target resolvers、result-list providers、keymap entries、palette entries 或 render hints 时，它们必须通过版本化声明式 manifests 和同一 vi-inspired composition model 上的确定性冲突诊断进行贡献。

#### Scenario: Plugins cannot bypass basic shell contracts / 插件不能绕过基础 Shell 契约

- **WHEN** a plugin-contributed interaction triggers executable work
- **THEN** the CLI must route it through typed command/action requests, policy, runtime, and audit paths, preserving structured output parity and terminal-profile degradation
- **中文** 当 plugin-contributed interaction 触发可执行工作时，CLI 必须通过 typed command/action requests、policy、runtime 与 audit paths 路由，并保留 structured output parity 与 terminal-profile degradation。
