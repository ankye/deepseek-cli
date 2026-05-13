## Context

The current manifest resolver downgrades semantic providers when their implementation status is missing, and the CLI `index-provider set` path writes semantic providers with `implementationStatus: "missing"`. That protects the normal CLI path, but a future config source, profile, or runtime manifest could claim `implementationStatus: "available"` without carrying evidence that the embedding provider, vector store, code analyzer, and PageIndex provenance path are actually wired.

当前 manifest resolver 会在 semantic provider 缺少 implementation status 时降级，CLI `index-provider set` 也会把 semantic providers 写成 `implementationStatus: "missing"`。这保护了常规 CLI 路径，但未来 config source、profile 或 runtime manifest 仍可能只声明 `implementationStatus: "available"`，却没有携带 embedding provider、vector store、code analyzer 与 PageIndex provenance path 已接入的证据。

## Goals / Non-Goals

**Goals:**
- Make activation evidence a bounded, host-agnostic contract.
- Keep PageIndex enabled as deterministic truth source.
- Require provider-specific evidence before semantic providers become effectively enabled.
- Keep doctor/readiness output offline and redacted while showing what evidence is missing.
- Preserve existing CLI intent behavior: requesting ZVec enabled still stores intent, but effective status remains deferred until evidence exists.

**Non-Goals:**
- Implement ZVec, embeddings, vector stores, code analyzers, ANN ranking, or semantic recall execution.
- Validate provider credentials or call live provider SDKs.
- Persist a new standalone provider evidence file.
- Replace PageIndex provenance requirements.

## Decisions

- Add `activationEvidence` to both manifest entries and resolved provider diagnostics.
  - Rationale: the input and output shapes need to stay inspectable, replayable, and serializable.
  - Alternative considered: hide evidence in metadata. That would make tests and doctor output less explicit and easier to bypass.

- Use typed evidence kinds with present/missing/unknown status.
  - Rationale: future providers can add evidence types without carrying implementation objects or secrets.
  - Alternative considered: use a boolean `ready`. That would not explain which piece is missing.

- Gate semantic providers by provider-specific required evidence:
  - ZVec requires `implementation-module`, `embedding-provider`, and `vector-store`.
  - code-index requires `implementation-module`, `code-analyzer`, and `pageindex-provenance`.
  - Rationale: `implementationStatus: "available"` is necessary but not sufficient; actual activation needs the pieces that support the advertised ranking.

- Treat missing activation evidence as a downgrade diagnostic, not an exception.
  - Rationale: doctor and status commands must explain unsafe configuration without breaking local workflows.

## Risks / Trade-offs

- [Risk] Real providers may need more evidence kinds later. -> Mitigation: keep evidence kinds versioned, metadata-extensible, and additive.
- [Risk] Users may see `requested=enabled` but `effective=deferred`. -> Mitigation: diagnostics identify the missing evidence kinds and suggested action.
- [Risk] Evidence can still be fabricated by a manifest source. -> Mitigation: this change blocks accidental status-only enablement; future runtime-owned evidence can add source trust levels and signatures.
