## Context

Chat palette references now support add, add-file, list, focus, file search, and text search. This gives users a useful way to build context, but it lacks the inverse controls needed to keep context precise during a long session.

Chat palette references 现在支持 add、add-file、list、focus、file search 和 text search。这让用户可以构建上下文，但还缺少长 session 中维持上下文精确所需的反向控制。

The existing reference state is local to the CLI host until a normal prompt is submitted. This change should keep that boundary intact: remove, clear, and replace mutate only the chat palette snapshot and never submit slash commands to runtime/model execution.

现有 reference state 在提交普通 prompt 前属于 CLI host 本地状态。本变更应保持这条边界：remove、clear、replace 只修改 chat palette snapshot，绝不把 slash commands 提交给 runtime/model execution。

## Goals / Non-Goals

**Goals:**

- Add local `/palette refs remove <selector|current>`.
- Add local `/palette refs clear`.
- Add local `/palette refs replace current` using the focused result-list item.
- Preserve deterministic focus behavior after mutations.
- Keep all reference mutation records structured and model-hidden.

**Non-Goals:**

- No persisted named reference-set storage.
- No multi-set creation/switching UX in this slice.
- No runtime/session transcript mutation.
- No plugin contribution contract expansion yet.

## Decisions

1. **Implement this slice in CLI palette state helpers.**

   The current user-visible surface is chat-local slash controls. Implementing in `palette-state.ts` keeps the change narrow while preserving the option to lift these semantics into shared `command-system` actions later.

   当前 user-visible surface 是 chat-local slash controls。放在 `palette-state.ts` 实现可以保持变更范围小，同时保留后续上升为 shared `command-system` actions 的空间。

2. **Selector semantics match focus controls.**

   `remove` accepts `current`, one-based index, reference id, or target id. Missing selectors produce typed local failures and preserve state.

   `remove` 接受 `current`、一基 index、reference id 或 target id。无法解析时返回 typed local failure，并保持状态。

3. **Clear removes all active reference sets.**

   The initial implementation has one active reference set. Clearing all local reference sets is simpler and ensures the next prompt carries no `referenceContext`.

   初始实现只有一个 active reference set。清空全部本地 reference sets 更简单，并确保下一条 prompt 不携带 `referenceContext`。

4. **Replace current is add-current with prior references discarded.**

   `replace current` resolves the focused result-list item through the same add path, but first clears existing references. This guarantees the active context is exactly the focused item.

   `replace current` 通过与 add 相同的路径解析当前聚焦 result-list item，但会先清空已有 references。这保证 active context 精确等于当前聚焦项。

## Risks / Trade-offs

- [Risk] Clearing all reference sets may be broader than future named-set UX. -> Mitigation: current chat state only exposes one active set; future named-set storage can add scoped clear variants.
- [Risk] Local helper behavior may diverge from shared action semantics later. -> Mitigation: keep result records typed and deterministic so migration to command-system actions is mechanical.
- [Risk] Removing an active item can leave focus ambiguous. -> Mitigation: choose the next item at the same index, else previous item, else no active reference.
