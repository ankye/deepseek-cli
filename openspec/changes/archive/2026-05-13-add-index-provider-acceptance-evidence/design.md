## Context

The index-provider CLI command is intentionally local and conservative: it writes provider intent, then relies on shared manifest normalization to show effective status. That behavior is safety-critical because it prevents `zvec enabled` from being mistaken for a working semantic provider.

index-provider CLI 命令刻意保持本地和保守：它写入 provider intent，然后依赖 shared manifest normalization 显示 effective status。这个行为是 safety-critical，因为它防止 `zvec enabled` 被误认为已经拥有可工作的 semantic provider。

## Goals / Non-Goals

**Goals:**
- Add e2e coverage in the existing local readiness CLI suite.
- Update acceptance evidence indexing to mention index-provider safety.
- Keep tests deterministic and isolated in temporary workspaces.

**Non-Goals:**
- Add new provider functionality.
- Refresh all acceptance output artifacts.
- Add a new acceptance command script.

## Decisions

- Put coverage in `tests/e2e/local-readiness-cli.test.ts`.
  - Rationale: the command is local readiness/configuration behavior, not runtime model execution.
  - Alternative considered: CLI host adapter smoke. That suite already builds the CLI and covers host boundaries; local readiness is a closer fit.

- Update `scripts/write-acceptance-index.mjs`.
  - Rationale: the acceptance index is generated, so source script changes prevent regeneration drift.

## Risks / Trade-offs

- [Risk] The e2e command writes config in the process workspace. -> Mitigation: reuse the suite helper that runs in a temporary directory and removes it after the test.
- [Risk] Acceptance text can become stale. -> Mitigation: keep the wording tied to command names and evidence files rather than implementation details.
