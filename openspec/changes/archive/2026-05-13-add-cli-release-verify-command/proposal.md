## Why

`diagnostics release` now proves concrete release evidence, but a user still has to interpret multiple checks and command lists manually before deciding whether the CLI is release-ready. The CLI needs a single local verification summary that says whether the current tree can proceed, what evidence is missing, and which validation command should run next.

`diagnostics release` 现在已经能证明具体发布证据，但用户在判断 CLI 是否 release-ready 前仍需要手动解释多个 checks 和 command lists。CLI 需要一个本地 verification summary，一次性说明当前工作树能否继续、缺少什么证据、下一条应该运行哪个校验命令。

## What Changes

- Add a CLI release verification command under diagnostics, exposed as `deepseek diagnostics verify`.
- Reuse existing release readiness evidence instead of executing publishing, network calls, model providers, or full validation suites.
- Render a compact text summary plus JSON/JSONL records with release status, blocking checks, warning checks, missing evidence paths, required command plan, and next action.
- Treat failing release gates as blockers, warning release gates as non-blocking but visible follow-up work, and passing release gates as publish-dry-run ready.
- Document the command as the recommended local pre-publish entrypoint.

- 在 diagnostics 下新增 CLI release verification command，对外为 `deepseek diagnostics verify`。
- 复用现有 release readiness evidence，不执行发布、网络调用、model providers 或完整 validation suites。
- 输出紧凑 text summary，并提供 JSON/JSONL records，包含 release status、blocking checks、warning checks、missing evidence paths、required command plan 与 next action。
- 将失败 release gates 视为 blocker，将 warning release gates 作为非阻塞但可见的后续工作，将通过状态视为可进入 publish dry-run。
- 将该命令记录为推荐的本地发布前入口。

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `cli-diagnostics-release-readiness`: Diagnostics gains a release verification command that aggregates existing release evidence into a decision-ready pre-publish summary. / Diagnostics 新增 release verification command，将现有 release evidence 聚合成可决策的发布前 summary。
- `cli-first-product-route`: CLI completion evidence gains a concrete local verification entrypoint before host promotion. / CLI completion evidence 在 host promotion 前增加具体本地 verification 入口。

## Impact

- Affected code: `src/packages/platform-contracts/src/readiness.ts`, `src/apps/cli/src/commands/parse.ts`, `src/apps/cli/src/diagnostics/index.ts`, CLI README, publishing docs, CLI/e2e/contract tests.
- Affected behavior: `deepseek diagnostics verify` becomes the recommended local pre-publish self-check. It is read-only and does not run npm publish, network calls, model calls, or heavyweight test suites.
- Validation: OpenSpec strict validation, focused CLI diagnostics tests, local readiness/e2e tests, typecheck, lint, boundary check.

- 影响代码：`src/packages/platform-contracts/src/readiness.ts`、`src/apps/cli/src/commands/parse.ts`、`src/apps/cli/src/diagnostics/index.ts`、CLI README、publishing docs、CLI/e2e/contract tests。
- 行为影响：`deepseek diagnostics verify` 成为推荐的本地发布前自检入口。该命令只读，不运行 npm publish、网络调用、model calls 或重型测试套件。
- 校验：OpenSpec strict validation、聚焦 CLI diagnostics tests、local readiness/e2e tests、typecheck、lint、boundary check。
