## 1. Contracts and Fixtures

- [x] 1.1 Extend model contracts with provider adapter config, transport, credential resolver, normalized reasoning, finish, usage/cache metadata, provider request metadata, and stable provider errors.
- [x] 1.2 Add deterministic DeepSeek provider fixture types/helpers for fake transport responses without live network access.
- [x] 1.3 Preserve deterministic mock gateway behavior against the expanded event union.
- [x] 1.4 Add tool intent preflight contracts for original/repaired inputs, repair actions, diagnostics, platform metadata, workspace root, and redaction.
- [x] 1.5 Add provider-specific preflight profile contracts for provider id, profile id, tool aliases, argument unwrapping, path fields, and stricter provider diagnostics.

## 2. DeepSeek Provider Adapter

- [x] 2.1 Implement DeepSeek OpenAI-compatible request construction with base URL/model/temperature/tool/reasoning metadata and injected credential headers.
- [x] 2.2 Implement normalization for text deltas, reasoning deltas, tool-call intents, usage/cache metadata, finish reasons, done, and provider errors.
- [x] 2.3 Implement fail-closed missing transport and missing credential behavior with redacted typed errors.
- [x] 2.4 Ensure provider adapter never imports runtime/host packages, never executes tools, and never writes memory/cache directly.
- [x] 2.5 Implement a deterministic tool intent preflight service that validates model-visible tool names, safe workspace paths, platform support, and repairability before execution.
- [x] 2.6 Implement safe path repair for redundant `./`, slash direction, and workspace-relative paths, and typed rejection for absolute paths, parent traversal, home expansion, and ambiguous platform syntax.
- [x] 2.7 Implement DeepSeek provider preflight profile for OpenAI-style function aliases and JSON `arguments` unwrapping before common safety validation.

## 3. Lint Enforcement

- [x] 3.1 Add AST lint rule forbidding direct provider credential reads from `process.env`, filesystem secret paths, or host credential APIs outside credential/platform owner packages and tests.
- [x] 3.2 Add lint tests proving provider credential access and provider execution bypass violations fail with stable rule ids.

## 4. Tests and Acceptance

- [x] 4.1 Add package-local model-gateway tests for request construction, missing credential, missing transport, response normalization, reasoning, tool calls, usage/cache, finish, and provider errors.
- [x] 4.2 Add contract/integration or golden tests for DeepSeek provider normalized event traces using fake transport fixtures.
- [x] 4.3 Add preflight tests for repaired workspace paths, rejected unsafe paths, unknown tool rejection, Windows/POSIX separator normalization, and replayable diagnostics.
- [x] 4.4 Add provider-profile tests proving DeepSeek aliases/argument unwrapping are repaired and invalid provider arguments are rejected before execution.
- [x] 4.5 Run `openspec validate add-deepseek-ai-provider --type change --strict`.
- [x] 4.6 Run `npm run lint`.
- [x] 4.7 Run `npm run typecheck`.
- [x] 4.8 Run `npm test` and targeted provider/preflight suites.
