# Acceptance Evidence / 验收证据

## Summary / 摘要

`implement-context-graph-projection` has completed deterministic validation for the first R2 ContextGraph projection boundary. The implementation introduces versioned projection contracts, deterministic in-memory projection, projection budget/cache/redaction evidence, runtime projection events before kernel execution, and architecture lint enforcement against host/provider context assembly bypasses.

`implement-context-graph-projection` 已完成 R2 第一阶段 ContextGraph projection 边界的确定性验收。实现新增了版本化 projection contracts、确定性的 in-memory projection、projection budget/cache/redaction evidence、kernel execution 前的 runtime projection events，以及防止 host/provider 绕过上下文组装边界的 architecture lint。

## Verification Commands / 校验命令

- `openspec validate implement-context-graph-projection --type change --strict` passed.
- `npm run typecheck` passed.
- `npm run lint` passed with 155 files and 11 architecture rules.
- `npm test` passed: 148 tests total, 146 passed, 2 optional live-provider tests skipped.
- `node scripts/check-boundaries.mjs` passed.
- `npm run test:contracts` passed.
- `npm run test:integration` passed.
- `npm run test:golden` passed.
- `npm run test:compatibility` passed.
- `npm run test:matrix` passed.
- `npm run build:cli` passed.
- `npm run test:e2e` passed.

## Behavioral Evidence / 行为证据

- Contract tests cover projection DTO schema versions, serializability, cache entry invalidation metadata, and fake substitutability.
- Unit tests cover filtering, ordering, budget fitting, degradation, redaction, cache hit behavior, unsupported schema rejection, and immutable projection output.
- Integration tests prove projection events occur before kernel execution and hard budget rejection prevents kernel/model dispatch.
- Golden replay captures projection selected/excluded metadata, budget decisions, redaction summaries, cache metadata, and terminal state.
- Compatibility tests reject unsupported projection schema versions.
- Matrix tests cover empty context, large prompt rejection, secret fixture redaction/exclusion, stale cache behavior, soft degradation, and unavailable memory-style degradation.
- E2E tests prove CLI/headless turns remain deterministic, offline by default, and free of raw secret output.

- 合同测试覆盖 projection DTO schema versions、serializability、cache entry invalidation metadata 和 fake substitutability。
- 单元测试覆盖 filtering、ordering、budget fitting、degradation、redaction、cache hit behavior、unsupported schema rejection 和 immutable projection output。
- 集成测试证明 projection events 在 kernel execution 前发生，且 hard budget rejection 会阻止 kernel/model dispatch。
- Golden replay 捕获 projection selected/excluded metadata、budget decisions、redaction summaries、cache metadata 和 terminal state。
- Compatibility 测试拒绝 unsupported projection schema versions。
- Matrix 测试覆盖 empty context、large prompt rejection、secret fixture redaction/exclusion、stale cache behavior、soft degradation 和 unavailable memory-style degradation。
- E2E 测试证明 CLI/headless turns 默认确定性离线运行，且不输出 raw secret。

## Acceptance Decision / 验收结论

The change is ready to archive after main specs are synchronized and strict spec validation passes.

在主规格同步并通过 strict spec validation 后，该变更可以归档。
