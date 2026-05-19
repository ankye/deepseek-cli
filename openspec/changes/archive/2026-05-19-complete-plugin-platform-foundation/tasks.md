## 1. Contracts And Catalog

- [x] 1.1 Add plugin lifecycle DTOs to `platform-contracts`: lifecycle states, transitions, events, health, rollback, activation, dependency, conflict, and audit records.
- [x] 1.2 Add plugin API level DTOs and diagnostics for manifest, declarative author, governed runtime, host projection, and test harness API usage.
- [x] 1.3 Add canonical contribution catalog DTOs for commands, actions, targets, result lists, keymaps, palette, render hints, hooks, skills, tools, MCP, agents, context providers, memory/cache providers, workflows, model profiles, config fragments, diagnostics providers, and resources.
- [x] 1.4 Add compatibility/deprecation metadata for active, inactive, experimental, deprecated, unsupported, and host-gated APIs.

## 2. Plugin API

- [x] 2.1 Expand `@deepseek/plugin-api` with declarative builders for the complete contribution catalog.
- [x] 2.2 Add API-level metadata to plugin manifests and contribution descriptors created by plugin-api.
- [x] 2.3 Add forbidden API diagnostics for host callbacks, runtime handles, raw credential access, filesystem/process/network primitives, model SDKs, and undeclared owner routes.
- [x] 2.4 Add test harness helpers for deterministic plugin fixtures, malformed plugins, source/trust scenarios, and replay assertions.

## 3. Plugin System Runtime

- [x] 3.1 Implement lifecycle state transition helpers with deterministic evidence and replay fingerprints.
- [x] 3.2 Implement discovery, validation, dependency resolution, install, enable, activation, disable, uninstall, health, update, and rollback state paths.
- [x] 3.3 Implement dependency graph and conflict diagnostics for commands, keymaps, palette entries, render hints, hooks, providers, and config fragments.
- [x] 3.4 Implement plugin event/audit emission for lifecycle, activation, projection, diagnostics, health, runtime requests, and rollback.
- [x] 3.5 Preserve inert projection: listing, validating, inspecting, and projecting plugins must not execute plugin or owner handlers.

## 4. Hook Integration

- [x] 4.1 Add canonical plugin lifecycle hook points to hook-system with schemas, default timeout, failure policy, ordering, and blocking rules.
- [x] 4.2 Normalize plugin-contributed hooks into hook-system registration requests with plugin provenance.
- [x] 4.3 Attach hook diagnostics and hook decisions to plugin lifecycle transition evidence.
- [x] 4.4 Reject plugin-private lifecycle callbacks and report the canonical hook contribution format.

## 5. Host And Diagnostics

- [x] 5.1 Add CLI/JSON/JSONL plugin lifecycle and API-level diagnostics.
- [x] 5.2 Expand TUI/plugin inspector metadata with lifecycle state, API levels, permissions, credentials, dependencies, conflicts, health, audit links, and owner execution routes.
- [x] 5.3 Update package scorecards and release diagnostics to include complete plugin platform readiness.
- [x] 5.4 Keep host layout owned by host adapters; plugin render hints remain descriptors.

## 6. Regression Evidence

- [x] 6.1 Add lifecycle matrix tests covering every lifecycle state and transition.
- [x] 6.2 Add contribution catalog matrix tests covering every contribution kind and inactive unsupported owners.
- [x] 6.3 Add governance denial tests for private callbacks, direct host/runtime imports, raw credentials, filesystem/process/network primitives, and undeclared owner routes.
- [x] 6.4 Add dependency, conflict, compatibility, permission, credential, health, update, rollback, and quarantine tests.
- [x] 6.5 Add projection tests proving CLI/TUI/JSON/JSONL inspection remains inert.
- [x] 6.6 Run OpenSpec strict validation, typecheck, lint, boundary checks, focused plugin tests, and full regression tests.
