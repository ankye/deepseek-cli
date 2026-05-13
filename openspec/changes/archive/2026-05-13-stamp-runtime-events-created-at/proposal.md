## Why

PageIndex evidence quality can distinguish runtime-sourced timestamps from fallback timestamps, but runtime events do not yet expose a canonical `createdAt`. Adding a deterministic event timestamp gives CLI recall a real provenance field and prepares future freshness policies.

PageIndex evidence quality 已能区分 runtime-sourced timestamp 与 fallback timestamp，但 runtime events 尚未暴露 canonical `createdAt`。增加确定性 event timestamp 可以让 CLI recall 获得真实 provenance 字段，并为未来 freshness policy 做准备。

## What Changes

- Add `createdAt` to the canonical `RuntimeEvent` contract.
- Stamp runtime adapter events with deterministic ISO timestamps.
- Persist the same timestamp into session event records and bus envelopes.
- Update PageIndex tests to expect runtime-sourced `createdAt` and known freshness.

## Capabilities

### New Capabilities

### Modified Capabilities
- `runtime-execution-kernel`: Runtime events must include canonical createdAt timestamps.
- `minimal-chat-cli`: PageIndex evidence quality must use runtime event timestamps when available.

## Impact

- Affected code: `src/packages/platform-contracts/src/runtime.ts`, `src/packages/runtime/src/events.ts`, `src/packages/runtime/src/kernel.ts`, `src/apps/cli/test/cli.test.ts`.
- Affected specs: `runtime-execution-kernel`, `minimal-chat-cli`.
- Deterministic tests continue using epoch time through existing deterministic clock behavior.
