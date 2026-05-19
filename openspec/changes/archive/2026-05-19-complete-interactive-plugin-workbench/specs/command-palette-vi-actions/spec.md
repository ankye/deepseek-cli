## ADDED Requirements

### Requirement: Palette exposes executable plugin route requests
The command palette SHALL expose built-in plugin command entries as host-executable plugin route requests when the route is implemented.

Command palette 必须在 route implemented 时，将 built-in plugin command entries 暴露为 host-executable plugin route requests。

#### Scenario: Palette route execution returns structured record
- **WHEN** a palette plugin command entry is executed through the host execution helper
- **THEN** the result is a plugin workbench execution record with route readiness, dispatch status, diagnostics, and result-list metadata
- **中文** 当 palette plugin command entry 通过 host execution helper 执行时，结果必须是包含 route readiness、dispatch status、diagnostics 与 result-list metadata 的 plugin workbench execution record。

### Requirement: Palette preserves inert action resolution
The command palette SHALL continue to resolve generic actions as dry-run composition updates unless the caller explicitly requests plugin route execution.

Command palette 必须继续将 generic actions 解析为 dry-run composition updates，除非调用方显式请求 plugin route execution。

#### Scenario: Generic palette action remains dry-run
- **WHEN** a palette action is resolved with `resolvePaletteAction`
- **THEN** it does not execute owner routes and remains safe for preview, tests, and model-facing command discovery
- **中文** 当 palette action 通过 `resolvePaletteAction` 解析时，不得执行 owner routes，并且必须继续适用于 preview、tests 与 model-facing command discovery。
