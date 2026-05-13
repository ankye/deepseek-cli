## Why

Index provider text output now explains activation evidence and missing-evidence reasons, but the acceptance evidence index still only names broad e2e coverage. Release reviewers need a precise gate that ties provider intent safety and text-mode evidence safety to the test suite that proves them.

Index provider text output 现在已经解释 activation evidence 与 missing-evidence reasons，但 acceptance evidence index 仍只标注宽泛 e2e 覆盖。发布评审需要一个更精确的 gate，把 provider intent safety 与 text-mode evidence safety 绑定到证明它们的测试套件。

## What Changes

- Add acceptance index entries for index-provider text evidence rendering and provider activation evidence gate coverage.
- Regenerate `tests/acceptance/acceptance-index.md` from `scripts/write-acceptance-index.mjs`.
- Keep release readiness evidence local, deterministic, and free of raw provider secrets.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `cli-diagnostics-release-readiness`: Release evidence must identify text-mode index provider evidence coverage in addition to local provider intent safety.

## Impact

- Affected files: `scripts/write-acceptance-index.mjs`, `tests/acceptance/acceptance-index.md`, and the CLI diagnostics release readiness spec.
- No product runtime code changes, storage changes, or external dependencies.
