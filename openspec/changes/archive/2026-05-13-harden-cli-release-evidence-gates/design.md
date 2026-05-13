## Context

`diagnostics release` already reports package metadata, required verification commands, support-bundle policy, and acceptance evidence paths. The weak point is that those paths and build artifacts are mostly declarative: the command does not consistently prove that evidence files exist, that `dist/index.js` exists, or that an npm dry-run tarball would only contain the allowed package surface.

`diagnostics release` 已经报告 package metadata、required verification commands、support-bundle policy 与 acceptance evidence paths。当前弱点是这些 paths 和 build artifacts 主要是声明式：命令没有一致证明 evidence 文件存在、`dist/index.js` 存在，或 npm dry-run tarball 只包含允许的 package surface。

## Goals / Non-Goals

**Goals:**

- Add additive release evidence DTO fields for evidence files, build artifact, and tarball scope.
- Make release readiness checks fail on missing build artifact and unsafe tarball files, and warn on missing historical acceptance evidence.
- Keep all checks local, deterministic, and redacted by default.
- Keep CLI text/JSON/JSONL output based on the same structured evidence.

- 增加 additive release evidence DTO fields，覆盖 evidence files、build artifact 与 tarball scope。
- 对缺失 build artifact 和不安全 tarball 文件给出 fail，对缺失历史 acceptance evidence 给出 warn。
- 所有检查保持本地、确定性、默认脱敏。
- CLI text/JSON/JSONL 输出继续基于同一 structured evidence。

**Non-Goals:**

- Do not publish to npm or require network access.
- Do not run full validation commands inside `diagnostics release`; it reports evidence state, not execute the whole release pipeline.
- Do not make generated `dist/` tracked; it remains build output.

- 不发布 npm，也不要求网络访问。
- `diagnostics release` 不执行完整 validation pipeline；它报告 evidence state，而不是跑完整发布流水线。
- 不把生成的 `dist/` 改为 tracked；它仍是 build output。

## Decisions

### Decision: Release diagnostics checks local evidence state

`collectReleaseReadinessEvidence()` will inspect local filesystem state for declared evidence files and build output. Missing acceptance files produce `warn` so fresh worktrees can still diagnose readiness before evidence refresh; missing build output produces `fail` because npm publish cannot succeed without `dist/index.js`.

`collectReleaseReadinessEvidence()` 会检查本地 filesystem state，验证声明的 evidence files 和 build output。缺失 acceptance files 产生 `warn`，使新工作树在刷新 evidence 前仍可诊断；缺失 build output 产生 `fail`，因为没有 `dist/index.js` 就无法发布。

### Decision: Tarball scope is derived from package metadata first

The initial gate checks `package.json` `files`, `bin`, `exports`, and known allowed package paths without invoking npm. If a later task records `npm publish --dry-run` output, diagnostics can include it as evidence, but this change keeps the default path deterministic and offline.

初始门禁先从 `package.json` 的 `files`、`bin`、`exports` 与已知允许 package paths 推导 tarball scope，不调用 npm。后续如果记录了 `npm publish --dry-run` 输出，diagnostics 可以纳入 evidence，但本变更保持默认路径确定且离线。

### Decision: Structured evidence is additive

Add optional fields to release DTOs rather than replacing existing fields. Existing hosts can ignore new fields; CLI text/JSONL can render richer checks immediately.

通过 optional fields 增强 release DTO，而不是替换现有字段。已有 host 可以忽略新字段；CLI text/JSONL 可以立即渲染更完整 checks。

## Risks / Trade-offs

- Local evidence may be stale -> Diagnostics reports file presence and paths, not semantic freshness; acceptance refresh remains a separate command.
- Offline tarball scope cannot catch npm implementation changes -> Use metadata gate now and keep dry-run command required before publish.
- Missing build artifact may make dev worktrees look failed -> This is intentional for release readiness; users can run `npm run build:cli`.

- 本地 evidence 可能过期 -> Diagnostics 报告文件存在和路径，不声称语义新鲜；acceptance refresh 仍是独立命令。
- 离线 tarball scope 无法捕获 npm 实现变化 -> 当前使用 metadata gate，同时保留 publish 前必须运行 dry-run command。
- 缺失 build artifact 会让开发工作树显示 fail -> 对 release readiness 这是预期行为；用户可运行 `npm run build:cli`。
