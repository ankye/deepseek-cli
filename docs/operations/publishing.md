# Publishing / 发布

Published CLI package name:

已发布 CLI 包名：

```text
deepseek-agent-cli
```

CLI package path:

CLI 包路径：

```text
src/apps/cli
```

## Build / 构建

```bash
npm run build:cli
```

## Dry Run / 干跑

```bash
npm publish --dry-run --workspace deepseek-agent-cli --access public
```

The tarball should contain only CLI package metadata, README, and built `dist/index.js`.

tarball 应只包含 CLI package metadata、README 和构建后的 `dist/index.js`。

## Publish / 发布

```bash
npm publish --workspace deepseek-agent-cli --access public
```

## Release Hygiene / 发布卫生

Before publishing:

发布前：

- Do not include `.env`. / 不包含 `.env`。
- Do not include `参考/`. / 不包含 `参考/`。
- Do not include `.codex/`. / 不包含 `.codex/`。
- Do not include generated caches. / 不包含生成缓存。
- Run the archive/release validation gate. / 运行归档或发布门禁。

## Release Evidence / 发布证据

Run:

运行：

```bash
deepseek diagnostics refresh --output json
deepseek diagnostics release --output json
deepseek diagnostics verify --output json
```

`diagnostics refresh` is the recommended first release-evidence command. It runs only built-in allowlisted local validation steps, writes per-step output under `tests/acceptance/latest/`, and rejects user-supplied command strings. Use `deepseek diagnostics refresh --full --output json` when release evidence needs the heavier deterministic suites such as contracts, integration, golden, versioning, matrix, and e2e.

`diagnostics refresh` 是推荐的第一条 release-evidence 命令。它只运行内置 allowlisted local validation steps，将每步输出写入 `tests/acceptance/latest/`，并拒绝用户自定义 command strings。需要 contracts、integration、golden、versioning、matrix、e2e 等更重的确定性 suites 时，使用 `deepseek diagnostics refresh --full --output json`。

The release diagnostics gate checks package metadata, `dist/index.js` build output, declared acceptance evidence files, support-bundle export policy, and package surface scope. Missing build output or unsafe package files fail release readiness; missing historical acceptance evidence warns until the evidence is refreshed.

release diagnostics 门禁会检查 package metadata、`dist/index.js` 构建产物、声明的 acceptance evidence 文件、support-bundle export policy 与 package surface 范围。缺失构建产物或不安全 package 文件会让 release readiness 失败；缺失历史 acceptance evidence 会在刷新 evidence 前产生警告。

`diagnostics verify` is the recommended local pre-publish entrypoint. It reuses the same release evidence, does not run publish/network/model/test commands, and returns `ready`, `warn`, or `blocked` with the next action and command plan.

`diagnostics verify` 是推荐的本地发布前入口。它复用同一套 release evidence，不运行 publish/network/model/test commands，并返回带 next action 与 command plan 的 `ready`、`warn` 或 `blocked`。
