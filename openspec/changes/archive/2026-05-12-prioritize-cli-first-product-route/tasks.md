## 1. Roadmap Documentation / 路线图文档

- [x] 1.1 Update `docs/product/product-roadmap.md` to state the CLI-first operating principle and cross-host promotion gates. / 更新 `docs/product/product-roadmap.md`，声明 CLI-first 工作原则与跨端推广门禁。
- [x] 1.2 Reorder the roadmap nodes so CLI product hardening follows the foundation before broader IDE/server/SDK expansion. / 重排路线图节点，使 CLI 产品打磨位于 foundation 之后、广泛 IDE/server/SDK 扩展之前。
- [x] 1.3 Update the immediate recommended sequence to prioritize CLI permissions/approval UX, CLI diagnostics/release readiness, and CLI extension/auth management before R4 host expansion. / 更新近期推荐顺序，优先 CLI permissions/approval UX、CLI diagnostics/release readiness 和 CLI extension/auth management，再推进 R4 host expansion。
- [x] 1.4 Mark VSCode, server, SDK, browser/native, team sync, and enterprise surfaces as follow-on projection phases gated by CLI acceptance evidence. / 将 VSCode、server、SDK、browser/native、team sync 和 enterprise surfaces 标记为受 CLI 验收证据门禁控制的后续投影阶段。
- [x] 1.5 Add `docs/product/cli-reference-extraction-implementation-plan.md` as the Claude CLI capability ledger and DeepSeek directory-planning guide. / 增加 `docs/product/cli-reference-extraction-implementation-plan.md`，作为 Claude CLI 能力总账与 DeepSeek 目录规划指南。
- [x] 1.6 Update roadmap metadata so future OpenSpecs include directory plans and reference capability coverage. / 更新路线图元数据，使后续 OpenSpec 包含目录计划和参考能力覆盖说明。
- [x] 1.7 Add reference pit fixtures to roadmap metadata and immediate sequencing. / 在路线图元数据和近期顺序中增加参考坑位 fixtures。

## 2. OpenSpec Alignment / OpenSpec 对齐

- [x] 2.1 Add `cli-first-product-route` requirements for CLI-first priority, promotion gates, and no execution bypass. / 增加 `cli-first-product-route` requirements，覆盖 CLI-first 优先级、推广门禁和不得绕过执行边界。
- [x] 2.2 Add `product-roadmap` requirements for CLI-first sequencing and CLI evidence before cross-host parity. / 增加 `product-roadmap` requirements，覆盖 CLI-first 排序和跨端对齐前的 CLI 证据。
- [x] 2.3 Add `future-capability-landings` requirements that keep non-CLI host surfaces reserved until CLI gates pass while allowing contract-only seams. / 增加 `future-capability-landings` requirements，使非 CLI host surfaces 在 CLI 门禁前保持预留，同时允许 contract-only seams。
- [x] 2.4 Add `vscode-extension-adapter` requirements that make VSCode a projection of CLI-proven semantics. / 增加 `vscode-extension-adapter` requirements，使 VSCode 成为 CLI 已验证语义的投影。
- [x] 2.5 Add `remote-runtime-connectivity` requirements that sequence server/SDK work after CLI-proven protocol semantics. / 增加 `remote-runtime-connectivity` requirements，使 server/SDK 工作排在 CLI 已验证协议语义之后。
- [x] 2.6 Record that large CLI capabilities need directory plans and scale guardrails before implementation. / 记录大型 CLI 能力在实现前需要目录计划和规模护栏。
- [x] 2.7 Add requirements that known reference pitfalls become negative regression fixtures for security-sensitive CLI work. / 增加 requirement，使已知参考坑位成为安全敏感 CLI 工作的负向回归 fixtures。

## 3. Validation / 校验

- [x] 3.1 Run `openspec validate prioritize-cli-first-product-route --type change --strict`. / 运行 `openspec validate prioritize-cli-first-product-route --type change --strict`。
- [x] 3.2 Run `openspec validate --specs --strict`. / 运行 `openspec validate --specs --strict`。
- [x] 3.3 Review `git status --short` to confirm only roadmap/OpenSpec planning files were added or edited by this change. / 检查 `git status --short`，确认本变更只新增或编辑路线图/OpenSpec 规划文件。
