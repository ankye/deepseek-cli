## Why

R3 extension work now has usable CLI management, plugin lockfiles, MCP gateway v1, and composition records, but MCP/plugin credential boundaries still need a contract-backed implementation so extension ecosystems cannot accidentally inherit broad provider, filesystem, network, or user credentials. This should land before host promotion because VSCode/server/plugin marketplace surfaces must reuse CLI-proven auth, scope, audit, and fail-closed semantics rather than inventing parallel trust rules.

R3 扩展能力已经具备 CLI management、plugin lockfile、MCP gateway v1 与 composition records，但 MCP/plugin credential boundaries 还需要契约化实现，避免扩展生态意外继承过宽的 provider、filesystem、network 或 user credentials。该能力应在 host promotion 前落地，因为 VSCode/server/plugin marketplace 必须复用 CLI 已验证的 auth、scope、audit 与 fail-closed 语义，而不是另建一套 trust 规则。

## What Changes

- Add scoped credential grants for MCP servers and plugin contributions, with explicit grant ids, owner provenance, allowed operations, redaction class, expiration/revocation metadata, and audit fingerprints.
- Extend MCP gateway behavior so tool/resource/prompt operations can request credentials only through declared scoped references and fail closed when scope, trust, transport, or caller metadata does not match.
- Extend plugin lifecycle behavior so plugin install/apply/enable surfaces declared credential needs, permission diffs, and auth readiness without exposing raw secrets or mutating credential storage directly.
- Add CLI-consumable evidence records for MCP/plugin auth diagnostics, including text/JSONL parity, pit fixture ids, redaction metadata, and replay fingerprints.
- Add deterministic regression coverage for scope denial, plugin permission expansion with auth needs, MCP fail-closed auth, and audit replay.
- No breaking public API removal is intended; new DTO fields and result records should be additive and versioned.

- 为 MCP servers 与 plugin contributions 增加 scoped credential grants，包含 grant id、owner provenance、allowed operations、redaction class、expiration/revocation metadata 与 audit fingerprints。
- 扩展 MCP gateway 行为，使 tool/resource/prompt operations 只能通过声明的 scoped references 请求 credentials，并在 scope、trust、transport 或 caller metadata 不匹配时 fail closed。
- 扩展 plugin lifecycle 行为，使 plugin install/apply/enable 暴露 declared credential needs、permission diffs 与 auth readiness，且不暴露 raw secrets、不直接修改 credential storage。
- 增加 CLI 可消费的 MCP/plugin auth diagnostics evidence records，覆盖 text/JSONL parity、pit fixture ids、redaction metadata 与 replay fingerprints。
- 增加 deterministic regression，覆盖 scope denial、带 auth needs 的 plugin permission expansion、MCP fail-closed auth 与 audit replay。
- 不计划移除公开 API；新增 DTO fields 与 result records 应保持 additive 和 versioned。

## Capabilities

### New Capabilities

- `mcp-plugin-auth-boundaries`: Defines shared scoped credential grants, auth readiness evidence, fail-closed authorization results, and audit records for MCP/plugin extension workflows. / 定义 MCP/plugin 扩展工作流共享的 scoped credential grants、auth readiness evidence、fail-closed authorization results 与 audit records。

### Modified Capabilities

- `mcp-gateway`: MCP calls and resource reads must authorize declared credential scopes before dispatch and return typed diagnostics on auth boundary failures. / MCP calls 与 resource reads 必须在 dispatch 前授权 declared credential scopes，并在 auth boundary failures 时返回 typed diagnostics。
- `plugin-system`: Plugin lifecycle and contribution metadata must expose credential requirements, permission/auth diffs, and audit-ready auth evidence without directly owning credential storage. / Plugin lifecycle 与 contribution metadata 必须暴露 credential requirements、permission/auth diffs 与 audit-ready auth evidence，且不直接拥有 credential storage。
- `credential-auth-management`: Credential contracts must support scoped grant references for extension owners without exposing raw secrets across package or host boundaries. / Credential contracts 必须支持 extension owners 的 scoped grant references，且不得跨 package 或 host boundary 暴露 raw secrets。
- `testing-regression`: Regression suites must cover MCP/plugin auth scope denial, redaction, replay fingerprints, CLI structured evidence, and reference pit fixtures. / Regression suites 必须覆盖 MCP/plugin auth scope denial、redaction、replay fingerprints、CLI structured evidence 与 reference pit fixtures。
- `cli-first-product-route`: CLI-first extension/auth work must cite concrete pit fixtures and produce CLI evidence before host promotion. / CLI-first extension/auth 工作必须引用具体 pit fixtures，并在 host promotion 前产出 CLI evidence。

## Impact

- Affected packages: `src/packages/platform-contracts`, `src/packages/credential-auth-management`, `src/packages/mcp-gateway`, `src/packages/plugin-system`, `src/packages/extension-system`, `src/apps/cli`, `src/packages/testing-regression`.
- Affected specs: `mcp-gateway`, `plugin-system`, `credential-auth-management`, `testing-regression`, `cli-first-product-route`, plus the new `mcp-plugin-auth-boundaries`.
- Affected tests: contract tests for DTOs and grant factories, MCP/plugin integration tests, CLI extension/auth output tests, golden replay for redacted audit evidence, and reference pit fixture coverage.
- Architecture constraints: credential resolution remains behind shared contracts; MCP/plugin packages must not import host secrets, Node process env, or CLI internals; CLI renders structured evidence rather than recomputing auth policy.

- 影响包：`src/packages/platform-contracts`、`src/packages/credential-auth-management`、`src/packages/mcp-gateway`、`src/packages/plugin-system`、`src/packages/extension-system`、`src/apps/cli`、`src/packages/testing-regression`。
- 影响规格：`mcp-gateway`、`plugin-system`、`credential-auth-management`、`testing-regression`、`cli-first-product-route`，以及新增 `mcp-plugin-auth-boundaries`。
- 影响测试：DTO 与 grant factories contract tests、MCP/plugin integration tests、CLI extension/auth output tests、redacted audit evidence golden replay，以及 reference pit fixture coverage。
- 架构约束：credential resolution 继续位于共享契约之后；MCP/plugin packages 不得导入 host secrets、Node process env 或 CLI internals；CLI 只渲染 structured evidence，不重新计算 auth policy。
