## Context

Runtime event persistence already writes `at` and bus `createdAt` values, but the in-memory `RuntimeEvent` object does not carry the timestamp. CLI PageIndex sees only the terminal event object, so it currently falls back to a deterministic timestamp source.

Runtime event persistence 已经写入 `at` 与 bus `createdAt`，但内存中的 `RuntimeEvent` object 不携带 timestamp。CLI PageIndex 只能看到 terminal event object，因此当前只能使用 deterministic fallback timestamp source。

## Goals / Non-Goals

**Goals:**
- Add a canonical event timestamp to all runtime events.
- Keep timestamps deterministic in existing tests.
- Let PageIndex classify timestamps as runtime-sourced when terminal events include `createdAt`.

**Non-Goals:**
- Add wall-clock freshness thresholds.
- Change event ordering, ids, traces, or payload shapes beyond adding `createdAt`.
- Change model provider behavior.

## Decisions

- Stamp events inside event factory helpers and kernel event conversion.
  - Rationale: these are the canonical construction points for runtime events.
  - Alternative considered: make CLI infer timestamp from session records. That would couple CLI host to persistence internals.

- Use deterministic epoch timestamp in helper functions.
  - Rationale: current test runtime already treats adapter events as replayable epoch events. This preserves existing deterministic suites while making the timestamp explicit.

## Risks / Trade-offs

- Contract expansion touches many event producers -> Mitigation: add `createdAt` in central factories and kernel conversion helpers.
- Some external consumers may ignore `createdAt` -> It is additive and JSON-compatible.
