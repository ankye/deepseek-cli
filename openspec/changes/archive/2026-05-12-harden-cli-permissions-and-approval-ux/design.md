## Context

DeepSeek already has a CLI-first route, split host adapter directories, terminal capability profiles, vi-inspired composition contracts, checkpoint/undo foundations, and a reference pit fixture catalog. The next CLI completion blocker is the trust path: approvals and denials exist conceptually, but the user-facing CLI experience is not yet a full product contract across interactive, scripted, headless, text, JSON, and JSONL modes.

DeepSeek 已经具备 CLI-first 路线、拆分后的 host adapter 目录、terminal capability profiles、vi-inspired composition contracts、checkpoint/undo 基础，以及 reference pit fixture catalog。下一个 CLI 完成度阻塞点是 trust path：approvals 与 denials 已有概念基础，但面向用户的 CLI 体验尚未形成覆盖 interactive、scripted、headless、text、JSON 和 JSONL modes 的完整产品契约。

This pack must use the archived reference pit fixtures, especially `pit.permission-bypass.hard-safety`, `pit.headless-trust.fail-closed`, `pit.shell-parser.fallback-risk`, `pit.path-canonicalization.unsafe-syntax`, `pit.extension-permission-expansion.permission-diff`, and `pit.diagnostic-redaction.support-bundle`.

本包必须使用已归档的 reference pit fixtures，尤其是 `pit.permission-bypass.hard-safety`、`pit.headless-trust.fail-closed`、`pit.shell-parser.fallback-risk`、`pit.path-canonicalization.unsafe-syntax`、`pit.extension-permission-expansion.permission-diff` 和 `pit.diagnostic-redaction.support-bundle`。

## Goals / Non-Goals

**Goals:**

- Make approval requests and decisions explicit, versioned, redacted, and renderable in CLI text/JSON/JSONL. / 让 approval requests 与 decisions 显式、版本化、脱敏，并可在 CLI text/JSON/JSONL 中渲染。
- Give headless/scripted execution fail-closed behavior with deterministic denial records. / 为 headless/scripted execution 提供 fail-closed 行为和确定性 denial records。
- Render file/shell/capability/extension/platform risk summaries from evidence contracts rather than private runtime internals. / 从 evidence contracts 渲染 file/shell/capability/extension/platform risk summaries，而不是读取 private runtime internals。
- Preserve CLI as a host adapter and keep shared approval DTOs in `platform-contracts`. / 保持 CLI 为 host adapter，并把共享 approval DTOs 放在 `platform-contracts`。
- Provide deterministic owner tests, CLI tests, matrix tests, golden/parity tests, and reference pit fixture id coverage. / 提供确定性的 owner tests、CLI tests、matrix tests、golden/parity tests 和 reference pit fixture id coverage。

**Non-Goals:**

- Do not build full-screen TUI dialogs, alternate-screen flows, or rich Vim emulation in this pack. / 本包不构建 full-screen TUI dialogs、alternate-screen flows 或完整 Vim 模拟。
- Do not implement enterprise managed policy or signed marketplace flows. / 本包不实现 enterprise managed policy 或 signed marketplace flows。
- Do not add a new model/tool execution path inside CLI. / 不在 CLI 中新增 model/tool execution path。
- Do not claim complete request/turn revert UX; this pack only preserves approval evidence needed by future revert actions. / 不宣称完整 request/turn revert UX；本包只保留未来 revert actions 所需的 approval evidence。

## Decisions

### Decision: Approval DTOs live in platform-contracts

`platform-contracts` will own implementation-free approval request, approval decision, approval summary, denial summary, and audit reference DTOs. `policy-sandbox`, runtime, protocol, CLI renderers, and tests will consume those DTOs through package exports.

`platform-contracts` 负责无实现的 approval request、approval decision、approval summary、denial summary 和 audit reference DTOs。`policy-sandbox`、runtime、protocol、CLI renderers 和 tests 通过 package exports 消费这些 DTOs。

Alternative considered: define approval shapes inside CLI. Rejected because VSCode/server projection and JSON/JSONL parity would then require stdout parsing or host-specific translation.

备选方案：在 CLI 内定义 approval shapes。该方案被拒绝，因为 VSCode/server projection 与 JSON/JSONL parity 会被迫依赖 stdout parsing 或 host-specific translation。

### Decision: Runtime emits approval lifecycle evidence, CLI only renders

Policy and runtime will produce approval-required, approval-decided, approval-denied, approval-timeout, approval-cancelled, and audit-linked records. CLI renderers convert those records into terminal or structured output without executing approval policy themselves.

