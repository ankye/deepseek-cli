## 1. Fixture Catalog / Fixture Catalog

- [x] 1.1 Add `src/packages/testing-regression/src/reference-pits` with typed catalog entries, selectors, coverage assertions, and redaction-safe serialization. / 增加 `src/packages/testing-regression/src/reference-pits`，包含类型化 catalog entries、selectors、coverage assertions 和 redaction-safe serialization。
- [x] 1.2 Export the reference pit catalog from `@deepseek/testing-regression` without adding implementation dependencies to `platform-contracts`. / 从 `@deepseek/testing-regression` 导出 reference pit catalog，且不向 `platform-contracts` 增加实现依赖。
- [x] 1.3 Add contract tests proving required pit families exist, covered/partial fixtures have evidence ids, planned fixtures remain visible, and serialized catalog contains no raw secrets or copied reference details. / 增加 contract tests，证明必需坑位族存在、covered/partial fixtures 具备 evidence ids、planned fixtures 保持可见，且序列化 catalog 不含 raw secrets 或复制的参考细节。

## 2. Owner Regression Backfill / Owner 回归回填

- [x] 2.1 Add policy-sandbox tests for bypass hard-safety behavior, headless fail-closed approval, and shell parser fallback risk classification. / 增加 policy-sandbox 测试，覆盖 bypass hard-safety behavior、headless fail-closed approval 和 shell parser fallback risk classification。
- [x] 2.2 Harden platform path resolution where needed and add tests for unsafe path syntaxes plus safe relative path acceptance. / 在需要处加固 platform path resolution，并增加 unsafe path syntaxes 与 safe relative path acceptance 测试。
- [x] 2.3 Harden config construction snapshots where needed and add tests for source precedence, immutable environment/CLI snapshots, and raw secret rejection. / 在需要处加固 config construction snapshots，并增加 source precedence、immutable environment/CLI snapshots 和 raw secret rejection 测试。
- [x] 2.4 Add plugin manager tests for permission expansion visibility and integrity mismatch fail-closed behavior using fixture ids. / 增加 plugin manager 测试，用 fixture ids 覆盖 permission expansion visibility 和 integrity mismatch fail-closed behavior。
- [x] 2.5 Add remote connectivity tests for remote binding/session/transport/audit identity separation and cancellation targeting. / 增加 remote connectivity 测试，覆盖 remote binding/session/transport/audit identity separation 和 cancellation targeting。
- [x] 2.6 Add observability tests for diagnostic bundle redaction across env, auth header, MCP credential, plugin metadata, file path, and trace payload fixtures. / 增加 observability 测试，覆盖 env、auth header、MCP credential、plugin metadata、file path 和 trace payload fixtures 的 diagnostic bundle redaction。

## 3. Documentation And Governance / 文档与治理

- [x] 3.1 Update the CLI reference extraction implementation plan so the pit-to-fixture backlog points to the executable catalog and owner evidence. / 更新 CLI 参考抽离实施方案，使坑位到 fixture backlog 指向可执行 catalog 和 owner evidence。
- [x] 3.2 Update product roadmap metadata guidance to require future CLI OpenSpecs to cite fixture ids for relevant reference pits. / 更新产品路线图元数据指引，要求后续 CLI OpenSpec 为相关 reference pits 引用 fixture ids。
- [x] 3.3 Ensure new planning and behavior text remains bilingual. / 确保新增规划和行为文本保持双语。

## 4. Verification / 校验

- [x] 4.1 Run `openspec validate backfill-reference-pit-fixtures --type change --strict`. / 运行 `openspec validate backfill-reference-pit-fixtures --type change --strict`。
- [x] 4.2 Run `openspec validate --specs --strict`. / 运行 `openspec validate --specs --strict`。
- [x] 4.3 Run `npm run typecheck`, `npm run lint`, and targeted owner tests for testing-regression, policy, platform, config, plugin, remote, and observability fixtures. / 运行 `npm run typecheck`、`npm run lint`，以及 testing-regression、policy、platform、config、plugin、remote 和 observability fixtures 的定向 owner tests。
- [x] 4.4 Run `npm test` and `node scripts/check-boundaries.mjs`. / 运行 `npm test` 和 `node scripts/check-boundaries.mjs`。
- [x] 4.5 Review `git status --short --ignored` and confirm `参考/`, `.codex/`, `node_modules/`, caches, generated bundles, and secrets are not added. / 检查 `git status --short --ignored`，确认未加入 `参考/`、`.codex/`、`node_modules/`、caches、generated bundles 和 secrets。
