## ADDED Requirements

### Requirement: Durable Credential Reference Storage / 持久凭证引用存储

Credential auth management SHALL provide durable credential reference storage through host-injected secure-storage adapters while preventing raw secret values from entering config, command output, traces, test fixtures, or model provider adapters.

credential auth management 必须通过 host-injected secure-storage adapters 提供持久 credential reference storage，同时防止 raw secret values 进入 config、command output、traces、test fixtures 或 model provider adapters。

#### Scenario: Auth stores credential through adapter / auth 通过 adapter 存储凭证

- **WHEN** `deepseek auth` receives a DeepSeek API key or token from an explicit user input path
- **THEN** credential-auth-management stores the raw value only through the configured credential storage adapter and returns a credential reference id, source, scope, rotation metadata, and redaction metadata
- **中文** 当 `deepseek auth` 通过显式用户输入路径收到 DeepSeek API key 或 token 时，credential-auth-management 必须只通过配置的 credential storage adapter 存储 raw value，并返回 credential reference id、source、scope、rotation metadata 和 redaction metadata。

#### Scenario: Auth output never prints raw credential / auth 输出永不打印原始凭证

- **WHEN** auth, config, doctor, live verification, model gateway, logs, traces, snapshots, or assertion messages refer to a stored credential
- **THEN** they include only credential reference metadata and redacted summaries, never the raw credential value
- **中文** 当 auth、config、doctor、live verification、model gateway、logs、traces、snapshots 或 assertion messages 引用已存储凭证时，只能包含 credential reference metadata 和 redacted summaries，绝不能包含 raw credential value。

### Requirement: Credential Storage Adapter Contract / 凭证存储适配器契约

Credential auth management SHALL define secure-storage adapter contracts for storing, resolving, deleting, listing, and auditing credential references with deterministic fake implementations for tests.

credential auth management 必须定义 secure-storage adapter contracts，用于 store、resolve、delete、list 和 audit credential references，并提供 tests 使用的 deterministic fake implementations。

#### Scenario: Missing secure storage has safe fallback / 缺少安全存储时安全降级

- **WHEN** the host platform cannot provide secure credential storage
- **THEN** credential-auth-management returns a structured unavailable or degraded-storage diagnostic and does not silently store raw credentials in general config
- **中文** 当 host platform 无法提供 secure credential storage 时，credential-auth-management 必须返回 structured unavailable 或 degraded-storage diagnostic，且不得静默把 raw credentials 存入普通 config。

#### Scenario: Logout removes scoped credential / logout 删除限定范围凭证

- **WHEN** `deepseek auth logout` or an equivalent command deletes a DeepSeek credential reference
- **THEN** credential-auth-management removes only credentials in the requested provider/profile/workspace scope and emits redacted audit metadata
- **中文** 当 `deepseek auth logout` 或等价命令删除 DeepSeek credential reference 时，credential-auth-management 必须只删除请求的 provider/profile/workspace scope 内的凭证，并输出 redacted audit metadata。

### Requirement: Credential Resolution For Live Provider / live provider 凭证解析

Credential auth management SHALL resolve DeepSeek credential references for model-gateway live verification through injected resolvers rather than direct provider environment reads.

credential auth management 必须通过 injected resolvers 为 model-gateway live verification 解析 DeepSeek credential references，而不是让 provider 直接读取环境。

#### Scenario: Provider receives credential value only at boundary / provider 只在边界收到凭证值

- **WHEN** model-gateway performs an explicit live DeepSeek request
- **THEN** the credential resolver provides the raw credential only to the transport boundary and redacts it from request metadata, runtime events, diagnostics, and errors
- **中文** 当 model-gateway 执行显式 DeepSeek live request 时，credential resolver 只能把 raw credential 提供给 transport boundary，并必须从 request metadata、runtime events、diagnostics 和 errors 中脱敏。
