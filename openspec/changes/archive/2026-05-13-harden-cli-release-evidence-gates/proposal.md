## Why

The CLI is close to being the first polished product surface, but release diagnostics still mostly list required evidence paths instead of proving the local release gate is complete. Before calling the CLI "done", `diagnostics release` should fail or warn on missing build artifacts, missing acceptance evidence, and unsafe npm tarball contents.

CLI 已接近成为第一个成熟产品面，但 release diagnostics 目前主要列出 required evidence paths，而不是证明本地发布门禁已经完整。要把 CLI 称为“完成”，`diagnostics release` 必须能对缺失 build artifact、缺失 acceptance evidence、以及不安全 npm tarball 内容给出 fail/warn。

## What Changes

- Add structured release gate evidence for acceptance evidence file existence, CLI build artifact existence, and npm publish dry-run tarball file scope.
- Make `diagnostics release` and `diagnostics doctor` derive pass/warn/fail from those evidence gates instead of only declared command counts.
- Preserve text/JSON/JSONL parity so scripts and future host projections consume the same release evidence records.
- Document the release gate behavior in CLI/publishing docs.
- No breaking API removal; new DTO fields are additive.

- 增加结构化 release gate evidence，覆盖 acceptance evidence 文件存在性、CLI build artifact 存在性、npm publish dry-run tarball 文件范围。
- 让 `diagnostics release` 和 `diagnostics doctor` 基于这些 evidence gates 计算 pass/warn/fail，而不是只看声明的命令数量。
- 保持 text/JSON/JSONL 一致，使脚本和未来 host projection 消费同一 release evidence records。
- 在 CLI/publishing docs 中记录 release gate 行为。
- 不移除公开 API；新增 DTO fields 保持 additive。

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `cli-diagnostics-release-readiness`: Release diagnostics must verify concrete release evidence presence and npm tarball scope. / Release diagnostics 必须验证具体 release evidence 存在性与 npm tarball 范围。
- `cli-first-product-route`: CLI completion requires executable release evidence gates before host promotion. / CLI 完成度必须先具备可执行 release evidence gates，然后才能 host promotion。

## Impact

- Affected code: `src/packages/platform-contracts/src/readiness.ts`, `src/apps/cli/src/diagnostics/release-evidence.ts`, `src/apps/cli/src/diagnostics/index.ts`, CLI tests, acceptance index tests, CLI/publishing docs.
- Affected behavior: `diagnostics release` may now return `warn` or `fail` when required local evidence is absent or tarball scope is unsafe.
- Validation: focused CLI diagnostics tests, contract tests, `openspec validate harden-cli-release-evidence-gates --strict`, typecheck, lint, boundary check.

- 影响代码：`src/packages/platform-contracts/src/readiness.ts`、`src/apps/cli/src/diagnostics/release-evidence.ts`、`src/apps/cli/src/diagnostics/index.ts`、CLI tests、acceptance index tests、CLI/publishing docs。
- 行为影响：当本地必需 evidence 缺失或 tarball 范围不安全时，`diagnostics release` 现在可能返回 `warn` 或 `fail`。
- 校验：聚焦 CLI diagnostics tests、contract tests、`openspec validate harden-cli-release-evidence-gates --strict`、typecheck、lint、boundary check。
