## 1. Discovery / 调研

- [x] 1.1 Confirm current PageIndex behavior is deterministic recall, not permanent memory.
- [x] 1.2 Confirm current lossless context behavior preserves source records, but does not distill long-lived memory.
- [x] 1.3 Compare official Codex/OpenAI and Claude/Anthropic memory surfaces as design references.

## 2. Contracts / 契约

- [x] 2.1 Add platform-contract DTOs for permanent memory records, candidates, scopes, provenance, redaction, lifecycle status, freshness, and conflict metadata.
- [x] 2.2 Add a `PermanentMemoryManager` interface with candidate, promote, query, explain, update, delete, disable, export, and audit operations.
- [x] 2.3 Add provider manifests for capability support, durability, locality, encryption, provenance, delete semantics, export/import, and migration safety.
- [x] 2.4 Add external memory hook manifests, hook payload DTOs, hook result DTOs, timeout/failure policy, permission metadata, and replay identifiers.
- [x] 2.5 Add scoped memory DTOs for user, workspace, path/subtree, agent/subagent, and session/thread scope matching.
- [x] 2.6 Add procedure/skill candidate metadata so repeatable workflows can be routed away from factual memory records.
- [x] 2.7 Add runtime events for candidate proposed, memory promoted, memory injected, memory stale, memory conflict, memory deleted, provider switched, memory disabled, hook started, hook completed, and hook failed.

## 3. Storage / 存储

- [x] 3.1 Implement a local durable backend with append-only audit evidence and deterministic hydration.
- [x] 3.2 Keep backend choice behind contracts so JSONL, SQLite, or encrypted storage can be swapped without app coupling.
- [x] 3.3 Add migration/version handling for memory record schema changes.
- [x] 3.4 Add provider switching tests for compatible migration and explicit failure when a target provider cannot preserve provenance, delete markers, disabled states, or redaction metadata.

## 4. Extraction And Governance / 提取与治理

- [x] 4.1 Generate memory candidates from explicit remember requests, repeated corrections, project decisions, stable workflow facts, and accepted CLI events.
- [x] 4.2 Require approval or configured policy before promoting candidates that affect future behavior.
- [x] 4.3 Block or redact secrets and sensitive values before candidate creation or promotion.
- [x] 4.4 Add conflict detection and stale-memory handling when current instructions or workspace evidence contradict a stored memory.
- [x] 4.5 Allow external hooks to enrich candidates, dedupe candidates, and add governance diagnostics without receiving unredacted source content.
- [x] 4.6 Add background extraction eligibility rules for idle sessions, minimum interaction volume, lock/state coordination, and rate or budget throttling.
- [x] 4.7 Exclude MCP, web, connector, browser/screen, customer-data, and third-party-document sessions from automatic memory generation unless policy explicitly allows them.
- [x] 4.8 Route repeatable workflow candidates to skills/procedures instead of permanent memory when they contain multi-step operational behavior.

## 5. Runtime And Prompt Assembly / Runtime 与 Prompt Assembly

- [x] 5.1 Retrieve task-relevant permanent memories by scope, confidence, freshness, and conflict status.
- [x] 5.2 Inject bounded memory context with provenance and priority lower than current instructions and repository guidance.
- [x] 5.3 Add CLI flows to inspect, approve, reject, edit, delete, disable, export, and explain memories.
- [x] 5.4 Ensure `memory.read-write`, PageIndex, and lossless context tools report their role without claiming permanent-memory completion.
- [x] 5.5 Add global, workspace, and session/thread controls for read, generate, promote, and inject behavior.
- [x] 5.6 Dispatch external memory hooks at capture, candidate, retrieval, injection, promotion, deletion, export/import, migration, and scoring-evidence boundaries.
- [x] 5.7 Add memory source diagnostics showing included, skipped, stale, conflicted, deleted, and over-budget memories for each prompt assembly.
- [x] 5.8 Add lazy path/subtree memory loading so large monorepos do not inject unrelated local memory.

## 6. Evaluation And Verification / 评估与验证

- [x] 6.1 Add unit tests for contracts, redaction, provenance, promotion policy, retrieval ranking, conflict handling, and deletion.
- [x] 6.2 Add integration tests proving a remembered preference or project fact survives process restart and influences a later run only when relevant.
- [x] 6.3 Add negative tests proving PageIndex-only, lossless-context-only, cache-hit-only, and fake in-memory paths fail the permanent-memory delivery gate.
- [x] 6.4 Update delivery capability scorecards so missing permanent memory deducts honestly instead of being hidden by recall features.
- [x] 6.5 Add hook tests for redacted payloads, timeout handling, idempotent retry, enforcement hooks, non-enforcement failure isolation, and deterministic replay.
- [x] 6.6 Add budget and scope tests proving unrelated path/subtree memory is skipped and over-budget memory is explained.
- [x] 6.7 Add external-context negative tests proving high-risk sources do not create memory without explicit policy.
- [x] 6.8 Run `openspec validate add-permanent-memory-layer --strict`.
