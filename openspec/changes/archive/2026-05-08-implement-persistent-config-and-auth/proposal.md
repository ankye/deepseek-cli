## Why

R1 readiness commands currently prove that the local surface is shaped correctly, but they do not persist user configuration, create durable credential references, or verify a live DeepSeek connection through an explicit user action. The next product step is to turn readiness from deterministic scaffolding into a real first-run path while preserving the platform boundaries, secret redaction, and default no-network guarantees.

当前 R1 readiness commands 已经证明本地表面形态正确，但还没有持久化用户配置、创建持久 credential references，或通过显式用户动作验证真实 DeepSeek 连接。下一步产品工作是把 readiness 从 deterministic scaffolding 推进为真实首次使用路径，同时保留平台边界、secret redaction 和默认不联网保证。

## What Changes

- Add persistent configuration support for user-level, workspace-level, environment, and CLI override sources.
- 增加持久化配置能力，支持 user-level、workspace-level、environment 和 CLI override sources。
- Add schema validation, source precedence, redaction, diagnostics, and migration metadata for config values.
- 增加 config values 的 schema validation、source precedence、redaction、diagnostics 和 migration metadata。
- Add credential reference persistence through credential-auth-management with pluggable secure storage adapters and deterministic fake storage.
- 通过 credential-auth-management 增加 credential reference persistence，支持可插拔 secure storage adapters 和 deterministic fake storage。
- Extend local readiness commands so `init`, `config`, `auth`, `doctor`, and `privacy` consume persisted config/auth state instead of hardcoded readiness defaults.
- 扩展 local readiness commands，让 `init`、`config`、`auth`、`doctor` 和 `privacy` 消费持久化 config/auth state，而不是硬编码 readiness defaults。
- Add explicit live verification through `doctor --live` or equivalent command input, routed through model-gateway with injected credentials and redacted evidence.
- 增加通过 `doctor --live` 或等价 command input 触发的显式 live verification，经由 model-gateway 和 injected credentials 执行，并输出脱敏证据。
- Add tests for config precedence, credential redaction, persistence boundaries, live opt-in behavior, and host-neutral command results.
- 增加 config precedence、credential redaction、persistence boundaries、live opt-in behavior 和 host-neutral command results 测试。

## Capabilities

### New Capabilities

- `config`: Persistent configuration schema, source precedence, validation, redaction, migration metadata, and host-neutral config service contracts.
- `config`: 持久化配置 schema、source precedence、validation、redaction、migration metadata 和 host-neutral config service contracts。

### Modified Capabilities

- `local-readiness`: Readiness commands consume persistent config/auth state and expose explicit live verification without changing default deterministic behavior.
- `local-readiness`: readiness commands 消费持久化 config/auth state，并暴露显式 live verification，同时不改变默认 deterministic behavior。
- `credential-auth-management`: Add durable credential reference storage, secure-storage adapter contracts, local fallback behavior, and no-raw-secret audit evidence.
- `credential-auth-management`: 增加持久 credential reference storage、secure-storage adapter contracts、local fallback behavior 和 no-raw-secret audit evidence。
- `model-gateway`: Define live verification call semantics for credential-backed DeepSeek connectivity checks without leaking provider wire details to commands.
- `model-gateway`: 定义 credential-backed DeepSeek connectivity checks 的 live verification 调用语义，不向 commands 泄漏 provider wire details。
- `platform-abstraction`: Add user config path, workspace metadata path, atomic write, file permission, and cross-platform storage diagnostics requirements.
- `platform-abstraction`: 增加 user config path、workspace metadata path、atomic write、file permission 和 cross-platform storage diagnostics 要求。
- `testing-regression`: Add deterministic persistence, redaction, config precedence, matrix, e2e, and optional live verification regression requirements.
- `testing-regression`: 增加 deterministic persistence、redaction、config precedence、matrix、e2e 和 optional live verification regression 要求。

## Impact

- Affects `src/apps/cli`, `src/packages/config`, `src/packages/command-system`, `src/packages/credential-auth-management`, `src/packages/platform-abstraction`, `src/packages/model-gateway`, `src/packages/platform-contracts`, and `src/packages/testing-regression`.
- 影响 `src/apps/cli`、`src/packages/config`、`src/packages/command-system`、`src/packages/credential-auth-management`、`src/packages/platform-abstraction`、`src/packages/model-gateway`、`src/packages/platform-contracts` 和 `src/packages/testing-regression`。
- Adds persisted local state under governed user/workspace paths, but raw credentials must never be committed, printed, traced, or stored outside the credential adapter boundary.
- 会在受治理的 user/workspace paths 下增加持久本地状态，但 raw credentials 绝不能被提交、打印、追踪，或存储在 credential adapter boundary 之外。
- Default tests and default readiness commands remain deterministic and do not call the live DeepSeek API.
- 默认测试和默认 readiness commands 仍保持 deterministic，且不调用真实 DeepSeek API。
