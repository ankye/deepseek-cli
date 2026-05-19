## 1. Contracts And Fixtures

- [x] 1.1 Add visible reasoning DTOs to `@deepseek/platform-contracts` for records, steps, actors, statuses, evidence links, projection state, renderer detail level, privacy/redaction metadata, and compatibility metadata.
- [x] 1.2 Export visible reasoning contracts from package public entrypoints and add schema/versioning fixtures.
- [x] 1.3 Add contract tests for serialization, deterministic ordering, required ids, privacy classes, evidence links, and raw provider/internal reasoning exclusion.
- [x] 1.4 Add redaction pit fixtures covering API keys, authorization headers, env-style credentials, private-key-like content, file previews, tool output previews, plugin metadata, and provider reasoning payloads.

## 2. Runtime And Prompt Integration

- [x] 2.1 Add visible reasoning builders/helpers in shared packages without importing app hosts or provider SDKs.
- [x] 2.2 Emit intent, assumption, context-selection, tool-intent, edit-decision, verification, risk, and outcome records from the agent loop boundaries.
- [x] 2.3 Integrate prompt assembly output contracts so model-authored rationale summaries are captured as bounded visible reasoning summaries.
- [x] 2.4 Connect reasoning records to existing trace ids, context nodes, evidence-first records, command evidence, diagnostics, result lists, and replay fingerprints.
- [x] 2.5 Add replay tests that detect visible reasoning drift without requiring raw prompt, raw file content, or raw provider reasoning persistence.

## 3. CLI And TUI Rendering

- [x] 3.1 Add plain text rendering for compact visible reasoning blocks with stable ids for follow-up inspection.
- [x] 3.2 Add JSON and JSONL rendering for schema-versioned visible reasoning records without ANSI or terminal-only metadata.
- [x] 3.3 Add interactive TUI reasoning panel state with compact/full/detail levels, ordered steps, status markers, evidence counts, and focus state.
- [x] 3.4 Add inspector navigation from focused reasoning steps to context items, command output, diff summary, diagnostics, result lists, checks, and plugin contributions.
- [x] 3.5 Add terminal fixture tests for narrow width, no color, non-TTY, JSON, JSONL, Windows-like, and unsupported raw-input profiles.

## 4. Plugin Contributions

- [x] 4.1 Extend first-party dev plugin metadata to declare visible reasoning contribution support.
- [x] 4.2 Add bounded reasoning contribution records for context compactor, repo navigator, git review, and dev checks workflows.
- [x] 4.3 Validate plugin reasoning contributions for ids, size limits, stale evidence links, unsupported privacy classes, and missing redaction metadata before projection.
- [x] 4.4 Add contract tests proving unsafe plugin reasoning is rejected or degraded with structured diagnostics.

## 5. Product Quality And Docs

- [x] 5.1 Update CLI help and README docs to describe visible reasoning, detail levels, structured outputs, and privacy boundaries.
- [x] 5.2 Add acceptance evidence that shows a complete turn from intent through context, actions, verification, final outcome, and evidence navigation.
- [x] 5.3 Ensure diagnostics and support bundles include only redacted visible reasoning summaries and projection fingerprints.
- [x] 5.4 Run `openspec validate add-visible-reasoning-surface --strict`, `npm run typecheck`, `npm run lint`, `npm test`, `node scripts/check-boundaries.mjs`, and relevant CLI/TUI renderer tests.
