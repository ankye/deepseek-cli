## Context

The CLI currently has a minimal kernel-backed prompt path. The product roadmap now marks local readiness as an R1 requirement: users need deterministic commands for initialization, configuration, credential setup, diagnostics, privacy, and installation verification before the coding agent becomes a daily tool.

CLI 当前只有最小 kernel-backed prompt path。产品路线图已经把 local readiness 标记为 R1 requirement：在 coding agent 成为日常工具前，用户需要 deterministic commands 来完成 initialization、configuration、credential setup、diagnostics、privacy 和 installation verification。

## Goals / Non-Goals

**Goals:**

- Add host-visible readiness commands with structured results and text/JSON rendering.
- 增加 host-visible readiness commands，并支持 structured results 与 text/JSON rendering。
- Keep command behavior deterministic and testable without live provider access.
- 保持 command behavior deterministic，且无需 live provider access 即可测试。
- Treat API keys as secret references and never echo raw values.
- 将 API keys 作为 secret references 处理，永不回显 raw values。
- Produce readiness evidence suitable for R1 acceptance.
- 产出适用于 R1 acceptance 的 readiness evidence。

**Non-Goals:**

- Do not implement full encrypted credential storage yet.
- 暂不实现完整 encrypted credential storage。
- Do not implement full settings sync or enterprise managed settings.
- 暂不实现完整 settings sync 或 enterprise managed settings。
- Do not call the live DeepSeek API from default readiness checks.
- 默认 readiness checks 不调用 live DeepSeek API。

## Decisions

### Decision: Readiness commands return structured command results

Each readiness command returns a structured result with status, checks, warnings, redacted metadata, and suggested next actions. CLI text rendering is a host concern; future VSCode/server hosts can render the same result shape.

每个 readiness command 返回 structured result，包含 status、checks、warnings、redacted metadata 和 suggested next actions。CLI text rendering 属于 host concern；未来 VSCode/server hosts 可以渲染同一 result shape。

### Decision: Credentials are references first

`auth` verifies the presence and shape of `DEEPSEEK_API_KEY` or `DEEPSEEK_TOKEN`, reports a redacted reference, and prepares the path for future secure storage. It does not print the token or commit any local secret file.

`auth` 验证 `DEEPSEEK_API_KEY` 或 `DEEPSEEK_TOKEN` 的存在与形态，报告 redacted reference，并为未来 secure storage 铺路。它不打印 token，也不提交任何本地 secret file。

### Decision: Doctor is deterministic by default

`doctor` checks Node version, package metadata, platform info, workspace accessibility, command availability, config validity, credential presence, and ignored secret/reference directories. It does not perform network checks unless a future explicit live flag is added.

`doctor` 检查 Node version、package metadata、platform info、workspace accessibility、command availability、config validity、credential presence 和 ignored secret/reference directories。除非未来增加显式 live flag，否则不执行 network checks。

## Risks / Trade-offs

- [Risk] Local readiness grows into a parallel runtime. -> Mitigation: commands stay in command-system/CLI host boundaries and do not own model/tool execution.
- [风险] local readiness 发展成并行 runtime。-> 缓解：commands 保持在 command-system/CLI host boundaries 内，不拥有 model/tool execution。
- [Risk] Credential command creates false sense of secure storage. -> Mitigation: label v1 as reference/presence setup and defer secure persistence to credential storage OpenSpec.
- [风险] credential command 造成已具备 secure storage 的错觉。-> 缓解：v1 标记为 reference/presence setup，把 secure persistence 延后到 credential storage OpenSpec。
- [Risk] Doctor checks become platform-specific. -> Mitigation: use platform abstraction or deterministic adapters for OS/command checks.
- [风险] doctor checks 变得平台特定。-> 缓解：OS/command checks 使用 platform abstraction 或 deterministic adapters。

## Migration Plan

1. Define readiness command result contracts.
2. Add CLI parsing and rendering for readiness commands.
3. Add deterministic fakes and tests for each command.
4. Add R1 acceptance smoke for all readiness commands.

迁移计划：

1. 定义 readiness command result contracts。
2. 增加 readiness commands 的 CLI parsing 与 rendering。
3. 为每个 command 增加 deterministic fakes 和 tests。
4. 增加覆盖所有 readiness commands 的 R1 acceptance smoke。
