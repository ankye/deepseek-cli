## Why

Built-in plugin commands are already discoverable in the TUI command bar, but several slash aliases can still fall through as unknown chat commands or submit before required arguments are entered.

内置插件命令已经能在 TUI command bar 中被发现，但部分 slash alias 仍可能在 chat 中落入 unknown command，或在缺少必需参数时过早提交。

## What Changes

- Route first-party built-in plugin slash aliases for repo navigation, git review, and developer checks through host-owned CLI handlers.
- Add an injected plugin slash command registry so chat routing is driven by plugin owner route aliases rather than hard-coded business command names.
- Mark plugin slash suggestions that require arguments with placeholder previews so raw TUI input inserts editable draft prefixes instead of submitting incomplete prompts.
- Preserve the existing governance boundary: command bar acceptance remains descriptor-only, and execution happens only through chat slash command handling and owner subsystems.
- Add focused tests for command discovery, draft bridging, and chat command execution.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `chat-tui-workbench-interaction`: Plugin slash suggestions that require input must bridge as editable drafts and supported first-party plugin aliases must execute locally after completion.
- `first-party-dev-plugins`: First-party plugin projections must expose enough alias, owner route, and input metadata for host surfaces to inject slash commands and distinguish complete aliases from argument-taking aliases.

## Impact

- CLI chat slash command router and local output paths.
- TUI command bar suggestion projection and raw input bridge behavior.
- First-party built-in plugin projection metadata and tests.
- OpenSpec artifacts for chat TUI and first-party plugin behavior.
