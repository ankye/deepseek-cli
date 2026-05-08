## Why

R1 cannot be considered usable if users can run a model turn but cannot initialize a workspace, configure local settings, set a credential reference, run diagnostics, verify installation, or control privacy behavior.

如果用户只能运行一次模型回合，却不能初始化 workspace、配置本地设置、设置 credential reference、运行诊断、验证安装或控制隐私行为，那么 R1 不能算可用。

This change starts the R1 local readiness layer so DeepSeek CLI has a deterministic, safe, and testable first-run path before expanding into richer coding tools.

本变更启动 R1 local readiness layer，让 DeepSeek CLI 在扩展更丰富 coding tools 之前，先具备 deterministic、安全、可测试的首次使用路径。

## What Changes

- Add local readiness CLI commands: `init`, `config`, `auth`, `doctor`, `privacy`, and `verify-install`.
- 增加 local readiness CLI commands：`init`、`config`、`auth`、`doctor`、`privacy` 和 `verify-install`。
- Route readiness commands through shared command contracts and structured results instead of ad hoc CLI-only state.
- 让 readiness commands 通过共享 command contracts 和 structured results，而不是 ad hoc CLI-only state。
- Add secret-safe credential reference setup for DeepSeek API keys without printing or persisting raw token values in traces.
- 增加 secret-safe credential reference setup，用于 DeepSeek API keys，且不在 traces 中打印或持久化 raw token values。
- Add deterministic doctor and install verification output for platform, package, Node version, workspace, config, and credential presence checks.
- 增加 deterministic doctor 与 install verification 输出，覆盖 platform、package、Node version、workspace、config 和 credential presence checks。
- Add privacy setting inspection and local opt-out metadata for future telemetry/diagnostic export.
- 增加 privacy setting inspection 和 local opt-out metadata，用于未来 telemetry/diagnostic export。

## Capabilities

### New Capabilities / 新增能力

- `local-readiness`: First-run and local readiness commands, config/auth/doctor/privacy/install verification flows, and R1 smoke evidence.
- `local-readiness`: 首次使用与本地可用性命令，覆盖 config/auth/doctor/privacy/install verification flows 和 R1 smoke evidence。

### Modified Capabilities / 修改能力

- `command-system`: Add concrete readiness command registration, invocation, structured result, and host rendering requirements.
- `command-system`: 增加具体 readiness command registration、invocation、structured result 和 host rendering 要求。
- `credential-auth-management`: Add local API key reference setup and redacted credential presence checks for R1.
- `credential-auth-management`: 增加 R1 local API key reference setup 和 redacted credential presence checks。
- `platform-abstraction`: Add readiness checks for Node version, platform metadata, command availability, and workspace path behavior.
- `platform-abstraction`: 增加 Node version、platform metadata、command availability 和 workspace path behavior 的 readiness checks。
- `testing-regression`: Add deterministic readiness smoke, CLI command tests, and redaction fixtures.
- `testing-regression`: 增加 deterministic readiness smoke、CLI command tests 和 redaction fixtures。

## Impact

- Affects `src/apps/cli`, `src/packages/command-system`, `src/packages/credential-auth-management`, platform/config-adjacent package surfaces, tests, and docs.
- 影响 `src/apps/cli`、`src/packages/command-system`、`src/packages/credential-auth-management`、platform/config-adjacent package surfaces、tests 和 docs。
- Does not add live provider calls to readiness commands by default.
- readiness commands 默认不增加 live provider calls。
- Does not store raw credentials in repository files, traces, test snapshots, or stdout.
- 不在 repository files、traces、test snapshots 或 stdout 中存储 raw credentials。
