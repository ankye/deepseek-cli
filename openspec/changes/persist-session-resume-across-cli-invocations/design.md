## Context

`DevelopmentFilesystemSessionStore` was added alongside the first session resume/fork work. It writes events as JSONL (`<sessionId>.jsonl`), metadata as JSON (`<sessionId>.metadata.json`), and snapshots as JSON (`<sessionId>.snapshot.json`), but construction never loads any of those files back. The expectation was that a future change would bring hydration; that change is this one.

`DevelopmentFilesystemSessionStore` 是在首次 session resume/fork 工作时加入的。它把事件写成 JSONL（`<sessionId>.jsonl`），metadata 和 snapshot 分别写成 JSON，但构造时从不读回这些文件。当时预期由后续变更补齐 hydration —— 就是本次。

We also never chose where to store sessions. The contract test used an arbitrary temp directory. For a real CLI, sessions need to live somewhere stable, per-user, outside any given workspace, so that `deepseek session resume` works when the user changes directories or clones a new repo.

`PlatformRuntime.workspaceMetadataPath(root, namespace)` returns a platform-appropriate metadata path. Its cousin helper for user-scoped (not workspace-scoped) state does not exist yet. We add the minimum needed: a `userSessionsDirectory(env?, platform?)` helper exported from `@deepseek/session-store` (colocated with the store that consumes it). Keeping the helper in the same package avoids a trivial cross-package dependency and sidesteps the `provider/no-direct-credential-access` lint that governs `@deepseek/platform-abstraction` when `process.env` is read.

`PlatformRuntime.workspaceMetadataPath(root, namespace)` 返回平台相关的 metadata 路径。其对应的用户级（非工作区级）helper 目前不存在。我们只加必要的那一个：在 `@deepseek/session-store` 里导出 `userSessionsDirectory(env?, platform?)`（与消费它的 store 同包）。把 helper 放在同一个包里避免了跨包琐碎依赖，也绕开了约束 `@deepseek/platform-abstraction` 读取 `process.env` 的 `provider/no-direct-credential-access` lint 规则。

## Goals / Non-Goals

**Goals:**

- `deepseek chat --live` turn 1 at time T, `deepseek session resume <id>` at T+1 day: the resume call returns the real event history.
- `deepseek run --live "…"` prints the session id and a ready-to-paste `deepseek session resume <id>` line at the end of text / JSON mode output.
- Two back-to-back CLI invocations in an integration test, sharing a temp sessions directory, see each other's events.
- Deterministic tests remain unaffected (they continue to use the in-memory store).
- Session files never contain raw secrets (the existing `redactJson` pass stays in effect).

- `deepseek chat --live` 在时间 T 完成一轮，`deepseek session resume <id>` 在 T+1 天后调用：resume 返回真实事件历史。
- `deepseek run --live "…"` 在 text / JSON 输出结尾打印 session id 以及可直接复制的 `deepseek session resume <id>` 行。
- integration test 里两次背靠背 CLI 调用，共享临时 sessions 目录，能看到彼此的事件。
- Deterministic 测试不受影响（仍用 in-memory store）。
- Session 文件从不包含 raw secret（现有 `redactJson` 保持启用）。

**Non-Goals:**

- No cross-machine sync, no cloud backup, no encryption at rest. Local FS only.
- No schema migration tool. If `SESSION_SCHEMA_VERSION` changes, existing files become unreadable; we will add a migration in a follow-up when the first schema bump happens.
- No concurrent-writer safety. A user running two `deepseek chat --live` in the same session id simultaneously will get interleaved writes; the mitigation is that session ids are unique per turn today.
- No session listing / picker UI. `deepseek session list` is a separate follow-up.
- No auto-compaction of long sessions. Turn budgets handle runtime size; disk size is bounded by the user running `rm -rf ~/.deepseek/sessions` at their discretion.

- 不做跨机器同步、云备份、加密静态存储。只写本地 FS。
- 不做 schema 迁移工具。一旦 `SESSION_SCHEMA_VERSION` 变化，旧文件变得不可读；第一次 schema bump 时再加迁移。
- 不做并发写保护。同一 session id 并发两次 `deepseek chat --live` 会交错写入；缓解方式是当前每轮 session id 唯一。
- 不做 session list / picker UI。`deepseek session list` 单独后续做。
- 不做长会话自动压缩。运行时大小由 turn budget 控制；磁盘大小靠用户自己 `rm -rf ~/.deepseek/sessions` 管理。

## Decisions

### Decision 1: Hydration at construction, not at first read

Loading on construct means one disk sweep per CLI launch, deterministic startup time, and no lazy-read races. For the current volumes (session files are 1-100 KB each, dozens per user), the whole sessions directory fits in memory easily. A background index that lazy-loads individual sessions is premature.

