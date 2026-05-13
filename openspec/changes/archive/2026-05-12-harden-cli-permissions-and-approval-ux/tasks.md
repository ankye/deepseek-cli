## 1. Contracts And Evidence / 契约与证据

- [x] 1.1 Add implementation-free approval DTOs, broker result shapes, render summaries, risk summaries, and audit references in `@deepseek/platform-contracts`. / 在 `@deepseek/platform-contracts` 增加无实现的 approval DTOs、broker result shapes、render summaries、risk summaries 和 audit references。
- [x] 1.2 Add contract/type tests proving approval DTOs are readonly, serializable, exported, host-agnostic, and versioned. / 增加 contract/type tests，证明 approval DTOs 是 readonly、serializable、exported、host-agnostic 和 versioned。
- [x] 1.3 Extend testing-regression helpers or fixtures to assert approval evidence parity and required reference pit fixture ids. / 扩展 testing-regression helpers 或 fixtures，用于断言 approval evidence parity 和必需 reference pit fixture ids。

## 2. Policy, Broker, And Runtime Lifecycle / 策略、Broker 与 Runtime 生命周期

- [x] 2.1 Extend policy-sandbox decisions to produce redacted renderable approval evidence for ask, deny, rewrite, require-sandbox, timeout, and cancel outcomes. / 扩展 policy-sandbox decisions，为 ask、deny、rewrite、require-sandbox、timeout 和 cancel outcomes 产出脱敏可渲染 approval evidence。
- [x] 2.2 Implement or wire a headless/scripted approval broker that denies by default without an injected decision and cites `pit.headless-trust.fail-closed`. / 实现或接入 headless/scripted approval broker，使其在没有注入 decision 时默认 deny，并引用 `pit.headless-trust.fail-closed`。
- [x] 2.3 Ensure bypass hard-safety and shell fallback decisions emit approval/denial evidence citing `pit.permission-bypass.hard-safety` and `pit.shell-parser.fallback-risk`. / 确保 bypass hard-safety 与 shell fallback decisions 发出引用 `pit.permission-bypass.hard-safety` 和 `pit.shell-parser.fallback-risk` 的 approval/denial evidence。
- [x] 2.4 Route approval-required runtime work through broker/runtime events before scheduler submission, with no workspace mutation on default denial. / 在 scheduler submission 前将 approval-required runtime work 通过 broker/runtime events 路由，并确保默认 denial 不修改 workspace。

## 3. Protocol And Message Bus / 协议与消息总线

- [x] 3.1 Add approval lifecycle protocol records for required, decided, denied, timeout, cancelled, and audit-linked events. / 增加 required、decided、denied、timeout、cancelled 和 audit-linked approval lifecycle protocol records。
- [x] 3.2 Route approval decisions as correlated control messages without resubmitting the original request. / 将 approval decisions 作为关联 control messages 路由，且不重新提交原始 request。
- [x] 3.3 Add protocol compatibility/versioning tests for additive approval lifecycle fields. / 增加 approval lifecycle 字段增量演进的 protocol compatibility/versioning tests。

## 4. CLI Rendering, Input, And Actions / CLI 渲染、输入与动作

- [x] 4.1 Add text, JSON, and JSONL approval renderers that consume shared approval evidence and exclude terminal controls in structured modes. / 增加 text、JSON 和 JSONL approval renderers，消费共享 approval evidence，并在 structured modes 中排除 terminal controls。
- [x] 4.2 Add terminal-profile-aware approval fallback for CI, pipes, no-color, narrow/unknown width, and unsupported raw input. / 增加 terminal-profile-aware approval fallback，覆盖 CI、pipes、no-color、narrow/unknown width 和 unsupported raw input。
- [x] 4.3 Add minimal CLI approval actions or broker adapters for inspect, accept, deny, and cancel as typed targets, without direct runtime primitive execution. / 增加最小 CLI approval actions 或 broker adapters，支持 inspect、accept、deny 和 cancel typed targets，且不直接执行 runtime primitives。
- [x] 4.4 Ensure chat approval rendering and cancellation use the same lifecycle semantics as run mode and keep unknown slash commands local. / 确保 chat approval rendering 与 cancellation 使用与 run mode 相同的生命周期语义，并保持 unknown slash commands 本地处理。

## 5. Redaction, Fixtures, And Tests / 脱敏、Fixtures 与测试

- [x] 5.1 Add approval diagnostics redaction tests for env, auth headers, credential material, file paths/content, plugin tokens, extension diffs, and trace payloads. / 增加 approval diagnostics redaction tests，覆盖 env、auth headers、credential material、file paths/content、plugin tokens、extension diffs 和 trace payloads。
- [x] 5.2 Add policy/runtime tests for headless fail-closed, injected broker decisions, bypass hard-safety evidence, shell fallback evidence, and no workspace mutation on denial. / 增加 policy/runtime tests，覆盖 headless fail-closed、injected broker decisions、bypass hard-safety evidence、shell fallback evidence 和 denial 不修改 workspace。
- [x] 5.3 Add CLI run/chat parity tests for approval-required, denied, cancelled, timeout, text, JSON, and JSONL outputs. / 增加 CLI run/chat parity tests，覆盖 approval-required、denied、cancelled、timeout、text、JSON 和 JSONL outputs。
- [x] 5.4 Add terminal matrix tests for approval rendering/fallback across deterministic platform profiles. / 增加 terminal matrix tests，覆盖跨确定性 platform profiles 的 approval rendering/fallback。
- [x] 5.5 Add golden or replay fixtures proving approval lifecycle records remain replayable and immutable for future request/turn revert. / 增加 golden 或 replay fixtures，证明 approval lifecycle records 可 replay 且作为未来 request/turn revert 的 immutable evidence。

## 6. Documentation And Governance / 文档与治理

- [x] 6.1 Update CLI reference extraction implementation plan with approval UX implementation evidence and fixture id expectations. / 更新 CLI 参考抽离实施方案，补充 approval UX implementation evidence 与 fixture id expectations。
- [x] 6.2 Update product roadmap status/next-step notes so CLI completion proceeds through permission approval UX before diagnostics/release and extension management. / 更新产品路线图 status/next-step notes，使 CLI completion 在 diagnostics/release 和 extension management 前先推进 permission approval UX。
- [x] 6.3 Ensure all new planning and behavior text remains bilingual. / 确保所有新增规划和行为文本保持双语。

## 7. Verification / 校验

- [x] 7.1 Run `openspec validate harden-cli-permissions-and-approval-ux --type change --strict`. / 运行 `openspec validate harden-cli-permissions-and-approval-ux --type change --strict`。
- [x] 7.2 Run `openspec validate --specs --strict`. / 运行 `openspec validate --specs --strict`。
- [x] 7.3 Run `npm run typecheck`, `npm run lint`, and targeted owner tests for contracts, policy, runtime, protocol, CLI, terminal, regression, and observability approval coverage. / 运行 `npm run typecheck`、`npm run lint`，以及 contracts、policy、runtime、protocol、CLI、terminal、regression 和 observability approval coverage 的定向 owner tests。
- [x] 7.4 Run `npm test` and `node scripts/check-boundaries.mjs`. / 运行 `npm test` 和 `node scripts/check-boundaries.mjs`。
- [x] 7.5 Review `git status --short --ignored` and confirm `参考/`, `.codex/`, `node_modules/`, caches, generated bundles, and secrets are not added. / 检查 `git status --short --ignored`，确认未加入 `参考/`、`.codex/`、`node_modules/`、caches、generated bundles 和 secrets。
