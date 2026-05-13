## Why

R3 now needs a trustworthy CLI-first extension management loop so users can inspect, activate, install, verify, and diagnose plugins, skills, MCP connectors, and scoped credentials before any VSCode/server projection.

R3 现在需要一个可信的 CLI-first extension management 闭环，让用户能在 VSCode/server 投影前先通过 CLI 检查、激活、安装、校验并诊断 plugins、skills、MCP connectors 与 scoped credentials。

## What Changes

- Add a CLI extension management surface for `extension list`, plugin install/apply-lockfile/snapshot/verify, skill list/activate, credential scope diagnostics, and MCP test evidence. / 增加 CLI extension management 产品面，覆盖 `extension list`、plugin install/apply-lockfile/snapshot/verify、skill list/activate、credential scope diagnostics 和 MCP test evidence。
- Normalize extension output into text, JSON, and JSONL records with stable ids, redaction metadata, permission diffs, audit summaries, and reference pit fixture ids. / 将 extension output 归一化为 text、JSON、JSONL records，包含 stable ids、redaction metadata、permission diffs、audit summaries 和 reference pit fixture ids。
- Extend plugin, MCP, skill, extension, credential, command, and regression specs only where CLI-visible behavior or contract expectations change. / 仅在 CLI 可见行为或契约预期变化处扩展 plugin、MCP、skill、extension、credential、command 和 regression specs。
- Keep CLI as a thin host adapter; shared packages keep manifest validation, lockfile, credential, skill, MCP, and permission-diff ownership. / 保持 CLI 为薄 host adapter；manifest validation、lockfile、credential、skill、MCP 和 permission-diff 归属共享 packages。
- Add deterministic tests for extension command rendering, permission expansion, MCP/plugin precedence, credential scope denial, manifest normalization, redaction, and no-reference-source hygiene. / 增加确定性测试，覆盖 extension command rendering、permission expansion、MCP/plugin precedence、credential scope denial、manifest normalization、redaction 和 no-reference-source hygiene。

## Capabilities

### New Capabilities

- `cli-extension-auth-management`: CLI-first extension management commands, structured evidence, text/JSON/JSONL parity, permission diff rendering, scoped credential diagnostics, MCP test projection, and reference pit coverage. / CLI-first extension management commands、structured evidence、text/JSON/JSONL parity、permission diff rendering、scoped credential diagnostics、MCP test projection 和 reference pit coverage。

### Modified Capabilities

- `plugin-system`: plugin install/apply/verify/snapshot behavior must produce CLI-consumable permission diff, lockfile, integrity, and audit evidence. / plugin install/apply/verify/snapshot 行为必须产出 CLI 可消费的 permission diff、lockfile、integrity 和 audit evidence。
- `mcp-gateway`: MCP test evidence must remain governed, deterministic by default, and usable from the extension management surface. / MCP test evidence 必须保持受治理、默认确定性，并可被 extension management surface 使用。
- `skill-system`: skill list and activation summaries must be safe for CLI extension management without loading full context into command output. / skill list 与 activation summaries 必须能安全供 CLI extension management 使用，且不把完整 context 装入命令输出。
- `extension-system`: extension contribution summaries must normalize skills, plugins, MCP, commands, hooks, and renderer hints without granting execution authority. / extension contribution summaries 必须归一化 skills、plugins、MCP、commands、hooks 和 renderer hints，且不授予执行权。
- `credential-auth-management`: scoped credential diagnostics must cover MCP/plugin connector access without raw secret output. / scoped credential diagnostics 必须覆盖 MCP/plugin connector access，且不得输出 raw secret。
- `command-system`: CLI extension commands must be registered as host-agnostic structured command results rather than ad-hoc terminal strings. / CLI extension commands 必须注册为 host-agnostic structured command results，而不是临时 terminal 字符串。
- `testing-regression`: deterministic regression coverage must include CLI extension management, permission diff pits, credential scope pits, MCP/plugin precedence, and legacy contribution normalization. / deterministic regression coverage 必须包含 CLI extension management、permission diff pits、credential scope pits、MCP/plugin precedence 和 legacy contribution normalization。

## Impact

- Affects `src/apps/cli` parsing, help, extension command adapter, renderers, README, and CLI tests. / 影响 `src/apps/cli` 的 parsing、help、extension command adapter、renderers、README 和 CLI tests。
- Affects shared contracts only through implementation-free DTOs for extension management records and credential scope diagnostics. / 共享契约仅通过无实现 DTO 扩展 extension management records 与 credential scope diagnostics。
- Reuses existing `@deepseek/platform-abstraction` plugin manager, `@deepseek/mcp-gateway`, `@deepseek/skill-system`, and `@deepseek/credential-auth-management` public exports. / 复用现有 `@deepseek/platform-abstraction` plugin manager、`@deepseek/mcp-gateway`、`@deepseek/skill-system` 和 `@deepseek/credential-auth-management` 公开导出。
- Adds tests under CLI, contract, integration/e2e, and regression fixture locations according to existing ownership. / 按现有归属在 CLI、contract、integration/e2e 和 regression fixture 位置增加测试。
- Does not implement marketplace search, remote plugin fetch, signed packages, managed enterprise policy, full TUI, or non-CLI host UX in this pack. / 本包不实现 marketplace search、remote plugin fetch、signed packages、managed enterprise policy、full TUI 或非 CLI host UX。
