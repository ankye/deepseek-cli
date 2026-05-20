## Why

DeepSeek v0.1.8 has grown from a CLI prototype into a contract-first platform, but the planning surface now mixes implemented, partial, rollout-gated, deferred, and placeholder capabilities in ways that are easy to misread during reviews. / DeepSeek v0.1.8 已从 CLI 原型成长为契约先行平台，但规划面现在混合了已实现、部分实现、受门禁控制、延期与占位能力，审查时很容易误读状态。

This change creates a systematic governance layer so ghost aliases, placeholder implementations, gated product modes, and evidence gaps are tracked as first-class release risks before new host or enterprise work proceeds. / 本变更建立系统性治理层，把幽灵别名、占位实现、受门禁控制的产品模式和证据缺口作为一等发布风险来跟踪，再推进新的 host 或企业级工作。

## What Changes

- Add a platform governance capability that classifies capability maturity, placeholder status, acceptance evidence, and allowed promotion gates. / 增加 platform governance 能力，用于分类能力成熟度、占位状态、验收证据和允许的推广门禁。
- Require architecture guardrails to detect stale package aliases, missing workspace packages, placeholder-only ownership, and drift between `tsconfig`, workspace manifests, package map, and roadmap language. / 要求架构护栏检测陈旧 package alias、缺失 workspace package、纯占位 ownership，以及 `tsconfig`、workspace manifests、package map 与 roadmap 语言之间的漂移。
- Require CLI diagnostics and release readiness output to report governance risks, including placeholder remote/update behavior, semantic index deferral, multi-agent rollout gates, host promotion gates, and thin host adapters. / 要求 CLI diagnostics 与 release readiness 输出治理风险，包括 remote/update 占位行为、semantic index 延期、多 agent rollout 门禁、host 推广门禁和薄 host adapter。
- Require testing evidence to distinguish contract coverage from product coverage, and to expose package-level gaps across e2e, live smoke, integration, golden, matrix, and acceptance suites. / 要求测试证据区分 contract coverage 与 product coverage，并暴露 e2e、live smoke、integration、golden、matrix 与 acceptance 套件中的包级缺口。
- Update roadmap governance language so future reviews use consistent states: `implemented`, `partial`, `rollout-gated`, `deferred`, `placeholder`, and `unsupported`. / 更新 roadmap 治理语言，使未来审查统一使用 `implemented`、`partial`、`rollout-gated`、`deferred`、`placeholder` 与 `unsupported` 状态。
- Add Linux-style kernel governance principles: keep runtime kernel small, treat platform contracts as stable UAPI, unify context through VFS-like references, make pipes bounded with backpressure, govern agents through namespace/quota scopes, force all execution through policy-sandbox, expose `/proc`-style diagnostics, treat plugins as governed modules, protect context page-cache behavior, and prevent central-file growth. / 增加 Linux 风格内核治理原则：保持 runtime kernel 小而硬，把 platform contracts 当稳定 UAPI，以 VFS-like references 统一 context，使 pipe 有界并具备 backpressure，用 namespace/quota scopes 治理 agents，强制所有执行经过 policy-sandbox，暴露 `/proc` 风格 diagnostics，将 plugins 作为受治理 modules，保护 context page-cache 行为，并防止中心文件膨胀。
- Prioritize stable runtime kernel governance as the first child governance track before host expansion, plugin marketplace, multi-agent write execution, or enterprise work. / 将稳定 runtime kernel 治理作为第一个专项治理轨道，先于 host 扩张、插件市场、多 agent 写执行或企业级工作。
- Keep this change as the umbrella governance program until required child governance tracks are completed, validated, and linked as closure evidence. / 在必需专项治理完成、校验并作为关闭证据链接前，保持本变更作为治理总纲 program。
- No breaking runtime API changes. / 不引入破坏性 runtime API 变更。

## Capabilities

### New Capabilities

- `platform-governance`: System-level governance records, maturity taxonomy, release-risk classification, and promotion gates for package, capability, host, and test evidence status. / 系统级治理记录、成熟度分类、发布风险分类，以及 package、capability、host 和 test evidence 状态的推广门禁。

### Modified Capabilities

