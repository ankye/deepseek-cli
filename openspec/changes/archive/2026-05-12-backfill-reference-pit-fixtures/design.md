## Context

DeepSeek has already moved to a CLI-first product route and added host/architecture guardrails. The next risk is security-sensitive CLI work growing from happy-path behavior while known reference pitfalls remain only as documentation.

DeepSeek 已经切到 CLI-first 产品路线，并完成 host/architecture 护栏。下一个风险是安全敏感 CLI 工作只沿 happy path 增长，而参考实现暴露出的已知坑位仍只停留在文档中。

Current owners already exist for most mitigations: `policy-sandbox` owns policy and sandbox decisions, `platform-abstraction` owns path and host facts, `config` owns source precedence, `platform-abstraction` currently hosts placeholder plugin/remote managers, `observability` owns diagnostic redaction, and `testing-regression` owns reusable fixtures and replay harnesses.

当前多数缓解点已有 owner：`policy-sandbox` 负责 policy 与 sandbox decisions，`platform-abstraction` 负责 path 与 host facts，`config` 负责 source precedence，`platform-abstraction` 当前承载 plugin/remote placeholder managers，`observability` 负责 diagnostic redaction，`testing-regression` 负责 reusable fixtures 与 replay harnesses。

## Goals / Non-Goals

**Goals:**

- Add a stable reference pit fixture catalog that names each pit, owner, risk class, required assertion, and expected evidence. / 增加稳定的 reference pit fixture catalog，声明每个坑位的名称、owner、风险等级、必需断言和预期证据。
- Backfill deterministic tests for the highest-risk pit families before permission and extension UX expands. / 在 permission 与 extension UX 扩张前，回填最高风险坑位族的确定性测试。
- Keep all fixtures expressed in DeepSeek contracts and package owners, not in copied reference implementation terms. / 所有 fixtures 都用 DeepSeek contracts 与 package owners 表达，而不是复制参考实现术语。
- Make future OpenSpecs classify which pit fixtures they add, reuse, or intentionally defer. / 让后续 OpenSpec 归类它们新增、复用或有意延后的坑位 fixtures。

**Non-Goals:**

- Do not implement a full shell parser in this pack. / 本包不实现完整 shell parser。
- Do not implement enterprise managed policy, signed marketplace, or full remote server identity flows. / 本包不实现 enterprise managed policy、signed marketplace 或完整 remote server identity flows。
- Do not add user-facing CLI commands. / 不新增用户可见 CLI commands。
- Do not copy code, names, or module shape from the reference CLI. / 不复制参考 CLI 的代码、命名或模块形态。

## Decisions

### Decision: Centralize pit metadata in testing-regression

`testing-regression` will expose a small `reference-pits` catalog with typed fixture metadata and helper selectors. Owner tests consume this catalog to prove each pit is covered by at least one deterministic regression.

`testing-regression` 将暴露一个小型 `reference-pits` catalog，包含类型化 fixture metadata 和 helper selectors。owner tests 消费该 catalog，证明每个坑位至少由一个确定性回归覆盖。

Alternative considered: duplicate pit names directly in every package test. Rejected because drift would make coverage hard to audit.

备选方案：在每个 package test 中重复坑位名称。该方案被拒绝，因为名称漂移会让覆盖审计变困难。

### Decision: Start with fixture gates, not full feature implementations

This change should assert the current safety contract and add small missing helpers only where existing behavior is under-specified. For example, path syntax rejection and immutable config snapshots are suitable hardening; full shell AST parsing and enterprise policy merge are follow-up implementation packs.

本变更应断言当前安全契约，只在现有行为定义不足处补小型 helper。例如 path syntax rejection 和 immutable config snapshots 属于合适的加固；完整 shell AST parsing 和 enterprise policy merge 留给后续实现包。

Alternative considered: implement every mitigation in the backlog immediately. Rejected because it would mix regression backfill with multiple new product systems.