Policy 与 runtime 产出 approval-required、approval-decided、approval-denied、approval-timeout、approval-cancelled 和 audit-linked records。CLI renderers 只把这些 records 转成 terminal 或 structured output，不自行执行 approval policy。

Alternative considered: let CLI ask and then call tools directly after user confirmation. Rejected because it bypasses scheduler, sandbox, audit, replay, and future host promotion.

备选方案：让 CLI 直接询问用户，然后在确认后调用工具。该方案被拒绝，因为它会绕过 scheduler、sandbox、audit、replay 和未来 host promotion。

### Decision: Headless fail-closed is a product behavior

Headless/scripted modes must deny approval-required work unless an explicit test or host approval broker injects a decision. The denial must be visible in text mode and structured modes, must not mutate workspace state, and must cite the `pit.headless-trust.fail-closed` fixture.

Headless/scripted modes 在没有显式 test 或 host approval broker 注入 decision 时，必须 deny approval-required work。denial 必须在 text mode 与 structured modes 可见，不得修改 workspace state，并引用 `pit.headless-trust.fail-closed` fixture。

Alternative considered: allow headless mode to warn and continue for compatibility. Rejected because reference pitfalls show this creates silent trust downgrades.

备选方案：为了兼容性允许 headless mode 警告后继续。该方案被拒绝，因为参考坑位表明这会造成静默 trust downgrade。

### Decision: Approval rendering follows terminal profiles

Approval prompts and summaries use renderer/input profiles. JSON/JSONL never include ANSI, prompts, spinners, cursor controls, or alternate-screen state. Unsupported interactive terminals degrade to plain summaries plus explicit accept/deny instructions only when reliable line input exists; otherwise they fail closed or require an injected decision.

Approval prompts 与 summaries 使用 renderer/input profiles。JSON/JSONL 不得包含 ANSI、prompts、spinners、cursor controls 或 alternate-screen state。不支持的交互终端降级为 plain summaries，并且只有可靠 line input 存在时才显示显式 accept/deny 指令；否则 fail closed 或要求注入 decision。

Alternative considered: implement one rich prompt and strip ANSI later. Rejected because stripping does not fix input reliability, width, or structured parity.

备选方案：实现一个 rich prompt，再事后 strip ANSI。该方案被拒绝，因为 strip 不能解决 input reliability、width 或 structured parity。

### Decision: Vi-inspired model treats approvals as targets

Approval requests become typed targets that can later be selected, inspected, accepted, denied, or reverted through the vi-inspired action model. This pack only creates the target/evidence shape and minimal CLI actions; advanced keymaps and result-list navigation remain later work.

Approval requests 成为 typed targets，后续可通过 vi-inspired action model 被选择、查看、接受、拒绝或回退。本包只创建 target/evidence shape 和最小 CLI actions；高级 keymaps 与 result-list navigation 留到后续。

Alternative considered: treat approvals as transient prompt text. Rejected because transient text cannot support jump history, quickfix lists, replay, or request/turn revert evidence.

备选方案：把 approvals 当作临时 prompt text。该方案被拒绝，因为临时文本无法支持 jump history、quickfix lists、replay 或 request/turn revert evidence。

## Directory Plan / 目录计划

- `src/packages/platform-contracts/src/approval.ts`: approval DTOs, broker interface, audit references, render summaries. / approval DTOs、broker interface、audit references、render summaries。
- `src/packages/policy-sandbox/src/*`: produce deterministic approval decisions and risk summaries; split helpers if `index.ts` grows near guardrail thresholds. / 产出确定性 approval decisions 与 risk summaries；若 `index.ts` 接近护栏阈值则拆 helper。
- `src/packages/runtime/src/*`: route approval-required decisions through broker/runtime events before scheduler execution. / 在 scheduler execution 前通过 broker/runtime events 路由 approval-required decisions。
- `src/packages/communication-protocol/src/*`: encode/decode approval lifecycle protocol records. / encode/decode approval lifecycle protocol records。
- `src/apps/cli/src/renderers/*`: render approval summaries for text/json/jsonl without owning policy. / 为 text/json/jsonl 渲染 approval summaries，但不拥有 policy。
- `src/apps/cli/src/input/*`: line/scripted accept-deny input only when terminal profile supports it. / 仅在 terminal profile 支持时处理 line/scripted accept-deny input。
- `src/apps/cli/src/commands/*`: CLI-local approval actions or broker injection adapters only. / 仅放 CLI-local approval actions 或 broker injection adapters。
- Tests: package owner tests near packages, CLI tests under `src/apps/cli/test`, protocol/contract tests under `tests/contracts`, golden/matrix tests under `tests/golden` or `tests/matrix` as existing patterns allow. / 测试放在 owner package 附近，CLI tests 放 `src/apps/cli/test`，protocol/contract tests 放 `tests/contracts`，golden/matrix tests 按现有模式放 `tests/golden` 或 `tests/matrix`。

