## Context

DeepSeek is now a 32-package TypeScript monorepo with a CLI-first product route, shared platform contracts, and several planned host surfaces. Recent review surfaced a recurring governance problem: the repository has real implemented surfaces, partial product slices, deterministic placeholders, and intentionally deferred capabilities, but the status language is spread across `tsconfig`, package manifests, docs, OpenSpec specs, diagnostics, and tests.

DeepSeek 当前是包含 32 个 package 的 TypeScript monorepo，采用 CLI-first 产品路线、共享平台契约，并规划多个 host surface。近期审查暴露出一个反复出现的治理问题：仓库里同时存在真实实现、部分产品切片、确定性占位实现和有意延期能力，但状态语言分散在 `tsconfig`、package manifest、文档、OpenSpec specs、diagnostics 与测试中。

The governance layer should make these states explicit without turning planning into a second implementation system. It should classify risk, attach evidence, and fail release readiness when a placeholder or deferred capability is presented as product-ready.

治理层应让这些状态显式化，但不把规划文档变成第二套实现系统。它应分类风险、绑定证据，并在占位或延期能力被表述为产品就绪时让 release readiness 失败。

## Goals / Non-Goals

**Goals:**

- Define a shared maturity taxonomy for capability, package, host, and test evidence status. / 定义 capability、package、host 与测试证据状态的共享成熟度分类。
- Define Linux-style kernel governance rules for runtime boundaries, UAPI stability, VFS-like context, pipe/backpressure, agent scopes, mandatory policy gates, diagnostics, modules, page-cache behavior, and central-file size pressure. / 定义 Linux 风格内核治理规则，覆盖 runtime boundaries、UAPI stability、VFS-like context、pipe/backpressure、agent scopes、强制 policy gates、diagnostics、modules、page-cache behavior 与中心文件规模压力。
- Put stable runtime kernel governance first, because host expansion, plugin execution, multi-agent writes, policy enforcement, and context caching all depend on a small and explicit kernel boundary. / 将稳定 runtime kernel 治理放在第一位，因为 host 扩张、插件执行、多 agent 写入、policy enforcement 与 context caching 都依赖小而明确的内核边界。
- Add lint/readiness checks for ghost aliases, missing workspace packages, placeholder ownership, and roadmap/code drift. / 增加针对幽灵 alias、缺失 workspace package、占位 ownership 和 roadmap/code 漂移的 lint/readiness 检查。
- Surface governance risks from CLI diagnostics so release decisions see placeholders and rollout gates. / 从 CLI diagnostics 暴露治理风险，让发布决策能看到占位与 rollout gates。
- Require tests and acceptance evidence to distinguish contract coverage from product readiness. / 要求测试与验收证据区分 contract coverage 与 product readiness。

**Non-Goals:**

- Do not implement real remote networking, update catalogs, semantic vector providers, TaskGraph, VSCode features, or enterprise distribution in this change. / 本变更不实现真实远程网络、更新目录、语义向量 provider、TaskGraph、VSCode 功能或企业级分发。
- Do not remove valid deterministic placeholders used by tests or platform assembly. / 不移除测试或平台组装所需的有效确定性占位实现。
- Do not change runtime event schemas except additive diagnostics/readiness metadata if implementation needs it. / 除实现需要的 additive diagnostics/readiness metadata 外，不改变 runtime event schema。

## Decisions

1. Use a governance taxonomy instead of binary complete/incomplete labels. / 使用治理分类，而不是二元完成/未完成标签。

   The canonical states are `implemented`, `partial`, `rollout-gated`, `deferred`, `placeholder`, and `unsupported`. This matches the actual platform shape better than treating every contract or stub as either done or missing.

   规范状态为 `implemented`、`partial`、`rollout-gated`、`deferred`、`placeholder` 与 `unsupported`。这比把每个契约或 stub 都视为完成/缺失更贴合平台现状。

   Alternative considered: only update the product roadmap prose. That is too weak because drift can reappear in `tsconfig`, diagnostics, and acceptance evidence.

