# Development Guide / 开发指南

This guide explains how to work in the DeepSeek CLI monorepo without breaking platform boundaries.

本文说明如何在 DeepSeek CLI monorepo 中开发，同时不破坏平台边界。

## Quick Start / 快速开始

```bash
npm install
npm run typecheck
npm run lint
npm test
```

Build and smoke the CLI:

构建并 smoke CLI：

```bash
npm run build:cli
npm run smoke:headless
```

## Repository Layout / 仓库结构

| Path / 路径 | Purpose / 用途 |
| --- | --- |
| `src/apps/cli` | CLI host adapter and npm package target. / CLI host 适配器和 npm 发布目标。 |
| `src/apps/vscode-extension` | VSCode host adapter skeleton. / VSCode host 适配器骨架。 |
| `src/packages/platform-contracts` | Shared contracts only. / 只放共享契约。 |
| `src/packages/runtime` | Headless runtime kernel. / headless runtime kernel。 |
| `src/packages/*` | Shared platform packages. / 共享平台包。 |
| `tests/contracts` | Cross-package contract tests. / 跨包契约测试。 |
| `tests/integration` | Runtime integration tests. / runtime 集成测试。 |
| `tests/golden` | Replay and trace tests. / replay 与 trace 测试。 |
| `tests/matrix` | Platform and scenario matrix tests. / 平台与场景矩阵测试。 |
| `tests/e2e` | Host-level smoke tests. / host 层 smoke 测试。 |
| `scripts/lint-framework` | Extensible architecture lint. / 可扩展架构 lint。 |
| `openspec` | Formal requirements and change archive. / 正式需求与变更归档。 |
| `docs` | Developer-facing explanations. / 面向开发者的解释文档。 |

## Package Boundary Rules / 包边界规则

- Apps must not import apps. / app 不得 import app。
- Shared logic belongs under `src/packages/*`. / 共享逻辑放在 `src/packages/*`。
- Use package imports like `@deepseek/runtime`, not cross-package relative imports. / 使用 package import，不用跨包相对路径。
- `platform-contracts` must not import Node filesystem/process APIs, VSCode APIs, model SDKs, or implementation packages. / `platform-contracts` 不得 import Node fs/process、VSCode API、模型 SDK 或实现包。
- Runtime must not depend on testing fakes. / runtime 不得依赖 testing fake。
- Host adapters must not bypass protocol, runtime, policy, session, or bus. / host adapter 不得绕过协议、runtime、policy、session 或 bus。

## Adding A Package / 新增包

1. Add the workspace package under `src/packages/<name>`. / 在 `src/packages/<name>` 下新增 workspace 包。
2. Add package metadata and exports. / 增加 package metadata 与 exports。
3. Add the package to `scripts/workspace-packages.mjs` if boundary rules need to know it. / 如果边界规则需要识别，加入 `scripts/workspace-packages.mjs`。
4. Add contract or unit tests. / 增加 contract 或 unit tests。
5. Run `npm run lint` and `node scripts/check-boundaries.mjs`. / 运行 lint 和边界检查。

## Adding A Capability / 新增能力

1. Define or reuse DTOs in `platform-contracts`. / 在 `platform-contracts` 定义或复用 DTO。
2. Register a manifest in the owner package. / 在责任包注册 manifest。
3. Declare side effects, resource scope, sandbox requirements, secret exposure, and audit metadata. / 声明副作用、资源范围、sandbox、secret、audit。
4. Route execution through the runtime envelope. / 通过 runtime envelope 执行。
5. Add tests at the right layer. / 在正确层级增加测试。

Do not add a direct execution shortcut just because the first implementation is small.

不要因为第一版实现很小就增加直接执行捷径。

## Editing OpenSpec And Docs / 修改 OpenSpec 与 Docs

For non-trivial changes:

非平凡变更：

1. Open an OpenSpec change. / 先开 OpenSpec change。
2. Keep planning and behavior docs bilingual. / 规划和行为文档保持中英双语。
3. Implement tasks. / 执行任务。
4. Update `docs/` if the change introduces new developer concepts. / 如果引入新的开发者概念，更新 `docs/`。
5. Archive after validation. / 校验后归档。

## Git Hygiene / Git 卫生

Do not commit:

不要提交：

- `参考/`
- `.codex/`
- `node_modules/`
- generated caches / 生成缓存
- build output unless explicitly required / 构建产物，除非明确需要
- `.env` or local secrets / `.env` 或本地密钥

Check reference material before pushing:

推送前检查参考材料：

```powershell
git status --short --ignored
git ls-files | Select-String -Pattern "^参考/|^参考\\"
```
