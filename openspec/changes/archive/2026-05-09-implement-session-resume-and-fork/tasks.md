## 1. Contracts / 契约

- [x] 1.1 Add session metadata, lineage, resume result, fork result, and typed failure shapes to `platform-contracts`.
- [x] 1.2 Extend `SessionStore` with resume and fork-lite methods without introducing host-specific UI state.
- [x] 1.3 Add command/session DTOs needed by CLI and tests with schema version and redaction metadata.

## 2. Session Store Implementations / Session Store 实现

- [x] 2.1 Implement resume/fork-lite in `InMemorySessionStore` with deterministic lineage and unknown-session failures.
- [x] 2.2 Implement compatible metadata persistence in `DevelopmentFilesystemSessionStore`.
- [x] 2.3 Ensure session metadata and persisted files contain schema version and no raw secret fields.

## 3. Runtime Integration / Runtime 集成

- [x] 3.1 Ensure kernel-backed turns append to an explicitly resumed session id.
- [x] 3.2 Ensure forked child sessions can execute turns through the same governed kernel path.
- [x] 3.3 Preserve session lineage and replay metadata in session events without changing scheduler/policy behavior.

## 4. CLI And Command Surface / CLI 与命令表面

- [x] 4.1 Add scriptable CLI session commands for resume and fork-lite with text and stream-json output.
- [x] 4.2 Add interactive session controls for resume/fork-lite that update the active session selection only after successful structured results.
- [x] 4.3 Ensure unknown session ids return typed failures and do not mutate active session selection.

## 5. Regression Coverage / 回归覆盖

- [x] 5.1 Add session-store contract tests for create, append, resume, fork-lite, unknown id, redaction, and serialization.
- [x] 5.2 Add runtime integration tests for resumed and forked turns using selected session ids.
- [x] 5.3 Add golden replay tests for resume and fork-lite lineage.
- [x] 5.4 Add compatibility tests for session metadata/result schema versions and unsupported schema rejection.
- [x] 5.5 Add CLI e2e tests for scriptable session resume/fork and interactive controls without live provider access.
- [x] 5.6 Add or extend architecture lint coverage if implementation creates new bypass paths.

## 6. Verification And Archive / 校验与归档

- [x] 6.1 Run `openspec validate implement-session-resume-and-fork --type change --strict`.
- [x] 6.2 Run `npm run typecheck`, `npm run lint`, `npm test`, and `node scripts/check-boundaries.mjs`.
- [x] 6.3 Run `npm run test:contracts`, `npm run test:integration`, `npm run test:golden`, `npm run test:compatibility`, `npm run test:e2e`, and `npm run build:cli`.
- [x] 6.4 Record acceptance evidence, sync specs, validate all specs, and archive the change.