- `architecture-scale-guardrails`: Add requirements for stale alias detection, missing workspace package reporting, placeholder ownership declarations, and planning/code drift checks. / 增加陈旧 alias 检测、缺失 workspace package 报告、占位 ownership 声明以及规划/代码漂移检查要求。
- `cli-diagnostics-release-readiness`: Add governance diagnostics to release readiness so CLI output surfaces placeholders, rollout gates, and evidence gaps before release. / 在 release readiness 中增加治理诊断，使 CLI 输出在发布前暴露占位、rollout gates 和证据缺口。
- `testing-regression`: Add package-level evidence matrix requirements that distinguish contract tests from product/e2e/live readiness. / 增加包级证据矩阵要求，区分 contract tests 与 product/e2e/live readiness。
- `product-roadmap`: Require roadmap status language to classify maturity and gates consistently across CLI-first, host-promotion, multi-agent, indexing, remote, update, and enterprise areas. / 要求路线图状态语言在 CLI-first、host-promotion、多 agent、索引、远程、更新和企业级领域中一致分类成熟度与门禁。
- `runtime-execution-kernel`: Require a small stable runtime kernel boundary and reject subsystem logic that belongs in owner packages. / 要求小而稳定的 runtime kernel 边界，并拒绝应属于 owner packages 的子系统逻辑进入 kernel。
- `platform-contracts`: Treat cross-package DTOs, ids, events, envelopes, and errors as a stable UAPI with versioning and migration governance. / 将跨 package DTO、id、event、envelope 与 error 作为稳定 UAPI，用 versioning 与 migration 治理。
- `context-engine`: Govern context as VFS/page-cache-like references and immutable context evidence rather than host-specific prompt fragments. / 将 context 治理为 VFS/page-cache-like references 与不可变 context evidence，而不是 host-specific prompt fragments。
- `runtime-message-bus`: Require bounded pipe/backpressure semantics for context, tool-result, runtime, and plugin streams. / 要求 context、tool-result、runtime 与 plugin streams 具备有界 pipe/backpressure 语义。
- `agent-management`: Require namespace/quota-style agent scopes before multi-agent write execution can be promoted. / 要求在多 agent 写执行推广前具备 namespace/quota 风格 agent scopes。
- `policy-sandbox`: Treat policy-sandbox as an LSM-style mandatory execution gate for all risky capability, plugin, MCP, file, shell, credential, and remote operations. / 将 policy-sandbox 作为 LSM 风格强制执行门禁，覆盖所有有风险 capability、plugin、MCP、file、shell、credential 与 remote operations。
- `plugin-system`: Treat plugins and extensions as governed modules with manifests, permissions, auditability, unloading/disable semantics, and no private runtime object access. / 将 plugins 与 extensions 作为受治理 modules，具备 manifests、permissions、auditability、卸载/禁用语义，并且不能访问私有 runtime objects。

## Impact

- Owner packages / 责任包: `platform-contracts`, `platform-abstraction`, `runtime`, `context-engine`, `prompt-assembly`, `memory-cache-management`, `runtime-message-bus`, `agent-management`, `policy-sandbox`, `plugin-system`, `command-system`, `testing-regression`, `apps/cli`, scripts under `scripts/lint-framework/`.
- Docs and OpenSpec / 文档与 OpenSpec: `docs/product/product-roadmap.md`, `docs/architecture/package-map.md`, `openspec/specs/*`.
- CLI surface / CLI 表面: diagnostics/readiness output only; no new execution behavior in this change. / 仅影响 diagnostics/readiness 输出；本变更不新增执行行为。
- Architecture policy / 架构策略: makes placeholder implementations explicit and fail-closed for product readiness unless evidence is attached. / 让占位实现显式化，并在缺少证据时对产品就绪 fail-closed。
- Test policy / 测试策略: adds governance acceptance expectations across lint, contract, integration, golden, matrix, e2e, live smoke, and acceptance evidence. / 增加贯穿 lint、contract、integration、golden、matrix、e2e、live smoke 与 acceptance evidence 的治理验收预期。
- Archive policy / 归档策略: do not archive this umbrella until child changes `harden-runtime-kernel-boundary`, `introduce-context-pipeline-prefix-cache`, `govern-platform-contracts-uapi`, `define-bounded-runtime-pipes`, `enforce-policy-sandbox-gates`, `govern-agent-namespace-quotas`, `govern-plugin-module-boundaries`, `expose-kernel-diagnostics-readiness`, `establish-governance-evidence-matrix`, and `enforce-architecture-guardrails-drift` are completed or explicitly deferred with release-risk rationale. / 在 `harden-runtime-kernel-boundary`、`introduce-context-pipeline-prefix-cache`、`govern-platform-contracts-uapi`、`define-bounded-runtime-pipes`、`enforce-policy-sandbox-gates`、`govern-agent-namespace-quotas`、`govern-plugin-module-boundaries`、`expose-kernel-diagnostics-readiness`、`establish-governance-evidence-matrix` 与 `enforce-architecture-guardrails-drift` 完成，或带发布风险理由显式延期前，不归档本总纲。
