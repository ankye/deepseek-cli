## 1. Contracts And Runtime Loop / 契约与 Runtime Loop

- [x] 1.1 Define provider-neutral agent loop request, response, event, output mode, terminal status, and error contracts in shared platform/runtime contracts.
- [x] 1.2 Implement runtime-owned model-tool iteration for one-shot turns with deterministic dependency injection.
- [x] 1.3 Implement chat session turn submission that preserves session id across multiple turns.
- [x] 1.4 Enforce iteration, tool-call, timeout, retry, output, and budget limits inside runtime.
- [x] 1.5 Emit canonical lifecycle, model, tool, repair, preflight, retry, cancellation, error, and terminal events with stable schema versions.

## 2. Model Gateway And Tool Intent / 模型网关与工具意图

- [x] 2.1 Extend model request construction to include projected context, model-visible tool schemas, tool result messages, profile metadata, credential reference, timeout metadata, and trace context.
- [x] 2.2 Normalize DeepSeek/OpenAI-compatible tool calls into provider-neutral intents with parse diagnostics and repair eligibility.
- [x] 2.3 Add runtime repair and validation flow for malformed but recoverable provider tool-call inputs.
- [x] 2.4 Fail unsupported provider capabilities before network dispatch.
- [x] 2.5 Add opt-in live DeepSeek agent-loop smoke coverage for structural provider evidence.

## 3. Core Tool Projection And Governance / 核心工具投影与治理

- [x] 3.1 Project model-visible schemas from registered executable capabilities, policy state, platform availability, and provider compatibility metadata.
- [x] 3.2 Implement preflight normalization for model-supplied paths, shell commands, cwd, environment scope, resource locks, and output limits.
- [x] 3.3 Ensure all model-requested tools pass through execution envelope, policy, scheduler, timeout, retry, and trace boundaries.
- [x] 3.4 Return bounded model-facing tool result previews and richer replay/audit evidence.
- [x] 3.5 Add lint or boundary tests that reject CLI/provider direct execution bypasses.

## 4. CLI Product Surface / CLI 产品界面

- [x] 4.1 Add `deepseek run "<task>"` command as a thin runtime adapter.
- [x] 4.2 Add `deepseek chat` command with chat prompt loop, clean exit handling, and cancellation.
- [x] 4.3 Add text output rendering for streaming assistant text, bounded tool progress, diagnostics, and trace ids.
- [x] 4.4 Add JSONL output mode that emits one canonical runtime event per line.
- [x] 4.5 Add JSON output mode that emits one final summary object with status, assistant summary, ids, diagnostics, and redaction metadata.
- [x] 4.6 Resolve model profile, credential reference, workspace root, policy profile, output mode, timeout, and live/offline mode through shared config/platform services.

## 5. Testing, Replay, And Acceptance / 测试、回放与验收

- [x] 5.1 Add deterministic unit tests for no-tool success, tool success, repair success, repair rejection, policy denial, timeout, cancellation, and provider failure.
- [x] 5.2 Add integration tests for fake model plus core tool execution through runtime governance.
- [x] 5.3 Add golden trace fixtures for canonical event order, schema versions, trace correlation, redaction metadata, and terminal statuses.
- [x] 5.4 Add CLI e2e tests for `deepseek run --output json`, `deepseek run --output jsonl`, and scripted `deepseek chat --output jsonl`.
- [x] 5.5 Add opt-in live DeepSeek smoke tests that are skipped by default and assert structure rather than exact generated text.
- [x] 5.6 Update README and docs with first usable agent workflow, output modes, live test setup, and troubleshooting.

## 6. Verification And Release Readiness / 验证与发布准备

- [x] 6.1 Run `npm run typecheck`.
- [x] 6.2 Run `npm run lint`.
- [x] 6.3 Run `npm test`.
- [x] 6.4 Run `node scripts/check-boundaries.mjs`.
- [x] 6.5 Run `npm run test:integration`, `npm run test:golden`, and `npm run test:e2e`.
- [x] 6.6 Run `npm run build:cli` and local CLI smoke checks for `run`, `chat`, `doctor`, and `verify-install`.
- [x] 6.7 Validate OpenSpec with `openspec validate deliver-first-usable-agent-loop --strict` and `openspec validate --specs --strict`.
