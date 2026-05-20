## 1. Contracts And Compatibility

- [x] 1.1 Add platform-contract DTOs for `ContextBlock`, `ContextPipelineLayer`, `ContextPrefixHash`, `ContextPipelineManifest`, cache hints, exclusions, and cache evidence.
- [x] 1.2 Add schema-version, compatibility, redaction, and stable-id helpers for pipeline DTOs.
- [x] 1.3 Add provider capability metadata for explicit cache-hint support without exposing provider-specific fields outside `model-gateway`.

## 2. Context Engine Pipeline Projection

- [x] 2.1 Add a compatibility projector that derives pipeline manifests from existing `ContextProjectionResult.selectedNodes`.
- [x] 2.2 Implement canonical layer assignment for kernel, project, session, and current-turn blocks based on lifecycle, source, and volatility.
- [x] 2.3 Compute deterministic block hashes, dependency fingerprints, layer prefix hashes, and overall pipeline fingerprint.
- [x] 2.4 Preserve existing context projection behavior for callers that do not request pipeline output.
- [x] 2.5 Add structured diagnostics for prefix stability changes and excluded high-priority blocks.

## 3. Cache And Manifest Storage

- [x] 3.1 Add content-addressed cache entry factories for immutable context blocks in `memory-cache-management`.
- [x] 3.2 Add pipeline manifest cache records keyed by session id, turn id, and pipeline fingerprint metadata.
- [x] 3.3 Add manifest comparison helpers that identify first changed layer/block and affected token estimates.

## 4. Prompt Assembly Integration

- [x] 4.1 Teach prompt assembly to consume pipeline manifests as typed ordered evidence.
- [x] 4.2 Preserve kernel, project, session, current-turn layer order in model-visible section planning.
- [x] 4.3 Include pipeline fingerprint, layer prefix hashes, included/excluded block ids, and cache hint summary in assembly evidence.
- [x] 4.4 Keep existing section assembly behavior as a fallback until pipeline output is enabled in runtime.

## 5. Runtime Event Loop And Tool Results

- [x] 5.1 Build model request assembly from pipeline manifests in the runtime main path behind a compatibility switch or diagnostics-first path.
- [x] 5.2 Route full raw tool outputs to current-turn tail or artifact storage while adding only bounded summaries/references to stable session blocks.
- [x] 5.3 Emit replay-safe runtime evidence for pipeline fingerprint, layer hashes, block counts, exclusions, and cache hints.
- [x] 5.4 Add compact-boundary handling that replaces only bounded contiguous session ranges and records source block hashes.

## 6. Model Gateway And Protocol

- [x] 6.1 Carry pipeline fingerprint and cache hints from prompt assembly into provider-neutral model requests.
- [x] 6.2 Map cache hints to provider-specific request metadata only when selected provider capability metadata supports it.
- [x] 6.3 Normalize provider cache hit/miss token counts and attach them to pipeline fingerprint evidence.
- [x] 6.4 Add additive communication-protocol metadata for pipeline fingerprint, prefix hashes, and cache evidence summaries.

## 7. Runtime Message Bus Backpressure

- [x] 7.1 Add context-stream event shapes for pipeline block transfer, stream completion, stream failure, and backpressure.
- [x] 7.2 Enforce bounded queue/backpressure behavior for oversized context/tool-result streams.
- [x] 7.3 Ensure backpressure records include stream id, correlation id, affected block ids, overflow policy, and redaction metadata.

## 8. Tests And Acceptance Evidence

- [x] 8.1 Add unit tests for block hashing, layer assignment, prefix hash computation, and manifest comparison.
- [x] 8.2 Add integration tests proving stable kernel/project prefix hashes across turns with different current user input.
- [x] 8.3 Add tests proving project changes invalidate project prefix while keeping kernel prefix stable.
- [x] 8.4 Add tests proving oversized tool results are summarized out of stable prefix layers.
- [x] 8.5 Add deterministic provider fixture tests for cache hit/miss metric normalization.
- [x] 8.6 Add golden replay coverage for pipeline manifest stability, compaction, and cache opportunity diagnostics.
- [x] 8.7 Update acceptance evidence for CLI diagnostics showing prefix stability and cache evidence.

## 9. CLI Statusline Telemetry

- [x] 9.1 Add a bounded statusline telemetry DTO/projection with cache hit rate, cache hit/miss tokens, selected model, thinking mode, context tokens, context budget, and prefix stability status.
- [x] 9.2 Feed statusline telemetry from pipeline manifest evidence, model request metadata, and normalized usage records without exposing raw context content.
- [x] 9.3 Render the telemetry in CLI/TUI statusline and compact/narrow layouts without triggering model calls.
- [x] 9.4 Add deterministic tests for cache hit rate, model, thinking mode, context size, and budget pressure rendering.

## 10. Verification

- [x] 10.1 Run `openspec validate introduce-context-pipeline-prefix-cache --strict`.
- [x] 10.2 Run `npm run typecheck`.
- [x] 10.3 Run `npm run lint`.
- [x] 10.4 Run focused unit/integration/golden tests for context pipeline, cache evidence, and statusline telemetry.
- [x] 10.5 Run `npm test` or document why a narrower suite is sufficient for the implementation slice.
