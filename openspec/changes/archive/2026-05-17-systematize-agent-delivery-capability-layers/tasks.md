## 1. OpenSpec And Mapping / OpenSpec 与映射

- [x] 1.1 Validate this change with `openspec validate systematize-agent-delivery-capability-layers --strict`.
- [x] 1.2 Review the layer ownership map against existing specs and remove duplicate or contradictory requirements.
- [x] 1.3 Convert each known Terminal-Bench failure or adapter prompt rule into a product-layer issue, regression fixture, or explicit non-goal.
- [x] 1.4 Convert source-map reference lessons into DeepSeek CLI-owned requirements without copying external implementation details.

## 2. Contracts / 契约

- [x] 2.1 Add host-neutral DTOs for project rule evidence, output contracts, verification expectations, contract verification results, and execution profiles.
- [x] 2.2 Keep DTOs serializable, versioned, redacted, and implementation-free in `@deepseek/platform-contracts`.
- [x] 2.3 Add contract tests for JSON/schema/file/command-plan output contract shapes and noninteractive execution profile metadata.

## 3. Prompt Assembly / Prompt 组装

- [x] 3.1 Project repository rules such as `AGENTS.md` as prioritized runtime-owned sections while preserving the exact user prompt.
- [x] 3.2 Add output-contract sections for JSON, schema, file artifacts, command plans, and completion criteria.
- [x] 3.3 Add trace evidence showing which project rules and output contracts were included, excluded, or degraded.

## 4. Tools And Platform Execution / 工具与平台执行

- [x] 4.1 Add a governed noninteractive execution profile for shell and test tools.
- [x] 4.2 Apply pager/editor avoidance and bounded diagnostics in `shell.run`, `test.run`, and git-backed evidence tools through core/tool contracts.
- [x] 4.3 Add platform matrix coverage for Windows, WSL/Linux, and no-shell hosts.

## 5. Runtime Verification And Repair / Runtime 验证与修复

- [x] 5.1 Discover and run applicable schema, artifact, check-command, and generated-output verification through the normal verifier path.
- [x] 5.2 Feed contract verification failures into the existing self-repair loop with bounded diagnostics.
- [x] 5.3 Fail closed when required output contracts remain unsatisfied after repair budgets are exhausted.

## 6. Memory And Context / 记忆与上下文

- [x] 6.1 Surface diagnostics that distinguish current context, PageIndex, lossless context, permanent memory, provider cache, and external memory hooks.
- [x] 6.2 Ensure memory absence, disabled memory, fake memory, and partial memory produce distinct delivery-score evidence.
- [x] 6.3 Verify that memory/context sections cannot override current project rules, user instructions, or host policy.

## 7. Evaluation And Scoring / 评测与评分

- [x] 7.1 Slim the Terminal-Bench adapter so it only calls official CLI capabilities and records output.
- [x] 7.2 Add layered delivery scoring dimensions for project rules, tools, loop, output contracts, verification, and memory/context.
- [x] 7.3 Ensure adapter-only behavior, fake providers, missing verification, and unimplemented layers score incomplete rather than full credit.

## 8. Verification / 验证

- [x] 8.1 Run `npm run typecheck`, `npm run lint`, `npm test`, and `node scripts/check-boundaries.mjs`.
- [x] 8.2 Run relevant integration, golden, matrix, smoke, and live-gated suites after implementation.
- [x] 8.3 Record acceptance evidence under `tests/acceptance/` when the systemized workflow reaches the delivery target.
