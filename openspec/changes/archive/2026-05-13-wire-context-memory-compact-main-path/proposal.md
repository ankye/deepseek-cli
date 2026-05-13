## Why

Long CLI coding sessions still depend mostly on per-turn prompt/reference projection, so the agent can lose earlier decisions, tool evidence, and memory unless the user manually re-attaches context. / 长时间 CLI coding session 目前仍主要依赖单回合 prompt/reference projection，agent 容易丢失早先决策、工具证据和记忆，除非用户手动重新挂载上下文。

R2/R3 already has context projection, PageIndex recall, code intelligence, memory/cache contracts, and replayable runtime events. This change wires those pieces into the daily `run`/`chat` main path so memory, compact boundaries, tool-result evidence, and code-intelligence references become first-class, bounded context evidence before host promotion. / R2/R3 已具备 context projection、PageIndex recall、code intelligence、memory/cache contracts 和可 replay runtime events。本变更把这些能力接入日常 `run`/`chat` 主路径，让 memory、compact boundary、tool-result evidence 与 code-intelligence references 在 host promotion 前成为一等、有界的上下文证据。

## What Changes

- Runtime context projection will collect eligible `MemoryManager` entries for working/session/project scopes and convert them into typed `ContextGraphNode` candidates with provenance, redaction, deterministic priority, dependency fingerprints, and degradation metadata. / Runtime context projection 会收集 working/session/project scope 的 eligible `MemoryManager` entries，并转换为带 provenance、redaction、deterministic priority、dependency fingerprints 和 degradation metadata 的 typed `ContextGraphNode` candidates。
- Agent loop will emit compact boundary events when projection reaches configured compact pressure, recording a replay boundary instead of silently rewriting prompts. / 当 projection 达到配置的 compact pressure 时，agent loop 会发出 compact boundary events，把压缩记录为 replay boundary，而不是静默改写 prompt。
- Tool execution results will be summarized into bounded, redacted evidence records that can enter cache/replay and future context projection without exposing raw stdout/stderr or host renderer state. / 工具执行结果会被摘要为有界、脱敏的 evidence records，可进入 cache/replay 与后续 context projection，不暴露 raw stdout/stderr 或 host renderer state。
- Code intelligence will expose references/definitions context evidence through the runtime projection path, with safe fallback when analyzers cannot resolve symbols. / Code intelligence 会通过 runtime projection path 暴露 references/definitions context evidence，analyzer 无法解析 symbol 时安全降级。
- CLI text/JSON/JSONL output will continue to render existing runtime events; new memory/compact/evidence metadata must be structured and host-neutral. / CLI text/JSON/JSONL 继续渲染现有 runtime events；新增 memory/compact/evidence metadata 必须结构化且 host-neutral。
- No breaking changes. / 无 breaking changes。

## Capabilities

### New Capabilities

- None. / 无。

### Modified Capabilities

- `agent-loop`: runtime turns must include bounded memory candidates, compact boundary events, and tool-result evidence records in the host-neutral event stream. / runtime 回合必须在 host-neutral event stream 中包含有界 memory candidates、compact boundary events 与 tool-result evidence records。
- `context-engine`: projection must accept runtime memory candidates and code-intelligence references/definitions with the same budget, redaction, cache, and replay rules as file/PageIndex references. / projection 必须接受 runtime memory candidates 与 code-intelligence references/definitions，并应用与 file/PageIndex references 相同的 budget、redaction、cache 和 replay rules。
- `memory-cache-management`: memory/cache contracts must define bounded turn evidence, compact boundary metadata, and deterministic memory candidate fingerprints. / memory/cache contracts 必须定义有界 turn evidence、compact boundary metadata 与 deterministic memory candidate fingerprints。
- `code-intelligence`: references/definitions evidence must be projectable as context candidates and safely degrade when unavailable. / references/definitions evidence 必须可投影为 context candidates，并在不可用时安全降级。
- `testing-regression`: regression coverage must include memory projection, compact boundary replay, tool-result evidence redaction, and code-intelligence reference/definition fallback. / regression coverage 必须包含 memory projection、compact boundary replay、tool-result evidence redaction 与 code-intelligence reference/definition fallback。

## Impact

- Owner packages / 责任包: `runtime`, `context-engine`, `memory-cache-management`, `code-intelligence`, `runtime-message-bus`, `testing-regression`.
- Host surface / Host 表面: CLI-first (`deepseek run`, `deepseek chat`) through shared runtime events; no VSCode/server behavior changes in this pack. / 通过共享 runtime events 影响 CLI-first 的 `deepseek run`、`deepseek chat`；本包不改变 VSCode/server 行为。
- Protocol impact / 协议影响: additive runtime event payload metadata for memory candidates, compact boundaries, and tool-result evidence. / 对 runtime event payload metadata 做 additive 扩展，增加 memory candidates、compact boundaries 与 tool-result evidence。
- Data/privacy class / 数据与隐私等级: local/sensitive; all projected memory and tool evidence must carry redaction metadata and avoid raw secrets. / local/sensitive；所有投影 memory 与 tool evidence 必须携带 redaction metadata，避免 raw secrets。
- Acceptance evidence / 验收证据: focused contract/integration/golden tests plus OpenSpec validation. / 聚焦 contract/integration/golden tests 与 OpenSpec validation。
