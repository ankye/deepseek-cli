# Validation Gates / 校验门禁

## Default Gate / 默认门禁

```bash
npm run typecheck
npm run lint
npm test
node scripts/check-boundaries.mjs
```

Use this for most code changes before handoff.

大多数代码变更交付前使用该门禁。

## OpenSpec Change Gate / OpenSpec 变更门禁

```bash
openspec validate <change-id> --type change --strict
npm run typecheck
npm run lint
npm test
node scripts/check-boundaries.mjs
```

Use before marking OpenSpec tasks complete.

在标记 OpenSpec tasks 完成前使用。

## Archive Gate / 归档门禁

```bash
openspec validate <change-id> --type change --strict
openspec validate --specs --strict
npm run test:contracts
npm run test:integration
npm run test:golden
npm run test:versioning
npm run test:matrix
npm run test:e2e
npm run build:cli
npm run smoke:headless
```

Use before `openspec archive <change-id> --yes`.

在执行 `openspec archive <change-id> --yes` 前使用。

## Security-Sensitive Gate / 安全敏感门禁

For secret, sandbox, credential, policy, provider, or platform changes, include:

secret、sandbox、credential、policy、provider 或 platform 变更需要包含：

```bash
npm run test:contracts
npm run test:integration
npm run test:golden
npm run test:matrix
npm run test:e2e
```

Also check that raw secrets do not appear in stdout, JSON output, traces, snapshots, cache artifacts, or assertion messages.

还要检查 raw secret 不出现在 stdout、JSON output、traces、snapshots、cache artifacts 或 assertion messages。