2. Keep placeholders legal but product-gated. / 允许占位实现存在，但用产品门禁约束。

   `NoopRemoteRuntimeConnectivity` and `StaticDistributionUpdateManager` remain useful deterministic defaults, but diagnostics must classify them as placeholders and release readiness must reject product claims that depend on them as real remote/update implementations.

   `NoopRemoteRuntimeConnectivity` 与 `StaticDistributionUpdateManager` 仍是有用的确定性默认实现，但 diagnostics 必须把它们分类为 placeholder，release readiness 必须拒绝把依赖它们的产品能力声明为真实 remote/update 实现。

   Alternative considered: delete placeholder exports. That would break assembly and tests before replacement implementations exist.

3. Treat ghost package aliases as governance failures. / 把幽灵 package alias 视为治理失败。

   A `tsconfig` path alias for `@deepseek/*` must resolve to an existing workspace package, plugin package, or an explicit retired/merged entry with diagnostics. This catches stale packages such as old split-out remote/update/evolution/extension aliases.

   `@deepseek/*` 的 `tsconfig` path alias 必须解析到现有 workspace package、plugin package，或带 diagnostics 的显式 retired/merged entry。这样可以捕获旧拆分 remote/update/evolution/extension alias 这类陈旧项。

4. Make CLI diagnostics the product-facing governance surface. / 让 CLI diagnostics 成为面向产品的治理表面。

   Governance data may be produced by lint, package scanning, docs scanning, and test evidence, but the CLI should summarize the release risks because CLI is the current product surface.

   治理数据可以来自 lint、package scanning、docs scanning 和测试证据，但 CLI 应汇总发布风险，因为 CLI 是当前产品面。

5. Require package-level evidence matrices. / 要求包级证据矩阵。

   Contract tests prove DTO and boundary behavior; they do not prove product readiness. Governance should separately count contract, integration, golden, matrix, e2e, live smoke, and acceptance evidence for each risk-bearing package or host surface.

   Contract tests 证明 DTO 与边界行为，不证明产品就绪。治理应分别统计每个有风险 package 或 host surface 的 contract、integration、golden、matrix、e2e、live smoke 与 acceptance evidence。

6. Treat the runtime as the first governance target and a small kernel, not a platform warehouse. / 将 runtime 作为第一个治理目标，并视为小内核，而不是平台仓库。

   The runtime kernel owns turn lifecycle, execution envelopes, policy handoff, scheduler handoff, event emission, and the model/tool continuation loop. Context retrieval, prompt assembly, memory/cache, plugins, MCP, code intelligence, and host rendering remain owner-package responsibilities.

   Runtime kernel 负责 turn lifecycle、execution envelopes、policy handoff、scheduler handoff、event emission 与 model/tool continuation loop。Context retrieval、prompt assembly、memory/cache、plugins、MCP、code intelligence 与 host rendering 保持为 owner-package 职责。

   Stable kernel governance is the first child track because every other governance topic either crosses the kernel boundary or depends on it for enforcement. This track must define what can enter runtime, what must stay in owner packages, which dependencies are forbidden, and which diagnostics prove the boundary remains healthy.

   稳定内核治理是第一个专项轨道，因为其他治理主题要么跨越 kernel boundary，要么依赖它执行门禁。该轨道必须定义什么可以进入 runtime、什么必须留在 owner packages、哪些依赖被禁止，以及哪些 diagnostics 能证明边界仍然健康。

   Alternative considered: keep adding helpers to `agent-loop.ts` and runtime internals until features are easy to wire. That would optimize short-term implementation speed but weaken the long-term ABI.

