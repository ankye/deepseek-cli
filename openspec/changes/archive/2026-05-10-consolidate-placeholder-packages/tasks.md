## 1. 源码迁移 / Source Migration

- [x] 1.1 `mkdir -p src/packages/platform-abstraction/src/placeholders/`。
- [x] 1.2 新建 `src/packages/platform-abstraction/src/placeholders/agent-plugin.ts`，把 `src/packages/plugin-system/src/index.ts` 的内容原样移入，import 从 `@deepseek/platform-contracts` 保持不变。
- [x] 1.3 同样新建 `agent-extension.ts`、`agent-evolution.ts`、`agent-remote.ts`、`agent-distribution.ts`。
- [x] 1.4 `src/packages/platform-abstraction/src/index.ts` 末尾追加 5 行 `export * from "./placeholders/agent-*.js"`。

## 2. 消费者切换 / Consumer Rewire

- [x] 2.1 `src/packages/testing-regression/src/fakes/index.ts`：5 个独立 `import` 合并成一个 `from "@deepseek/platform-abstraction"`。
- [x] 2.2 grep 确认没有其他 TS 文件仍然直接 import 这 5 个包路径（仅 package.json 中出现，已在 §3 清理）。

## 3. Workspace 元数据 / Workspace Metadata

- [x] 3.1 根 `package.json` 使用 `src/packages/*` glob，无需修改。
- [x] 3.2 `scripts/workspace-packages.mjs`：`packages` 数组删 5 条；`packageDependencies` 里 5 个键值对删掉；`runtime` 和 `testing-regression` 的数组各删 5 条。
- [x] 3.3 `src/packages/runtime/package.json`：`dependencies` 删 5 条。
- [x] 3.4 `src/packages/testing-regression/package.json`：同 3.3。

## 4. 删除目录 / Delete Directories

- [x] 4.1 删除 `src/packages/plugin-system/`、`extension-system/`、`evolution-engine/`、`remote-runtime-connectivity/`、`distribution-update-management/`。

## 5. Lint / Boundary 调整

- [x] 5.1 `node scripts/check-boundaries.mjs` 输出 `dependency boundaries passed for 27 packages from src (16 rules)`，无硬编码需改。
- [x] 5.2 `npm run lint` 通过（`ast lint passed (209 files, 16 rules)`）。
- [x] 5.3 `tests/contracts/package-boundaries.test.ts` 无硬编码包数或名单，自动适配。

## 6. 文档 / Documentation

- [x] 6.1 `grep -rn "32 packages\|32 package\|32 workspace" docs/ openspec/` 只命中 change pack 自身，无需修改。
- [x] 6.2 `docs/architecture/` 与 `docs/development/` 未列举包清单，无需修改。

## 7. 验证 / Verification

- [x] 7.1 `npm run typecheck`。
- [x] 7.2 `npm run lint`。
- [x] 7.3 `node scripts/check-boundaries.mjs`。
- [x] 7.4 `npm test`（期望 275 pass + 4 skip）。
- [x] 7.5 `ls src/packages/ | wc -l` = 27。
- [x] 7.6 `npm run smoke:live:e2e`（环境门控；无 key 时 skip）。
- [x] 7.7 `openspec validate consolidate-placeholder-packages --strict` 和 `openspec validate --specs --strict` 都通过。
- [x] 7.8 刷新 `tests/acceptance/latest/` 证据，重新生成 `acceptance-index.md`。
