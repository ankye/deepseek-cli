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