7. Treat `platform-contracts` as UAPI. / 将 `platform-contracts` 视为 UAPI。

   Cross-package DTOs, ids, event kinds, envelopes, manifests, and errors must be stable, versioned, additive by default, and migration-governed when breaking. A TypeScript compile pass is not enough evidence that a contract change is safe.

   跨 package DTO、id、event kind、envelope、manifest 与 error 必须稳定、版本化、默认 additive，并在 breaking 时受 migration 治理。TypeScript 编译通过不足以证明契约变更安全。

8. Use VFS/page-cache thinking for context. / 用 VFS/page-cache 思维治理 context。

   File evidence, memory, PageIndex recall, code intelligence, tool evidence, and future semantic recall should project into shared context references or immutable context blocks with id, hash, freshness, scope, redaction, token estimate, and dependency fingerprints.

   File evidence、memory、PageIndex recall、code intelligence、tool evidence 与未来 semantic recall 应投影为共享 context references 或不可变 context blocks，包含 id、hash、freshness、scope、redaction、token estimate 与 dependency fingerprints。

9. Use namespace and quota governance for agents. / 用 namespace 与 quota 治理 agents。

   Coordinator, worker, verifier, and repair modes must not be promoted to default write-capable execution until each agent has explicit scopes for paths, tools, memory, scratchpad, checkpoints, budgets, deadlines, lineage, and ownership.

   Coordinator、worker、verifier 与 repair modes 在每个 agent 具备 paths、tools、memory、scratchpad、checkpoints、budgets、deadlines、lineage 与 ownership 的显式 scope 前，不得推广为默认写执行。

10. Treat plugins as modules with manifests, not internal imports. / 将 plugins 视为带 manifest 的 modules，而不是内部 import。

   Plugins, MCP servers, extensions, skills, and hooks must interact through manifests, contributions, events, permissions, and policy/audit records. They must not receive private runtime objects or bypass public contracts.

   Plugins、MCP servers、extensions、skills 与 hooks 必须通过 manifests、contributions、events、permissions 与 policy/audit records 交互。它们不得拿到 private runtime objects 或绕过公共契约。

11. Keep the umbrella open until child governance tracks close. / 在专项治理关闭前保持总纲打开。

   `systematize-platform-governance` is a governance program, not a single implementation slice. It should be archived only after required child changes are completed and validated, or intentionally deferred with owner, risk, follow-up change, and release-gate impact recorded.

   `systematize-platform-governance` 是治理 program，而不是单个实现切片。只有在必需专项变更完成并校验，或带 owner、风险、后续变更与发布门禁影响被有意延期后，才应归档。

## Risks / Trade-offs

- [Risk] Governance checks become noisy and block useful iteration. / 治理检查可能产生噪声并阻碍有效迭代。 → Mitigation: classify severity as `info`, `warning`, or `release-blocking`, and only block when a product-ready claim conflicts with placeholder/deferred evidence. / 缓解：将严重度分类为 `info`、`warning` 或 `release-blocking`，只在产品就绪声明与 placeholder/deferred 证据冲突时阻断。
- [Risk] Roadmap and diagnostics drift again. / 路线图与 diagnostics 可能再次漂移。 → Mitigation: add lint/readiness checks that compare package aliases, package map, roadmap labels, and acceptance evidence. / 缓解：增加 lint/readiness 检查，对比 package alias、package map、roadmap labels 与 acceptance evidence。
- [Risk] Teams interpret `placeholder` as failure even when it is intentional. / 团队可能把 `placeholder` 误解为失败，即使它是有意设计。 → Mitigation: governance records include owner, allowed consumers, replacement trigger, and promotion gate. / 缓解：治理记录包含 owner、允许消费方、替换触发条件与推广门禁。
- [Risk] Kernel governance slows feature wiring because owner packages need proper APIs first. / 内核治理可能降低功能接线速度，因为 owner packages 需要先有正确 API。 → Mitigation: allow diagnostics-first compatibility shims, but require follow-up tasks to move subsystem logic behind public package exports before release gates pass. / 缓解：允许 diagnostics-first compatibility shims，但要求在发布门禁通过前通过后续任务将子系统逻辑移到 public package exports 后面。
- [Risk] UAPI-style contract governance feels heavy for a young product. / 对年轻产品而言，UAPI 风格契约治理可能显得沉重。 → Mitigation: keep additive fields easy, require strict migration only for persisted or cross-package breaking changes. / 缓解：保持 additive fields 简单，对 persisted 或 cross-package breaking changes 才要求严格迁移。

