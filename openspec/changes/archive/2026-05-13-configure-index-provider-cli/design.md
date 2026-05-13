## Context

Index provider manifests are now normalized by shared code, and CLI doctor can show effective provider status. The remaining gap is an ergonomic local CLI command for reading and writing provider intent without hand-editing config JSON.

Index provider manifests 现在由 shared code 归一化，CLI doctor 可以显示 effective provider status。剩余缺口是一个本地 CLI 命令，用于读取与写入 provider intent，避免用户手工编辑 config JSON。

## Goals / Non-Goals

**Goals:**
- Add a thin CLI host adapter for index provider config/status.
- Persist provider intent through `PersistentConfigService` under the existing `indexProviders` key.
- Render effective diagnostics by calling `resolveIndexProviderDiagnostics`.
- Keep the command scriptable in text, JSON, and JSONL.

**Non-Goals:**
- Implement real semantic provider activation.
- Add interactive prompts or rich TUI controls.
- Read provider credentials or environment secrets.
- Add a new shared command-system primitive in this slice.

## Decisions

- Use a dedicated top-level `index-provider` command instead of overloading `config set`.
  - Rationale: provider intent is structured and needs effective-status preview after normalization.
  - Alternative considered: document raw `config set indexProviders <json>`. That is brittle and easy to misconfigure.

- Store only requested intent in config.
  - Rationale: effective status must remain computed from implementation evidence, not persisted as truth.
  - Alternative considered: store diagnostics output. That would go stale and mix config with runtime evidence.

- Keep parsing constrained to known providers and statuses.
  - Rationale: unknown values should fail locally instead of creating config that later doctor must repair.
  - Alternative considered: accept arbitrary provider ids for future plugins. That requires a registry/permission model not present in this slice.

## Risks / Trade-offs

- [Risk] A user may expect `set zvec enabled` to activate ZVec. -> Mitigation: output includes requested/effective status and downgrade diagnostics.
- [Risk] Adding another CLI command increases parser surface. -> Mitigation: keep it narrow: `status` and `set`.
- [Risk] Config key validation may warn on `indexProviders`. -> Mitigation: add it to known config keys.
