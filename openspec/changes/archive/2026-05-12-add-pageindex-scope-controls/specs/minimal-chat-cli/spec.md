## ADDED Requirements

### Requirement: Chat PageIndex Recall Scope Controls / Chat PageIndex 回溯 Scope 控制

The chat shell SHALL support explicit scope selection for `/palette recall` while keeping `session` as the only R1 executable PageIndex scope.

Chat shell 必须支持 `/palette recall` 的显式 scope 选择，同时在 R1 中只将 `session` 作为可执行 PageIndex scope。

#### Scenario: Default recall uses session scope / 默认 Recall 使用 Session Scope

- **WHEN** the user enters `/palette recall <query>` without a scope
- **THEN** the shell searches session PageIndex pages, renders recall records with `scope=session`, and does not submit a runtime/model request
- **中文** 当用户输入不带 scope 的 `/palette recall <query>` 时，shell 必须搜索 session PageIndex pages，渲染带 `scope=session` 的 recall records，且不提交 runtime/model request。

#### Scenario: Explicit session recall is equivalent / 显式 Session Recall 等价

- **WHEN** the user enters `/palette recall --scope session <query>`
- **THEN** the shell behaves the same as default recall and preserves `scope=session` in summaries, result lists, targets, and metadata
- **中文** 当用户输入 `/palette recall --scope session <query>` 时，shell 必须与默认 recall 行为一致，并在 summaries、result lists、targets 与 metadata 中保留 `scope=session`。

#### Scenario: Workspace recall is deferred locally / Workspace Recall 本地延后

- **WHEN** the user enters `/palette recall --scope workspace <query>` before workspace PageIndex storage exists
- **THEN** the shell emits a typed local deferred recall result with requested scope, available scopes, and diagnostic code, without falling back to session results or submitting a runtime/model request
- **中文** 当用户在 workspace PageIndex storage 尚不存在时输入 `/palette recall --scope workspace <query>`，shell 必须输出 typed local deferred recall result，包含 requested scope、available scopes 与 diagnostic code，且不得 fallback 到 session results 或提交 runtime/model request。

#### Scenario: Global recall is deferred locally / Global Recall 本地延后

- **WHEN** the user enters `/palette recall --scope global <query>` before global PageIndex storage exists
- **THEN** the shell emits a typed local deferred recall result with requested scope, available scopes, and diagnostic code, without falling back to session results or submitting a runtime/model request
- **中文** 当用户在 global PageIndex storage 尚不存在时输入 `/palette recall --scope global <query>`，shell 必须输出 typed local deferred recall result，包含 requested scope、available scopes 与 diagnostic code，且不得 fallback 到 session results 或提交 runtime/model request。

#### Scenario: Invalid recall scope stays local / 无效 Recall Scope 保持本地

- **WHEN** the user enters `/palette recall --scope <invalid> <query>` or omits the scope value
- **THEN** the shell emits a typed local failure and keeps the REPL available without submitting a runtime/model request
- **中文** 当用户输入 `/palette recall --scope <invalid> <query>` 或省略 scope value 时，shell 必须输出 typed local failure 并保持 REPL 可用，且不提交 runtime/model request。
