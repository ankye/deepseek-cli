## Why

`index-provider status|set` is now a user-visible CLI surface, but release acceptance still does not explicitly list or smoke-test it. Before moving deeper into real provider implementations, the CLI-first path should lock this safety behavior into e2e and acceptance evidence.

`index-provider status|set` 现在已经是用户可见 CLI surface，但 release acceptance 还没有明确列出或 smoke-test 它。在继续推进真实 provider implementation 前，CLI-first 路线需要把这类安全行为纳入 e2e 与 acceptance evidence。

## What Changes

- Add e2e coverage that runs `index-provider status` and `index-provider set zvec enabled` in an isolated workspace.
- Verify the command stays local, writes safe intent, and reports effective downgrade without raw secrets.
- Update acceptance evidence indexing so index provider safety is mapped to release/local-readiness evidence.
- No functional provider behavior changes.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `framework-acceptance`: Adds explicit evidence requirements for CLI index provider configuration/status safety.
- `cli-diagnostics-release-readiness`: Clarifies that index-provider command safety must be included in local readiness or release evidence.

## Impact

- Affected code: e2e tests, acceptance evidence index script.
- Affected specs: `framework-acceptance`, `cli-diagnostics-release-readiness`.
- No new runtime behavior, storage migration, dependencies, or provider execution.
