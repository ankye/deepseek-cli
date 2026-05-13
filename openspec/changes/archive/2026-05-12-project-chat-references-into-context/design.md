## Context

The CLI can maintain reference sets and submit them as `AgentLoopRequest.referenceContext`. The runtime already calls `projectAgentLoopContext` before model dispatch, and the context engine already accepts typed `candidateNodes`. The missing link is the governed resolution from selected reference metadata into bounded context candidates, plus a runtime-owned prompt assembly step that makes selected projection content model-visible.

CLI 已能维护 reference sets，并通过 `AgentLoopRequest.referenceContext` 提交。Runtime 已经在 model dispatch 前调用 `projectAgentLoopContext`，context engine 也已经接受 typed `candidateNodes`。缺失的是：把 selected reference metadata 受治理地解析为有界 context candidates，并由 runtime-owned prompt assembly 将被选中的 projection 内容暴露给模型。

## Goals / Non-Goals

**Goals:**

- Resolve supported file references from `referenceContext` into context graph candidate nodes.
- Use platform path resolution and platform file reads in runtime-owned projection code, not CLI prompt assembly.
- Preserve projection budget, redaction, cache, and replay semantics by sending candidates through `ContextEngine.projectGraph`.
- Add model-visible projected context as a deterministic system message and model metadata.
- Emit selected/excluded reference evidence without raw secret leakage.
- Add a local CLI reference command that can record a file target without reading it.

- 从 `referenceContext` 解析 supported file references 为 context graph candidate nodes。
- 在 runtime-owned projection code 中使用 platform path resolution 与 platform file reads，而不是在 CLI 中拼 prompt。
- 通过 `ContextEngine.projectGraph` 保持 projection budget、redaction、cache 与 replay 语义。
- 将 model-visible projected context 作为确定性 system message 与 model metadata 加入 model request。
- 输出 selected/excluded reference evidence，且不泄漏 raw secrets。
- 增加一个本地 CLI reference command，用于记录 file target，但不读取文件。

**Non-Goals:**

- No directory expansion, symbol resolution, diff reconstruction, prior message replay, or tool-evidence materialization in this slice.
- No VSCode/server host projection.
- No user-facing raw-mode picker or full Vim buffer/register behavior.
- No bypass of context engine redaction or model gateway contracts.

- 本阶段不做 directory expansion、symbol resolution、diff reconstruction、prior message replay 或 tool-evidence materialization。
- 不做 VSCode/server host projection。
- 不做用户可见 raw-mode picker 或完整 Vim buffer/register 行为。
- 不绕过 context engine redaction 或 model gateway contracts。

## Decisions

1. Runtime owns reference materialization.

   The CLI records `target.kind="file"` and `target.path` through a local slash command. It never reads the file or mutates prompt text. Runtime uses `deps.platform.resolveWorkspacePath(workspaceRoot, path)` and `deps.platform.readFile(resolved.path)` to create candidates. This keeps host adapters thin and preserves platform policy.

   Runtime 拥有 reference materialization。CLI 仅通过本地 slash command 记录 `target.kind="file"` 与 `target.path`，不读取文件、不修改 prompt text。Runtime 使用 `deps.platform.resolveWorkspacePath(workspaceRoot, path)` 与 `deps.platform.readFile(resolved.path)` 创建 candidates，以保持 host adapters 轻量并复用 platform policy。

2. Unsupported references become excluded candidates/evidence.

   Directory, symbol, diagnostic, diff, message, turn, and tool-evidence targets remain metadata-only for now. Projection events list them as unresolved/excluded reference ids rather than failing the entire turn. File references that fail path resolution or read are also excluded. Hard budget rejection remains owned by context engine.

   Unsupported references 转成 excluded candidates/evidence。directory、symbol、diagnostic、diff、message、turn 与 tool-evidence targets 当前仍保持 metadata-only。Projection events 记录 unresolved/excluded reference ids，而不是让整个 turn 失败。path resolution 或 read 失败的 file references 也会被排除。Hard budget rejection 仍由 context engine 拥有。

3. Prompt assembly is runtime-owned and deterministic.

   `projectAgentLoopContext` will return a projection result after emitting events. The agent loop will add one system message containing a bounded context block only when selected non-user reference nodes exist. The original user prompt remains byte-for-byte unchanged in the user message. Model metadata carries projection summary and full `referenceContext`.

   Prompt assembly 由 runtime 拥有且确定化。`projectAgentLoopContext` 在发出事件后返回 projection result。Agent loop 仅在存在 selected non-user reference nodes 时增加一条 system message，包含有界 context block。原始 user prompt 在 user message 中保持逐字不变。Model metadata 携带 projection summary 与完整 `referenceContext`。

4. Test through runtime/model boundary.

   The main regression will inject a fake file into `FakePlatformRuntime`, submit an `AgentLoopRequest` with a file reference, assert projection event counts, assert the model request includes a context system message, and assert the user prompt message is unchanged. A CLI test will cover `/palette refs add-file` locality and later prompt propagation.

   通过 runtime/model boundary 测试。主回归将向 `FakePlatformRuntime` 写入文件，提交带 file reference 的 `AgentLoopRequest`，断言 projection event counts、model request 包含 context system message，并断言 user prompt message 不变。CLI test 覆盖 `/palette refs add-file` 的本地性与后续 prompt propagation。

## Risks / Trade-offs

- **Risk:** File content can contain secrets. → **Mitigation:** context engine secret detection excludes/redacts before selected content reaches model-visible context.
- **Risk:** Reading large files can be expensive. → **Mitigation:** this slice reads only explicit file references and relies on context budget for selection; richer byte limits and streaming are follow-ups.
- **Risk:** Unsupported references surprise users. → **Mitigation:** projection events include typed exclusion metadata so UI can explain what was not materialized.
- **Risk:** Adding context as a system message changes model behavior. → **Mitigation:** it is deterministic, runtime-owned, separately tested, and original user prompt remains unchanged.

- **风险：** 文件内容可能包含 secrets。→ **缓解：** context engine secret detection 会在 selected content 进入模型可见 context 前排除/脱敏。
- **风险：** 读取大文件可能昂贵。→ **缓解：** 本阶段只读取显式 file references，并依赖 context budget 选择；更细的 byte limits 与 streaming 后续处理。
- **风险：** Unsupported references 可能让用户困惑。→ **缓解：** projection events 包含 typed exclusion metadata，UI 可解释哪些引用没有 materialize。
- **风险：** 以 system message 注入 context 会改变模型行为。→ **缓解：** 该路径确定化、归 runtime 拥有、有独立测试，且原始 user prompt 不变。
