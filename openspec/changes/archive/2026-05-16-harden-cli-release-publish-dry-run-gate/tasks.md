## 1. Release Gate Hardening

- [x] 1.1 Add structured publish dry-run evidence to release verification records. / 将结构化 publish dry-run evidence 加入 release verification record。
- [x] 1.2 Block `diagnostics verify` when dry-run evidence is missing, stale, errored, or shows an npm version collision. / 当 dry-run evidence 缺失、过期、报错或显示 npm 版本冲突时，阻断 `diagnostics verify`。
- [x] 1.3 Add regression coverage for published-version collision evidence. / 为已发布版本冲突 evidence 增加回归覆盖。
- [x] 1.4 Bump the CLI package to an unpublished version and refresh successful dry-run evidence. / 将 CLI package 升到未发布版本，并刷新成功 dry-run evidence。
- [x] 1.5 Require DeepSeek live smoke, live tool coverage, response cache, and current-schema overall delivery capability evidence before publish dry-run readiness. / 在 publish dry-run ready 前要求 DeepSeek live smoke、live tool coverage、response cache 与当前 schema 的 overall delivery capability evidence。

## 2. Verification

- [x] 2.1 Run focused readiness and CLI diagnostics tests. / 运行聚焦的 readiness 与 CLI diagnostics 测试。
- [x] 2.2 Run typecheck, lint, and dependency boundary checks. / 运行 typecheck、lint 与依赖边界检查。
- [x] 2.3 Run `diagnostics release`, `diagnostics verify`, and `npm publish --dry-run`. / 运行 `diagnostics release`、`diagnostics verify` 与 `npm publish --dry-run`。
