## Why

The TUI now exposes plugin slash aliases, but `/jump symbol <query>` still appears as a deferred route even though the local code-intelligence service can already index symbols. This creates a product-quality gap: users can discover a command that looks first-class, but it cannot complete the basic navigation workflow.

TUI 已经暴露 plugin slash aliases，但 `/jump symbol <query>` 仍然显示为 deferred route，而本地 code-intelligence service 已经可以索引 symbols。这会形成产品体验断层：用户能发现一个看似一等公民的命令，却无法完成基础跳转工作流。

## What Changes

- Make `jump.navigator.symbol` an implemented owner route backed by injected code-intelligence.
- 将 `jump.navigator.symbol` 改为由注入的 code-intelligence 驱动的 implemented owner route。
- Return typed symbol result lists with file targets, line metadata, active target, diagnostics, and redaction metadata.
- 返回 typed symbol result lists，包含 file targets、line metadata、active target、diagnostics 与 redaction metadata。
- Keep file/text jump behavior unchanged and preserve host-owned dispatch with no plugin-private handlers.
- 保持 file/text jump 行为不变，并继续通过 host-owned dispatch 执行，不引入 plugin-private handlers。
- Update TUI, palette, extension inspection, and chat slash routing surfaces so symbol jump is projected as executable.
- 更新 TUI、palette、extension inspection 与 chat slash routing surfaces，使 symbol jump 被投影为可执行。

## Capabilities

### New Capabilities

### Modified Capabilities
- `builtin-navigation-plugins`: Symbol jump changes from deferred fallback to executable code-intelligence-backed navigation.
- `builtin-plugin-owner-routes`: Owner route readiness and dispatch semantics now mark `jump.navigator.symbol` as implemented when routed through the host.
- `chat-tui-workbench-interaction`: Chat/TUI slash execution now keeps `/jump symbol <query>` as an active symbol result list rather than a deferred diagnostic result.

## Impact

- Affected code: `src/apps/cli/src/commands/jump-navigator.ts`, `src/apps/cli/src/plugins/builtin-owner-routes.ts`, chat slash/plugin execution surfaces, and focused tests.
- Affected contracts: built-in navigation plugin behavior, owner-route readiness, and TUI result-list attachment.
- No new runtime dependency. Execution uses the existing `CodeIntelligenceService` contract already present in runtime dependencies.
