## Context

The current CLI can run deterministic readiness commands and an opt-in live provider smoke test, but real users still need a durable first-run path: initialize workspace metadata, configure provider/model defaults, store or reference credentials, inspect privacy choices, and verify the live provider only when they explicitly ask for it.

当前 CLI 可以运行 deterministic readiness commands 和可选 live provider smoke test，但真实用户仍需要一条持久的首次使用路径：初始化 workspace metadata、配置 provider/model defaults、存储或引用凭证、检查隐私选择，并且只有在用户显式请求时才验证 live provider。

The core constraint is boundary discipline. Config parsing cannot become CLI-only state. Credential storage cannot leak raw secrets into config, traces, stdout, tests, or model provider adapters. Live checks cannot become default network behavior.

核心约束是边界纪律。config parsing 不能变成 CLI-only state。credential storage 不能把 raw secrets 泄漏到 config、traces、stdout、tests 或 model provider adapters。live checks 不能变成默认联网行为。

## Goals / Non-Goals

**Goals:**

- Provide a host-neutral config service with schema validation, source precedence, redaction, diagnostics, and migration metadata.
- 提供 host-neutral config service，包含 schema validation、source precedence、redaction、diagnostics 和 migration metadata。
- Provide credential reference persistence through credential-auth-management with secure-storage adapter contracts and deterministic fakes.
- 通过 credential-auth-management 提供 credential reference persistence，并包含 secure-storage adapter contracts 和 deterministic fakes。
- Make readiness commands consume persisted config/auth state while preserving deterministic default behavior.
- 让 readiness commands 消费持久化 config/auth state，同时保留 deterministic 默认行为。
- Add explicit live verification for DeepSeek connectivity through model-gateway and injected credential resolution.
- 通过 model-gateway 和 injected credential resolution 增加显式 DeepSeek connectivity live verification。
- Cover config precedence, redaction, path behavior, storage failure, and live opt-in behavior with tests before archive.
- 在 archive 前用测试覆盖 config precedence、redaction、path behavior、storage failure 和 live opt-in behavior。

**Non-Goals:**

- Do not implement enterprise managed settings or settings sync in this change.
- 本变更不实现 enterprise managed settings 或 settings sync。
- Do not implement OAuth/device-code login yet; API-key credential references are enough for R1.
- 暂不实现 OAuth/device-code login；R1 使用 API-key credential references 即可。
- Do not make live provider calls part of default `doctor`, default tests, or install verification.
- 不把 live provider calls 放入默认 `doctor`、默认测试或 install verification。
- Do not expose provider SDK types, OpenAI SDK objects, or DeepSeek wire details outside model-gateway.
- 不在 model-gateway 之外暴露 provider SDK types、OpenAI SDK objects 或 DeepSeek wire details。

## Decisions

### Decision: Config is a service with explicit source precedence

Config will be represented as typed values plus source metadata. The resolver will apply this precedence:

配置将表示为 typed values 加 source metadata。resolver 应用以下优先级：

1. CLI invocation overrides / CLI 调用覆盖值
2. Environment values / 环境值
3. Workspace config under the workspace metadata path / workspace metadata path 下的 workspace config
4. User config under the platform user config path / platform user config path 下的 user config
5. Built-in defaults / 内置默认值

Rationale: users need predictable override behavior, tests need deterministic source evidence, and future enterprise settings can be inserted above or below local sources through a separate OpenSpec.

理由：用户需要可预测的覆盖行为，测试需要 deterministic source evidence，未来 enterprise settings 可通过独立 OpenSpec 插入到本地来源之上或之下。

Alternative considered: let CLI parse config directly. Rejected because VSCode/server would reimplement the same state machine and boundary lint could not protect source precedence.

备选方案：让 CLI 直接解析 config。拒绝原因是 VSCode/server 会重复实现同一状态机，且 boundary lint 无法保护 source precedence。

### Decision: Credentials are stored as references, not config values

`auth` stores or resolves a credential reference through credential-auth-management. Config may point to a credential ref id, but it must not contain raw token values. Secure storage is an adapter interface; the first implementation can use deterministic fake storage for tests and a local host adapter for CLI.

`auth` 通过 credential-auth-management 存储或解析 credential reference。Config 可以指向 credential ref id，但不得包含 raw token values。Secure storage 是 adapter interface；第一版实现可在测试中使用 deterministic fake storage，并为 CLI 提供 local host adapter。

Rationale: model-gateway already depends on injected credential resolution. Keeping raw secrets out of config prevents accidental persistence and makes redaction testable.

理由：model-gateway 已经依赖 injected credential resolution。让 raw secrets 不进入 config 可以避免意外持久化，并让 redaction 可测试。

Alternative considered: store API keys in `.deepseek/config.json`. Rejected because it violates no-raw-secret persistence and creates cross-platform file-permission risk.

备选方案：把 API keys 存入 `.deepseek/config.json`。拒绝原因是违反 no-raw-secret persistence，并产生跨平台 file-permission 风险。

### Decision: Live verification is explicit and structurally asserted

