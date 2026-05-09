# Roadmap To Architecture / 路线图到架构映射

This document maps roadmap nodes to owner packages and validation gates.

本文将路线图节点映射到责任包与验证门禁。

| Roadmap node / 路线图节点 | Main packages / 主要包 | Validation focus / 验证重点 |
| --- | --- | --- |
| R0 Foundation / 基础 | `platform-contracts`, `runtime`, `model-gateway`, `policy-sandbox`, `testing-regression` | contracts, provider boundary, envelope, policy, lint, deterministic tests. / 契约、provider 边界、envelope、policy、lint、确定性测试。 |
| R1 MVP Coding Agent / MVP Agent | `core-coding-tools`, `command-system`, `workspace-state-management`, `session-store` | local tools, CLI flows, readiness, session resume/fork. / 本地工具、CLI flow、readiness、session resume/fork。 |
| R2 Context And Safety / 上下文安全 | `context-engine`, `memory-cache-management`, `usage-budget-management`, `workspace-state-management`, `code-intelligence`, `observability` | projection, redaction, compaction, budget, sandbox matrix, checkpoint/undo, code intelligence evidence, diagnostic bundles, privacy decisions. / projection、redaction、compaction、budget、sandbox matrix、checkpoint/undo、code intelligence evidence、diagnostic bundles、privacy decisions。 |
| R3 Extensibility / 扩展 | `skill-system`, `hook-system`, `mcp-gateway`, `plugin-system`, `extension-system` | canonical skills/hooks/MCP gateway v1, manifests, permission diff, lockfile, gateway policy, hook ordering, MCP replay evidence. / canonical skills/hooks/MCP gateway v1、manifest、权限 diff、lockfile、gateway policy、hook ordering、MCP replay evidence。 |
| R4 IDE And Server / IDE 与 Server | `communication-protocol`, `remote-runtime-connectivity`, `runtime-message-bus`, `session-store` | protocol versioning, VSCode projection, server transport, SDK schema. / protocol versioning、VSCode projection、server transport、SDK schema。 |
| R5 Multi-Agent / 多 Agent | `agent-management`, `workflow-orchestration`, `concurrency-orchestration`, `workspace-state-management` | scoped agents, worktree/overlay, conflict handling, evidence merge. / scoped agents、worktree/overlay、冲突处理、证据合并。 |
| R6 Product UX / 产品体验 | `apps/cli`, `apps/vscode-extension`, host input adapters, command-system | rich TUI, keybindings, tips, statusline, browser/native host. / rich TUI、快捷键、tips、statusline、browser/native host。 |
| R7 Enterprise / 企业生态 | `policy-sandbox`, `credential-auth-management`, `distribution-update-management`, `plugin-system`, `evolution-engine` | managed policy, audit export, signed plugins, release channels. / managed policy、audit export、signed plugins、release channels。 |

## Roadmap Metadata / 路线图元数据

Future OpenSpec proposals should include:

未来 OpenSpec proposal 应包含：

```text
Roadmap node / 路线图节点:
Launch gate / 发布门禁:
Owner packages / 责任包:
Dependencies / 依赖:
Required tests / 必需测试:
Acceptance evidence / 验收证据:
Risk class / 风险等级:
Data/privacy class / 数据与隐私等级:
Host surfaces / Host 表面:
Protocol impact / 协议影响:
Feature flag / 功能开关:
Migration/rollback / 迁移与回滚:
```
