## Why

DeepSeek has enough platform foundation to build across many hosts, but spreading product work across CLI, VSCode, server, SDK, and collaboration surfaces too early dilutes the first user experience. The roadmap should make CLI the primary product surface until it is polished, reliable, and daily-usable, then promote proven capabilities to other hosts through the shared protocol.

DeepSeek 已具备支撑多端的基础平台，但过早同时推进 CLI、VSCode、server、SDK 与协作面会稀释第一个用户体验。路线图应先把 CLI 作为主产品面，打磨到稳定、顺手、可日常使用，再通过共享协议把成熟能力推广到其他端。

## What Changes

- Reframe the roadmap from broad staged parity to a CLI-first product route. / 将路线图从宽泛的分阶段对齐调整为 CLI-first 产品路线。
- Add a CLI-first operating principle: one primary host surface ships first; other hosts remain thin adapters and should not lead product scope until CLI acceptance gates pass. / 增加 CLI-first 原则：先交付一个主 host surface；其他 host 保持薄适配器，CLI 验收通过前不主导产品范围。
- Split the current R1/R2/R3/R6 work into a focused CLI track: CLI reliability, interactive UX, permissions, sessions, extension management, local diagnostics, and release readiness. / 将当前 R1/R2/R3/R6 工作拆成聚焦 CLI 的路径：CLI 可靠性、交互体验、权限、会话、扩展管理、本地诊断和发布就绪。
- Defer VSCode, local server, public SDK, browser/native, team sync, and enterprise surfaces until CLI-proven runtime events, permissions, and workflows are stable. / 将 VSCode、local server、public SDK、browser/native、team sync 和 enterprise surfaces 延后到 CLI 已验证 runtime events、权限和工作流稳定之后。
- Update immediate OpenSpec sequencing so the next work prioritizes CLI polish and CLI-managed extension/auth flows before R4 IDE/server expansion. / 更新近期 OpenSpec 顺序，优先 CLI polish 和 CLI 管理的扩展/认证流程，再推进 R4 IDE/server。
- Keep the contract-first architecture unchanged: platform packages remain host-agnostic, and CLI must still consume shared protocol/runtime events rather than owning execution internals. / 保持契约先行架构不变：平台包仍 host-agnostic，CLI 仍必须消费共享 protocol/runtime events，不能拥有执行内部逻辑。
- Add a CLI reference extraction implementation plan so Claude CLI capability lessons are tracked as a DeepSeek-owned ledger, with directory planning guardrails before heavy feature expansion. / 增加 CLI 参考精华抽离实施方案，使 Claude CLI 能力经验作为 DeepSeek 自有总账被追踪，并在重型功能扩张前加入目录规划护栏。
- Turn reference pitfalls into required negative fixtures for security-sensitive areas such as bypass modes, headless trust, shell parsing, path canonicalization, MCP/plugin precedence, remote ids, env snapshotting, and diagnostics redaction. / 将参考实现踩过的坑转成安全敏感领域的必需负向 fixtures，包括 bypass modes、headless trust、shell parsing、path canonicalization、MCP/plugin precedence、remote ids、env snapshotting 和 diagnostics redaction。

## Capabilities

### New Capabilities

- `cli-first-product-route`: CLI-first roadmap governance, promotion gates, and sequencing rules for when capabilities may move from CLI to other host surfaces. / CLI-first 路线治理、推广门禁，以及能力何时从 CLI 推广到其他 host surfaces 的排序规则。

### Modified Capabilities

- `product-roadmap`: Change roadmap ordering and acceptance language so CLI becomes the first polished product surface and other hosts follow after CLI promotion gates. / 调整路线图排序与验收语言，使 CLI 成为第一个打磨成熟的产品面，其他端在 CLI 推广门禁后跟进。
- `future-capability-landings`: Clarify that deferred host surfaces stay as landing zones until CLI product gates prove the shared protocol, permissions, and workflows. / 明确 deferred host surfaces 在 CLI 产品门禁验证共享协议、权限和工作流前保持为 landing zones。
- `vscode-extension-adapter`: Re-sequence VSCode work as a follow-on projection of CLI-proven runtime events rather than a parallel product priority. / 将 VSCode 工作重排为 CLI 已验证 runtime events 的后续投影，而不是并行产品优先级。
- `remote-runtime-connectivity`: Re-sequence daemon/server/SDK as post-CLI promotion work. / 将 daemon/server/SDK 重排为 CLI 通过推广门禁后的工作。

## Impact

- Affects `docs/product/product-roadmap.md`, product planning rules, and future OpenSpec sequencing. / 影响 `docs/product/product-roadmap.md`、产品规划规则和未来 OpenSpec 排序。
- Adds OpenSpec requirements for CLI-first gates and cross-host promotion criteria. / 增加 CLI-first 门禁与跨端推广标准的 OpenSpec requirements。
- Does not change runtime APIs or package boundaries in this change. / 本变更不修改 runtime API 或 package boundaries。
- Reduces near-term priority for VSCode/server/SDK implementation while preserving their contracts and landing zones. / 降低 VSCode/server/SDK 的近期优先级，同时保留其契约与落点。
- Adds planning pressure for a follow-up architecture scale-guardrails pack before large permission, diagnostics, extension, or rich TUI implementations. / 增加后续 architecture scale-guardrails 包的规划压力，使其先于大型 permission、diagnostics、extension 或 rich TUI 实现。
- Adds planning pressure for a `backfill-reference-pit-fixtures` pack before polishing trust-critical CLI workflows. / 增加 `backfill-reference-pit-fixtures` 包的规划压力，使其先于信任关键 CLI workflow 打磨。
