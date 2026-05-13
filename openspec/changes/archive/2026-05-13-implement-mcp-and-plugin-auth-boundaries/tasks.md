## 1. Contracts And Directory Boundaries

- [x] 1.1 Add platform-contract DTOs for extension credential requirements, scoped grants, authorization results, auth diffs, and audit evidence under focused contract modules without importing implementation packages.
- [x] 1.2 Export the new contracts through public package entrypoints and update contract tests for schema versioning, redaction metadata, replay fingerprints, and JSON-serializable shape.
- [x] 1.3 Add architecture/lint coverage if needed so MCP/plugin packages cannot read raw process env, host secrets, or credential storage APIs directly.

## 2. Credential Auth Management

- [x] 2.1 Add credential-auth-management factories for scoped grants, metadata-only diagnostics, authorization allowed/denied results, revocation, and deterministic replay fingerprints.
- [x] 2.2 Ensure authorization denial never calls raw credential resolution and emits typed reasons for missing, revoked, expired, undeclared, owner mismatch, operation mismatch, trust mismatch, and workspace mismatch.
- [x] 2.3 Add deterministic fake storage/diagnostic helpers for tests while keeping raw secret values out of fixtures, traces, and assertion messages.

## 3. MCP Gateway Integration

- [x] 3.1 Extend MCP manifest/tool/resource result metadata with optional credential requirements and auth evidence without changing no-auth deterministic paths.
- [x] 3.2 Check scoped grant authorization before MCP tool/resource/prompt or real transport dispatch when credential requirements are declared.
- [x] 3.3 Return typed fail-closed MCP diagnostics with redaction metadata, pit fixture ids, audit fingerprints, and no handler/adapter/resolver invocation on auth denial.

## 4. Plugin Lifecycle Integration

- [x] 4.1 Extend plugin manifests, lockfile entries, install/apply/verify/list results, and contribution metadata with optional credential requirements and auth readiness evidence.
- [x] 4.2 Add auth requirement diffing alongside existing permission diffing for install/update/apply-lockfile flows.
- [x] 4.3 Block credential-backed contribution activation before owning subsystem registration when no matching scoped grant exists.

## 5. CLI Evidence And Rendering

- [x] 5.1 Update CLI extension/auth rendering to display auth readiness, missing grant, denied scope, and auth diff records from structured results in text mode.
- [x] 5.2 Ensure JSON/JSONL output uses the same evidence records as text output and preserves redaction metadata.
- [x] 5.3 Document the CLI-first extension auth behavior and deferred host promotion evidence in CLI or product docs.

## 6. Regression And Acceptance

- [x] 6.1 Add contract tests for grant DTOs, credential auth factories, plugin auth diffs, and MCP auth evidence.
- [x] 6.2 Add integration tests proving MCP/plugin scope denial is fail-closed and does not invoke handlers, adapters, transports, or raw credential resolvers. (MCP handler denial covered)
- [x] 6.3 Add CLI tests for text/JSONL auth evidence parity and no raw secret serialization.
- [x] 6.4 Add golden or replay tests for redacted audit evidence and stable replay fingerprints.
- [x] 6.5 Update reference pit fixture coverage for credential scope denial, permission/auth expansion, environment snapshotting, diagnostic redaction, and MCP/plugin precedence.

## 7. Validation

- [x] 7.1 Run `openspec validate implement-mcp-and-plugin-auth-boundaries --strict`.
- [x] 7.2 Run focused contract/integration/CLI tests for the touched packages.
- [x] 7.3 Run `npm run typecheck`, `npm run lint`, and `node scripts/check-boundaries.mjs` before marking the change complete.
