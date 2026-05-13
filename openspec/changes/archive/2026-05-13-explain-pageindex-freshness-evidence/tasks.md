## 1. CLI Recall Explain

- [x] 1.1 Add bounded freshness evidence extraction from PageIndex result metadata.
- [x] 1.2 Include freshness evidence in `/palette recall explain` JSON/JSONL and compact text output.
- [x] 1.3 Ensure recall result target metadata preserves evidence quality fields needed by references.

## 2. Context Projection

- [x] 2.1 Read PageIndex freshness evidence from reference metadata during projection.
- [x] 2.2 Render a compact model-visible freshness evidence line.
- [x] 2.3 Preserve freshness evidence in node provenance and dependency fingerprints.

## 3. Tests

- [x] 3.1 Add CLI tests for stale and unknown freshness explain evidence.
- [x] 3.2 Add projection assertions for model-visible freshness evidence and provenance/fingerprint behavior.

## 4. Validation

- [x] 4.1 Run focused CLI/runtime tests and OpenSpec change validation.
- [x] 4.2 Run typecheck, lint, boundary checks, and full tests as needed.
