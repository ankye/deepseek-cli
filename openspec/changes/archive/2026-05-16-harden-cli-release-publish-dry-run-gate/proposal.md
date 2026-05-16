## Why

`diagnostics verify` could report release readiness while `npm publish --dry-run` still failed because the CLI package version already existed on npm. That made the release gate too optimistic for real publishing.

`diagnostics verify` 曾经可能报告 release ready，但 `npm publish --dry-run` 仍会因为 CLI package version 已在 npm 存在而失败。这让发布门禁对真实发布过于乐观。

## What Changes

- Require recorded `npm publish --dry-run` evidence before `diagnostics verify` can report `publishDryRunReady=true`.
- Parse the dry-run evidence for the current `deepseek-agent-cli@version`, npm error output, and published-version collision messages.
- Add a failing `release.publish-dry-run` check when evidence is missing, stale for another version, contains npm errors, or shows a published-version collision.
- Bump the CLI package to `0.1.5` and record successful dry-run evidence for that unpublished version.

- 要求记录的 `npm publish --dry-run` evidence 存在后，`diagnostics verify` 才能报告 `publishDryRunReady=true`。
- 解析 dry-run evidence，检查当前 `deepseek-agent-cli@version`、npm error output 与已发布版本冲突消息。
- 当 evidence 缺失、属于其他版本、包含 npm error，或显示已发布版本冲突时，新增失败的 `release.publish-dry-run` check。
- 将 CLI package 升到 `0.1.5`，并为该未发布版本记录成功 dry-run evidence。

## Impact

- A previously passing release gate can now block until the publish dry-run evidence is refreshed.
- The diagnostics remain read-only; they inspect local evidence and do not publish.

- 之前通过的 release gate 现在可能会阻塞，直到 publish dry-run evidence 被刷新。
- diagnostics 仍保持只读；它只检查本地 evidence，不执行真实发布。
