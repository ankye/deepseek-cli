## Context

The CLI-first roadmap has already landed the first extension management slice: plugins can be installed and snapshotted, MCP manifests can be tested through the gateway, extension commands render structured evidence, and credential scope diagnostics are metadata-only. The missing R3 boundary is the authority model that lets MCP/plugin owners declare credential needs while preventing those owners from reading raw secrets, broad provider credentials, or host-specific stores directly.

CLI-first 路线已经落地第一段 extension management：plugins 可以 install/snapshot，MCP manifests 可以通过 gateway 测试，extension commands 会渲染 structured evidence，credential scope diagnostics 也是 metadata-only。当前缺口是 R3 authority model：MCP/plugin owners 可以声明 credential needs，但不得直接读取 raw secrets、宽泛 provider credentials 或 host-specific stores。

This change is cross-cutting across contracts, credential-auth-management, MCP gateway, plugin lifecycle, CLI rendering, and regression fixtures. It must stay additive, host-neutral, and deterministic.

该变更横跨 contracts、credential-auth-management、MCP gateway、plugin lifecycle、CLI rendering 与 regression fixtures。它必须保持 additive、host-neutral 与 deterministic。

## Goals / Non-Goals

**Goals:**

- Define scoped credential grants as metadata-first records owned by credential-auth-management and exposed through platform contracts.
- Require MCP and plugin workflows to authorize credential scope before tool/resource/contribution use.
- Surface CLI-consumable auth readiness, denial, redaction, audit, and replay evidence.
- Add deterministic tests and reference pit fixture coverage for extension auth scope failures and permission expansion.
- Preserve CLI-first promotion evidence so future VSCode/server/plugin marketplace work reuses the same semantics.

- 定义 scoped credential grants，作为由 credential-auth-management 拥有、通过 platform contracts 暴露的 metadata-first records。
- 要求 MCP 与 plugin workflows 在 tool/resource/contribution 使用前授权 credential scope。
- 暴露 CLI 可消费的 auth readiness、denial、redaction、audit 与 replay evidence。
- 增加 deterministic tests 与 reference pit fixture 覆盖，验证 extension auth scope failures 与 permission expansion。
- 保留 CLI-first promotion evidence，使后续 VSCode/server/plugin marketplace 复用同一语义。

**Non-Goals:**

- No live OAuth/device-code implementation in this slice; host-mediated auth UI remains a later adapter task.
- No raw secret persistence changes beyond existing credential storage adapters.
- No remote plugin marketplace fetch or signed distribution work.
- No weakening of current MCP real-transport fail-closed defaults.

- 本切片不实现 live OAuth/device-code；host-mediated auth UI 留给后续 adapter。
- 不改变现有 credential storage adapters 之外的 raw secret persistence。
- 不实现 remote plugin marketplace fetch 或 signed distribution。
- 不放宽当前 MCP real-transport fail-closed 默认值。

## Decisions

### Decision: Scoped grants are contract DTOs, raw credential resolution stays private

Add shared DTOs for `ExtensionCredentialGrant`, `ExtensionCredentialRequirement`, `ExtensionCredentialAuthorizationResult`, and audit evidence in `@deepseek/platform-contracts`. Credential-auth-management owns factories and authorization helpers. MCP/plugin packages consume authorization results and grant references, but never receive raw secret values.

新增 `ExtensionCredentialGrant`、`ExtensionCredentialRequirement`、`ExtensionCredentialAuthorizationResult` 与 audit evidence 到 `@deepseek/platform-contracts`。credential-auth-management 拥有 factories 与 authorization helpers。MCP/plugin packages 只消费 authorization results 与 grant references，永远不接收 raw secret values。

Alternative considered: let each subsystem define its own auth scope object. Rejected because MCP, plugin, skill, and extension diagnostics need consistent replay and redaction evidence.

备选方案：各 subsystem 自定义 auth scope object。拒绝原因是 MCP、plugin、skill 与 extension diagnostics 需要一致的 replay 与 redaction evidence。

### Decision: MCP and plugin auth boundary is pre-dispatch and fail-closed

MCP tool/resource calls and plugin lifecycle/contribution activation must authorize declared credential needs before dispatch. Missing, expired, revoked, undeclared, caller-mismatched, trust-mismatched, or operation-mismatched grants return typed diagnostics and do not call handlers, adapters, or credential resolvers.

MCP tool/resource calls 与 plugin lifecycle/contribution activation 必须在 dispatch 前授权 declared credential needs。grant 缺失、过期、已撤销、未声明、caller 不匹配、trust 不匹配或 operation 不匹配时返回 typed diagnostics，且不调用 handlers、adapters 或 credential resolvers。

