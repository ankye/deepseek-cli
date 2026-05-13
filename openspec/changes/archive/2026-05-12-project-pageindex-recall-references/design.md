## Context

The previous PageIndex slice created deterministic local recall pages and `/palette recall <query>` result lists. Result items already use `turn` targets with page id, session id, turn id, status, trace id, prompt preview, assistant preview, deterministic score, and semantic placeholder metadata.

上一片 PageIndex 已创建确定性的 local recall pages 与 `/palette recall <query>` result lists。Result items 已经使用 `turn` targets，并带 page id、session id、turn id、status、trace id、prompt preview、assistant preview、deterministic score 与 semantic placeholder metadata。

The current projection path only materializes file references. Non-file references are recorded as unsupported evidence. This change adds one narrow supported non-file case: a `turn` reference created from PageIndex recall metadata.

当前 projection path 只物化 file references。非 file references 会被记录为 unsupported evidence。本变更只增加一个狭窄的非 file supported case：由 PageIndex recall metadata 创建的 `turn` reference。

## Goals / Non-Goals

**Goals:**

- Keep `/palette refs add current` working for recall result items without special CLI prompt mutation.
- Materialize PageIndex recall references as `summary` context nodes in runtime projection.
- Use only bounded metadata already present on the reference target.
- Include projection evidence and provenance for page id, turn id, session id, trace id, and source command.
- Keep the model request user message unchanged.
- Ensure secret-like previews are excluded by existing context redaction policy.

**Non-Goals:**

- No full transcript lookup from session store.
- No durable PageIndex persistence.
- No semantic/ZVec ranking implementation.
- No projection of arbitrary `message`, `tool-evidence`, `diagnostic`, or generic `turn` references without PageIndex metadata.
- No new public contract kind; use existing `turn` reference and `summary` context node kinds.

## Decisions

1. **Projection accepts only PageIndex-shaped turn references.**

   Runtime projection checks `item.kind === "turn"` and `item.target.kind === "turn"` and requires metadata fields such as `pageId`, `promptPreview`, and `assistantPreview`. Other turn references remain unresolved evidence.

   Projection 只接受 PageIndex 形态的 turn references。Runtime projection 检查 `item.kind === "turn"` 与 `item.target.kind === "turn"`，并要求 `pageId`、`promptPreview`、`assistantPreview` 等 metadata。其他 turn references 仍作为 unresolved evidence。

2. **Materialized nodes are summaries.**

   The candidate node uses `kind=summary`, `source=host`, `lifecycle=turn`, and high but lower-than-file priority. Content is formatted as a PageIndex summary with bounded prompt and assistant previews.

   物化节点是 summary。Candidate node 使用 `kind=summary`、`source=host`、`lifecycle=turn`，priority 高但低于 file reference。Content 格式化为 PageIndex summary，包含有界 prompt 与 assistant previews。

3. **Reference metadata remains the source of materialization.**

   The runtime does not read transcript files or session history in this slice. This keeps privacy and replay behavior deterministic.

   Reference metadata 仍是物化来源。本片 runtime 不读取 transcript files 或 session history。这保持 privacy 与 replay behavior 的确定性。

4. **Context message includes host summary nodes.**

   Agent loop context-message rendering expands from host file nodes to supported host reference nodes. Labels come from provenance, and the node content remains runtime projection output.

   Agent loop context-message rendering 从 host file nodes 扩展到受支持的 host reference nodes。Label 来自 provenance，node content 保持 runtime projection output。

## Risks / Trade-offs

- [Risk] Summaries may include sensitive preview text. -> Mitigation: previews are bounded and run through the existing context secret/redaction classifier before model dispatch.
- [Risk] Arbitrary turn refs could pretend to be PageIndex refs. -> Mitigation: require PageIndex metadata and preserve provenance; future durable PageIndex can verify page ids.
- [Risk] Context message now includes host summary nodes. -> Mitigation: tests assert user prompt remains unchanged and projection evidence differentiates selected node kinds.
