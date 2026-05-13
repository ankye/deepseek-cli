## Context

The release evidence DTO already contains `verification.acceptanceEvidencePaths`, and JSON/JSONL output exposes it. Text output currently prints the verification command chain but not the evidence paths, which weakens the manual release workflow.

Release evidence DTO 已经包含 `verification.acceptanceEvidencePaths`，JSON/JSONL output 也会暴露它。Text output 目前打印 verification command chain，但不打印 evidence paths，这会削弱人工发布流程。

## Goals / Non-Goals

**Goals:**
- Add deterministic line-oriented text output for acceptance evidence paths.
- Keep output terminal safe: no ANSI, cursor controls, tables, or interactive state.
- Reuse existing release evidence DTOs.

**Non-Goals:**
- Add or change release evidence fields.
- Refresh latest acceptance artifacts.
- Change release readiness status logic.

## Decisions

- Render all acceptance evidence paths as a single comma-separated line.
  - Rationale: this matches existing concise text style and keeps output stable for tests and logs.
  - Alternative considered: one line per path. That is easier to scan for very long lists but makes output more verbose.

## Risks / Trade-offs

- [Risk] Long path lists make the text line wide. -> Mitigation: current list is bounded and deterministic; structured output remains available for machine parsing.
