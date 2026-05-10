## 1. Live Dependency Factory / Live 依赖 Factory

- [x] 1.1 Add `createLiveCliDependencies(options: { workspaceRoot: string; credentialAuth?: unknown; transport?: ModelProviderTransport })` to `src/packages/testing-regression/src/fakes/index.ts` that starts from `createDeterministicRuntimeDependencies()` and overrides `platform`, `workspaceState`, and `codeIntelligence` with their real-platform equivalents, plus `models` with `DeepSeekOpenAIProvider`.
- [x] 1.2 Keep the deterministic factory byte-identical in behavior; no test under `src/packages/*/test/` or `tests/` outside the new ones should observe a change.
- [x] 1.3 Export the new factory from the package barrel so `@deepseek/testing-regression` exposes both factories.

## 2. CLI Wiring / CLI 线路

- [x] 2.1 Change `createCliAgentRuntime` in `src/apps/cli/src/index.ts` to call `createLiveCliDependencies` when `options.live === true` and otherwise keep `createDeterministicRuntimeDependencies`.
- [x] 2.2 Ensure credential and transport construction for the live provider happens inside the factory, not inline in the CLI, so future hosts reuse the same wiring.
- [x] 2.3 Preserve the existing `registerRuntimeCoreTools(deps, workspaceRoot)` call and the `createDefaultRuntimeKernel(deps)` step for both modes.

## 3. Tests / 测试

- [x] 3.1 Add `tests/integration/live-factory-real-fs.test.ts` that constructs live deps with a deterministic model (`DeterministicMockModelGateway` or a `SingleToolCallModelGateway` pointed at `core.file.read` / `core.file.list`) against `tests/fixtures/fake-workspace/` and asserts the tool result contains real-file content, not a `Fake file not found` string.
- [x] 3.2 Tighten `tests/live/deepseek-agent-tool-live-smoke.test.ts` with a negative assertion: the serialized event stream must not contain the substring `Fake file not found`.
- [x] 3.3 Add one factory-shape unit test: `createLiveCliDependencies` returns a `RuntimeDependencies` where `platform instanceof NodePlatformRuntime` (asserted via duck typing because the export is through an interface).

## 4. Operator Surface / 运维面

- [x] 4.1 Add a `smoke:live:e2e` npm script running the new integration test without the live gate (it uses deterministic models) so contributors can reproduce real-FS tool turns without credentials.
- [x] 4.2 Update `docs/development/testing-and-acceptance.md` Live Agent Tool Execution section with the new live dependency contract and the deterministic-but-real-FS smoke.
- [x] 4.3 Update `scripts/live-check.mjs` comment to note that it now exercises the real filesystem so contributors understand why edits to `README.md` would be real edits.

## 5. Verification / 验证

- [x] 5.1 Run `npm run typecheck`.
- [x] 5.2 Run `npm run lint`.
- [x] 5.3 Run `npm test` (expect 249 + new tests, 0 fail).
- [x] 5.4 Run `node scripts/check-boundaries.mjs`.
- [x] 5.5 Run `npm run test:integration` and `npm run smoke:live:e2e` and `npm run smoke:headless`.
- [x] 5.6 Refresh `tests/acceptance/latest/` evidence (typecheck, lint, boundaries, integration, smoke-headless, test-summary) and regenerate `acceptance-index.md`.
- [x] 5.7 Run gated live check manually: `DEEPSEEK_LIVE_AGENT_TOOL_TESTS=1 npm run smoke:live:agent-tools` (operator-driven, requires `.env` with `DEEPSEEK_API_KEY`).
- [x] 5.8 Validate OpenSpec: `openspec validate enable-real-platform-in-live-mode --strict` and `openspec validate --specs --strict`.
