## 1. Contracts And Runtime Loop / 契约与 Runtime Loop

- [ ] 1.1 Define provider-neutral agent loop request, response, event, output mode, terminal status, and error contracts in shared platform/runtime contracts.
- [ ] 1.2 Implement runtime-owned model-tool iteration for one-shot turns with deterministic dependency injection.
- [ ] 1.3 Implement chat session turn submission that preserves session id across multiple turns.
- [ ] 1.4 Enforce iteration, tool-call, timeout, retry, output, and budget limits inside runtime.
- [ ] 1.5 Emit canonical lifecycle, model, tool, repair, preflight, retry, cancellation, error, and terminal events with stable schema versions.

## 2. Model Gateway And Tool Intent / 模型网关与工具意图

- [ ] 2.1 Extend model request construction to include projected context, model-visible tool schemas, tool result messages, profile metadata, credential reference, timeout metadata, and trace context.
- [ ] 2.2 Normalize DeepSeek/OpenAI-compatible tool calls into provider-neutral intents with parse diagnostics and repair eligibility.
- [ ] 2.3 Add runtime repair and validation flow for malformed but recoverable provider tool-call inputs.
- [ ] 2.4 Fail unsupported provider capabilities before network dispatch.
- [ ] 2.5 Add opt-in live DeepSeek agent-loop smoke coverage for structural provider evidence.

## 3. Core Tool Projection And Governance / 核心工具投影与治理

- [ ] 3.1 Project model-visible schemas from registered executable capabilities, policy state, platform availability, and provider compatibility metadata.
- [ ] 3.2 Implement preflight normalization for model-supplied paths, shell commands, cwd, environment scope, resource locks, and output limits.
- [ ] 3.3 Ensure all model-requested tools pass through execution envelope, policy, scheduler, timeout, retry, and trace boundaries.
- [ ] 3.4 Return bounded model-facing tool result previews and richer replay/audit evidence.
- [ ] 3.5 Add lint or boundary tests that reject CLI/provider direct execution bypasses.

## 4. CLI Product Surface / CLI 产品界面

- [ ] 4.1 Add `deepseek run "<task>"` command as a thin runtime adapter.
- [ ] 4.2 Add `deepseek chat` command with interactive prompt loop, clean exit handling, and cancellation.
- [ ] 4.3 Add text output rendering for streaming assistant text, bounded tool progress, diagnostics, and trace ids.
- [ ] 4.4 Add JSONL output mode that emits one canonical runtime event per line.
- [ ] 4.5 Add JSON output mode that emits one final summary object with status, assistant summary, ids, diagnostics, and redaction metadata.
- [ ] 4.6 Resolve model profile, credential reference, workspace root, policy profile, output mode, timeout, and live/offline mode through shared config/platform services.

## 5. Testing, Replay, And Acceptance / 测试、回放与验收

- [ ] 5.1 Add deterministic unit tests for no-tool success, tool success, repair success, repair rejection, policy denial, timeout, cancellation, and provider failure.
- [ ] 5.2 Add integration tests for fake model plus core tool execution through runtime governance.
- [ ] 5.3 Add golden trace fixtures for canonical event order, schema versions, trace correlation, redaction metadata, and terminal statuses.
- [ ] 5.4 Add CLI e2e tests for `deepseek run --output json`, `deepseek run --output jsonl`, and scripted `deepseek chat --output jsonl`.
- [ ] 5.5 Add opt-in live DeepSeek smoke tests that are skipped by default and assert structure rather than exact generated text.
- [ ] 5.6 Update README and docs with first usable agent workflow, output modes, live test setup, and troubleshooting.

## 6. Verification And Release Readiness / 验证与发布准备

- [ ] 6.1 Run `npm run typecheck`.
- [ ] 6.2 Run `npm run lint`.
- [ ] 6.3 Run `npm test`.
- [ ] 6.4 Run `node scripts/check-boundaries.mjs`.
- [ ] 6.5 Run `npm run test:integration`, `npm run test:golden`, and `npm run test:e2e`.
- [ ] 6.6 Run `npm run build:cli` and local CLI smoke checks for `run`, `chat`, `doctor`, and `verify-install`.
- [ ] 6.7 Validate OpenSpec with `openspec validate deliver-first-usable-agent-loop --strict` and `openspec validate --specs --strict`.
