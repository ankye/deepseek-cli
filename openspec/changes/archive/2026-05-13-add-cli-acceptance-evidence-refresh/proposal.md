## Why

The CLI can now verify release readiness, but the evidence files it verifies are still refreshed by ad hoc shell commands outside the CLI product surface. To make the CLI feel complete before publish dry-run or host promotion, it needs a deterministic `diagnostics refresh` command that regenerates the local evidence bundle through an explicit allowlist.

CLI 现在已经能验证 release readiness，但它验证的 evidence files 仍依赖 CLI 产品面之外的临时 shell 命令刷新。为了让 CLI 在 publish dry-run 或 host promotion 前形成完整闭环，需要新增确定性的 `diagnostics refresh` 命令，通过显式 allowlist 重新生成本地 evidence bundle。

## What Changes

- Add `deepseek diagnostics refresh` as a local evidence-refresh command.
- Run only an internal allowlist of repository validation commands; no user-provided command strings, publish, network, model, provider, or arbitrary shell execution.
- Default refresh runs a fast release subset: acceptance index, typecheck, lint, dependency boundaries, CLI build, headless smoke, release verify, and release diagnostics.
- `--full` extends the allowlist to heavier deterministic suites such as contracts, integration, golden, versioning, matrix, and e2e.
- Write command outputs to `tests/acceptance/latest/*.txt`, then emit a text/JSON/JSONL summary of refreshed files and failures.

- 新增 `deepseek diagnostics refresh` 作为本地 evidence refresh 命令。
- 只运行内部 allowlist 的仓库校验命令；不接受用户自定义 command strings，不执行 publish、network、model、provider 或任意 shell。
- 默认 refresh 运行快速 release 子集：acceptance index、typecheck、lint、dependency boundaries、CLI build、headless smoke、release verify 与 release diagnostics。
- `--full` 扩展到更重但确定性的 suites，例如 contracts、integration、golden、versioning、matrix 与 e2e。
- 将命令输出写入 `tests/acceptance/latest/*.txt`，再输出 text/JSON/JSONL summary，列出刷新文件与失败项。

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `cli-diagnostics-release-readiness`: Diagnostics gains a controlled evidence refresh command for regenerating local acceptance artifacts. / Diagnostics 新增受控 evidence refresh 命令，用于重新生成本地 acceptance artifacts。
- `cli-first-product-route`: CLI completion evidence requires a repeatable local refresh path, not only passive verification. / CLI completion evidence 不只需要被动验证，还需要可重复的本地刷新路径。

## Impact

- Affected code: `src/packages/platform-contracts/src/readiness.ts`, `src/apps/cli/src/commands/parse.ts`, `src/apps/cli/src/diagnostics/index.ts`, new diagnostics refresh helper, CLI README, publishing/acceptance docs, tests.
- Affected behavior: users can run `deepseek diagnostics refresh` before `diagnostics verify` to regenerate current acceptance evidence.
- Validation: OpenSpec strict validation, focused CLI diagnostics tests, typecheck, lint, boundary check, and targeted refresh dry-run tests.

- 影响代码：`src/packages/platform-contracts/src/readiness.ts`、`src/apps/cli/src/commands/parse.ts`、`src/apps/cli/src/diagnostics/index.ts`、新的 diagnostics refresh helper、CLI README、publishing/acceptance docs、tests。
- 行为影响：用户可以在 `diagnostics verify` 前运行 `deepseek diagnostics refresh`，重新生成当前 acceptance evidence。
- 校验：OpenSpec strict validation、聚焦 CLI diagnostics tests、typecheck、lint、boundary check 与针对性 refresh dry-run tests。
