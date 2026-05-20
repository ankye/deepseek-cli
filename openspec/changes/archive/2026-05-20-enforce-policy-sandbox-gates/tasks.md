## 1. Policy Model

- [x] 1.1 Define risky operation taxonomy for file, shell, MCP, plugin, credential, remote, sandbox, and workspace mutation operations.
- [x] 1.2 Define policy decision record fields and redaction rules.
- [x] 1.3 Define fail-closed behavior for missing policy decisions.

## 2. Integration

- [x] 2.1 Add policy handoff checks to runtime and extension execution paths.
- [x] 2.2 Add diagnostics for bypass attempts and missing policy evidence.
- [x] 2.3 Add CLI readiness rendering for policy gate health.

## 3. Evidence

- [x] 3.1 Add fixtures for allow, deny, prompt, redact, audit-only, and bypass cases.
- [x] 3.2 Add replay tests proving policy records are deterministic and redacted.
- [x] 3.3 Link policy evidence from the umbrella governance change.

## 4. Verification

- [x] 4.1 Run `openspec validate enforce-policy-sandbox-gates --strict`.
- [x] 4.2 Run focused policy-sandbox and CLI diagnostics tests.
- [x] 4.3 Run `npm run lint` for policy boundary rules.
