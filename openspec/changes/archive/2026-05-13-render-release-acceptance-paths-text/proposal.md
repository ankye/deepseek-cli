## Why

`diagnostics release` now carries the acceptance index path in structured output, but text output still only prints verification commands. Manual release review needs the same acceptance evidence pointers in terminal text so the generated gate map is visible without switching to JSON.

`diagnostics release` 现在已经在 structured output 中携带 acceptance index path，但 text output 仍只打印 verification commands。人工发布评审需要在终端文本中看到同样的 acceptance evidence pointers，不必切换到 JSON 才能看到 generated gate map。

## What Changes

- Render release acceptance evidence paths in diagnostics text output.
- Ensure text mode includes `tests/acceptance/acceptance-index.md`.
- Add focused CLI/e2e tests for text output parity.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `cli-diagnostics-release-readiness`: Text release diagnostics must list acceptance evidence pointers, including the generated acceptance index.

## Impact

- Affected code: CLI diagnostics text renderer and focused tests.
- No DTO, storage, provider, or publish behavior changes.
