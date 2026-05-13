## Context

Structured output already carries activation evidence after the provider evidence gate work. The remaining usability gap is text mode: a user running local CLI commands sees that ZVec is deferred, but not the concrete evidence kinds that keep it deferred.

结构化输出已经在 provider evidence gate 后携带 activation evidence。剩余的可用性缺口在 text mode：用户运行本地 CLI 命令时能看到 ZVec deferred，但看不到让它保持 deferred 的具体 evidence kinds。

## Goals / Non-Goals

**Goals:**
- Make text output explain provider activation status without requiring JSON parsing.
- Keep output deterministic, line-oriented, and terminal-profile safe.
- Reuse existing diagnostics/evidence DTOs rather than adding host-only state.
- Keep structured output backward-compatible.

**Non-Goals:**
- Add new provider contracts or manifest fields.
- Execute semantic providers or validate credentials.
- Add color, cursor control, tables, spinners, or interactive prompts.

## Decisions

- Render a compact evidence summary per provider.
  - Rationale: one deterministic line such as `evidence=embedding-provider:missing, vector-store:missing` is useful in CI and terminal logs.
  - Alternative considered: only render diagnostic codes. That is stable but too opaque for users.

- Derive missing evidence from provider metadata when available, otherwise from activation evidence statuses.
  - Rationale: the resolver already records exact missing kinds; text rendering should not reimplement provider-specific rules.

- Keep JSON/JSONL unchanged.
  - Rationale: downstream consumers already read full provider DTOs and do not need a presentation-specific field.

## Risks / Trade-offs

- [Risk] Text output gets too noisy as providers add more evidence kinds. -> Mitigation: render a single compact line per provider and only add missing-evidence detail when present.
- [Risk] Metadata shape changes later. -> Mitigation: fall back to activation evidence statuses and diagnostic codes.
