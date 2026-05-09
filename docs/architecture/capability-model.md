# Capability Model / 能力模型

DeepSeek CLI treats tools, commands, skills, hooks, MCP, plugins, workflows, and subagents as capability surfaces. The key distinction is whether a capability is only discoverable or also executable.

DeepSeek CLI 将工具、命令、skills、hooks、MCP、plugins、workflows 和 subagents 都视为能力面。关键区别是：某个 capability 只是可发现，还是也可执行。

## Capability Types / 能力类型

| Type / 类型 | Example / 示例 | Execution model / 执行模型 |
| --- | --- | --- |
| Core tool / 核心工具 | Read file, edit file, search, shell/test, git evidence. / 读文件、编辑、搜索、shell/test、git evidence。 | Executable capability through runtime envelope. / 通过 runtime envelope 执行。 |
| Command / 命令 | `init`, `doctor`, `config`, slash commands. / 初始化、诊断、配置、斜杠命令。 | Host action or workflow trigger; side effects still governed. / host action 或 workflow trigger；副作用仍受治理。 |
| Skill / Skill | Domain procedure, reusable workflow knowledge. / 领域流程、可复用工作流知识。 | Usually discoverable context; may contribute executable workflow templates later. / 通常是可发现上下文；未来可贡献可执行 workflow 模板。 |
| Hook / Hook | Pre-tool, post-tool, prompt, session, MCP hook. / 工具前后、prompt、session、MCP hook。 | Event-triggered capability with ordering, timeout, and failure policy. / 事件触发能力，带顺序、超时和失败策略。 |
| MCP / MCP | External tools/resources/prompts. / 外部工具、资源、prompt。 | Normalized by `mcp-gateway`, then governed as capability. / 由 `mcp-gateway` 归一化后作为 capability 治理。 |
| Plugin / 插件 | Bundle of skills, hooks, MCP servers, commands, settings. / skills、hooks、MCP servers、commands、settings 的组合包。 | Manifest + permission diff + lockfile + contribution points. / manifest、权限 diff、lockfile、贡献点。 |
| Subagent / 子 Agent | Reviewer, tester, explorer, worker. / review、test、explore、worker agent。 | Managed agent lifecycle with scoped tools, budgets, and work boundaries. / 受管理生命周期，具备范围、工具、预算、工作边界。 |
| Workflow / 工作流 | Multi-step task graph. / 多步骤任务图。 | Orchestrated graph of governed capabilities. / 由受治理 capabilities 构成的编排图。 |

## Manifest Requirements / Manifest 要求

Executable capabilities must declare:

可执行 capability 必须声明：

- Identity: id, name, version, source. / 身份：id、name、version、source。
- Trust: builtin, local, plugin, remote. / 信任：builtin、local、plugin、remote。
- Schemas: input and output JSON schemas. / schema：输入与输出 JSON schema。
- Visibility: model-visible, host-visible, executor-visible. / 可见性：model、host、executor。
- Side effects: none, read, write, network, process. / 副作用：none、read、write、network、process。
- Permissions: declared and requested. / 权限：声明与请求。
- Resource scope: paths, cwd, environment, network hosts, native capabilities. / 资源范围：路径、cwd、环境、网络 host、native capability。
- Sandbox requirements: profile, capabilities, timeout, enforcement. / 沙箱要求：profile、capabilities、timeout、enforcement。
- Redaction: secret exposure, output redaction, audit evidence. / 脱敏：secret exposure、output redaction、audit evidence。
- Replay: deterministic metadata and evidence references. / replay：确定性 metadata 与 evidence reference。

## Registration Vs Execution / 注册与执行

| Capability state / 能力状态 | Allowed behavior / 允许行为 | Not allowed / 禁止行为 |
| --- | --- | --- |
| Registered only / 仅注册 | Appears in catalog, docs, model schema projection, permission diff. / 出现在目录、文档、模型 schema 投影、权限 diff。 | Execute side effects. / 执行副作用。 |
| Discoverable / 可发现 | Can be selected by model or host as candidate capability. / 可被模型或 host 选择为候选能力。 | Bypass preflight or policy. / 绕过 preflight 或 policy。 |
| Executable / 可执行 | Runtime can build envelope and call executor after policy/scheduler. / runtime 可在 policy/scheduler 后调用 executor。 | Execute without envelope, trace, timeout, sandbox, audit. / 无 envelope、trace、timeout、sandbox、audit 执行。 |
| Installed extension / 已安装扩展 | Contributes manifests under lockfile and permission diff. / 在 lockfile 与权限 diff 下贡献 manifest。 | Change capabilities silently after approval. / 审批后静默改变能力。 |

## Capability Flow / 能力流

```mermaid
sequenceDiagram
  participant Provider
  participant Preflight
  participant Registry
  participant Runtime
  participant Policy
  participant Scheduler
  participant Executor

  Provider->>Preflight: tool call intent
  Preflight->>Registry: resolve model-visible capability
  Registry-->>Preflight: manifest
  Preflight-->>Runtime: normalized invocation
  Runtime->>Policy: execution envelope
  Policy-->>Runtime: decision
  Runtime->>Scheduler: task
  Scheduler->>Executor: execute
  Executor-->>Runtime: result + evidence
```

## Design Rule / 设计规则

Adding a new capability type should not create a new execution path. It should add a new manifest/contribution shape and then enter the same execution pipeline.

新增 capability 类型不应创建新的执行路径。它应该新增 manifest/contribution 形态，然后进入同一执行管线。
