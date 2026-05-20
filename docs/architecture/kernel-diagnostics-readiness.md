# Kernel Diagnostics Readiness / 内核诊断就绪

Kernel diagnostics are the local `/proc/deepseek/*` view of platform governance. They do not change runtime execution. They project release evidence, maturity labels, and policy boundaries into a stable text/JSON/JSONL surface that humans, CI, and future hosts can read.

内核诊断是平台治理的本地 `/proc/deepseek/*` 视图。它不改变 runtime 执行，只把发布证据、成熟度标签和策略边界投影为稳定的 text/JSON/JSONL 表面，供人、CI 和未来 host 读取。

## Sections / 分区

| Section / 分区 | Owner / 责任包 | Capability / 能力 | Meaning / 含义 |
| --- | --- | --- | --- |
| `governance.kernel-boundary` | `runtime` | `runtime-kernel` | Runtime kernel ownership, forbidden imports, and compatibility shims. / runtime kernel 归属、禁止导入与兼容 shim。 |
| `governance.uapi-compatibility` | `platform-contracts` | `platform-contracts-uapi` | Stable DTO/event/interface UAPI compatibility. / 稳定 DTO、event、interface UAPI 兼容性。 |
| `governance.context-cache-health` | `context-engine` | `context-prefix-cache` | Context pipeline and provider cache evidence. / 上下文管道与 provider cache 证据。 |
| `governance.bus-pressure` | `runtime-message-bus` | `bounded-runtime-pipes` | Bounded stream, pressure, overflow, and replay health. / 有界 stream、pressure、overflow 与 replay 健康度。 |
| `governance.policy-gates` | `policy-sandbox` | `policy-sandbox-gates` | Mandatory policy gates for risky operations. / 风险操作强制 policy gate。 |
| `governance.agent-scopes` | `agent-management` | `agent-namespace-quotas` | Agent namespace, quotas, lineage, and rollout gates. / Agent namespace、quota、lineage 与 rollout gate。 |
| `governance.module-status` | `plugin-system` | `plugin-module-boundaries` | Governed plugin/extension/MCP/skill/hook module boundary. / plugin、extension、MCP、skill、hook 的受治理模块边界。 |
| `governance.roadmap-drift` | `platform-governance` | `roadmap-drift` | Follow-up drift scanner registration. / 后续 drift scanner 注册。 |
| `governance.evidence-matrix` | `testing-regression` | `governance-evidence-matrix` | Acceptance and closure evidence completeness. / 验收与关闭证据完整度。 |

## Finding Contract / 诊断项契约

Every governance finding has a stable id, section id, owner package, affected capability, severity, maturity state, readiness status, evidence ids, redaction metadata, and next action.

每个 governance finding 都包含稳定 id、section id、责任包、受影响能力、severity、maturity state、readiness status、evidence ids、redaction metadata 和 next action。

Severity is intentionally release-oriented:

severity 面向发布决策：

- `info`: implemented or explicitly registered evidence. / 已实现或已登记证据。
- `warning`: evidence is present but incomplete or missing historical artifacts. / 证据存在但不完整，或历史产物缺失。
- `release-blocking`: a required gate failed, or a product-ready claim conflicts with placeholder, deferred, rollout-gated, or missing evidence state. / 必需门禁失败，或 product-ready 声明与 placeholder、deferred、rollout-gated、missing evidence 状态冲突。

## CLI Surface / CLI 表面

`deepseek diagnostics release|doctor|verify` includes `governanceDiagnostics` in JSON output and emits JSONL records with these kinds:

`deepseek diagnostics release|doctor|verify` 会在 JSON 输出里包含 `governanceDiagnostics`，并在 JSONL 中输出这些 record kind：

- `diagnostics.governance.summary`
- `diagnostics.governance.section`
- `diagnostics.governance.finding`

Text output renders each section as `/proc/deepseek/<section-id>` so operators can quickly scan the kernel-like governance surface.

Text 输出把每个 section 渲染为 `/proc/deepseek/<section-id>`，让操作者能快速扫描类内核治理表面。

Filters are local and read-only:

过滤器是本地且只读的：

```bash
deepseek diagnostics release --severity release-blocking --output jsonl
deepseek diagnostics release --package plugin-system --output json
deepseek diagnostics release --capability agent-namespace-quotas --output text
```

Product-ready claims can be checked by the same gate:

product-ready 声明可用同一门禁检查：

```bash
deepseek diagnostics release --product-ready agent-namespace-quotas --output jsonl
```

If the matching section is not both `pass` and `implemented`, the release is blocked by `governance.product-ready-claims`.

如果匹配 section 不是同时满足 `pass` 与 `implemented`，发布会被 `governance.product-ready-claims` 阻断。

## Placeholder And Gate Findings / 占位与门禁诊断

The `/proc/deepseek/*` sections also carry risk-bearing child findings for capabilities that have contracts or deterministic placeholders but are not product-ready.

`/proc/deepseek/*` 分区还会承载有风险的子 finding，用于标记已有契约或确定性占位、但尚未产品就绪的能力。

| Finding id / 诊断 ID | State / 状态 | Owner / 责任方 | Meaning / 含义 |
| --- | --- | --- | --- |
| `governance.finding.remote-runtime-connectivity-placeholder` | `placeholder` | `platform-abstraction` | `NoopRemoteRuntimeConnectivity` is memory-only and has no real network transport. / `NoopRemoteRuntimeConnectivity` 仅内存行为，没有真实网络传输。 |
| `governance.finding.distribution-update-management-placeholder` | `placeholder` | `platform-abstraction` | `StaticDistributionUpdateManager` returns a static dev release and no update catalog. / `StaticDistributionUpdateManager` 返回静态 dev release，没有更新目录。 |
| `governance.finding.extension-system-placeholder` | `placeholder` | `platform-abstraction` | Extension management is in-memory and must not be claimed as a standalone extension product. / extension 管理是内存占位，不得声明为独立 extension 产品。 |
| `governance.finding.evolution-engine-placeholder` | `placeholder` | `platform-abstraction` | Evolution gates and migrations are in-memory placeholders. / evolution gate 与 migration 是内存占位。 |
| `governance.finding.semantic-indexing-deferred` | `deferred` | `index-provider` | ZVec/code-index are deferred behind missing implementation and activation evidence; PageIndex remains deterministic fallback. / ZVec/code-index 因缺少实现与激活证据而延期；PageIndex 保持确定性回退。 |
| `governance.finding.vscode-host-adapter-skeleton` | `partial` | `vscode-extension` | VSCode is a protocol bridge skeleton, not a full IDE product workflow. / VSCode 是协议桥骨架，不是完整 IDE 产品工作流。 |
| `governance.finding.multi-agent-rollout-gated-defaults` | `rollout-gated` | `agent-management` | Coordinator/worker/repair write-capable defaults remain gated despite namespace/quota contracts. / 即使已有 namespace/quota 契约，coordinator/worker/repair 默认可写执行仍受门禁。 |

## Evidence / 证据

This surface is covered by:

该表面由以下证据覆盖：

- `tests/e2e/local-readiness-cli.test.ts`: text, JSON, JSONL, filters, and product-ready blocker behavior. / text、JSON、JSONL、过滤器与 product-ready blocker 行为。
- `tests/contracts/local-readiness.test.ts`: release evidence schema and product-ready fail-closed gate. / release evidence schema 与 product-ready fail-closed 门禁。
- `tests/golden/governance-diagnostics-replay.test.ts`: deterministic replay and redaction stability. / 确定性 replay 与脱敏稳定性。
