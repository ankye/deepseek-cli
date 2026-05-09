## 1. Contracts / 契约

- [x] 1.1 Add versioned ContextGraph projection DTOs to `platform-contracts`.
- [x] 1.2 Define context node metadata, projection request/result, projection events, exclusion reasons, redaction summaries, and budget decision shapes.
- [x] 1.3 Add contract tests for serializability, fake substitutability, schema versions, and implementation-free `platform-contracts`.

## 2. Context Engine / Context Engine

- [x] 2.1 Implement deterministic candidate normalization for turn, session, workspace evidence, tool result, and memory reference nodes.
- [x] 2.2 Implement eligibility filtering for lifecycle, scope, policy, redaction, freshness, and invalidation state.
- [x] 2.3 Implement stable ordering and tie-break rules for selected nodes.
- [x] 2.4 Implement immutable projection result output with selected and excluded evidence.

## 3. Budget, Cache, And Redaction / 预算、缓存与脱敏

- [x] 3.1 Add deterministic token estimator fixtures and budget decision integration.
- [x] 3.2 Add projection cache namespace with dependency fingerprints and invalidation behavior.
- [x] 3.3 Ensure projection excludes or redacts secret-like and unavailable redaction-class content before events, traces, caches, or snapshots.
- [x] 3.4 Add stale cache, hard budget, soft degradation, and memory-unavailable tests.

## 4. Runtime And Protocol Integration / Runtime 与协议集成

- [x] 4.1 Wire runtime model turns to request projection before model gateway dispatch.
- [x] 4.2 Ensure model gateway receives only projected context and cannot assemble raw session/workspace context.
- [x] 4.3 Emit projection runtime/protocol events with correlation id, session id, trace context, redaction metadata, and budget evidence.
- [x] 4.4 Fail closed before model dispatch on projection rejection, unsupported schema, unsafe redaction state, or corrupted projection evidence.

## 5. Architecture Lint / 架构 Lint

- [x] 5.1 Add or extend lint rules to reject direct prompt/context assembly outside approved projection owners.
- [x] 5.2 Add negative lint fixtures for host adapters or model providers reading raw context-engine/session/workspace internals.

## 6. Regression Coverage / 回归覆盖

- [x] 6.1 Add unit tests for filtering, ordering, budget fitting, degradation, redaction, cache hit/miss, and invalidation.
- [x] 6.2 Add integration tests proving runtime projection precedes model provider request construction.
- [x] 6.3 Add golden replay tests for selected/excluded nodes, budget decisions, redaction summaries, and cache metadata.
- [x] 6.4 Add compatibility tests for projection request/result/event/cache schemas and unsupported schema rejection.
- [x] 6.5 Add matrix tests for empty context, large session, secret fixture, stale cache, hard budget exceeded, memory unavailable, and degraded host scope.
- [x] 6.6 Add e2e smoke proving CLI/headless turns complete without live provider access and without raw secret leakage.

## 7. Verification And Archive / 校验与归档

- [x] 7.1 Run `openspec validate implement-context-graph-projection --type change --strict`.
- [x] 7.2 Run `npm run typecheck`, `npm run lint`, `npm test`, and `node scripts/check-boundaries.mjs`.
- [x] 7.3 Run relevant contract, integration, golden, compatibility, matrix, e2e, and `npm run build:cli` checks.
- [x] 7.4 Record acceptance evidence, sync specs, validate all specs, and archive the change.
