## Why

`deepseek session resume <id>` exists as a CLI command and validates its contract via `tests/contracts/session-store-resume-fork.test.ts`, but in practice it always returns `SESSION_NOT_FOUND` because every CLI invocation constructs a fresh `InMemorySessionStore` through `createDeterministicRuntimeDependencies()` / `createLiveCliDependencies()`. The on-disk writer `DevelopmentFilesystemSessionStore` exists but is only touched by the contract test; the CLI never wires it up, and even if it did, the class inherits `InMemorySessionStore` without hydrating from disk on construction. A user running `deepseek chat --live`, leaving, and then running `deepseek session resume …` the next day loses every turn. Session persistence is a R1 readiness promise we are silently breaking.

`deepseek session resume <id>` 作为 CLI 命令存在，也通过 `tests/contracts/session-store-resume-fork.test.ts` 验证契约，但实际每次 CLI 调用都通过 `createDeterministicRuntimeDependencies()` / `createLiveCliDependencies()` 构造全新的 `InMemorySessionStore`，所以永远返回 `SESSION_NOT_FOUND`。磁盘写入用的 `DevelopmentFilesystemSessionStore` 只在 contract test 里被触达，CLI 没接上；即便接上，它继承自 `InMemorySessionStore` 但构造时不读盘。用户跑 `deepseek chat --live` 离开，第二天跑 `deepseek session resume …` 拿不到任何历史。Session 持久化是 R1 可用性承诺，现在在默默违约。

## What Changes

- Replace `DevelopmentFilesystemSessionStore` with a properly designed `PersistentFilesystemSessionStore` that hydrates events, metadata, and snapshots from disk on construction and keeps the `InMemorySessionStore` as an in-process cache for the rest of the session's lifetime.
- Add a `SessionStoreLocation` helper that derives a per-user path (`~/.deepseek/sessions/` on POSIX, `%APPDATA%/deepseek/sessions/` on Windows) through `NodePlatformRuntime.workspaceMetadataPath`, so live and CLI-driven sessions persist outside the workspace and survive across invocations.
- Wire `createLiveCliDependencies` to use `PersistentFilesystemSessionStore` by default; keep `createDeterministicRuntimeDependencies` pinned to `InMemorySessionStore` so the test suite stays hermetic.
- Change `runSessionCommand` to use the live factory (or an explicit persistent factory) so `deepseek session resume`/`fork` actually reads from disk.
- After every successful `deepseek run` and `deepseek chat` turn, append a line or JSON field showing the session id and the resume command verbatim, so users who did not request `jsonl` can still resume later.
- Add integration tests proving two back-to-back CLI invocations share state: run 1 writes a deterministic session, run 2 resumes the same id and sees the event count.
- No breaking changes to the `SessionStore` contract itself.

- 用 `PersistentFilesystemSessionStore` 替换 `DevelopmentFilesystemSessionStore`：构造时从磁盘 hydrate events/metadata/snapshot，运行期维持 `InMemorySessionStore` 作为 in-process 缓存。
- 新增 `SessionStoreLocation` helper，通过 `NodePlatformRuntime.workspaceMetadataPath` 推导 per-user 路径（POSIX `~/.deepseek/sessions/`、Windows `%APPDATA%/deepseek/sessions/`），让 live 和 CLI 驱动的会话持久化到工作区之外，跨调用保留。
- `createLiveCliDependencies` 默认使用 `PersistentFilesystemSessionStore`；`createDeterministicRuntimeDependencies` 保持 `InMemorySessionStore`，测试套件保持无副作用。
- `runSessionCommand` 改为通过 live factory（或显式 persistent factory）构造，让 `deepseek session resume`/`fork` 真正读盘。
- `deepseek run` 和 `deepseek chat` 每轮成功后，在非 jsonl 输出里打印一行显示 session id 以及可直接复用的 resume 命令，用户就能在下次手动 resume。
- 新增 integration test：两次背靠背 CLI 调用共享状态 — 第一次写入 deterministic 会话，第二次 resume 同一个 id 并看到 event 数量。
- 不改 `SessionStore` 接口本身。

## Capabilities

### Modified Capabilities

- `session-store`: Require the filesystem-backed session store to hydrate from disk on construction and present a SessionStore whose `resume`/`fork`/`events`/`metadata` calls observe state written by earlier CLI invocations.
- `command-system`: Require `deepseek run` and `deepseek chat` text/json outputs to surface the session id and resume hint after terminal status, and require `deepseek session resume`/`fork` to read from the persistent store.

## Impact

- `src/packages/session-store/src/index.ts`: extract filesystem helpers (read/write event log, metadata, snapshot), rename/refactor into `PersistentFilesystemSessionStore`, hydrate on construct.
- `src/packages/testing-regression/src/fakes/index.ts`: `createLiveCliDependencies` accepts an optional `sessionsDirectory` and defaults to the per-user location; returns a persistent store for live mode.
- `src/apps/cli/src/index.ts`: plumb persistent factory through `runSessionCommand`; add resume hint to text / JSON final summary; leave JSONL events untouched.
- `tests/integration/session-persistence-across-invocations.test.ts`: new integration test using a temp directory to simulate two CLI invocations.
- `tests/contracts/session-store-resume-fork.test.ts`: update to match the renamed class and new hydration behavior.
- `docs/development/testing-and-acceptance.md`: add a short "Session persistence / 会话持久化" section.
