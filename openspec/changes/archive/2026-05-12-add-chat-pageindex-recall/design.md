## Context

The CLI already has local chat history, quickfix-style palette result lists, jump navigation, and reference-set controls. Those features make prior turns addressable, but they are still optimized for the current UI state rather than deterministic recall across a long conversation.

CLI 目前已经具备本地 chat history、quickfix-style palette result lists、jump navigation 与 reference-set controls。这些能力让先前 turns 可寻址，但仍主要服务当前 UI state，而不是长会话中的确定性回溯。

The user concern is that model memory degrades during long sessions. The first recall slice should therefore be a local, replayable PageIndex owned by the CLI host. It should search completed turns without asking the model, and it should produce typed targets that future reference/projection work can reuse.

用户的核心担忧是长会话中 model memory 会退化。因此第一片 recall 应由 CLI host 拥有一个本地、可回放的 PageIndex。它必须不询问 model 就能搜索已完成 turns，并产生未来 reference/projection 工作可复用的 typed targets。

## Goals / Non-Goals

**Goals:**

- Record each completed chat prompt turn as a bounded PageIndex page.
- Preserve page id, session id, turn id, status, trace id, sequence, prompt preview, assistant preview, and redaction metadata.
- Add `/palette recall <query>` as a local command that searches PageIndex pages deterministically.
- Represent recall matches as a quickfix-style result list with typed `turn` targets.
- Reuse existing palette navigation and jump history for recall results.
- Keep slash-command recall model-hidden and runtime-hidden.
- Reserve metadata for later semantic/ZVec ranking without making it part of the source of truth.

**Non-Goals:**

- No vector database, embeddings, or ZVec semantic search in this slice.
- No durable cross-process PageIndex persistence yet.
- No projection of PageIndex pages into model requests yet.
- No raw transcript storage in local result-list records.
- No full Vim buffer, mark, register, or macro behavior.

## Decisions

1. **PageIndex is a chat-local source of deterministic recall truth.**

   The CLI stores an in-memory `pageIndex` beside chat history for the active chat process. Each page is created only after the runtime returns a terminal event for a normal prompt turn.

   PageIndex 是 chat-local 的确定性 recall truth source。CLI 在 active chat process 内把 `pageIndex` 存在 chat history 旁边。每个 page 只在普通 prompt turn 收到 runtime terminal event 后创建。

2. **Pages store bounded previews, not full transcripts.**

   Prompt and assistant text are normalized and trimmed before entering PageIndex. The record includes redaction metadata describing those bounded fields. The full model/runtime event stream remains the trace source; PageIndex is a recall index, not transcript persistence.

   Pages 保存有界 preview，而不是完整 transcript。Prompt 与 assistant text 在进入 PageIndex 前会 normalize 并裁剪。记录包含描述这些有界字段的 redaction metadata。完整 model/runtime event stream 仍是 trace source；PageIndex 是 recall index，不是 transcript persistence。

3. **Recall results use `turn` targets.**

   `/palette recall <query>` creates `result-list:pageindex-recall` with `kind=search` and `sourceCommand=palette.recall`. Each item target uses `kind=turn`, `sessionId`, `turnId`, and metadata containing `pageId`, previews, status, trace id, sequence, deterministic score, and reserved semantic score fields.

   `/palette recall <query>` 创建 `result-list:pageindex-recall`，使用 `kind=search` 与 `sourceCommand=palette.recall`。每个 item target 使用 `kind=turn`、`sessionId`、`turnId`，metadata 包含 `pageId`、previews、status、trace id、sequence、确定性 score 与预留 semantic score 字段。

4. **Search is deterministic text matching first.**

   The first implementation scores normalized query terms across page id, turn id, session id, prompt preview, assistant preview, and status. Results are sorted by score, then recency, then page id. This avoids hidden model-dependent ranking.

   第一版搜索先使用确定性文本匹配。实现会在 page id、turn id、session id、prompt preview、assistant preview 与 status 上匹配 normalized query terms，并按 score、recency、page id 排序。这避免引入隐藏的 model-dependent ranking。

5. **Recall is navigation-only until projection is explicitly designed.**

   The existing runtime context projection only materializes supported file references. PageIndex recall target references therefore remain local navigation/evidence targets in this slice. A later change can teach projection how to materialize turn/page summaries under budget and redaction.

   在 projection 明确设计前，recall 只用于导航。现有 runtime context projection 只物化受支持的 file references。因此本片的 PageIndex recall target references 只作为本地 navigation/evidence targets。后续变更可在 budget 与 redaction 约束下让 projection 物化 turn/page summaries。

6. **ZVec is a future ranking layer over PageIndex, not a replacement.**

   PageIndex page ids, sequence, and bounded text remain the replayable truth. A future ZVec layer may attach semantic candidates or scores, but every semantic result must point back to a PageIndex page.

   ZVec 是 PageIndex 之上的未来 ranking layer，而不是替代品。PageIndex page ids、sequence 与 bounded text 保持为可回放 truth。未来 ZVec layer 可以附加 semantic candidates 或 scores，但每个 semantic result 必须指回 PageIndex page。

## Risks / Trade-offs

- [Risk] Bounded previews may not contain enough recall detail. -> Mitigation: preserve trace/session/turn ids so future richer retrieval can resolve the full governed source.
- [Risk] Assistant preview can echo sensitive user text. -> Mitigation: previews are bounded, marked internal, and recall result-list records avoid raw full transcript storage.
- [Risk] Turn targets can be added to references before projection supports them. -> Mitigation: current projection treats unsupported non-file references as evidence-only; this change does not promise model context injection.
- [Risk] Deterministic text search is less capable than semantic recall. -> Mitigation: reserve semantic metadata and keep PageIndex stable as the future ZVec source.