Alternative considered: authorize lazily inside handlers. Rejected because it lets plugin/MCP owner code observe timing, partial state, or resolver availability before policy denial.

备选方案：在 handler 内 lazy authorize。拒绝原因是 plugin/MCP owner code 会在 policy denial 前观察到 timing、partial state 或 resolver availability。

### Decision: Plugin auth needs are lifecycle evidence, not credential storage writes

Plugin manifests and lockfile entries may declare credential requirements and auth readiness evidence. Installing or applying a plugin records permission/auth diffs and audit fingerprints, but does not create, resolve, or mutate credentials. A separate host-mediated auth flow can satisfy grants later.

Plugin manifests 与 lockfile entries 可以声明 credential requirements 与 auth readiness evidence。install/apply plugin 会记录 permission/auth diffs 与 audit fingerprints，但不创建、解析或修改 credentials。后续可由独立 host-mediated auth flow 满足 grants。

Alternative considered: plugin install automatically prompts for credentials. Rejected for deterministic headless behavior and because CLI/server/IDE auth UI must remain adapter-owned.

备选方案：plugin install 自动提示输入凭证。拒绝原因是 headless 行为必须确定，且 CLI/server/IDE auth UI 应由 adapter 拥有。

### Decision: CLI renders evidence from results only

CLI extension/auth commands render typed result records from credential-auth-management, MCP gateway, and plugin-system. The CLI must not recompute permission/auth policy from terminal state or inspect raw credential sources.

CLI extension/auth commands 只渲染 credential-auth-management、MCP gateway 与 plugin-system 返回的 typed result records。CLI 不得从 terminal state 重新计算 permission/auth policy，也不得检查 raw credential sources。

Alternative considered: CLI-only command shortcuts for auth checks. Rejected because future host projection needs shared protocol-compatible evidence.

备选方案：CLI-only auth check shortcuts。拒绝原因是后续 host projection 需要共享 protocol-compatible evidence。

## Risks / Trade-offs

- Scope model becomes too generic and hard to test -> Keep v1 operations small: `resolve`, `use-tool`, `read-resource`, `activate-contribution`, `install`, `apply-lockfile`, `diagnose`.
- Grant metadata may leak sensitive connector names -> Apply redaction metadata and bounded summaries to all CLI/protocol/test output.
- Existing plugin/MCP tests may assume missing auth is allowed -> Keep auth requirements opt-in; no declared credential need means existing deterministic paths continue.
- Future OAuth UX may need richer grant state -> Include compatibility metadata and additive schema versioning, but defer live flows.

- Scope model 过泛导致难测 -> v1 operations 保持小集合：`resolve`、`use-tool`、`read-resource`、`activate-contribution`、`install`、`apply-lockfile`、`diagnose`。
- Grant metadata 可能泄露敏感 connector 名称 -> 所有 CLI/protocol/test output 都使用 redaction metadata 与 bounded summaries。
- 现有 plugin/MCP tests 可能假设缺少 auth 仍可执行 -> auth requirements 保持 opt-in；没有声明 credential need 的现有确定性路径继续运行。
- 未来 OAuth UX 可能需要更丰富的 grant state -> 保留 compatibility metadata 与 additive schema versioning，但 live flows 延后。

## Migration Plan

1. Add DTOs and deterministic factories without changing existing plugin/MCP behavior.
2. Add optional credential requirement fields to plugin/MCP manifests and results.
3. Add authorization helpers and wire them into MCP/plugin paths only when requirements are declared.
4. Add CLI rendering and regression fixtures for declared-auth cases.
5. Keep rollback simple: remove declared auth requirements or disable the feature flag path; existing no-auth deterministic flows remain compatible.

1. 先新增 DTOs 与 deterministic factories，不改变现有 plugin/MCP 行为。
2. 给 plugin/MCP manifests 与 results 增加 optional credential requirement fields。
3. 增加 authorization helpers，并只在声明 requirements 时接入 MCP/plugin paths。
4. 增加 CLI rendering 与 declared-auth cases 的 regression fixtures。
5. 回滚保持简单：移除 declared auth requirements 或关闭 feature flag path；现有 no-auth deterministic flows 保持兼容。

## Open Questions

- Whether v1 should expose a CLI command for grant creation, or only diagnostics/readiness. Initial implementation should prefer diagnostics/readiness unless a local credential storage path is already available.
- Whether MCP prompt projection needs auth in this slice. Initial implementation should cover prompt metadata auth readiness, but defer prompt execution/auth UI.

- v1 是否需要暴露 grant creation CLI command，还是只做 diagnostics/readiness。初始实现应优先 diagnostics/readiness，除非已有本地 credential storage path。
- MCP prompt projection 是否在本切片需要 auth。初始实现应覆盖 prompt metadata auth readiness，但延后 prompt execution/auth UI。
