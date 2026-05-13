## Why

The acceptance index now maps detailed release gates, including index-provider safety gates, but `diagnostics release` still only lists individual latest evidence artifacts. Release reviewers need the generated acceptance index to appear as a first-class evidence pointer so they can navigate from one release command to the full gate map.

Acceptance index 现在已经映射详细 release gates，包括 index-provider safety gates，但 `diagnostics release` 仍只列出单独的 latest evidence artifacts。发布评审需要把生成的 acceptance index 作为一等 evidence pointer 暴露出来，从一个 release command 就能追到完整 gate map。

## What Changes

- Add `tests/acceptance/acceptance-index.md` to release verification evidence paths.
- Keep existing latest artifact pointers unchanged.
- Add regression coverage proving diagnostics release exposes the acceptance index.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `cli-diagnostics-release-readiness`: Release readiness evidence must include the generated acceptance index path in addition to latest verification artifacts.

## Impact

- Affected code: CLI release evidence assembly and tests.
- Affected specs: `cli-diagnostics-release-readiness`.
- No storage, network, provider, or package publish behavior changes.
