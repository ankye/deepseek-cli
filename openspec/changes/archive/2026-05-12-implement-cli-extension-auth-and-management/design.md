## Context

DeepSeek already has the R3 building blocks: plugin lockfile contracts, deterministic MCP gateway v1, canonical skill summaries and activation, credential reference storage, approval evidence, diagnostics, and reference pit fixtures. What is missing is a CLI-first management surface that composes these pieces into a daily-use workflow without turning the CLI into an execution owner.

DeepSeek 已经具备 R3 基础模块：plugin lockfile contracts、deterministic MCP gateway v1、canonical skill summaries and activation、credential reference storage、approval evidence、diagnostics 和 reference pit fixtures。当前缺口是一个 CLI-first management surface，把这些能力组合成日常可用流程，同时不让 CLI 变成执行所有者。

## Goals / Non-Goals

**Goals:**

- Provide `deepseek extension ...` commands for listing extension surfaces, plugin install/apply/snapshot/verify, skill list/activate, credential scope diagnostics, and MCP test projection. / 提供 `deepseek extension ...` commands，覆盖 extension surface listing、plugin install/apply/snapshot/verify、skill list/activate、credential scope diagnostics 和 MCP test projection。
- Render text, JSON, and JSONL from the same structured records. / 从同一套 structured records 渲染 text、JSON 和 JSONL。
- Show plugin permission diffs before the caller treats install/apply as accepted, with explicit expansion pit fixture evidence. / 在调用方把 install/apply 视为已接受前展示 plugin permission diff，并包含权限扩张坑位证据。
- Diagnose scoped credential availability for provider, plugin, and MCP connector access without resolving or printing raw secrets. / 诊断 provider、plugin 和 MCP connector 访问所需的 scoped credential availability，且不解析或打印 raw secrets。
- Keep command execution in shared packages and keep CLI files split by parser, command adapter, renderer, and host wiring. / 保持命令执行归属共享 packages，并按 parser、command adapter、renderer 和 host wiring 拆分 CLI 文件。
- Add deterministic tests and reference pit coverage for `pit.extension-permission-expansion.permission-diff`, `pit.mcp-plugin-precedence.enterprise-deny`, `pit.env-snapshot.immutable-startup`, `pit.diagnostic-redaction.support-bundle`, and `pit.legacy-contribution-normalization.manifest-boundary`. / 增加确定性测试与参考坑位覆盖。

**Non-Goals:**

- Do not implement remote marketplace search, remote plugin download, signed package verification, blocklists, or enterprise managed policy enforcement. / 不实现 remote marketplace search、remote plugin download、signed package verification、blocklists 或 enterprise managed policy enforcement。
- Do not implement a full-screen TUI or vi keybinding layer in this pack. / 本包不实现 full-screen TUI 或 vi keybinding layer。
- Do not promote extension UX to VSCode/server until CLI semantics have evidence. / CLI 语义有证据前，不把 extension UX 推广到 VSCode/server。
- Do not copy or depend on local reference implementation source. / 不复制或依赖本地参考实现源码。

## Decisions

### Decision: Add a CLI extension adapter over shared managers

`src/apps/cli/src/commands/extension.ts` will assemble records by calling public exports from `@deepseek/platform-abstraction`, `@deepseek/mcp-gateway`, `@deepseek/skill-system`, and `@deepseek/credential-auth-management`. The adapter owns argument-to-record wiring and rendering only.

`src/apps/cli/src/commands/extension.ts` 将通过 `@deepseek/platform-abstraction`、`@deepseek/mcp-gateway`、`@deepseek/skill-system` 和 `@deepseek/credential-auth-management` 的 public exports 组装 records。adapter 只负责参数到 record 的接线与渲染。

Alternative considered: implement extension management in `src/apps/cli/src/entry/run-cli.ts`. Rejected because it would recreate the central-file pressure already identified in the reference extraction plan.

备选方案：在 `src/apps/cli/src/entry/run-cli.ts` 中实现 extension management。拒绝原因是它会重演参考抽离方案中已识别的中心文件膨胀压力。

### Decision: Use one structured extension management record model

All subcommands return an `ExtensionManagementRecord` shape with `schemaVersion`, `kind`, `status`, `items`, `diagnostics`, `permissionDiffs`, `credentialScopes`, `audit`, `referencePitFixtureIds`, and `redaction`. Text output is a projection of this record; JSON returns the record; JSONL emits a header record and one record per item or lifecycle step.

所有 subcommands 返回 `ExtensionManagementRecord` 形态，包含 `schemaVersion`、`kind`、`status`、`items`、`diagnostics`、`permissionDiffs`、`credentialScopes`、`audit`、`referencePitFixtureIds` 和 `redaction`。text output 是该 record 的投影；JSON 返回 record；JSONL 输出 header record 和按 item/lifecycle step 拆分的 records。

Alternative considered: separate bespoke outputs for plugin, skill, MCP, and auth. Rejected because later host projection and golden replay need one stable evidence envelope.

备选方案：给 plugin、skill、MCP 和 auth 各自做 bespoke output。拒绝原因是后续 host projection 与 golden replay 需要一个稳定 evidence envelope。