构造时一次性 hydrate：每次 CLI 启动扫一次盘，启动时间确定，没有懒加载竞争。以当前体量（每个 session 文件 1-100 KB，每用户几十个），整个 sessions 目录轻松常驻内存。后台索引 + 懒加载单个会话属于过早优化。

Rejected alternative: lazy-load per session id. Adds cache invalidation, makes `resume` testing harder, and the fake store parity becomes brittle.

拒绝方案：按 session id 懒加载。增加缓存失效逻辑，让 `resume` 测试难写，与 fake store 的对等性变脆。

### Decision 2: Per-user sessions directory, not per-workspace

Sessions are conversational memory. A user moving between repositories should see the same resumable list. Storing under `~/.deepseek/sessions/` (POSIX) and `%APPDATA%/deepseek/sessions/` (Windows) matches how most CLI tools do it, and keeps `.gitignore`-free.

Session 是对话记忆。用户在仓库之间切换，应该能看到同一份可 resume 列表。POSIX 下 `~/.deepseek/sessions/`、Windows 下 `%APPDATA%/deepseek/sessions/`，与大多数 CLI 工具习惯一致，且天然跳出 `.gitignore`。

Rejected alternative: `.deepseek/sessions/` in the workspace. Makes session history accidentally part of the repo; tempts users to commit it.

拒绝方案：工作区下 `.deepseek/sessions/`。让历史意外进仓库；诱导用户提交。

### Decision 3: Keep InMemorySessionStore as the parent for simplicity

Rather than rebuild the contract methods (`create`, `append`, `events`, `snapshot`, `metadata`, `resume`, `fork`) from scratch, `PersistentFilesystemSessionStore` inherits from `InMemorySessionStore`, overrides the three persistence points (construct, append, snapshot), and delegates everything else. This is how `DevelopmentFilesystemSessionStore` was structured; we are finishing the job, not redesigning it.

不另起炉灶重写 (`create`、`append`、`events`、`snapshot`、`metadata`、`resume`、`fork`)；`PersistentFilesystemSessionStore` 继承 `InMemorySessionStore`，override 三个持久化点（构造、append、snapshot），其余委托给父类。`DevelopmentFilesystemSessionStore` 就是这个结构，我们把它补完。

Rejected alternative: extract a storage-port interface and have both stores implement it. That would be cleaner long-term but is overkill for one persistent variant; revisit if we add SQLite or a remote store.

拒绝方案：抽一个 storage-port 接口让两个 store 都实现。长期更干净，但为一个持久化变体做太重；等加 SQLite 或远程 store 再说。

### Decision 4: Surface session id in CLI text/JSON output, not JSONL

JSONL output is for machine consumption and already has `sessionId` on every event. Text mode users see a scrolling transcript and need an explicit resume hint at the end. JSON mode users see a single summary object; we add `resumeCommand` to it. This is purely additive — no existing test consumes the absence of these fields.

JSONL 用于机器消费，每个事件已经带 `sessionId`。Text 模式用户看滚动记录，最后需要显式 resume 提示。JSON 模式用户看一个 summary 对象，我们给它加 `resumeCommand` 字段。纯加法 — 没有现有测试依赖这些字段的缺失。

## Safety Model

- `redactJson` on snapshot payloads stays in effect; no raw secrets hit disk.
- The sessions directory is mode-0700 on POSIX (best-effort; Windows inherits ACL). If `mkdir` fails due to permission, hydration silently returns empty state, consistent with the existing `readFile(path, "utf8").catch(() => "")` style.
- No network calls, no outbound file reads outside the sessions directory.
- If a session file is malformed (partial write, manual edit), the line is skipped with a `kernel.observability.degraded` event rather than crashing the CLI.

- snapshot payload 的 `redactJson` 保持启用；raw secret 不会到磁盘。
- POSIX 下 sessions 目录尽量 0700（best-effort；Windows 沿用 ACL）。`mkdir` 因权限失败时，hydration 静默返回空状态，与现有 `readFile(path, "utf8").catch(() => "")` 风格一致。
- 没有网络调用，不读 sessions 目录之外的文件。
- 单个 session 文件坏了（写一半、手改）时，按行跳过并发出 `kernel.observability.degraded` 事件，不让 CLI 崩溃。

## Acceptance Strategy

- Contract: the existing `session-store-resume-fork` suite passes against the renamed class. One new case: create a store at path P, append an event, dispose, construct a fresh store at the same P, and assert `events(id)` returns the event.
- Integration: `tests/integration/session-persistence-across-invocations.test.ts` runs `runCli(["run", ...])` with a deterministic model into a temp directory via a CLI override, captures the session id from JSONL output, then runs `runCli(["session", "resume", id])` into the same directory and asserts the result's `eventCount` is non-zero.
- Regression: typecheck, lint, full suite, boundaries. No golden replay disturbance.
- Operator: manual check via `live-check.mjs` or a scripted two-run harness; document the resume hint in `testing-and-acceptance.md`.
