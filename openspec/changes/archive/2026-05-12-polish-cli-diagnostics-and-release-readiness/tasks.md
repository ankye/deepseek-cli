## 1. Contracts And Command Surface / 契约与命令表面

- [x] 1.1 Add implementation-free diagnostics/release readiness DTOs or extend readiness DTOs only where needed. / 增加无实现的 diagnostics/release readiness DTOs，或仅在需要处扩展 readiness DTOs。
- [x] 1.2 Extend CLI argument parsing, help, and dispatch for `deepseek diagnostics bundle|release|doctor` with text/json/jsonl modes. / 扩展 CLI 参数解析、help 和分发，支持 `deepseek diagnostics bundle|release|doctor` 的 text/json/jsonl modes。
- [x] 1.3 Keep diagnostics command local to CLI host adapters and avoid direct runtime/model/tool execution. / 将 diagnostics command 保持在 CLI host adapters 内，避免直接执行 runtime/model/tool。

## 2. Diagnostics And Release Evidence / 诊断与发布证据

- [x] 2.1 Implement CLI diagnostics assembly for local support bundles using observability bundle contracts and redacted synthetic evidence. / 基于 observability bundle contracts 与脱敏合成证据实现 CLI diagnostics local support bundle 组装。
- [x] 2.2 Implement release-readiness evidence for CLI package metadata, bin entry, expected tarball files, publish access, generated bundle hygiene, and verification command pointers. / 实现 CLI package metadata、bin entry、expected tarball files、publish access、generated bundle hygiene 和 verification command pointers 的 release-readiness evidence。
- [x] 2.3 Extend readiness doctor/privacy/verify-install metadata with release-readiness and support-bundle policy evidence. / 扩展 readiness doctor/privacy/verify-install metadata，加入 release-readiness 和 support-bundle policy evidence。
- [x] 2.4 Render diagnostics output in text, JSON, and JSONL without terminal controls in structured modes. / 在 text、JSON 和 JSONL 中渲染 diagnostics output，并确保 structured modes 无 terminal controls。

## 3. Redaction, Fixtures, And Docs / 脱敏、Fixtures 与文档

- [x] 3.1 Add redaction evidence for `pit.diagnostic-redaction.support-bundle` and `pit.env-snapshot.immutable-startup` in diagnostics outputs. / 在 diagnostics outputs 中增加 `pit.diagnostic-redaction.support-bundle` 与 `pit.env-snapshot.immutable-startup` 的 redaction evidence。
- [x] 3.2 Add tests proving serialized diagnostics outputs omit raw env/auth/credential/plugin/MCP/trace/path secret fixtures. / 增加测试，证明序列化 diagnostics outputs 不包含 raw env/auth/credential/plugin/MCP/trace/path secret fixtures。
- [x] 3.3 Update CLI README and product docs with diagnostics/release readiness usage and status. / 更新 CLI README 和产品文档，补充 diagnostics/release readiness 用法与状态。

## 4. Regression And Verification / 回归与校验

- [x] 4.1 Add CLI tests for diagnostics bundle/release/doctor in text, JSON, and JSONL modes. / 增加 CLI tests，覆盖 diagnostics bundle/release/doctor 的 text、JSON 和 JSONL modes。
- [x] 4.2 Add contract/e2e tests for readiness release evidence, support-bundle redaction, package surface, and external export denial. / 增加 contract/e2e tests，覆盖 readiness release evidence、support-bundle redaction、package surface 和 external export denial。
- [x] 4.3 Run `openspec validate polish-cli-diagnostics-and-release-readiness --type change --strict` and `openspec validate --specs --strict`. / 运行 `openspec validate polish-cli-diagnostics-and-release-readiness --type change --strict` 和 `openspec validate --specs --strict`。
- [x] 4.4 Run `npm run typecheck`, `npm run lint`, targeted diagnostics/readiness/observability/CLI tests, `npm test`, and `node scripts/check-boundaries.mjs`. / 运行 `npm run typecheck`、`npm run lint`、定向 diagnostics/readiness/observability/CLI tests、`npm test` 和 `node scripts/check-boundaries.mjs`。
- [x] 4.5 Review `git status --short --ignored` and confirm forbidden local/reference/generated/secret paths are not added. / 检查 `git status --short --ignored`，确认未加入禁入的 local/reference/generated/secret paths。