### Decision: Local manifests and lockfiles are the R3 acceptance path

The first implementation reads local plugin manifest and lockfile JSON files through the Node platform abstraction and in-memory managers. This proves manifest, permission diff, integrity, and apply-lockfile semantics without live marketplaces or network.

第一版实现通过 Node platform abstraction 和 in-memory managers 读取本地 plugin manifest 与 lockfile JSON 文件。这能在没有 live marketplaces 或 network 的情况下证明 manifest、permission diff、integrity 和 apply-lockfile 语义。

Alternative considered: add registry install now. Rejected because signed distribution and marketplace governance belong to R7.

备选方案：现在增加 registry install。拒绝原因是 signed distribution 与 marketplace governance 属于 R7。

### Decision: Credential diagnostics are metadata-only

Credential scope diagnostics list provider/profile/workspace/source/availability/audit metadata and declared plugin/MCP credential references. They never resolve raw secrets and never print secret-like values.

Credential scope diagnostics 只列出 provider/profile/workspace/source/availability/audit metadata 和声明的 plugin/MCP credential references。它们绝不解析 raw secrets，也不打印 secret-like values。

Alternative considered: test credential resolution from extension commands. Rejected because the management command should prove scope and availability, while secret resolution remains at the owning transport boundary.

备选方案：从 extension commands 测试 credential resolution。拒绝原因是 management command 应证明 scope 与 availability，secret resolution 仍归属具体 transport boundary。

### Decision: Vi-inspired composition remains metadata in this pack

Extension commands produce typed result-list items and target ids (`plugin:<id>`, `skill:<name>`, `mcp:<server>`, `credential:<ref>`) so later vi-style CLI navigation can jump, inspect, apply, or revert by target without rerunning model turns.

本包的 vi-inspired composition 先体现在 metadata：extension commands 产出 typed result-list items 和 target ids（`plugin:<id>`、`skill:<name>`、`mcp:<server>`、`credential:<ref>`），让后续 vi-style CLI navigation 可以按 target jump、inspect、apply 或 revert，而无需重新运行 model turns。

Alternative considered: add interactive keymaps now. Rejected because R3 acceptance is command/evidence semantics; rich input belongs to a later TUI pack.

备选方案：现在增加 interactive keymaps。拒绝原因是 R3 验收重点是 command/evidence semantics；rich input 属于后续 TUI 包。

## Directory Plan / 目录计划

- `src/apps/cli/src/commands/extension.ts`: CLI-only adapter and text/JSON/JSONL rendering for extension management. / CLI-only adapter 和 extension management 的 text/JSON/JSONL rendering。
- `src/apps/cli/src/commands/parse.ts`: parse `extension` subcommands and flags only. / 只解析 `extension` subcommands 与 flags。
- `src/apps/cli/src/entry/run-cli.ts`: dispatch `extension` to the adapter. / 将 `extension` 分发给 adapter。
- `src/packages/platform-contracts/src/extension-management.ts`: implementation-free record DTOs if existing contracts are not enough. / 若现有契约不足，则增加无实现 record DTOs。
- `src/packages/credential-auth-management/src/index.ts`: add metadata-only scope diagnostics helpers only if needed. / 必要时增加 metadata-only scope diagnostics helpers。
- Tests: CLI tests under `src/apps/cli/test`, contract tests under `tests/contracts`, integration/e2e smoke under `tests/e2e` or `tests/integration`, and pit assertions through `src/packages/testing-regression/src/reference-pits`. / 测试放在 `src/apps/cli/test`、`tests/contracts`、`tests/e2e` 或 `tests/integration`，并通过 `src/packages/testing-regression/src/reference-pits` 断言坑位。

Split triggers: keep `extension.ts` below 500 lines or split renderer/helpers; keep `index.ts` files as export surfaces only; move shared logic into package-local modules before any file approaches 800 lines.

拆分触发器：`extension.ts` 接近 500 行前拆 renderer/helpers；`index.ts` 只做导出面；任何文件接近 800 行前把共享逻辑拆到 package-local modules。

## Terminal Capability Impact / 终端能力影响

Text output must remain line-oriented and readable in narrow/non-TTY terminals. JSON and JSONL output must contain no ANSI, cursor control, prompt glyphs, alternate-screen state, or interactive-only instructions. Permission diff output must be stable across Windows/macOS/Linux path and width profiles.

Text output 必须保持 line-oriented，并在窄屏/non-TTY terminals 中可读。JSON 与 JSONL output 不得包含 ANSI、cursor control、prompt glyphs、alternate-screen state 或 interactive-only instructions。Permission diff output 必须跨 Windows/macOS/Linux path 与 width profiles 保持稳定。

## Vi-Inspired Composition Impact / Vi 启发式组合影响

Extension records are result-list friendly: each item has `targetKind`, `targetId`, `actionHints`, and provenance. Later vi-style commands can target `plugin`, `skill`, `mcp-server`, `mcp-tool`, or `credential-scope` records without interpreting prose.

