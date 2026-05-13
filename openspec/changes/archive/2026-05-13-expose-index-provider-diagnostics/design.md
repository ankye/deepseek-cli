## Context

The index provider boundary now separates PageIndex DTOs and deterministic recall from the CLI host. The next pressure point is visibility: users can ask for PageIndex/ZVec/code-index strategy, but doctor diagnostics still report platform/auth/release state without saying which recall providers are actually active.

Index provider boundary 已经把 PageIndex DTO 与 deterministic recall 从 CLI host 中拆出。下一个压力点是可见性：用户会关心 PageIndex/ZVec/code-index 策略，但 doctor diagnostics 仍只报告 platform/auth/release 状态，没有说明哪些 recall providers 真正可用。

## Goals / Non-Goals

**Goals:**
- Define a bounded, serializable `IndexProviderDiagnosticsSummary` contract.
- Generate default provider diagnostics from `@deepseek/index-provider`.
- Report PageIndex as enabled and ZVec/code-index as deferred until real implementations are configured.
- Surface this summary through readiness and diagnostics doctor output in text, JSON, and JSONL-safe forms.
- Keep diagnostics metadata-only and secret-safe.

**Non-Goals:**
- Implement ZVec, vector storage, embedding provider adapters, ANN ranking, or code semantic indexing.
- Add environment probing for real provider credentials.
- Add a new top-level CLI command in this slice.
- Move CLI terminal rendering into shared packages.

## Decisions

- Put DTOs in `@deepseek/platform-contracts` and helper construction in `@deepseek/index-provider`.
  - Rationale: contracts stay host-agnostic and implementation-free, while deterministic summary generation can be reused by CLI, VSCode, runtime, and tests.
  - Alternative considered: build the summary directly in CLI diagnostics. That would duplicate provider rules and pull future semantic logic toward the host adapter.

- Represent ZVec and code-index as explicit `deferred` providers, not missing providers.
  - Rationale: product intent is visible without implying semantic recall works today.
  - Alternative considered: omit them until implemented. That hides roadmap-relevant state and makes it harder to explain PageIndex-only behavior.

- Thread diagnostics through `LocalReadinessEnvironment`.
  - Rationale: command-system owns readiness checks and can expose host-neutral metadata, while CLI remains responsible only for environment assembly and rendering.
  - Alternative considered: attach provider status only to `diagnostics doctor`. That would leave `readiness doctor` with a different story.

## Risks / Trade-offs

- [Risk] Users may read deferred providers as failures. -> Mitigation: status is `warn` only for semantic provider deferral, with messages saying deterministic PageIndex remains enabled.
- [Risk] The diagnostics contract may need more fields when real providers arrive. -> Mitigation: include bounded metadata and diagnostics arrays now, but avoid provider-specific SDK fields.
- [Risk] Structured output can leak future config details. -> Mitigation: use explicit redaction metadata and avoid raw credentials, paths, handles, and SDK instances.
