## 1. Module Model

- [x] 1.1 Define governed module manifest fields, permissions, contributions, compatibility, and lifecycle states.
- [x] 1.2 Define public contract paths for commands, hooks, tools, MCP bridges, and UI contributions.
- [x] 1.3 Define disable, unload, cleanup, and diagnostics behavior.

## 2. Enforcement

- [x] 2.1 Add guardrails preventing private runtime object access from modules.
- [x] 2.2 Route risky module contributions through policy-sandbox.
- [x] 2.3 Add diagnostics for missing manifest data, permission mismatches, and lifecycle failures.

## 3. Evidence

- [x] 3.1 Add fixtures for valid modules, missing permissions, private-object access, unload, and disable.
- [x] 3.2 Add readiness output for module governance status.
- [x] 3.3 Link module governance evidence from the umbrella governance change.

## 4. Verification

- [x] 4.1 Run `openspec validate govern-plugin-module-boundaries --strict`.
- [x] 4.2 Run focused plugin-system and policy-sandbox tests.
