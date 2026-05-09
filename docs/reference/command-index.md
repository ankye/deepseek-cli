# Command Index / 命令索引

## Development / 开发

```bash
npm install
npm run typecheck
npm run lint
npm test
```

## Boundaries / 边界

```bash
node scripts/check-boundaries.mjs
```

## Test Layers / 测试层

```bash
npm run test:contracts
npm run test:integration
npm run test:golden
npm run test:versioning
npm run test:matrix
npm run test:e2e
```

## CLI / CLI

```bash
npm run build:cli
npm run smoke:headless
npx tsx src/apps/cli/src/index.ts run "smoke" --output jsonl
npx tsx src/apps/cli/src/index.ts chat --output jsonl
npx tsx src/apps/cli/src/index.ts init
npx tsx src/apps/cli/src/index.ts doctor --fake-live --output json
```

## OpenSpec / OpenSpec

```bash
openspec list
openspec validate <change-id> --type change --strict
openspec validate --specs --strict
openspec archive <change-id> --yes
```

## Live Tests / Live 测试

```bash
DEEPSEEK_LIVE_TESTS=1 npm run smoke:live:deepseek
DEEPSEEK_LIVE_AGENT_LOOP_TESTS=1 npm run smoke:live:agent-loop
DEEPSEEK_LIVE_AUTH_TESTS=1 npm test -- tests/live/deepseek-auth-live-verification.test.ts
```