## Terminal Capability Impact / 终端能力影响

Text mode must support readable approval summaries in plain and ANSI profiles. JSON/JSONL modes must emit structured approval records only. CI, redirected IO, no-color, unknown width, and unreliable raw input must avoid interactive prompts and choose deterministic fail-closed or injected-broker behavior.

Text mode 必须在 plain 与 ANSI profiles 中支持可读的 approval summaries。JSON/JSONL modes 必须只输出结构化 approval records。CI、redirected IO、no-color、unknown width 和 unreliable raw input 必须避免交互 prompt，并选择确定性 fail-closed 或 injected-broker 行为。

## Vi-Inspired Composition Impact / Vi 启发式组合影响

Approvals become typed action targets with stable ids. Minimal actions are `inspect`, `accept`, `deny`, and `cancel`. Approval queues can later become quickfix-style result lists, and approval navigation must not re-run model/tool turns.

Approvals 成为带稳定 id 的 typed action targets。最小 actions 是 `inspect`、`accept`、`deny` 和 `cancel`。approval queues 后续可成为 quickfix-style result lists，approval navigation 不得重新运行 model/tool turns。

## Request/Turn Revert Impact / 请求/回合回退影响

Approval and denial events must remain immutable history evidence. A future request/turn revert may compensate file changes, but it must not delete the original approval request, decision, audit record, or denial reason.

Approval 与 denial events 必须保持为 immutable history evidence。未来 request/turn revert 可以补偿 file changes，但不得删除原始 approval request、decision、audit record 或 denial reason。

## Risks / Trade-offs

- [Risk] Approval UI can slow CLI MVP work. -> Mitigation: start with line/text/JSON/JSONL parity and defer full-screen TUI. / [风险] Approval UI 可能拖慢 CLI MVP。-> 缓解：先做 line/text/JSON/JSONL parity，full-screen TUI 延后。
- [Risk] Headless fail-closed may reject workflows users expect to run. -> Mitigation: provide explicit broker injection for tests/automation and clear denial evidence. / [风险] Headless fail-closed 可能拒绝用户预期可运行的工作流。-> 缓解：为 tests/automation 提供显式 broker injection，并输出清晰 denial evidence。
- [Risk] Approval records could leak secrets through summaries. -> Mitigation: summaries are redacted DTOs and covered by `pit.diagnostic-redaction.support-bundle`. / [风险] Approval records 可能通过 summaries 泄漏 secrets。-> 缓解：summaries 是脱敏 DTOs，并由 `pit.diagnostic-redaction.support-bundle` 覆盖。
- [Risk] Policy, runtime, and protocol changes could sprawl. -> Mitigation: use directory plan and file-size guardrails, with `index.ts` as export surfaces. / [风险] Policy、runtime 和 protocol changes 可能扩散。-> 缓解：使用目录计划和文件体量护栏，`index.ts` 保持为导出面。

## Migration Plan

1. Add approval DTOs and tests in `platform-contracts`. / 在 `platform-contracts` 增加 approval DTOs 与测试。
2. Extend policy/runtime approval lifecycle evidence and headless fail-closed behavior. / 扩展 policy/runtime approval lifecycle evidence 与 headless fail-closed 行为。
3. Add protocol records and CLI renderers for text/JSON/JSONL parity. / 增加 protocol records 和 CLI renderers，覆盖 text/JSON/JSONL parity。
4. Add terminal-profile fallback, scripted/headless tests, reference pit fixture id coverage, and diagnostics redaction tests. / 增加 terminal-profile fallback、scripted/headless tests、reference pit fixture id coverage 和 diagnostics redaction tests。
5. Run OpenSpec validation, typecheck, lint, targeted tests, full `npm test`, and boundary checks. / 运行 OpenSpec validation、typecheck、lint、targeted tests、完整 `npm test` 和 boundary checks。

Rollback: remove the approval UX records and CLI renderers, leaving existing policy defaults intact. Any workspace mutation behavior introduced by this pack must be guarded by tests so rollback does not require data migration.

回滚：移除 approval UX records 与 CLI renderers，保留现有 policy defaults。本包引入的任何 workspace mutation behavior 都必须有测试保护，因此回滚不需要数据迁移。