`doctor --live` or an equivalent command input will call model-gateway through the DeepSeek provider using an injected credential reference. The output must report provider reachability, model id, terminal status, and redacted diagnostics. It must not snapshot exact model text or expose authorization headers.

`doctor --live` 或等价 command input 将通过 DeepSeek provider 和 injected credential reference 调用 model-gateway。输出必须报告 provider reachability、model id、terminal status 和 redacted diagnostics。不得 snapshot 精确模型文本，也不得暴露 authorization headers。

Rationale: live checks are valuable for user setup, but they are flaky and account-dependent. Default commands remain deterministic; live behavior uses an explicit flag and optional test gate.

理由：live checks 对用户配置很有价值，但它们不稳定且依赖账户。默认 commands 保持 deterministic；live behavior 使用显式 flag 和可选测试门禁。

Alternative considered: make `doctor` always call DeepSeek if credentials exist. Rejected because it breaks default no-network behavior and makes CI dependent on external services.

备选方案：只要存在凭证就让 `doctor` 总是调用 DeepSeek。拒绝原因是破坏默认 no-network behavior，并让 CI 依赖外部服务。

### Decision: Platform abstraction owns config paths and atomic persistence

Config and credential adapters will request user config path, workspace metadata path, atomic write, permission metadata, and path normalization through platform-abstraction. Core packages must not branch directly on OS-specific paths.

config 和 credential adapters 将通过 platform-abstraction 请求 user config path、workspace metadata path、atomic write、permission metadata 和 path normalization。核心包不得直接按 OS-specific paths 分支。

Rationale: Windows/macOS/Linux path behavior differs, and the project already requires a platform layer for command and filesystem semantics.

理由：Windows/macOS/Linux path behavior 不同，而项目已经要求 platform layer 统一 command 和 filesystem semantics。

Alternative considered: use hardcoded `~/.deepseek` and `.deepseek`. Rejected because it hides Windows path issues and makes matrix tests less meaningful.

备选方案：硬编码 `~/.deepseek` 和 `.deepseek`。拒绝原因是隐藏 Windows path 问题，并降低 matrix tests 的价值。

## Risks / Trade-offs

- [Risk] Local persistence becomes a parallel state system. -> Mitigation: config, credentials, readiness, and model-gateway communicate through platform contracts and structured command results.
- [风险] local persistence 变成并行状态系统。-> 缓解：config、credentials、readiness 和 model-gateway 通过 platform contracts 和 structured command results 通信。
- [Risk] Secure storage differs by platform. -> Mitigation: first define adapter contracts, deterministic fake storage, and local fallback diagnostics; platform-specific hardening can follow with focused OpenSpecs.
- [风险] secure storage 因平台而异。-> 缓解：先定义 adapter contracts、deterministic fake storage 和 local fallback diagnostics；平台特定加固后续用聚焦 OpenSpec 推进。
- [Risk] Live verification is flaky. -> Mitigation: keep it opt-in, structurally assert events, redact diagnostics, and keep default CI deterministic.
- [风险] live verification 不稳定。-> 缓解：保持 opt-in，只做结构断言，诊断脱敏，并保持默认 CI deterministic。
- [Risk] Config schema changes break persisted users. -> Mitigation: include schema version, migration metadata, compatibility tests, and incompatible-value diagnostics from the first persisted format.
- [风险] config schema changes 破坏已持久化用户。-> 缓解：从第一版 persisted format 开始包含 schema version、migration metadata、compatibility tests 和 incompatible-value diagnostics。

## Migration Plan

1. Add platform contracts for config documents, config sources, credential reference storage, and readiness live check inputs.
2. Add config package implementation with deterministic filesystem adapter tests.
3. Add credential-auth-management storage adapter contracts and fake/local adapters.
4. Update readiness commands to consume injected config/auth snapshots and explicit live-check dependency.
5. Add CLI parsing for config/auth/init persistence and `doctor --live`.
6. Add contract, unit, integration, e2e, matrix, redaction, compatibility, and optional live tests.

迁移计划：

1. 增加 config documents、config sources、credential reference storage 和 readiness live check inputs 的 platform contracts。
2. 增加 config package implementation 和 deterministic filesystem adapter tests。
3. 增加 credential-auth-management storage adapter contracts 以及 fake/local adapters。
4. 更新 readiness commands，使其消费 injected config/auth snapshots 和显式 live-check dependency。
5. 增加 config/auth/init persistence 和 `doctor --live` 的 CLI parsing。
6. 增加 contract、unit、integration、e2e、matrix、redaction、compatibility 和 optional live tests。

## Open Questions

- Which host-backed secure storage should be first for CLI: OS keychain, encrypted local file, or environment-only reference mode?
- CLI 第一版 host-backed secure storage 应该选择 OS keychain、encrypted local file，还是 environment-only reference mode？
- Should `auth logout` remove only DeepSeek credential refs or all provider credentials under the active profile?
- `auth logout` 应只删除 DeepSeek credential refs，还是删除 active profile 下所有 provider credentials？
- Should profile support be included now or limited to a single default profile for R1?
- profile support 是否现在纳入，还是 R1 只支持单个 default profile？
