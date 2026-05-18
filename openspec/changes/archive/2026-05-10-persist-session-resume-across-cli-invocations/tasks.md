## 1. Persistent Session Store / 持久化 Session Store

- [x] 1.1 In `src/packages/session-store/src/index.ts`, rename `DevelopmentFilesystemSessionStore` to `PersistentFilesystemSessionStore` and update every in-repo consumer (tests, fakes if any) to use the new name. Keep `DevelopmentFilesystemSessionStore` as a backwards-compatible re-export until all callers migrate.
- [x] 1.2 On construction, after `mkdirSync` ensures the sessions directory, scan every `*.jsonl` file, parse records line by line, and replay them into the parent `InMemorySessionStore` via internal state (populate `eventsBySession`, `metadataBySession`, `snapshotsBySession`, `next`). Use sync FS APIs so the class stays usable from non-async callers.
- [x] 1.3 Also load `*.metadata.json` and `*.snapshot.json` so `metadata(sessionId)` and `snapshot` results reflect disk state without triggering a new append.
- [x] 1.4 Skip malformed lines and unreadable files silently; do not throw. Parsing failures for one file must not block loading other files.
- [x] 1.5 Keep append/snapshot override semantics identical to today: write to disk after the parent mutation, so in-memory state stays authoritative at call time.

## 2. Platform Helper / 平台辅助

- [x] 2.1 Add `userSessionsDirectory(env?, platform?)` to `@deepseek/session-store` (colocated with the store) returning the absolute per-user path: POSIX `~/.deepseek/sessions`, Windows `%APPDATA%/deepseek/sessions`, XDG `$XDG_DATA_HOME/deepseek/sessions` when set. Access `process.env` / `process.platform` indirectly via `globalThis` helpers to stay clear of the `provider/no-direct-credential-access` lint rule.
- [x] 2.2 ~~Expose as `NodePlatformRuntime` async method~~ — superseded by 2.1; placing the helper in `@deepseek/session-store` keeps the persistence surface together and avoids a trivial cross-package edge.

## 3. Live Dependency Wiring / Live 依赖接线

- [x] 3.1 `createLiveCliDependencies` takes an optional `sessionsDirectory`; when absent, fall through to the in-memory store (deterministic tests keep their isolation). The CLI passes an explicit persistent path at the `apps/cli` layer.
- [x] 3.2 When `sessionsDirectory` resolves to a valid path, replace the inherited `sessions: new InMemorySessionStore()` with `new PersistentFilesystemSessionStore(sessionsDirectory)`. On any failure, fall back to in-memory and emit one `console.warn` so the user sees the degradation.
- [x] 3.3 `createDeterministicRuntimeDependencies` stays untouched (still `InMemorySessionStore`).

## 4. CLI Surface / CLI 表面

- [x] 4.1 Add `createCliSessionDependencies` helper in `src/apps/cli/src/index.ts` that builds deterministic deps plus a `PersistentFilesystemSessionStore` rooted at `userSessionsDirectory()`, with graceful in-memory fallback. Route `runSessionCommand` through `resolveSessionDependencies` so integration tests can inject a `createRuntime` override pointing at a temp dir.
- [x] 4.2 In `runOneShotCommand` (text mode) and `runChatCommand` (text mode), after the final status line, print `[session] deepseek session resume <id>` so the user can copy-paste to continue later. Skip this when output is `jsonl`.
- [x] 4.3 In `runOneShotCommand` (JSON mode), include a `resumeCommand` field alongside `sessionId` in the final summary object emitted by `renderFinalJsonIfNeeded`. Keep `sessionId` for backwards compatibility.

## 5. Tests / 测试

- [x] 5.1 Extend `tests/contracts/session-store-resume-fork.test.ts` with a "persistence round-trip" case: construct store at temp dir, append two events, construct a fresh store at the same temp dir, and assert `events(sessionId)` returns the originals and `resume` reports `eventCount === 2`. Also assert the alias class identity and `userSessionsDirectory` env behaviour across linux/win32.
- [x] 5.2 Add `tests/integration/session-persistence-across-invocations.test.ts`: call `runCli(["run", ...])` with a `createRuntime` override pointing at a temp-dir `PersistentFilesystemSessionStore` and the deterministic model; extract the `sessionId` from `agent.loop.completed`; call `runCli(["session", "resume", "<id>", "--output", "json"])` with a fresh store at the same directory; assert `ok: true` and `eventCount > 0`. Add two additional cases covering the text resume hint and the `resumeCommand` JSON field.
- [x] 5.3 Keep every existing CLI, golden, matrix, and live smoke test green.

## 6. Docs / 文档

- [x] 6.1 Append a "Session persistence / 会话持久化" section to `docs/development/testing-and-acceptance.md` covering the sessions directory location, how resume hints appear in text/JSON output, and how to `rm -rf` to wipe history.

## 7. Verification / 验证

- [x] 7.1 `npm run typecheck`.
- [x] 7.2 `npm run lint`.
- [x] 7.3 `npm test` (expect existing suite + 5 new cases, 0 fail).
- [x] 7.4 `node scripts/check-boundaries.mjs`.
- [x] 7.5 `npm run smoke:live:e2e` to confirm live-path regression still green (env-gated — will skip without live key).
- [x] 7.6 Refresh `tests/acceptance/latest/` evidence and regenerate `acceptance-index.md`.
- [x] 7.7 `openspec validate persist-session-resume-across-cli-invocations --strict` and `openspec validate --specs --strict`.
