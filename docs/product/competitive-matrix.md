# Competitive Matrix / 竞品矩阵

This matrix compares public product surfaces from Claude Code and Codex with DeepSeek CLI's intended architecture. It does not assume private implementation details.

本矩阵对比 Claude Code 和 Codex 的公开产品能力面与 DeepSeek CLI 的目标架构，不假设竞品私有实现。

## Public References / 公开参考

- Claude Code docs: <https://code.claude.com/docs>
- Claude Code subagents: <https://code.claude.com/docs/en/sub-agents>
- Claude Code hooks: <https://code.claude.com/docs/en/hooks>
- Claude Code MCP: <https://code.claude.com/docs/en/mcp>
- Claude Code plugins: <https://code.claude.com/docs/en/plugins>
- Codex CLI features: <https://developers.openai.com/codex/cli/features>
- Codex cloud: <https://developers.openai.com/codex/cloud>

## Capability Comparison / 能力对比

| Capability / 能力 | Claude Code public surface / Claude Code 公开能力 | Codex public surface / Codex 公开能力 | DeepSeek CLI target / DeepSeek CLI 目标 | Improvement point / 改进点 |
| --- | --- | --- | --- | --- |
| CLI coding loop / CLI 编码循环 | Terminal agent with tools, permissions, memory, hooks, MCP, skills, plugins, subagents. / 终端 agent，含工具、权限、记忆、hooks、MCP、skills、plugins、subagents。 | CLI TUI with repo reading, edits, command execution, plans/diffs, approvals. / CLI TUI 支持仓库读取、编辑、命令、计划、diff、审批。 | CLI host over shared runtime protocol. / CLI 是共享 runtime protocol 上的 host。 | Avoid host state-machine fork. / 避免 host 状态机分叉。 |
| IDE and host surfaces / IDE 与 Host | IDE integrations and terminal workflows. / IDE 集成与终端工作流。 | CLI, IDE extension, web/cloud surfaces. / CLI、IDE extension、web/cloud。 | CLI, VSCode, server, SDK, native/browser all consume same events. / 多 host 消费同一 events。 | One runtime for all hosts. / 一个 runtime 服务所有 host。 |
| Subagents / 子 Agent | Built-in and custom subagents with tools, models, memory, background, hooks, MCP, skills. / 内置与自定义 subagents，含工具、模型、记忆、后台、hooks、MCP、skills。 | Subagents and Agents SDK orchestration are public surfaces. / subagents 和 Agents SDK orchestration 是公开能力面。 | `agent-management` owns agent definitions, scopes, budgets, lifecycle, lineage. / agent-management 负责定义、范围、预算、生命周期、lineage。 | Agents become schedulable governed resources. / agent 成为可调度受治理资源。 |
| Workflow orchestration / 工作流编排 | Hooks, subagent chains, scheduled prompts, external events, agent teams. / hooks、subagent 链、计划 prompt、外部事件、agent teams。 | CLI exec, cloud tasks, integrations, Agents SDK orchestration. / CLI exec、cloud tasks、集成、Agents SDK orchestration。 | `workflow-orchestration` owns task graph, dependencies, phases, terminal criteria. / workflow 包负责任务图、依赖、阶段、结束条件。 | Workflow graph is inspectable and replayable. / workflow graph 可检查、可 replay。 |
| Scheduling / 调度 | Background subagents and permission handling are public concepts. / 后台 subagents 与权限处理是公开概念。 | Cloud background tasks and CLI queued input are public concepts. / 云后台任务和 CLI 队列输入是公开概念。 | `concurrency-orchestration` owns locks, queues, timeouts, cancellation, backpressure. / 并发调度包负责锁、队列、超时、取消、背压。 | Scheduling decisions are typed and testable. / 调度决策 typed 且可测试。 |
| Tools / 工具 | File, shell, web, MCP, and agent-related tools. / 文件、shell、web、MCP、agent 相关工具。 | File edit, shell, web/search, screenshot/image, and automation surfaces. / 文件编辑、shell、web/search、截图/图像、自动化。 | Core tools enter execution envelope with policy and sandbox metadata. / 核心工具带 policy 与 sandbox metadata 进入 envelope。 | No direct tool execution bypass. / 不允许直接工具执行绕过。 |
| Hooks / Hooks | Rich lifecycle hooks across commands, tools, prompts, agents, MCP. / 覆盖命令、工具、prompt、agent、MCP 的生命周期 hooks。 | Hooks are a documented CLI extension surface. / hooks 是 CLI 扩展面。 | Hooks become event-triggered capabilities. / hook 成为事件触发 capability。 | Hooks inherit timeout, policy, sandbox, and audit. / hook 继承超时、policy、sandbox、audit。 |
| Plugins / 插件 | Plugins can bundle skills, agents, hooks, MCP servers, LSP servers, monitors, settings. / plugin 可打包 skills、agents、hooks、MCP、LSP、monitor、settings。 | Plugins are documented as an extension surface. / plugins 是扩展面。 | Plugin manifests, permission diff, lockfile, signing path. / plugin manifest、权限 diff、lockfile、签名路径。 | Install and upgrade are governed. / 安装和升级受治理。 |
| MCP / MCP | Connect MCP servers and expose Claude Code as MCP server. / 可连接 MCP，也可作为 MCP server。 | Configure MCP and expose Codex as MCP server. / 可配置 MCP，也可作为 MCP server。 | `mcp-gateway` normalizes tools/resources/prompts under policy. / MCP gateway 在 policy 下归一化工具、资源、prompt。 | MCP cannot bypass execution envelope. / MCP 不能绕过 execution envelope。 |
| Skills / Skills | Skills extend capabilities and can be loaded by subagents. / skills 扩展能力，可被 subagent 加载。 | Skills are documented for reusable workflows. / skills 用于可复用工作流。 | Skills are context/capability packages with budgeted projection. / skill 是带预算投影的上下文/能力包。 | Skill content is governed by context policy. / skill 内容受 context policy 治理。 |
| Memory/context / 记忆上下文 | Memory and subagent context are public concepts. / memory 与 subagent context 是公开概念。 | Memories, compaction, prompt caching, and state are public concepts. / memories、compaction、prompt caching、state。 | ContextGraph, memory/cache, redaction, compaction, replay metadata. / ContextGraph、memory/cache、redaction、compaction、replay metadata。 | Memory enters as scoped evidence, not hidden state. / memory 以 scoped evidence 进入。 |
| Security / 安全 | Permissions, tool restrictions, managed settings, hooks. / 权限、工具限制、managed settings、hooks。 | Approval modes, sandbox, agent security guidance. / approval modes、sandbox、agent security。 | Policy/sandbox fail-closed before scheduler. / policy/sandbox 在 scheduler 前 fail-closed。 | Unsafe work never reaches execution. / 不安全任务不进入执行。 |
| Cross-platform / 跨平台 | macOS/Linux/WSL and Windows guidance. / macOS/Linux/WSL 与 Windows 指南。 | Windows and sandbox settings documented. / Windows 与 sandbox settings。 | Platform capability matrix for shell/search/process/fs/network/native. / 平台能力矩阵覆盖 shell/search/process/fs/network/native。 | Upper layers do not assume shell tools. / 上层不假设 shell 工具。 |
| Testing/regression / 测试回归 | Hooks and commands can enforce local workflows. / hooks 与 commands 可强制本地流程。 | Agents SDK has evaluation concepts and Codex workflows. / Agents SDK 有 eval 概念与 Codex workflows。 | Deterministic fakes, golden replay, matrix, compatibility, e2e, optional live tests. / 确定性 fake、golden、matrix、compat、e2e、optional live。 | Regression is platform infrastructure. / 回归是平台基础设施。 |

## Design Takeaways / 设计结论

1. Orchestration and scheduling must be platform primitives. / 编排和调度必须是一等平台原语。
2. Extensibility must enter through a common capability model. / 扩展必须进入统一 capability model。
3. Host UX must consume protocol events rather than owning execution. / host UX 必须消费协议事件，而不是拥有执行。
4. Safety must be typed and enforced before scheduling. / 安全必须 typed，并在调度前强制。
5. Tests must cover product behavior, not just utility functions. / 测试必须覆盖产品行为，不只是工具函数。
