## Context

The built-in plugin pack now contributes command metadata, aliases, owner route readiness, and fallback commands. The TUI command bar can discover those commands, but its suggestion title currently mirrors the bare alias. For aliases such as `/repo files`, the raw input bridge sees no placeholder and submits the incomplete command immediately.

内置插件包现在已经贡献 command metadata、aliases、owner route readiness 与 fallback commands。TUI command bar 能发现这些命令，但 suggestion title 目前只等于裸 alias。对于 `/repo files` 这类需要参数的 alias，raw input bridge 看不到 placeholder，会立即提交不完整命令。

## Goals / Non-Goals

**Goals:**

- Make built-in plugin slash aliases behave like native slash commands in chat.
- Use declarative owner route metadata to project placeholders, not plugin-private execution handlers.
- Keep file/jump/context behavior intact while extending repo/git/checks coverage.
- Add tests that cover both the TUI bridge and local execution behavior.

**Non-Goals:**

- This does not add third-party plugin execution.
- This does not introduce a marketplace, remote registry, or plugin-private callback bridge.
- This does not make deferred routes dispatchable.

## Decisions

1. Derive placeholder previews from owner route fallback commands.

   The owner route descriptor already states the host-owned fallback command and required argument placeholder. Reusing it keeps projection declarative and avoids duplicating input schema interpretation inside the TUI.

   Owner route descriptor 已经声明 host-owned fallback command 与 required argument placeholder。复用它可以保持 projection 声明式，并避免在 TUI 内重复解释 input schema。

2. Add chat slash handlers for implemented first-party families.

   Plugin business aliases such as `/repo files`, `/git status`, and `/checks lint` should be injected from owner route descriptors and execute through existing CLI owner subsystem resolvers and renderers. This keeps the chat surface aligned with standalone commands while preserving package boundaries and avoiding a growing `if/else` router.

   `/repo files`、`/git status` 与 `/checks lint` 等插件业务 alias 应由 owner route descriptors 注入，并通过现有 CLI owner subsystem resolver 与 renderer 执行，使 chat surface 与 standalone command 保持一致，同时保留 package boundary，避免持续膨胀的 `if/else` router。

3. Keep command bar acceptance descriptor-only.

   Pressing Enter in the command bar will still return a local descriptor. The raw input bridge decides whether to submit a complete slash prompt or insert an editable draft prefix.

   在 command bar 中按 Enter 仍只返回 local descriptor。raw input bridge 决定是提交完整 slash prompt，还是插入可编辑 draft prefix。

4. Prefer executable slash aliases over informational plugin palette metadata during command search.

   When a query matches both an executable slash alias and a palette metadata entry, the executable slash alias should rank first. This makes typed command search behave like a command launcher instead of a metadata browser.

   当 query 同时匹配 executable slash alias 与 palette metadata entry 时，executable slash alias 应排在前面。这样 typed command search 更像 command launcher，而不是 metadata browser。

## Risks / Trade-offs

- Running `/checks` can invoke real local verification commands. Mitigation: tests use the existing CLI fake platform path where possible and only assert routing/output shape for lightweight coverage.
- Deferred routes such as repo recall and project index can appear in suggestions. Mitigation: placeholder projection can still guide the user, while dispatch remains bounded to implemented chat handlers and owner route status.
