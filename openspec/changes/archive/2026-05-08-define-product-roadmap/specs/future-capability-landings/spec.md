## ADDED Requirements

### Requirement: Roadmap-Owned Future Landings / 路线图归属的未来能力落点

Future capability landing zones SHALL be owned by roadmap nodes with explicit prerequisites and phase targets.

future capability landing zones 必须由 roadmap nodes 管理，并声明明确 prerequisites 和 phase targets。

#### Scenario: Deferred UX has phase target / 延后 UX 能力声明阶段目标

- **WHEN** a deferred capability such as voice, vim/keybindings, rich TUI, browser/native host, recommendation UI, team memory sync, daemon/server, production sandbox matrix, or update UI is documented
- **THEN** it declares the roadmap node where it can be implemented and the platform prerequisites required first
- **中文** 当记录 voice、vim/keybindings、rich TUI、browser/native host、recommendation UI、team memory sync、daemon/server、production sandbox matrix 或 update UI 等延后能力时，必须声明可实现的路线图节点以及必须先完成的平台前置条件。

#### Scenario: Host UX refinements have explicit R6 landing / Host UX 细化能力有明确 R6 落点

- **WHEN** output styles, theme picker, status line, terminal title, command palette, first-run onboarding, feature tips, history search, or recommendation dismissal state is proposed
- **THEN** the roadmap places it under R6 host UX unless it is required for R1 local readiness, and it declares command/protocol event dependencies
- **中文** 当提出 output styles、theme picker、status line、terminal title、command palette、first-run onboarding、feature tips、history search 或 recommendation dismissal state 时，路线图必须将其放在 R6 host UX 下，除非它是 R1 local readiness 必需能力，并声明 command/protocol event dependencies。
