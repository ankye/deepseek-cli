## Context

The CLI can now show index provider diagnostics, but those diagnostics are hard-coded defaults. The next step is not a real vector implementation; it is a provider manifest layer that lets host adapters and config services express provider intent while shared code validates and downgrades unsupported capabilities.

CLI 现在可以显示 index provider diagnostics，但这些 diagnostics 还是硬编码默认值。下一步不是实现真实向量能力，而是增加 provider manifest layer，让 host adapters 与 config services 表达 provider intent，同时由 shared code 校验并降级未支持能力。

## Goals / Non-Goals

**Goals:**
- Add host-agnostic manifest DTOs for index provider configuration.
- Normalize partial, missing, duplicate, or unsafe manifest entries into deterministic diagnostics.
- Keep PageIndex enabled by default.
- Prevent configured semantic providers from being reported as enabled unless implementation evidence is present.
- Surface manifest source and validation diagnostics through doctor output.

**Non-Goals:**
- Implement ZVec storage, embedding generation, ANN search, or code semantic ranking.
- Read raw provider credentials, environment secrets, or SDK state.
- Add a new CLI command or interactive config editor.
- Persist a new manifest file format in this slice.

## Decisions

- Resolve manifests in `@deepseek/index-provider`.
  - Rationale: provider normalization belongs near provider diagnostics and must be shared by CLI, VSCode, runtime, and tests.
  - Alternative considered: resolve in CLI readiness. That would move provider semantics into the host adapter.

- Add `implementationStatus` to manifest entries.
  - Rationale: configuration intent is different from runtime capability. A user may request ZVec, but until implementation evidence exists, diagnostics must remain deferred.
  - Alternative considered: trust `status: enabled` from config. That would recreate the Claude-style pitfall where UI implies a capability that the backend cannot honor.

- Treat malformed entries as diagnostics, not exceptions.
  - Rationale: doctor commands should be robust and explain configuration problems without crashing first-run flows.
  - Alternative considered: throw on invalid manifests. That would make diagnostics less useful and harder to use in broken configs.

## Risks / Trade-offs

- [Risk] The manifest shape may evolve when real providers land. -> Mitigation: keep it small, versioned, and metadata-extensible.
- [Risk] Users may expect `enabled` config to activate ZVec immediately. -> Mitigation: resolver distinguishes requested status from effective status and emits validation diagnostics.
- [Risk] Config-derived metadata could leak secrets. -> Mitigation: manifest DTO excludes credentials and uses redaction metadata for all source and provider metadata.
