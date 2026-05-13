## Context

The CLI has local PageIndex recall, explicit `session`/`workspace` scope controls, session snapshots, and workspace PageIndex persistence. Recall results are represented as palette result-list items with `target.kind=turn` plus bounded PageIndex metadata. Runtime projection can already materialize PageIndex-shaped `turn` references as summary nodes, but scope provenance is not yet model-visible and the chat reference-add path can degrade non-file result items into generic `result-list-item` targets.

CLI 已具备本地 PageIndex 回溯、`session`/`workspace` scope 控制、session 快照与 workspace PageIndex 持久化。Recall 结果以 `target.kind=turn` 加有界 PageIndex metadata 表示。Runtime projection 已能把 PageIndex 形态的 `turn` reference 物化成 summary node，但 scope provenance 尚未明确进入模型可见摘要，并且 chat add-reference 路径可能把非 file result item 降级成普通 `result-list-item`。

## Goals / Non-Goals

**Goals:**
- Keep PageIndex recall references typed across result-list, reference set, request metadata, and runtime projection.
- Make workspace recall summaries explicitly distinguishable from session recall summaries.
- Preserve exact user prompt text while adding context through runtime-owned projection.
- Cover the cross-session workspace recall-to-reference-to-model path with deterministic tests.

**Non-Goals:**
- Implement global PageIndex storage.
- Add ZVec/vector ranking or embedding providers.
- Promote PageIndex into a full code index.
- Read full transcripts during projection; only bounded previews are used.

## Decisions

- Preserve `turn` targets directly in chat reference-add resolution.
  - Rationale: `turn` is already a typed target kind in the contracts and PageIndex result items carry all bounded metadata there. Converting it to `result-list-item` loses provenance and makes runtime projection treat it as unsupported evidence.
  - Alternative considered: copy metadata from result-list item metadata into a generic result-list target. This would create a second PageIndex shape and weaken contract consistency.

- Add scope to PageIndex summary formatting and node provenance.
  - Rationale: session and workspace recall have different trust and freshness boundaries. The model-visible summary and projection provenance must show which boundary supplied the evidence.
  - Alternative considered: keep scope only in CLI output. That does not help the runtime/model side avoid unsupported memory.

- Keep projection bounded and host-owned.
  - Rationale: PageIndex records are evidence catalogs, not full transcript stores. Projection must not read durable transcript content or invent missing context.
  - Alternative considered: hydrate full turns from session storage. That increases privacy, budget, and replay risk and belongs to a later governed memory design.

## Risks / Trade-offs

- Scope metadata may be missing on older session references -> Default to `session` for backward compatibility while keeping incomplete PageIndex references unresolved if page/previews are missing.
- Workspace summaries may become stale -> Keep provenance explicit and bounded; freshness/invalidations remain future ContextGraph concerns.
- Tests rely on deterministic fake platform storage -> Scope the regression to existing fake runtime and JSONL records to avoid host-specific terminal behavior.
