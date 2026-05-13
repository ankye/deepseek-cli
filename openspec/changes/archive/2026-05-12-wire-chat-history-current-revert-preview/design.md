## Context

Chat already receives canonical runtime events for each prompt turn, including terminal `agent.loop.completed|failed|cancelled` events with session and turn identifiers. Revert preview already accepts explicit turn targets. The missing link is local chat history state that can select one of those completed turns.

Chat 已经接收每个 prompt turn 的 canonical runtime events，其中 terminal `agent.loop.completed|failed|cancelled` events 包含 session 与 turn identifiers。Revert preview 已接受显式 turn targets。缺口是本地 chat history state，用于选择这些已完成 turns 之一。

## Goals / Non-Goals

**Goals:**

- Record local history entries after each completed chat prompt turn. / 每个 chat prompt turn 完成后记录本地 history entry。
- Expose deterministic `/history` output in text, JSON, and JSONL modes. / 在 text、JSON 与 JSONL modes 下暴露确定性的 `/history` output。
- Allow `/history select` to change active history focus. / 允许 `/history select` 改变 active history focus。
- Resolve `/revert preview current` to the selected turn's explicit `turnId` and `sessionId`. / 将 `/revert preview current` 解析为选中 turn 的显式 `turnId` 与 `sessionId`。

**Non-Goals:**

- No persisted cross-process transcript history. / 不做跨进程持久 transcript history。
- No full-screen history browser. / 不做 full-screen history browser。
- No mutating revert/apply. / 不做会修改状态的 revert/apply。
- No reconstruction of history from session store for this change. / 本变更不从 session store 重建 history。

## Decisions

### Decision: History is host-local chat state

`ChatSessionState` will hold a small ordered list of prompt turn summaries derived from terminal runtime events. Each entry includes index, session id, turn id, prompt preview, terminal status, and trace id. The latest completed turn becomes selected by default.

`ChatSessionState` 会持有一个小型有序 prompt turn summaries 列表，来源于 terminal runtime events。每个 entry 包含 index、session id、turn id、prompt preview、terminal status 与 trace id。最新完成的 turn 默认成为 selected。

### Decision: Current means selected history turn

`/revert preview current` will fail locally with a typed diagnostic when there is no selected history turn. When selected, it calls the same `previewRevert` helper with `{ sessionId, turnId }`.

`/revert preview current` 在没有 selected history turn 时会以 typed diagnostic 本地失败。有 selected turn 时，它使用 `{ sessionId, turnId }` 调用同一个 `previewRevert` helper。

### Decision: History output is compact

`/history` renders a summary and one record per entry in JSONL. Text mode renders one line per entry and marks the selected entry. This avoids dumping raw transcript content.

`/history` 在 JSONL 中渲染 summary 和每个 entry 一条 record。Text mode 每个 entry 一行，并标记 selected entry。这样避免 dump 原始 transcript 内容。

## Risks / Trade-offs

- [Risk] Local history disappears when chat exits. -> Mitigation: this is explicitly local state; persisted transcript browsing remains a later change. / [风险] chat 退出后本地 history 消失。-> 缓解：这明确是 local state；持久 transcript browsing 留给后续变更。
- [Risk] Prompt previews may expose sensitive text. -> Mitigation: keep previews short and mark redaction metadata internal. / [风险] prompt previews 可能暴露敏感文本。-> 缓解：preview 保持短小并标记 internal redaction metadata。
- [Risk] Users may expect current to mean latest even after selecting another item. -> Mitigation: `/history` displays selected state and `/history select last` is explicit. / [风险] 用户可能以为 current 永远是 latest。-> 缓解：`/history` 显示 selected state，且 `/history select last` 明确可用。
