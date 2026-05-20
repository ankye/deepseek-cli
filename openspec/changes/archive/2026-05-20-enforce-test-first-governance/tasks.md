## 1. Contract First / 契约先行

- [x] 1.1 Add deterministic regression tests for implementation-only failure, implementation-plus-test success, docs-only success, and explicit OpenSpec exception success. / 增加确定性回归测试，覆盖只有实现失败、实现加测试成功、纯文档成功、明确 OpenSpec 例外成功。
- [x] 1.2 Validate the OpenSpec change with `openspec validate enforce-test-first-governance --strict`. / 使用 `openspec validate enforce-test-first-governance --strict` 校验本变更。

## 2. Implementation / 实现

- [x] 2.1 Add a repository test-first gate script that parses git changed paths, identifies implementation files, identifies focused test coverage files, and recognizes explicit OpenSpec verification exceptions. / 增加仓库 test-first gate 脚本，解析 git changed paths、识别实现文件、识别聚焦测试覆盖文件，并识别明确 OpenSpec verification 例外。
- [x] 2.2 Wire the gate into `npm run lint` before the AST architecture lint step. / 在 AST architecture lint 之前将门禁接入 `npm run lint`。
- [x] 2.3 Keep diagnostics stable and actionable, including changed implementation paths and accepted exception path when present. / 保持诊断稳定且可行动，包含实现变更路径，并在存在例外时包含已接受例外路径。

## 3. Verification / 验证

- [x] 3.1 Run focused contract tests for the test-first gate. / 运行 test-first gate 的聚焦 contract tests。
- [x] 3.2 Run `npm run lint` to prove the gate is active in the default lint path. / 运行 `npm run lint` 证明门禁已接入默认 lint 路径。
- [x] 3.3 Update task status and leave evidence references for archive. / 更新任务状态并留下归档证据引用。

## Evidence / 证据

- `openspec validate enforce-test-first-governance --strict`
- `npx tsx --test tests/contracts/test-first-governance.test.ts`
- `node scripts/check-test-first-governance.mjs --json`
- `npm run lint`
