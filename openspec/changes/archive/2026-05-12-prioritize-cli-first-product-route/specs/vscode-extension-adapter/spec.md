## ADDED Requirements

### Requirement: VSCode Follows CLI-Proven Product Semantics / VSCode 跟随 CLI 已验证产品语义

The VSCode extension adapter SHALL treat CLI-proven runtime events, command semantics, policy decisions, approval flows, diagnostics, and session behavior as prerequisites for productized IDE features.

VSCode extension adapter 必须把 CLI 已验证的 runtime events、command semantics、policy decisions、approval flows、diagnostics 和 session behavior 作为产品化 IDE 功能的前置条件。

#### Scenario: IDE feature cites CLI evidence / IDE 功能引用 CLI 证据

- **WHEN** a VSCode product feature such as chat rendering, inline approval, diff projection, task view, diagnostics view, extension management, or session UI is proposed
- **THEN** the proposal cites the CLI workflow evidence and protocol fixtures it will project
- **中文** 当提出 VSCode product feature，例如 chat rendering、inline approval、diff projection、task view、diagnostics view、extension management 或 session UI 时，proposal 必须引用它将投影的 CLI workflow evidence 和 protocol fixtures。

#### Scenario: VSCode does not become parallel product surface early / VSCode 不过早成为并行产品面

- **WHEN** CLI-first gates for a workflow have not passed
- **THEN** VSCode work for that workflow is limited to bridge seams, contract tests, skeletal projections, or compatibility fixtures
- **中文** 当某个 workflow 的 CLI-first 门禁尚未通过时，该 workflow 的 VSCode 工作必须限制在 bridge seams、contract tests、skeletal projections 或 compatibility fixtures。

#### Scenario: IDE projection stays host-edge / IDE 投影保持在 host 边界

- **WHEN** a CLI-proven workflow is promoted to VSCode
- **THEN** the VSCode adapter adds host-specific rendering, editor context, workspace edit application, and approval UI without owning runtime execution state
- **中文** 当 CLI 已验证 workflow 推广到 VSCode 时，VSCode adapter 只能增加 host-specific rendering、editor context、workspace edit application 和 approval UI，不得拥有 runtime execution state。
