## Why

CLI-first execution is now blocked by trust quality: daily users need permission prompts, headless approval behavior, denial summaries, shell/file risk context, and audit evidence that are consistent across text, JSON, JSONL, and future hosts. This must land before richer TUI, extension management, or host promotion so the CLI does not grow around ad hoc safety shortcuts.

CLI-first 推进现在卡在 trust quality：日常用户需要 permission prompts、headless approval behavior、denial summaries、shell/file risk context 和 audit evidence，并且这些能力必须在 text、JSON、JSONL 与未来 host 之间保持一致。它必须先于 richer TUI、extension management 或 host promotion 落地，避免 CLI 围绕临时安全捷径继续膨胀。

## What Changes

- Add a first-class CLI permission and approval UX contract over shared approval events, policy decisions, and audit evidence. / 在共享 approval events、policy decisions 和 audit evidence 之上增加一等 CLI permission and approval UX contract。
- Define approval request/result protocol records for text, JSON, JSONL, chat, run, tests, and future host projection. / 定义适用于 text、JSON、JSONL、chat、run、tests 和未来 host projection 的 approval request/result protocol records。
- Require headless and scripted modes to fail closed unless an explicit broker decision is injected, with deterministic denial output. / 要求 headless 与 scripted modes 在没有显式 broker decision 注入时 fail closed，并输出确定性 denial。
- Render file, shell, capability, extension, and degraded-platform approval summaries from evidence rather than private runtime state. / 从 evidence 渲染 file、shell、capability、extension 和 degraded-platform approval summaries，而不是读取 private runtime state。
- Add terminal-profile-aware approval rendering so unsupported terminals degrade to stable plain/structured output. / 增加 terminal-profile-aware approval rendering，使不支持的终端降级为稳定 plain/structured output。
- Back approval UX with golden, contract, matrix, and CLI tests that cite reference pit fixture ids. / 通过引用 reference pit fixture ids 的 golden、contract、matrix 和 CLI tests 支撑 approval UX。
- No breaking changes are intended; existing run/chat commands keep their current invocation shape. / 不计划 breaking changes；现有 run/chat commands 保持当前调用形态。

## Capabilities

### New Capabilities

- `cli-permission-approval-ux`: CLI-facing permission prompts, approval rendering, headless defaults, structured denial/approval results, and parity across output modes. / 面向 CLI 的 permission prompts、approval rendering、headless defaults、structured denial/approval results，以及跨输出模式一致性。

### Modified Capabilities

- `policy-sandbox`: Approval requests, bypass hard-safety behavior, shell fallback risk summaries, and audit decisions become CLI-consumable evidence. / approval requests、bypass hard-safety behavior、shell fallback risk summaries 和 audit decisions 转为 CLI 可消费 evidence。
- `communication-protocol`: Approval request, approval decision, denial, timeout, cancel, and audit reference events become transport-neutral protocol records. / approval request、approval decision、denial、timeout、cancel 和 audit reference events 成为 transport-neutral protocol records。
- `minimal-chat-cli`: Chat and run paths render approval/denial/cancel results from the same event semantics and keep unknown slash commands local. / chat 与 run 路径从同一 event semantics 渲染 approval/denial/cancel results，并保持 unknown slash commands 本地处理。
- `terminal-capability-rendering`: Approval UI obeys renderer/input profiles and degrades safely for CI, pipes, no-color, narrow width, and unsupported raw input. / approval UI 遵守 renderer/input profiles，并在 CI、pipes、no-color、窄宽度和不支持 raw input 时安全降级。
- `platform-contracts`: Approval DTOs, renderable approval summaries, audit references, and broker interfaces are explicit implementation-free contracts. / approval DTOs、可渲染 approval summaries、audit references 和 broker interfaces 成为显式、无实现的 contracts。
- `testing-regression`: Regression harnesses cover approval parity, headless fail-closed, shell/file risk summaries, reference pit fixture ids, and golden replay. / regression harnesses 覆盖 approval parity、headless fail-closed、shell/file risk summaries、reference pit fixture ids 和 golden replay。
- `observability-privacy`: Approval and denial evidence stays redacted in diagnostics, traces, and support material. / approval 与 denial evidence 在 diagnostics、traces 和 support material 中保持脱敏。

## Impact

- Affects `src/apps/cli` renderers, commands, input strategy wiring, and scripted/headless run/chat behavior. / 影响 `src/apps/cli` renderers、commands、input strategy wiring，以及 scripted/headless run/chat behavior。
- Affects `src/packages/platform-contracts`, `policy-sandbox`, `communication-protocol`, `runtime`, `runtime-message-bus`, `testing-regression`, and `observability`. / 影响 `src/packages/platform-contracts`、`policy-sandbox`、`communication-protocol`、`runtime`、`runtime-message-bus`、`testing-regression` 和 `observability`。
- Adds no dependency from shared packages to CLI; CLI remains a host adapter over contracts and runtime events. / 不向共享 package 增加对 CLI 的依赖；CLI 仍是 contracts 与 runtime events 之上的 host adapter。
- Requires targeted acceptance evidence before archive: OpenSpec validation, typecheck, lint, targeted owner tests, golden/CLI parity tests, `npm test`, and boundary checks. / 归档前需要定向验收证据：OpenSpec validation、typecheck、lint、targeted owner tests、golden/CLI parity tests、`npm test` 和 boundary checks。
