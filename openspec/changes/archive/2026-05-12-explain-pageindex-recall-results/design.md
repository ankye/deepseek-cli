## Context

Recall result lists already contain bounded PageIndex metadata on each result item. Chat commands can inspect local palette state and render command-local JSON/JSONL/text output. The missing piece is a stable command path that selects an item from the active recall result list and renders its evidence fields directly.

Recall result list 已经在每个 result item 上包含有界 PageIndex metadata。Chat commands 能检查本地 palette state 并渲染 command-local JSON/JSONL/text output。缺失的是一个稳定命令路径，从 active recall result list 选择 item 并直接渲染其 evidence 字段。

## Goals / Non-Goals

**Goals:**
- Explain the current or selected PageIndex recall item from local state.
- Preserve bounded output and redaction metadata.
- Keep command behavior deterministic across text/json/jsonl modes.

**Non-Goals:**
- Explain arbitrary non-PageIndex result-list items.
- Read full transcripts, session event logs, workspace files, or model memory.
- Add semantic/vector explainability before ZVec integration exists.

## Decisions

- Implement explain in the PageIndex command module.
  - Rationale: the explain shape is PageIndex-specific and should not leak into generic palette state.
  - Alternative considered: generic result-list inspect. That would either be too vague or require every result source to define explain semantics now.

- Use current active item by default.
  - Rationale: it matches vi-style focused workflows and keeps the common path short: `/palette recall <q>` then `/palette recall explain`.
  - Alternative considered: require an id every time. That is less ergonomic for terminal navigation.

- Keep explain metadata-only.
  - Rationale: PageIndex is an evidence catalog, not a transcript store. Explain must not hydrate raw history.

## Risks / Trade-offs

- Active result list may not be a PageIndex recall list -> Return typed local failure.
- Users may expect full transcript -> Render explicit bounded preview fields and redaction metadata so the limitation is clear.
