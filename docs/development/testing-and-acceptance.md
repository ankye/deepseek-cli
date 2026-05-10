# Testing And Acceptance / 测试与验收

DeepSeek CLI treats tests as product infrastructure. Every platform guarantee should map to a deterministic test, replay trace, matrix fixture, or explicit acceptance evidence.

DeepSeek CLI 将测试视为产品基础设施。每个系统保证都应映射到确定性测试、replay trace、matrix fixture 或显式验收证据。

## Default Gate / 默认门禁

Run this before committing framework or runtime changes:

提交 framework 或 runtime 变更前运行：

```bash
npm run typecheck
npm run lint
npm test
node scripts/check-boundaries.mjs
```

## Release Or Archive Gate / 发布或归档门禁

For OpenSpec archive, release, or acceptance work:

OpenSpec 归档、发布或验收工作需要运行：

```bash
openspec validate <change-id> --type change --strict
openspec validate --specs --strict
npm run test:contracts
npm run test:integration
npm run test:golden
npm run test:versioning
npm run test:matrix
npm run test:e2e
npm run build:cli
npm run smoke:headless
```

## Test Layers / 测试层

| Layer / 层 | Command / 命令 | What it proves / 证明内容 |
| --- | --- | --- |
| Typecheck / 类型检查 | `npm run typecheck` | Type contracts compile across packages. / 跨包类型契约可编译。 |
| Architecture lint / 架构 lint | `npm run lint` | AST and manifest rules catch boundary bypasses. / AST 与 manifest 规则发现边界绕过。 |
| Boundary check / 边界检查 | `node scripts/check-boundaries.mjs` | Package dependencies obey direction rules. / 包依赖遵守方向规则。 |
| Unit/package tests / 单元与包测试 | `npm test` | Local package behavior and core scenarios. / 包内行为与核心场景。 |
| Contract tests / 契约测试 | `npm run test:contracts` | DTOs, schemas, boundaries, manifests, persisted shapes. / DTO、schema、边界、manifest、持久化形态。 |
| Integration tests / 集成测试 | `npm run test:integration` | Kernel, policy, scheduler, bus, session, capability pipeline. / kernel、policy、scheduler、bus、session、capability 管线。 |
| Golden tests / Golden 测试 | `npm run test:golden` | Replayable trace shape and deterministic evidence. / 可 replay trace 与确定性证据。 |
| Versioning tests / 版本契约测试 | `npm run test:versioning` | Schema version, persisted artifact requirements, and fail-closed unsupported versions. / schema version、持久化产物要求，以及不支持版本的 fail-closed 行为。 |
| Matrix tests / 矩阵测试 | `npm run test:matrix` | Platform and scenario matrix behavior. / 平台与场景矩阵行为。 |
| E2E tests / E2E | `npm run test:e2e` | CLI and VSCode host adapters consume runtime events correctly. / CLI 与 VSCode host 正确消费 runtime events。 |

## Recovery Regression / 恢复回归

Checkpoint and undo changes must cover:

checkpoint 与 undo 变更必须覆盖：

- unit tests for checkpoint creation, restore success, stale rejection, empty undo, and secret-safe evidence. / unit tests 覆盖 checkpoint creation、restore success、stale rejection、empty undo 和 secret-safe evidence。
- contract tests for DTO shape and redaction-safe public checkpoint records. / contract tests 覆盖 DTO shape 和脱敏安全的 public checkpoint records。
- integration tests proving core tools emit checkpoint metadata through runtime events. / integration tests 证明 core tools 通过 runtime events 输出 checkpoint metadata。
- golden tests proving replay traces do not contain raw rollback content. / golden tests 证明 replay traces 不包含 raw rollback content。
- matrix tests proving stale restore rejection is consistent across fake platform modes. / matrix tests 证明 stale restore rejection 在 fake platform modes 中一致。

## Acceptance Evidence / 验收证据

Latest acceptance evidence lives under:

最近一次验收证据位于：

```text
tests/acceptance/latest/
```

Acceptance evidence should record:

验收证据应记录：

- Command executed. / 执行的命令。
- Result summary. / 结果摘要。
- Relevant test count or validation count. / 相关测试数量或校验数量。
- Security or boundary evidence when applicable. / 适用时记录安全或边界证据。

## Live Tests / Live 测试

Live DeepSeek API tests are opt-in. Default CI and local verification must stay deterministic.

DeepSeek live API 测试是可选开关。默认 CI 和本地验证必须保持确定性。

```bash
DEEPSEEK_LIVE_TESTS=1 npm run smoke:live:deepseek
DEEPSEEK_LIVE_AUTH_TESTS=1 npm test -- tests/live/deepseek-auth-live-verification.test.ts
DEEPSEEK_LIVE_AGENT_LOOP_TESTS=1 npm run smoke:live:agent-loop
DEEPSEEK_LIVE_AGENT_TOOL_TESTS=1 npm run smoke:live:agent-tools
```

Never commit `.env` or raw credentials.

不要提交 `.env` 或 raw credential。

## Live Agent Tool Execution / Live Agent 工具执行

The live agent tool loop normalises DeepSeek tool calls, runs preflight
safety checks, executes accepted intents through the runtime kernel, and
sends bounded typed feedback (`success`, `repaired`, `rejected`,
`denied`, `timeout`, `cancelled`, `failed`) back to the model until the
turn completes or a terminal failure is emitted.

Live agent tool loop 会归一化 DeepSeek tool calls、执行 preflight 安全
校验、通过 runtime kernel 执行已接受的 intent，并把有界 typed
feedback 回传模型，直到 turn 完成或产生终态失败。

Safety boundaries / 安全边界:

- Live calls default to `toolProjection: "read-only"`; write, process,
  and network capabilities are hidden from the model until the host
  explicitly opts in. / Live 调用默认 `toolProjection: "read-only"`；
  write/process/network 能力默认不向模型投影，除非 host 显式放开。
- Preflight rejects traversal, home, absolute, drive-relative, null-byte,
  and unknown tool intents before envelope creation. / Preflight 在
  envelope 创建前会拒绝 traversal、home、absolute、drive-relative、null
  byte 和未知工具。
- Every tool outcome produces a redacted `ToolResultFeedback` with a
  bounded preview and trace identifiers; raw executor output stays in
  replay/audit records. / 每个 tool 结果都会产生脱敏的
  `ToolResultFeedback`，包含有界 preview 和 trace 标识；raw 输出保留在
  replay/audit 中。
- Recoverable feedback (`rejected`, `denied`, `repaired`) is sent back
  to the model so it can self-correct; non-recoverable feedback
  (`failed`, `timeout`, `cancelled`) terminates the turn. / 可恢复的
  feedback 会回传模型让它自我修正；不可恢复的 feedback 终结本轮。

Commands / 命令:

```bash
npm run smoke:headless
npx tsx src/apps/cli/src/index.ts tools-smoke --output jsonl
DEEPSEEK_LIVE_AGENT_TOOL_TESTS=1 npm run smoke:live:agent-tools
```

Troubleshooting / 排障:

- `skipped`: gate env var missing, or no credentials in `.env` / 环境
  变量没开，或 `.env` 缺凭证。
- `TOOL_INTENT_*_REJECTED`: preflight blocked the call; inspect
  diagnostics inside the `model.tool.rejected` event. / preflight 拒绝
  了这次调用，检查 `model.tool.rejected` 事件里的 diagnostics。
- `KERNEL_POLICY_DENIED`: policy profile does not allow the side
  effect; raise `toolProjection` or configure policy. / policy profile
  不允许此 side effect；提升 `toolProjection` 或配置 policy。
