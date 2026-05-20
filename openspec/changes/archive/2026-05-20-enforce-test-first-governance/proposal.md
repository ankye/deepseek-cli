## Why

The test-first rule is currently documented but not mechanically enforced, so implementation-heavy governance can still regress into "spec says yes, code says maybe." / 当前 test-first 规则主要停留在文档层，缺少机械门禁，导致实现型治理仍可能退化为“spec 写了，代码未必执行”。

This change makes non-documentation implementation work fail closed unless the same change set includes focused test coverage or an explicit OpenSpec verification exception. / 本变更让非文档实现工作默认 fail closed：同一批变更必须包含聚焦测试覆盖，或在 OpenSpec 中记录明确 verification 例外。

## What Changes

- Add a repository-level test-first lint gate that inspects the current git change set. / 增加仓库级 test-first lint gate，检查当前 git 变更集。
- Require changed implementation files under `src/**` to be accompanied by unit, contract, regression, golden, matrix, integration, e2e, or package-local test changes. / 要求 `src/**` 下的实现文件变更必须伴随 unit、contract、regression、golden、matrix、integration、e2e 或包内测试变更。
- Allow docs-only changes and generated acceptance evidence updates without requiring new unit tests. / 允许纯文档变更与生成的 acceptance evidence 更新不强制新增单元测试。
- Allow explicit OpenSpec verification exceptions only when the active change records why a test cannot be written first and what substitute verification will run. / 仅当 active change 记录无法先写测试的原因与替代验证方式时，允许 OpenSpec verification 例外。
- Wire the gate into `npm run lint` so local and CI checks fail before implementation-only governance lands. / 将门禁接入 `npm run lint`，让本地与 CI 在 implementation-only 治理落地前失败。

## Capabilities

### New Capabilities

None. / 无。

### Modified Capabilities

- `platform-governance`: Require implementation governance to be backed by mechanical test-first enforcement, not documentation alone. / 要求实现型治理由机械 test-first 门禁支撑，而不只是文档约定。
- `testing-regression`: Require deterministic regression coverage for the test-first lint gate and its allowed exceptions. / 要求 test-first lint gate 及其允许例外具备确定性回归覆盖。

## Impact

- Affected scripts: `scripts/lint.mjs`, new test-first check script. / 影响脚本：`scripts/lint.mjs` 与新增 test-first 检查脚本。
- Affected tests: contract tests for changed implementation files with and without coverage. / 影响测试：覆盖有/无测试伴随时的 contract tests。
- Affected workflow: non-doc implementation changes now fail lint until focused coverage or an explicit OpenSpec verification exception is present. / 影响流程：非文档实现变更在缺少聚焦覆盖或明确 OpenSpec verification 例外时会导致 lint 失败。
