## Context

The chat host already stores palette composition state with reference sets and active reference focus. `runAgentLoop` already accepts a contract-level `AgentLoopRequest` and emits deterministic started/turn/model request events. Today that request only carries prompt/session/model/runtime options, so reference sets are host-visible state only.

Chat host 已经保存带 reference sets 与 active reference focus 的 palette composition state。`runAgentLoop` 已经接受 contract-level `AgentLoopRequest` 并输出确定性的 started/turn/model request events。当前该 request 只携带 prompt/session/model/runtime options，因此 reference sets 仍只是 host-visible state。

## Goals / Non-Goals

**Goals:**

- Define a serializable, host-agnostic reference context DTO under platform contracts.
- Build the DTO from chat palette reference state for non-slash prompt turns.
- Surface the DTO in runtime events and model request metadata for deterministic tests and future context projection.
- Keep slash controls local and keep prompt text byte-for-byte user supplied.
- Avoid raw file contents, file reads, or token-budget expansion in this slice.

- 在 platform contracts 下定义可序列化、host-agnostic 的 reference context DTO。
- 对非 slash prompt turns，从 chat palette reference state 构建该 DTO。
- 在 runtime events 与 model request metadata 中暴露该 DTO，供确定性测试与后续 context projection 使用。
- Slash controls 继续保持本地，prompt text 保持用户输入原文。
- 本阶段避免 raw file contents、file reads 或 token-budget expansion。

**Non-Goals:**

- No automatic file reading or context injection into model prompt text.
- No context ranking, summarization, truncation, or token budget accounting.
- No persistence of reference sets across CLI processes.
- No VSCode/server projection in this slice.

- 不自动读取文件，也不把 context 注入 model prompt text。
- 不做 context ranking、summarization、truncation 或 token budget accounting。
- 不跨 CLI 进程持久化 reference sets。
- 本阶段不做 VSCode/server projection。

## Decisions

1. Add `AgentLoopReferenceContext` to `platform-contracts`.

   The contract mirrors reference-set state but strips host-only UI details. Items carry ids, kind, target, label, order, provenance, optional budget metadata, and redaction. The context carries active reference ids and summary counts.

   在 `platform-contracts` 中增加 `AgentLoopReferenceContext`。该契约映射 reference-set state，但去掉 host-only UI 细节。Items 携带 ids、kind、target、label、order、provenance、可选 budget metadata 与 redaction。Context 携带 active reference ids 与 summary counts。

2. Emit metadata, not prompt mutations.

   `runAgentLoop` will include reference context in `agent.loop.started`, `turn.started`, hook inputs, and model provider metadata. The `messages` array and `prompt` string remain unchanged, so this change does not smuggle raw references into model text.

   输出 metadata，而不是修改 prompt。`runAgentLoop` 会在 `agent.loop.started`、`turn.started`、hook inputs 与 model provider metadata 中包含 reference context。`messages` array 与 `prompt` string 保持不变，因此不会把 raw references 偷塞进 model text。

3. Build context in the CLI host from existing composition state.

   Chat owns the local reference state. A helper in `palette-state.ts` will serialize the active reference state into the contract DTO. If no references exist, the field is omitted.

   在 CLI host 中从现有 composition state 构建 context。Chat 拥有本地 reference state。`palette-state.ts` 中的 helper 会把 active reference state 序列化为 contract DTO。没有 references 时省略该字段。

## Risks / Trade-offs

- **Risk:** Users may expect model answers to use file contents immediately. → **Mitigation:** The output is explicit metadata only; raw content projection is a follow-up gate with security/budget controls.
- **Risk:** Metadata can leak sensitive paths. → **Mitigation:** Reuse redaction metadata and mark target/label fields internal in externally visible records.
- **Risk:** Future context engine projection may need richer DTOs. → **Mitigation:** Use a versioned-like schema field and preserve target/provenance structure for extension.

- **风险：** 用户可能期待模型立即使用文件内容。→ **缓解：** 当前只输出显式 metadata；raw content projection 是后续带 security/budget controls 的门禁。
- **风险：** Metadata 可能泄漏敏感 paths。→ **缓解：** 复用 redaction metadata，并将 target/label fields 标为 internal。
- **风险：** 后续 context engine projection 可能需要更丰富 DTO。→ **缓解：** 使用 schema 字段并保留 target/provenance 结构，便于扩展。

## Migration Plan

1. Add contract DTO and request field.
2. Add chat serialization helper.
3. Emit metadata in runtime started/turn/model events.
4. Add regression tests and run verification.

1. 增加 contract DTO 与 request field。
2. 增加 chat serialization helper。
3. 在 runtime started/turn/model events 中输出 metadata。
4. 增加回归测试并运行验证。

## Open Questions

None for this slice. Raw content projection and budgeted context insertion remain future changes.

本阶段无开放问题。Raw content projection 与 budgeted context insertion 仍是后续变更。
