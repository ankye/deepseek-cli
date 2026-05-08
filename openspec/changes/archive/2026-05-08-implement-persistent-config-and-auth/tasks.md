## 1. Contracts And Storage Model / 契约与存储模型

- [x] 1.1 Add config document, config source, config diagnostic, resolved config, config scope, and config service contracts to `@deepseek/platform-contracts`. / 在 `@deepseek/platform-contracts` 增加 config document、config source、config diagnostic、resolved config、config scope 和 config service contracts。
- [x] 1.2 Add credential storage adapter, credential audit, credential delete/list, and secure-storage diagnostic contracts without raw secret serialization fields. / 增加 credential storage adapter、credential audit、credential delete/list 和 secure-storage diagnostic contracts，且不包含 raw secret serialization fields。
- [x] 1.3 Add readiness live-check input/result contracts and provider-neutral live verification result contracts. / 增加 readiness live-check input/result contracts 和 provider-neutral live verification result contracts。
- [x] 1.4 Add platform path and atomic persistence contracts for user config path, workspace metadata path, permission diagnostics, and fake platform behavior. / 增加 user config path、workspace metadata path、permission diagnostics 和 fake platform behavior 的 platform path 与 atomic persistence contracts。

## 2. Config Service / 配置服务

- [x] 2.1 Implement `@deepseek/config` schema validation, source precedence, resolved-value metadata, redaction, and diagnostics. / 实现 `@deepseek/config` schema validation、source precedence、resolved-value metadata、redaction 和 diagnostics。
- [x] 2.2 Implement user/workspace config load and save through injected platform persistence with schema version and migration metadata. / 通过注入的 platform persistence 实现 user/workspace config load 与 save，并包含 schema version 和 migration metadata。
- [x] 2.3 Reject or redact secret-like values in config writes and route credential setup guidance to credential-auth-management. / 在 config writes 中拒绝或脱敏 secret-like values，并把 credential setup guidance 路由到 credential-auth-management。
- [x] 2.4 Add config command projections for text, JSON, replay, and future host rendering. / 增加 config command projections，支持 text、JSON、replay 和未来 host rendering。

## 3. Credential Auth Persistence / 凭证认证持久化

- [x] 3.1 Implement credential storage adapter interface, deterministic fake storage, local unavailable/degraded diagnostics, and scoped audit metadata. / 实现 credential storage adapter interface、deterministic fake storage、local unavailable/degraded diagnostics 和 scoped audit metadata。
- [x] 3.2 Implement DeepSeek credential reference store/resolve/delete/list flows with provider/profile/workspace scope. / 实现带 provider/profile/workspace scope 的 DeepSeek credential reference store/resolve/delete/list flows。
- [x] 3.3 Ensure credential-auth-management is the only non-test package allowed to read explicit credential input and raw values never enter config, traces, stdout, or model events. / 确保 credential-auth-management 是唯一允许读取显式 credential input 的非测试包，且 raw values 永不进入 config、traces、stdout 或 model events。

## 4. Readiness And CLI Commands / 可用性与 CLI 命令

- [x] 4.1 Update `init` to create workspace metadata and initial non-secret config idempotently through config/platform services. / 更新 `init`，通过 config/platform services 幂等创建 workspace metadata 和初始 non-secret config。
- [x] 4.2 Update `config` to read, validate, show, and set user/workspace config values with source precedence and redacted output. / 更新 `config`，支持以 source precedence 和 redacted output 读取、校验、展示和设置 user/workspace config values。
- [x] 4.3 Update `auth` to store, show, and logout DeepSeek credential references through credential-auth-management. / 更新 `auth`，通过 credential-auth-management 存储、展示和 logout DeepSeek credential references。
- [x] 4.4 Update `doctor` and `privacy` to consume persisted config/auth/privacy state while keeping default doctor offline. / 更新 `doctor` 和 `privacy`，消费 persisted config/auth/privacy state，同时保持默认 doctor 离线。
- [x] 4.5 Add explicit `doctor --live` parsing and command execution path through model-gateway with injected credentials and redacted structured output. / 增加显式 `doctor --live` parsing 和通过 model-gateway、injected credentials、redacted structured output 执行的 command path。

## 5. Model Gateway Live Verification / Model Gateway Live 验证

- [x] 5.1 Implement provider-neutral live verification operation over the existing DeepSeek provider and OpenAI SDK transport. / 基于现有 DeepSeek provider 和 OpenAI SDK transport 实现 provider-neutral live verification operation。
- [x] 5.2 Add typed redacted failure semantics for missing credentials, network/provider errors, unsupported capability, rate limit, and account/quota failures. / 增加 missing credentials、network/provider errors、unsupported capability、rate limit 和 account/quota failures 的 typed redacted failure semantics。
- [x] 5.3 Ensure live verification returns structural evidence only and does not snapshot exact model text. / 确保 live verification 只返回 structural evidence，且不 snapshot 精确模型文本。

## 6. Tests And Acceptance / 测试与验收

- [x] 6.1 Add contract tests for config, credential storage, readiness live-check, platform persistence, and live verification result shapes. / 增加 config、credential storage、readiness live-check、platform persistence 和 live verification result shapes 的 contract tests。
- [x] 6.2 Add unit tests for config precedence, validation diagnostics, secret-like value rejection, and schema migration metadata. / 增加 config precedence、validation diagnostics、secret-like value rejection 和 schema migration metadata 的 unit tests。
- [x] 6.3 Add credential redaction tests proving fake raw credentials never appear in stdout, JSON, traces, snapshots, model events, or assertion messages. / 增加 credential redaction tests，证明 fake raw credentials 不会出现在 stdout、JSON、traces、snapshots、model events 或 assertion messages。
- [x] 6.4 Add CLI e2e tests for init/config/auth/logout/doctor/privacy/default-offline doctor/live-fake doctor. / 增加 init/config/auth/logout/doctor/privacy/default-offline doctor/live-fake doctor 的 CLI e2e tests。
- [x] 6.5 Add fake Windows/macOS/Linux matrix tests for config paths, workspace metadata paths, traversal rejection, permission diagnostics, and atomic write failure. / 增加 fake Windows/macOS/Linux matrix tests，覆盖 config paths、workspace metadata paths、traversal rejection、permission diagnostics 和 atomic write failure。
- [x] 6.6 Add optional live auth verification script gated by explicit environment variables and structural assertions. / 增加由显式环境变量和结构断言门控的 optional live auth verification script。
- [x] 6.7 Run `openspec validate implement-persistent-config-and-auth --type change --strict`. / 运行 `openspec validate implement-persistent-config-and-auth --type change --strict`。
- [x] 6.8 Run `openspec validate --specs --strict`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:e2e`, `npm run test:contracts`, `npm run test:integration`, `npm run test:matrix`, and relevant live smoke only when explicitly enabled. / 运行 `openspec validate --specs --strict`、`npm run lint`、`npm run typecheck`、`npm test`、`npm run test:e2e`、`npm run test:contracts`、`npm run test:integration`、`npm run test:matrix`，并仅在显式启用时运行相关 live smoke。