## Migration Plan

1. Define the stable runtime kernel boundary as the first child governance track. / 将稳定 runtime kernel boundary 定义为第一个专项治理轨道。
2. Add governance specs and a central taxonomy before implementation. / 先增加治理 specs 与中心分类，再实现。
3. Extend lint/readiness scanning to report ghost aliases and placeholder status as diagnostics. / 扩展 lint/readiness scanning，把幽灵 alias 与 placeholder 状态报告为 diagnostics。
4. Add CLI diagnostics/readiness rendering for governance risk summaries. / 增加 CLI diagnostics/readiness 的治理风险摘要渲染。
5. Add package-level evidence matrix output and acceptance fixtures. / 增加包级 evidence matrix 输出与验收 fixture。
6. Update roadmap/package-map wording to use the taxonomy consistently. / 更新 roadmap/package-map 文案，统一使用分类。
7. Add kernel/extensibility governance diagnostics and lint rules incrementally, starting with runtime boundary ownership, central-file size pressure, private import boundaries, mandatory policy gates, and agent scope evidence. / 逐步增加 kernel/extensibility governance diagnostics 与 lint rules，先从 runtime boundary ownership、中心文件规模压力、私有 import 边界、强制 policy gates 与 agent scope evidence 开始。
8. Track child OpenSpec changes as closure evidence before archiving the umbrella: `harden-runtime-kernel-boundary`, `introduce-context-pipeline-prefix-cache`, `govern-platform-contracts-uapi`, `define-bounded-runtime-pipes`, `enforce-policy-sandbox-gates`, `govern-agent-namespace-quotas`, `govern-plugin-module-boundaries`, `expose-kernel-diagnostics-readiness`, `establish-governance-evidence-matrix`, and `enforce-architecture-guardrails-drift`. / 在归档总纲前，将专项 OpenSpec 变更作为关闭证据跟踪：`harden-runtime-kernel-boundary`、`introduce-context-pipeline-prefix-cache`、`govern-platform-contracts-uapi`、`define-bounded-runtime-pipes`、`enforce-policy-sandbox-gates`、`govern-agent-namespace-quotas`、`govern-plugin-module-boundaries`、`expose-kernel-diagnostics-readiness`、`establish-governance-evidence-matrix` 与 `enforce-architecture-guardrails-drift`。

Rollback is documentation and diagnostics-only at first: disable release-blocking severity while keeping informational reporting if a check blocks work unexpectedly. / 初期回滚范围仅限文档与 diagnostics：如果检查意外阻碍工作，可关闭 release-blocking 严重度，同时保留信息性报告。

## Open Questions

- Should the governance ledger live as generated diagnostics only, or also as a checked-in JSON fixture under `tests/acceptance/`? / 治理总账应只作为生成的 diagnostics 存在，还是也作为 `tests/acceptance/` 下的入库 JSON fixture？
- Should stale `tsconfig` aliases be removed immediately, or retained with explicit retired/merged metadata for one release? / 陈旧 `tsconfig` alias 应立即移除，还是保留一个版本并配显式 retired/merged metadata？
- What threshold should turn e2e/live coverage gaps from warning into release-blocking for CLI stable releases? / 对 CLI stable 发布而言，e2e/live 覆盖缺口到什么阈值应从 warning 升为 release-blocking？
- Which child governance tracks are mandatory for first umbrella closure, and which may be explicitly deferred with release-risk evidence? / 哪些专项治理轨道是总纲首次关闭的必需项，哪些可以带发布风险证据显式延期？
