## Context

`collectReleaseReadinessEvidence()` returns package surface, support bundle policy, verification commands, and `acceptanceEvidencePaths`. The path list currently points to `tests/acceptance/latest/*` artifacts but omits `tests/acceptance/acceptance-index.md`, which is the curated map tying gates to evidence.

`collectReleaseReadinessEvidence()` 返回 package surface、support bundle policy、verification commands 与 `acceptanceEvidencePaths`。当前 path list 指向 `tests/acceptance/latest/*` artifacts，但遗漏了 `tests/acceptance/acceptance-index.md`，而这个文件是 gate 到 evidence 的 curated map。

## Goals / Non-Goals

**Goals:**
- Make `diagnostics release` expose the generated acceptance index path.
- Preserve the existing latest evidence artifact list.
- Add focused regression tests so this pointer is not removed accidentally.

**Non-Goals:**
- Refresh every acceptance latest artifact.
- Change release gate semantics or publish commands.
- Add new DTO fields.

## Decisions

- Add the index path to `acceptanceEvidencePaths`.
  - Rationale: the existing DTO already represents evidence pointers and is consumed by text, JSON, JSONL, and readiness metadata.
  - Alternative considered: add a separate `acceptanceIndexPath` field. That would require contract churn for a simple pointer.

- Test the path through release evidence collection and CLI JSON output.
  - Rationale: one test covers the shared evidence builder, and one e2e-style test covers the CLI rendering path.

## Risks / Trade-offs

- [Risk] The list grows over time. -> Mitigation: keep the index path at the front as the navigational entry point.