备选方案：立即实现 backlog 中每个 mitigation。该方案被拒绝，因为会把 regression backfill 与多个新产品系统混在一起。

### Decision: Path and config hardening are implementation changes

Path canonicalization fixtures should fail closed for unsupported home, null byte, drive-relative, UNC, glob, shell-expansion, and Windows trailing-dot/space targets. Config should snapshot environment/CLI/default input objects at service construction so later process/env mutation cannot change resolved behavior.

Path canonicalization fixtures 应对 unsupported home、null byte、drive-relative、UNC、glob、shell-expansion 和 Windows trailing-dot/space targets fail closed。Config 应在 service 构造时快照 environment/CLI/default input objects，使后续 process/env mutation 不能改变已解析行为。

Alternative considered: test only current behavior. Rejected because the reference pit specifically warns against these bypass classes.

备选方案：只测试当前行为。该方案被拒绝，因为参考坑位明确预警这些绕过类别。

### Decision: Remote and plugin tests cover contract seams now

Remote identity fixtures will assert that session identity, transport identity, display identity, and audit correlation can remain distinct in the remote binding contract. Plugin fixtures will assert permission expansion and lockfile integrity remain visible and deterministic.

Remote identity fixtures 将断言 session identity、transport identity、display identity 和 audit correlation 能在 remote binding contract 中保持区分。Plugin fixtures 将断言 permission expansion 与 lockfile integrity 仍然可见且确定。

Alternative considered: wait for full server/plugin marketplace implementation. Rejected because contract seams should be protected before host promotion.

备选方案：等待完整 server/plugin marketplace 实现。该方案被拒绝，因为 contract seam 应在 host promotion 前被保护。

## Risks / Trade-offs

- [Risk] Fixtures can become a checklist divorced from real behavior. -> Mitigation: every catalog entry must be consumed by at least one executable regression assertion. / [风险] fixtures 可能变成脱离真实行为的清单。-> 缓解：每个 catalog entry 必须被至少一个可执行回归断言消费。
- [Risk] Some backlog pits need future systems. -> Mitigation: mark fixture status as `covered`, `partial`, or `planned` and only claim completion for covered/partial cases backed by tests. / [风险] 部分 backlog 坑位需要未来系统。-> 缓解：fixture status 标记为 `covered`、`partial` 或 `planned`，且只有有测试支撑的 covered/partial 才计入完成。
- [Risk] Path rejection can be too strict for reads. -> Mitigation: reject only unsupported syntaxes at the platform path boundary; search/glob tools keep their own explicit pattern APIs. / [风险] path rejection 对读取可能过严。-> 缓解：只在 platform path boundary 拒绝 unsupported syntax；search/glob tools 保持自己的显式 pattern APIs。

## Migration Plan

1. Add `reference-pits` catalog exports in `testing-regression`. / 在 `testing-regression` 增加 `reference-pits` catalog exports。
2. Add contract tests proving the catalog is complete, redacted, and consumed by owner tests. / 增加 contract tests，证明 catalog 完整、已脱敏且被 owner tests 消费。
3. Harden path and config behavior where fixtures expose gaps. / 在 fixtures 暴露缺口处加固 path 与 config 行为。
4. Add owner-focused regressions for policy/headless/shell fallback, path, config, plugin, remote, and observability redaction pits. / 增加 owner-focused regressions，覆盖 policy/headless/shell fallback、path、config、plugin、remote 和 observability redaction 坑位。
5. Run OpenSpec validation, typecheck, lint, unit/contract/matrix/integration tests, and boundary checks. / 运行 OpenSpec validation、typecheck、lint、unit/contract/matrix/integration tests 和 boundary checks。

Rollback: remove the fixture catalog and tests, and revert any path/config hardening if it causes compatibility issues. No data migration is expected.

回滚：移除 fixture catalog 与测试；若 path/config 加固造成兼容问题，则回退对应实现。本变更不预期数据迁移。