Extension records 适配 result-list：每个 item 都包含 `targetKind`、`targetId`、`actionHints` 和 provenance。后续 vi-style commands 可以定位 `plugin`、`skill`、`mcp-server`、`mcp-tool` 或 `credential-scope` records，而不解析自然语言。

## Request/Turn Revert Impact / 请求/回合回退影响

This pack does not implement request/turn revert. It records plugin install/apply, permission diff, skill activation, MCP test, and credential diagnostic evidence with stable target ids so future revert can identify restorable lockfile changes and non-restorable external side effects.

本包不实现 request/turn revert。它为 plugin install/apply、permission diff、skill activation、MCP test 和 credential diagnostic evidence 记录 stable target ids，使未来 revert 能识别可恢复的 lockfile changes 和不可恢复的 external side effects。

## Reference Coverage / 参考覆盖

This pack covers the reference capability area "Skills, Commands, Hooks, MCP, And Plugins" plus credential/auth boundaries and extension management. It intentionally uses behavior lessons only: manifest normalization, permission diff before enablement, scoped credential references, deterministic MCP testing, and extension contribution boundaries.

本包覆盖参考能力域 "Skills, Commands, Hooks, MCP, And Plugins"，并覆盖 credential/auth boundaries 与 extension management。它只借鉴行为经验：manifest normalization、enablement 前 permission diff、scoped credential references、deterministic MCP testing 和 extension contribution boundaries。

## Reference Pit Fixtures / 参考坑位 Fixtures

- `pit.extension-permission-expansion.permission-diff`: covered by plugin install/apply diff output and tests. / 通过 plugin install/apply diff output 与 tests 覆盖。
- `pit.mcp-plugin-precedence.enterprise-deny`: partial; this pack records precedence evidence and leaves managed enforcement to R7. / 部分覆盖；本包记录 precedence evidence，managed enforcement 留到 R7。
- `pit.env-snapshot.immutable-startup`: covered by credential diagnostics using presence metadata only. / 通过只使用 presence metadata 的 credential diagnostics 覆盖。
- `pit.diagnostic-redaction.support-bundle`: covered by serialized extension outputs that omit raw secrets. / 通过序列化 extension outputs 不含 raw secrets 覆盖。
- `pit.legacy-contribution-normalization.manifest-boundary`: covered by manifest-based skill/plugin/MCP contribution records. / 通过 manifest-based skill/plugin/MCP contribution records 覆盖。

## Risks / Trade-offs

- [Risk] Extension management could become a second command-system inside CLI. -> Mitigation: CLI returns structured records from shared package calls and does not own execution primitives. / [风险] extension management 可能在 CLI 内变成第二套 command-system。-> 缓解：CLI 从共享 package calls 返回 structured records，不拥有执行 primitive。
- [Risk] Local in-memory plugin manager does not persist lockfile state between invocations. -> Mitigation: this pack treats local manifest/lockfile round-trip as evidence; durable plugin store is a follow-up. / [风险] 本地 in-memory plugin manager 不在 invocation 间持久化 lockfile state。-> 缓解：本包把本地 manifest/lockfile round-trip 作为证据；durable plugin store 后续实现。
- [Risk] Credential diagnostics could leak environment or token values. -> Mitigation: use metadata-only records, redaction tests, and pit assertions. / [风险] credential diagnostics 可能泄漏 environment 或 token values。-> 缓解：使用 metadata-only records、redaction tests 和 pit assertions。
- [Risk] MCP real transport can introduce process/network nondeterminism. -> Mitigation: default remains fake/in-process only; real transport stays explicit opt-in and is covered by existing MCP fail-closed behavior. / [风险] MCP real transport 可能引入 process/network nondeterminism。-> 缓解：默认仍只支持 fake/in-process；真实 transport 保持显式 opt-in，并由现有 MCP fail-closed 行为覆盖。

## Migration Plan

1. Add extension-management OpenSpec and DTOs. / 增加 extension-management OpenSpec 与 DTOs。
2. Implement CLI parsing, dispatch, and structured rendering. / 实现 CLI parsing、dispatch 和 structured rendering。
3. Wire plugin, skill, credential, and MCP public package calls. / 接入 plugin、skill、credential 和 MCP public package calls。
4. Add deterministic CLI/contract/e2e/regression tests. / 增加 deterministic CLI/contract/e2e/regression tests。
5. Update CLI README and roadmap status. / 更新 CLI README 与 roadmap status。
6. Validate OpenSpec, typecheck, lint, targeted tests, full tests if feasible, and boundary checks. / 校验 OpenSpec、typecheck、lint、定向测试、可行时全量测试和 boundary checks。

Rollback: remove `extension` command parsing/dispatch and the extension-management DTO/test additions. Existing `mcp test`, skill tools, plugin manager, and credential auth services remain unchanged.

回滚：移除 `extension` command parsing/dispatch 和 extension-management DTO/test additions。现有 `mcp test`、skill tools、plugin manager 和 credential auth services 保持不变。

## Open Questions

- Durable plugin installation location is intentionally deferred. / durable plugin installation location 有意延后。
- Signed plugin verification and managed enterprise policy are intentionally deferred to R7. / signed plugin verification 与 managed enterprise policy 有意延后到 R7。
