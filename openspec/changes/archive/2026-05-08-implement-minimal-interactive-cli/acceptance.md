# Acceptance Evidence / 验收证据

Change: `implement-minimal-interactive-cli`

变更：`implement-minimal-interactive-cli`

## Verification Commands / 校验命令

- `openspec validate implement-minimal-interactive-cli --type change --strict` passed.
- `openspec validate implement-minimal-interactive-cli --type change --strict` 已通过。
- `npm run typecheck` passed.
- `npm run typecheck` 已通过。
- `npm run lint` passed with `ast lint passed (147 files, 10 rules)`.
- `npm run lint` 已通过，结果为 `ast lint passed (147 files, 10 rules)`。
- `npm test` passed with 128 tests: 126 passed, 2 optional live tests skipped.
- `npm test` 已通过，共 128 个测试：126 个通过，2 个可选 live 测试跳过。
- `node scripts/check-boundaries.mjs` passed.
- `node scripts/check-boundaries.mjs` 已通过。
- `npm run test:integration` passed.
- `npm run test:integration` 已通过。
- `npm run test:golden` passed.
- `npm run test:golden` 已通过。
- `npm run test:e2e` passed.
- `npm run test:e2e` 已通过。
- `npm run build:cli` passed.
- `npm run build:cli` 已通过。

## Product Evidence / 产品证据

- `deepseek interactive` scripted prompt, `/help`, `/cancel`, `/exit`, and EOF-style completion are covered without live provider access.
- `deepseek interactive` 的脚本化 prompt、`/help`、`/cancel`、`/exit` 和 EOF 风格完成路径已覆盖，且不需要 live provider。
- Interactive and headless runtime event semantics are compared in golden replay.
- interactive 与 headless 的 runtime event semantics 已通过 golden replay 对比。
- CLI no-arg non-TTY behavior prints deterministic help instead of blocking.
- CLI 无参数 non-TTY 行为会输出确定性 help，不会阻塞等待输入。
- Interactive controls are represented through command-system metadata and structured results.
- interactive controls 已通过 command-system metadata 与 structured results 表达。
