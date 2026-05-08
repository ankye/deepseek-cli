# Claude Code CLI 架构分析与 DeepSeek CLI 规划

本文基于本地参考源码 `参考/claude-code-2.1.88/src` 和 Claude Code 官方文档整理。重点不是复刻 Claude，而是提炼它已经验证过的产品能力、实际架构边界、历史包袱，并给 DeepSeek CLI 设计一个没有历史负担的未来架构。

## 1. 本地参考源码概览

当前目录结构：

```text
d:\work\deepseek
  doc/                         # 当前规划文档目录
  src/                         # 当前项目源码目录，目前为空
  参考/claude-code-2.1.88/
    src/                       # Claude Code 参考源码
    vendor/
    node_modules/
```

Claude 参考源码里的主要模块：

```text
src/
  main.tsx                     # CLI 入口、启动流程、Commander 命令、会话初始化
  QueryEngine.ts               # Headless/SDK 查询生命周期封装
  query.ts                     # 核心 agent loop
  Tool.ts                      # 工具接口、ToolUseContext、权限上下文类型
  tools.ts                     # 内置工具注册和工具池组合
  commands.ts                  # slash command / skill / plugin command 聚合
  tools/                       # Bash、Read、Edit、Agent、Skill、MCP、LSP 等工具
  commands/                    # /help、/compact、/mcp、/plugin、/agents 等命令
  services/api/                # Claude API 调用、流式响应、重试、usage
  services/tools/              # 工具调度、并发执行、hook 包装、telemetry
  services/mcp/                # MCP 配置、连接、工具/命令/资源转换
  services/compact/            # compact、microcompact、auto compact
  services/lsp/                # LSP server/client 管理
  utils/permissions/           # 权限规则、模式、路径校验、auto mode/classifier
  utils/plugins/               # 插件安装、缓存、marketplace、manifest、策略
  skills/                      # SKILL.md 加载、动态 skill 发现、MCP skill
  hooks/                       # React hooks 与权限/UI 桥接
  components/                  # Ink TUI 组件、权限弹窗、消息渲染
  ink/                         # 自维护/封装的终端 UI 渲染层
  remote/ server/ bridge/      # 远程会话、server、bridge、remote control
  state/                       # AppState、store、selector
  memdir/                      # memory 相关逻辑
```

关键源码锚点：

- `main.tsx:968`：主命令 `claude` 的 Commander 入口。
- `main.tsx:3811+`：大量根级 CLI flags，包含 worktree、tmux、agent teams、remote、channels 等。
- `main.tsx:3894+`：`mcp` 子命令。
- `main.tsx:3962+`：`server` 子命令。
- `main.tsx:4148+`：`plugin` 子命令。
- `QueryEngine.ts:184`：`QueryEngine` 类，封装 headless/SDK conversation lifecycle。
- `query.ts:219`：核心 `query()` agent loop。
- `Tool.ts:123`：`ToolPermissionContext` 类型。
- `Tool.ts:362`：`Tool` 接口。
- `tools.ts:193`：内置工具全集 `getAllBaseTools()`。
- `tools.ts:345`：内置工具 + MCP 工具组合 `assembleToolPool()`。
- `commands.ts:258`：内置 slash commands 列表。
- `commands.ts:476`：命令聚合 `getCommands()`，合并 built-in、skills、plugins、workflows。
- `utils/processUserInput/processUserInput.ts:85`：用户输入处理，包含 prompt、bash mode、slash command、图片、hooks。
- `services/tools/toolOrchestration.ts:19`：工具调用批处理和并发/串行调度。
- `services/tools/toolExecution.ts:337`：单个 tool_use 执行。
- `services/tools/toolExecution.ts:599`：权限、hooks、tool.call、结果映射、telemetry 的主流程。
- `utils/permissions/permissions.ts:473`：工具权限判定入口 `hasPermissionsToUseTool`。
- `utils/permissions/permissionSetup.ts:872`：权限上下文初始化。
- `utils/permissions/permissionSetup.ts:1078`：auto mode 可用性校验。
- `services/mcp/client.ts:2226`：MCP tools/commands/resources 转换入口。
- `services/mcp/config.ts:1071`：MCP 配置加载。
- `skills/loadSkillsDir.ts`：`SKILL.md` 加载、动态 skill、路径条件 skill。

## 2. Claude Code 功能版图

Claude Code 已经不是单纯 CLI，而是一个本地 agent runtime + TUI + 扩展平台 + 远程控制系统。

### 2.1 CLI 与会话

主要能力：

- 交互式 REPL：直接运行 `claude`。
- 单次 headless 查询：`claude -p "..."`。
- 管道输入：例如 `git diff | claude -p "review"`。
- 恢复会话：`--continue`、`--resume`、`/resume`。
- 分叉会话：`--fork-session`、`/branch`、fork subagent。
- 非交互输出格式：text、json、stream-json。
- 工作区相关：cwd、additional directories、git root、worktree、tmux。
- server / remote / SSH / open URL / remote-control 等远程入口。

源码表现：

- 入口逻辑集中在 `main.tsx`，启动流程、认证、配置、插件、MCP、权限、远程、TUI、headless 都在这里汇聚。
- `QueryEngine` 把 headless/SDK 查询生命周期从交互式 REPL 中抽出来，但交互式路径仍大量依赖 React/Ink AppState。

### 2.2 Agent Loop

Claude 的核心 agent loop 可抽象为：

```text
用户输入
  -> processUserInput
  -> 拼 system prompt / user context / tools schema
  -> 调模型流式输出
  -> 收集 assistant tool_use
  -> 权限检查
  -> 执行工具
  -> 生成 tool_result user message
  -> 加 attachments/hooks/memory/skill discovery
  -> 下一轮模型调用
  -> 直到没有 tool_use 或达到终止条件
```

源码对应：

- `QueryEngine.submitMessage()`：单个用户 turn 的生命周期，负责会话消息、system prompt、skills/plugins、预算、SDK 输出事件。
- `query()` / `queryLoop()`：真正循环模型调用和工具执行。
- `services/api/claude.ts`：模型流式调用。
- `services/tools/toolOrchestration.ts`：按工具安全性分批，并发执行 read-only/concurrency-safe 工具，串行执行有副作用工具。
- `services/tools/toolExecution.ts`：单工具执行的完整链路。

值得借鉴：

- Agent loop 被设计成 async generator，天然支持流式事件。
- 工具调度区分 concurrency-safe 与非 concurrency-safe。
- `ToolUseContext` 能让工具返回 `contextModifier`，在下一轮携带上下文变化。

风险点：

- `query.ts` 中 compaction、tool budget、attachments、memory prefetch、skill discovery、queued commands、stop hooks、token budget、API error recovery 等逻辑都交织在同一个 loop 里。
- 后期功能越多，loop 会越来越像“中央交换机”，难以保持可验证性。

### 2.3 Tool 系统

内置工具包括：

- 文件：Read、Write、Edit、NotebookEdit。
- 搜索：Glob、Grep。
- Shell：Bash、PowerShell。
- Web：WebFetch、WebSearch。
- Agent：AgentTool、TaskCreate/Get/Update/List/Output/Stop、TeamCreate/Delete。
- 规划：EnterPlanMode、ExitPlanMode。
- 扩展：SkillTool、MCPTool、ListMcpResources、ReadMcpResource、ToolSearch。
- IDE/LSP：LSPTool。
- 远程/后台：RemoteTrigger、ScheduleCron、Sleep、Monitor 等按 feature gate 启用。

`Tool` 接口职责很重，覆盖：

- 模型侧 schema：`inputSchema` / `inputJSONSchema`。
- 业务执行：`call()`。
- 权限：`checkPermissions()`、`validateInput()`、`preparePermissionMatcher()`。
- 安全语义：`isReadOnly()`、`isDestructive()`、`isConcurrencySafe()`、`isOpenWorld()`。
- Prompt：`prompt()`、`description()`。
- UI 渲染：tool use、progress、result、error、rejected、grouped render。
- 结果映射：`mapToolResultToToolResultBlockParam()`。
- telemetry/classifier：`toAutoClassifierInput()`。

这说明 Claude 的 Tool 已经承载了 runtime、policy、prompt、UI、telemetry 多个维度。

DeepSeek 不建议照搬这个接口。应拆成：

```text
ToolManifest      # 名称、schema、权限需求、能力声明
ToolExecutor      # 纯执行
ToolPolicy        # 可选的细粒度策略钩子
ToolRenderer      # CLI/TUI/IDE 专属显示
ToolPromptSpec    # 模型可见描述，支持 lazy/deferred
ToolTelemetrySpec # 只描述可观测字段，不进核心执行接口
```

### 2.4 Command / Skill 系统

Claude 的命令分三类：

- `prompt`：展开成 prompt，可被用户或模型调用。Skills 本质上也是 prompt command。
- `local`：执行本地命令，返回文本或 compact 结果。
- `local-jsx`：执行本地 UI 流程，渲染 Ink 组件。

来源包括：

- built-in commands。
- `.claude/skills/*/SKILL.md`。
- legacy `.claude/commands`。
- bundled skills。
- plugin commands/skills。
- MCP prompts。
- workflow commands。
- dynamic skills。

优点：

- 统一了 slash command 和 skill 的一部分加载路径。
- Skill 可被模型调用，也可被用户 `/skill-name` 调用。
- 支持路径条件 skill 和动态发现。

问题：

- Command、Skill、Workflow、MCP prompt、Plugin command 的概念有重叠。
- `commands.ts` 已经成为聚合器，包含 feature gates、auth availability、provider availability、动态缓存、远程安全过滤、bridge 安全过滤。
- `local-jsx` 把命令系统和 TUI 强耦合，未来复用到 IDE/server 会困难。

### 2.5 Context / Memory / Compact

Claude 的上下文来源：

- system prompt。
- user context / system context。
- `CLAUDE.md`、nested memory。
- skills frontmatter 和 skill 内容。
- MCP tool schema / MCP resources。
- hooks additional context。
- file change attachments。
- queued command attachments。
- image metadata。
- LSP/IDE selection。
- session transcript。
- compaction summary。

源码表现：

- `QueryEngine` 负责 `fetchSystemPromptParts()`、system prompt 组合、memory mechanics prompt。
- `query.ts` 在每轮模型调用前执行 snip、microcompact、context collapse、auto compact。
- 工具结果超预算会用 `toolResultStorage` 持久化到文件并给模型 preview。

已验证的方向：

- 上下文不能只是字符串拼接，必须有预算、压缩、替换、重取、折叠。
- 大型工具结果需要“存储 + preview + 路径引用”，否则很快爆上下文。

问题：

- 上下文生命周期分散在 `QueryEngine`、`query.ts`、attachments、memory、skills、hooks、toolResultStorage 多处。
- Compact 后的准确性取决于摘要质量，仍可能丢失细节。
- Tool schema、skill 描述、MCP schema 的 prompt cache 稳定性需要很多特殊排序和过滤逻辑维护。

### 2.6 权限与安全

Claude 权限核心要素：

- `ToolPermissionContext`：mode、allow/deny/ask rules、additional directories、auto mode 状态。
- 权限模式：default、acceptEdits、plan、auto、bypassPermissions 等。
- 规则来源：user/project/local/policy/flag/cli/session。
- 文件路径校验、workspace directory、scratchpad。
- Bash/PowerShell 规则匹配和危险命令检测。
- Auto mode classifier / bash classifier / yolo classifier。
- hooks 可参与权限决策。
- worker/coordinator/bridge/channel 远程审批路径。
- sandbox 单独存在，与权限规则互补。

设计问题：

- `useCanUseTool` 同时做权限判定、UI 队列、bridge/channel 回调、classifier 等待、worker 转发。
- `hasPermissionsToUseTool` 与 `tool.checkPermissions()`、hooks、classifier、permission prompt 之间的顺序很复杂。
- Shell 权限基于字符串/模式匹配，需要大量危险模式补丁。
- 文件权限和 shell 访问不是一个安全边界；禁止 Read 某文件并不能阻止 shell 读取它，必须依赖 sandbox。

DeepSeek 需要从第一天定义：

```text
PolicyEngine      # 纯判定：输入 capability request，输出 allow/ask/deny/rewrite
ApprovalBroker    # 用户/远程/IDE/CI 审批，不含策略逻辑
SandboxRuntime    # OS 级隔离，执行层强制
AuditLog          # 记录所有决策、来源、输入摘要、工具结果摘要
SecretGuard       # secret 文件/内容识别、transcript redaction
```

### 2.7 MCP / Plugins / Extensibility

Claude MCP：

- 从 settings、`.mcp.json`、CLI flag、enterprise config、Claude.ai、plugin 等多来源加载。
- 支持 stdio、SSE、HTTP、WebSocket、SDK、IDE 等 transport。
- MCP tools 转成 `mcp__server__tool` 格式。
- MCP prompts 转成 commands/skills。
- MCP resources 通过 List/Read resource 工具访问。
- 还扩展出 channels、elicitation、auth、official registry、server policy。

Claude Plugins：

- manifest schema 很复杂。
- 支持 marketplace、GitHub/git/npm/pip/local 等来源。
- 支持 plugin 安装作用域、缓存、版本、多 scope、依赖、策略、managed plugins。
- 插件可带 commands、skills、agents、hooks、MCP、LSP、output styles、channels。

问题：

- 插件是“把所有扩展点打包”的上层概念，威力很大，供应链风险也大。
- MCP 与 plugin、skills、commands、hooks、channels 相互嵌套，信任边界复杂。
- 需要 plugin policy、marketplace allowlist、cache、startup check、blocklist 等大量治理代码。

DeepSeek 建议把所有扩展统一成 `Capability`，再由插件只是打包分发格式：

```text
Capability
  id
  kind: tool | prompt | agent | event | resource | renderer | lsp
  version
  input_schema
  output_schema
  permissions
  trust_level
  context_cost
  lifecycle
  provider
  runtime
```

Plugin 只负责安装多个 capability，不直接成为 runtime 特权边界。

## 3. Claude 实际架构图

可以把 Claude Code 的实际架构抽象为：

```text
CLI / TUI / Headless / SDK / Server / Remote / Bridge / IDE
                    |
                main.tsx
                    |
       init/config/auth/settings/plugins/MCP
                    |
            REPL or QueryEngine
                    |
          processUserInput / commands
                    |
                query.ts
                    |
       API streaming <-> tool_use extraction
                    |
       permissions/hooks/classifier/approval
                    |
           toolOrchestration / toolExecution
                    |
       built-in tools / MCP tools / SkillTool / AgentTool
                    |
        messages / attachments / compact / transcript
```

更细的运行时流程：

```text
1. 启动
   main.tsx
   -> 加载 managed settings / user settings / project settings
   -> 初始化 auth / model / telemetry / feature gates
   -> 初始化 permission context
   -> 初始化 plugins / bundled skills / MCP configs
   -> 选择交互式或 headless 路径

2. 输入处理
   processUserInput
   -> 图片处理、粘贴内容、附件
   -> slash command / bash mode / prompt
   -> UserPromptSubmit hooks

3. 上下文构建
   fetchSystemPromptParts
   -> system prompt + userContext + systemContext
   -> skills/plugins/MCP/resource info
   -> memory / nested memory

4. 模型循环
   queryLoop
   -> compact/microcompact/context collapse
   -> queryModelWithStreaming
   -> assistant messages / tool_use blocks

5. 工具执行
   runTools
   -> 按 concurrency-safe 分批
   -> runToolUse
   -> validate input
   -> pre tool hooks
   -> permission decision
   -> tool.call
   -> post tool hooks
   -> map result to tool_result

6. 会话持久化
   recordTranscript
   -> jsonl transcript
   -> resume / fork / compact boundary / result stream
```

## 4. Claude 的历史包袱

### 4.1 入口过重

`main.tsx` 同时承担：

- CLI 参数定义。
- 初始化流程。
- auth/provider 判断。
- feature gate。
- settings/migration。
- MCP/plugin 初始化。
- permission 初始化。
- remote/server/SSH/open 子命令。
- TUI/headless 分流。

这说明 Claude 是从 CLI 产品逐步长成平台，而不是一开始按 platform runtime 设计。

DeepSeek 调整：

- `apps/cli` 只做参数解析和 UI。
- `core/runtime` 负责 agent loop。
- `core/bootstrap` 负责配置加载。
- `core/session` 负责 session。
- `core/extensions` 负责 capability 加载。

### 4.2 Tool 接口过宽

Claude 的 Tool 同时是：

- 模型工具定义。
- 本地执行器。
- 权限参与者。
- UI 渲染器。
- telemetry/classifier provider。
- prompt 片段 provider。

这会导致任何新工具都要理解太多生命周期。

DeepSeek 调整：

- Tool 执行核心保持纯粹。
- UI renderer 放到前端 adapter。
- policy descriptor 放 manifest。
- prompt descriptor 独立。
- telemetry descriptor 独立。

### 4.3 Context 管理是多处补丁

Claude 已经有 compact、microcompact、context collapse、tool result storage、snip、attachments、memory prefetch。这些功能都必要，但分布分散。

DeepSeek 调整：

- 设计 `ContextGraph`，每个上下文块都有来源、成本、优先级、生命周期、可重取方法、可压缩策略。
- 模型请求时从 graph 投影出 prompt，而不是在 loop 中临时拼装。

### 4.4 权限系统和交互系统耦合

Claude 的权限流中夹杂 UI queue、bridge callbacks、channel callbacks、worker forwarding、classifier grace period。

DeepSeek 调整：

- `PolicyEngine` 只做纯判定。
- `ApprovalBroker` 管所有审批通道。
- `ExecutionSandbox` 是最终强制边界。

### 4.5 配置和扩展来源太多

Claude 有 settings、local settings、managed settings、MCP config、plugin config、skills、commands、memory、feature flags、env vars。每个都有自己的优先级和缓存策略。

DeepSeek 调整：

- 配置统一成 typed layered config。
- 每项配置必须有 source、scope、priority、trust level。
- 所有 capability 都走统一 registry。

### 4.6 供应链信任边界复杂

Claude 插件能带 MCP、hooks、skills、agents、LSP、channels。插件安装后能影响模型上下文、工具调用和事件流。

DeepSeek 调整：

- 插件必须有 lockfile。
- 默认签名校验。
- 每个 capability 单独授权。
- 安装时展示权限 diff。
- 运行时可审计、可禁用单个 capability。

## 5. DeepSeek CLI 推荐目标架构

### 5.1 总体原则

DeepSeek CLI 应该从第一天按“可嵌入 agent runtime”设计，而不是把 CLI 写成产品中心。

核心原则：

- Headless-first：CLI、IDE、server、CI 都调用同一个 runtime。
- Event-sourced：会话用事件日志驱动，可 replay、fork、resume。
- Capability-first：工具、skills、agents、hooks、MCP、resources 统一注册。
- Policy-first：任何副作用都先过 policy，再由 sandbox 强制。
- ContextGraph-first：上下文是图，不是 prompt 字符串。
- Provider-neutral：DeepSeek 是默认 provider，但模型网关不绑定单一模型。
- UI adapter：TUI、JSON stream、IDE renderer 不进入 core。

### 5.2 推荐目录结构

```text
deepseek-cli/
  apps/
    cli/                       # Commander/arg parser, TUI, stdin/stdout, shell completion
    server/                    # 本地 daemon / HTTP / WebSocket，可后置
    vscode/                    # 后续 IDE 插件

  packages/
    runtime/                   # agent loop, turn lifecycle, event stream
    model-gateway/             # DeepSeek/OpenAI-compatible/local provider adapter
    session-store/             # encrypted event log, checkpoint, resume, fork
    context-engine/            # ContextGraph, budget, retrieval, compaction projection
    tool-registry/             # Capability registry, tool manifest, lazy tool schema
    tool-executors/            # builtin file/shell/search/web/git/lsp tools
    policy-engine/             # rules, risk model, approvals, capability policy
    sandbox/                   # fs/network/process isolation
    extension-runtime/         # skills, hooks, agents, plugin loader
    mcp-gateway/               # MCP client, trust wrapping, namespacing, resource adapter
    task-graph/                # subagents, worktree, task DAG, merge protocol
    ui-protocol/               # runtime event -> UI event schema
    tui/                       # terminal UI renderer
    config/                    # layered config loader and schema
    telemetry/                 # optional observability, redacted
    common/                    # ids, Result, errors, paths, platform

  .deepseek/
    config.yaml
    policy.yaml
    memory.md
    rules/
    skills/
    agents/
    hooks.yaml
    mcp.yaml
    plugins.lock
```

### 5.3 核心运行时分层

```text
apps/cli
  -> RuntimeClient
  -> AgentRuntime
  -> ModelGateway
  -> ToolOrchestrator
  -> PolicyEngine
  -> SandboxRuntime
  -> ContextEngine
  -> SessionStore
```

各层职责：

```text
AgentRuntime
  - 接收 UserTurn
  - 发出 RuntimeEvent
  - 驱动 model/tool loop
  - 不依赖 TUI，不读写配置文件

ModelGateway
  - 统一 DeepSeek chat/reasoner/coder/fast models
  - 支持 OpenAI-compatible tool calls
  - 支持 fallback、retry、budget、rate limit

ContextEngine
  - 维护 ContextGraph
  - 做 token budget、context projection、compaction
  - 管理 memory、rules、files、tool outputs、summaries

ToolRegistry
  - 注册 capability
  - 生成模型可见 tool schemas
  - 支持 deferred tool loading / tool search

ToolOrchestrator
  - 校验 tool input
  - 询问 PolicyEngine
  - 调 ApprovalBroker
  - 在 SandboxRuntime 中执行 ToolExecutor
  - 产出 ToolResultEvent

PolicyEngine
  - 输入 CapabilityRequest
  - 输出 allow / ask / deny / rewrite / requireSandbox
  - 不渲染 UI，不直接读 TUI 状态

ApprovalBroker
  - TUI prompt
  - JSON/SDK permission request
  - IDE approval
  - remote approval
  - CI policy auto-decision

SessionStore
  - encrypted event log
  - snapshots/checkpoints
  - resume/fork/replay
  - redaction and retention
```

### 5.4 Capability Manifest

统一工具、skill、agent、hook、MCP、resource：

```yaml
id: builtin.file.read
kind: tool
version: 1.0.0
title: Read file
description: Read text files inside approved workspace roots
input_schema:
  type: object
  required: [path]
  properties:
    path:
      type: string
    offset:
      type: integer
    limit:
      type: integer
output_schema:
  type: object
permissions:
  fs:
    read:
      - "$workspace/**"
  network: []
side_effect: none
risk: low
context:
  default_visibility: model
  max_result_chars: 20000
  overflow: persist_and_preview
runtime:
  executor: builtin:file-read
```

Shell 工具示例：

```yaml
id: builtin.shell.exec
kind: tool
permissions:
  process:
    spawn: ask
  fs:
    read: policy
    write: policy
  network:
    egress: policy
side_effect: variable
risk: high
requires_sandbox: true
policy_hooks:
  - shell_ast_classification
  - dangerous_command_detector
  - secret_access_guard
```

### 5.5 ContextGraph 设计

不要直接维护一个线性 prompt 数组，而是维护 graph：

```text
ContextNode
  id
  type: user_message | assistant_message | tool_result | file | memory | rule | skill | summary
  source
  created_at
  priority
  token_cost
  visibility
  lifecycle: turn | session | project | global
  compressible: true/false
  retrievable: true/false
  dependencies
  redaction_policy
```

投影策略：

```text
project(model, budget, purpose)
  -> system prompt
  -> stable rules
  -> active task state
  -> recent conversation
  -> relevant files/memory
  -> tool schemas
  -> summaries
```

优势：

- Compact 不再是“把历史聊天压成一段摘要”，而是图上的投影优化。
- 可重取的源码、文件列表、工具大输出不需要永久塞进 prompt。
- 会话 fork 可以共享不可变节点，节省存储和上下文。

### 5.6 权限和沙箱设计

DeepSeek 应采用三层安全：

```text
静态策略 Policy
  - capability allow/ask/deny
  - fs/network/process/secrets/git/worktree 规则

动态风险判定 Risk
  - shell AST
  - destructive operation
  - secret access
  - external network
  - dependency install
  - git history rewrite

执行强制 Sandbox
  - filesystem mount policy
  - network egress policy
  - process limits
  - timeout/cpu/memory
  - env allowlist
```

策略文件示例：

```yaml
mode: default
workspace:
  roots:
    - "."
fs:
  read:
    allow:
      - "$workspace/**"
    deny:
      - "**/.env*"
      - "**/id_rsa"
      - "**/secrets/**"
  write:
    ask:
      - "$workspace/**"
    deny:
      - ".git/**"
network:
  egress:
    ask:
      - "*"
process:
  shell:
    ask: true
    sandbox: true
approval:
  remember:
    default_ttl: session
```

关键要求：

- `Read` deny 必须和 sandbox FS deny 一致。
- Shell 不能绕过 secret policy。
- 权限判定结果必须记录 audit event。
- transcript 默认脱敏。
- headless/CI 模式不能隐式弹 TUI，必须通过 structured permission request 返回。

### 5.7 多 Agent / Task Graph

不要从“agent team 聊天室”开始。建议从任务图开始：

```text
TaskGraph
  TaskNode
    id
    goal
    inputs
    allowed_paths
    allowed_tools
    budget
    status
    outputs
    evidence
```

执行模型：

- 主 agent 规划 DAG。
- worker agent 获取明确任务和写入范围。
- worker 在独立 worktree 或 overlay FS 中执行。
- worker 输出 patch、summary、test evidence。
- aggregator 合并 patch，处理冲突。
- policy 控制 worker 是否可联网、可安装依赖、可写哪些目录。

这样比 Claude 的 swarm/team 更适合工程项目。

## 6. DeepSeek CLI MVP 路线

### Phase 0：骨架

目标：先做出可运行的 headless runtime。

```text
deepseek -p "explain this repo"
deepseek
deepseek resume
```

必要模块：

- `apps/cli`
- `packages/runtime`
- `packages/model-gateway`
- `packages/session-store`
- `packages/tool-registry`
- `packages/tool-executors`
- `packages/policy-engine`
- `packages/config`

### Phase 1：核心 Coding Agent

功能：

- 交互式 TUI。
- `-p` 非交互。
- JSON / stream-json 输出。
- 会话 resume/fork。
- Read/Write/Edit/Glob/Grep/Shell。
- 基础权限：allow/ask/deny。
- `.deepseek/memory.md`。
- `.deepseek/rules/*.md`。
- checkpoint / undo。
- token/cost/max turns/max budget。

此阶段不要做：

- 插件 marketplace。
- agent teams。
- remote control。
- cron。
- voice。
- complicated telemetry。

### Phase 2：安全和上下文加强

功能：

- Sandbox。
- Secret redaction。
- ContextGraph。
- Tool result storage。
- Auto compaction。
- LSP。
- Skills。
- Hooks。
- MCP basic。

### Phase 3：扩展生态

功能：

- Capability plugin。
- Plugin lockfile。
- Signed package。
- MCP policy。
- Subagents + task graph。
- Worktree integration。
- IDE adapter。

### Phase 4：平台化

功能：

- Local daemon/server。
- Remote sessions。
- Enterprise managed policy。
- Team memory。
- Routines / scheduled agents。
- Plugin marketplace。

## 7. 技术选型建议

考虑 Claude 参考源码是 TypeScript + Bun/Node + React/Ink，DeepSeek 可以沿用 TypeScript，但不要沿用“大量 React hooks 进入核心逻辑”的方式。

推荐：

```text
语言：TypeScript
运行时：Node 22 LTS 或 Bun 可选
包管理：pnpm workspace
CLI 参数：commander 或 clipanion
TUI：Ink 或自研轻量 renderer
Schema：zod + JSON Schema export
配置：yaml + zod validation
日志：pino 或结构化 JSON logger
事件：AsyncIterable<RuntimeEvent>
测试：vitest
```

关键接口先行：

```ts
type RuntimeEvent =
  | { type: 'session.started'; sessionId: string }
  | { type: 'turn.started'; turnId: string }
  | { type: 'model.delta'; text: string }
  | { type: 'tool.requested'; call: ToolCall }
  | { type: 'permission.requested'; request: PermissionRequest }
  | { type: 'tool.completed'; result: ToolResult }
  | { type: 'turn.completed'; result: TurnResult }
  | { type: 'error'; error: RuntimeError }
```

Agent runtime：

```ts
interface AgentRuntime {
  submit(input: UserInput, options?: TurnOptions): AsyncIterable<RuntimeEvent>
  interrupt(reason?: string): Promise<void>
  fork(options?: ForkOptions): Promise<SessionRef>
  resume(sessionId: string): Promise<SessionRef>
}
```

Tool executor：

```ts
interface ToolExecutor<I, O> {
  execute(input: I, ctx: ToolExecutionContext): Promise<O>
}
```

Policy engine：

```ts
interface PolicyEngine {
  evaluate(request: CapabilityRequest): Promise<PolicyDecision>
}
```

## 8. 和 Claude 对比后的架构调整清单

DeepSeek 应该保留：

- async generator 事件流。
- headless/interactive 共用 agent runtime。
- 工具并发安全声明。
- skill 的渐进加载。
- MCP 生态兼容。
- session resume/fork。
- compact/context budget。
- worktree/subagent 思路。

DeepSeek 应该避免：

- CLI 入口变成平台总线。
- Tool 接口承载 UI/权限/prompt/telemetry/执行所有职责。
- hooks 直接影响核心循环但缺少统一 capability 权限。
- config 来源没有统一优先级模型。
- shell 权限只依赖字符串规则。
- transcript 明文持久化且无脱敏。
- 插件安装后自动获得过宽能力。
- 多 agent 没有任务图和写入范围。

DeepSeek 应该新增：

- ContextGraph。
- Capability manifest。
- PolicyEngine / ApprovalBroker / SandboxRuntime 三段式安全。
- Encrypted session store。
- Plugin lockfile 和签名。
- Capability-level audit。
- Model gateway，支持 deepseek-chat、deepseek-reasoner、fast/coder/fallback。
- TaskGraph，多 agent 从工程任务图开始。

## 9. 建议下一步

建议先产出三份基础设计文档：

```text
doc/runtime-design.md          # AgentRuntime、RuntimeEvent、turn lifecycle
doc/capability-system.md       # tools/skills/agents/hooks/MCP/plugin 统一模型
doc/security-policy.md         # policy、approval、sandbox、audit、secret redaction
```

然后再开始写源码骨架：

```text
src/
  apps/cli/
  packages/runtime/
  packages/model-gateway/
  packages/session-store/
  packages/context-engine/
  packages/tool-registry/
  packages/tool-executors/
  packages/policy-engine/
  packages/config/
```

最小可验收目标：

```text
deepseek -p "list files and summarize project"
  -> runtime emits stream events
  -> model calls Read/Glob/Grep
  -> policy records decisions
  -> session encrypted event log can resume
```

## 10. 对比 Claude Code 2.1.88 后 DeepSeek OpenSpec 的缺口复核

本节用于复核参考实现的能力版图，不表示 DeepSeek 要复制其实现。OpenSpec 中应沉淀的是 DeepSeek 自己的平台抽象和架构边界。

### 10.1 已补入 OpenSpec 的架构级能力

这些能力会影响基础框架边界，已经进入 `bootstrap-future-ready-cli-framework`：

| 参考实现能力域 | DeepSeek 抽象 | 为什么必须进基础架构 |
| --- | --- | --- |
| CLI / headless / SDK / VSCode / future server | `communication-protocol`, `vscode-extension-adapter`, `remote-runtime-connectivity` | 多 host 不能靠解析 stdout 集成，必须一开始协议化 |
| 内部协调 / Hermes 类消息体系 | `runtime-message-bus` | runtime 内部服务需要 typed topics、ordering、backpressure、replay 和审计 |
| Agent / subagent / swarm / teammate | `agent-management`, `workflow-orchestration`, `concurrency-orchestration` | agent 生命周期和任务图必须集中管理，不能散在工具里 |
| Tool 注册与执行 | `capability-registry`, `policy-sandbox`, `platform-abstraction` | 工具要拆成 manifest、executor、policy、renderer、telemetry |
| Slash commands / workflow commands / plugin commands | `command-system` | 命令不是 UI 字符串，需要 schema、权限、host-neutral result |
| Skills / bundled skills / dynamic skills | `skill-system` | skill 应是一等知识/动作包，包含 progressive loading、trust、state、regression |
| Hooks | `hook-system` | hook 会改变 runtime 行为，必须有 ordering、timeout、isolation、failure policy |
| MCP tools / prompts / resources | `mcp-gateway` | 外部 server 要被隔离成受治理 capability/resource/context |
| Plugins / marketplace / installed plugins / auto update | `plugin-system`, `distribution-update-management` | 插件是供应链与权限边界，需要 manifest、lockfile、integrity、permission diff、rollback |
| Plugin/extension contributions | `extension-system` | contribution loading 和 package distribution 要分层 |
| Feature gates / migrations / model/profile migration | `evolution-engine` | 面向未来必须有兼容性、迁移、回滚和灰度 |
| Context / compact / memory / tool-result storage | `context-engine`, `memory-cache-management` | 上下文必须是 graph/projection，不是 loop 里的字符串拼接 |
| Auth / OAuth / API keys / connector credentials | `credential-auth-management` | secret 不能被 model、trace、plugin 直接接触 |
| Cost / token / usage / rate limit | `usage-budget-management` | budget 决策会影响 runtime turn、workflow 和并发调度 |
| LSP / IDE diagnostics / symbols | `code-intelligence` | 代码智能是 context 和 edit safety 的平台输入 |
| Worktree / file snapshots / diff / edit application | `workspace-state-management` | 编辑事务、rollback、多 agent 写入范围和 VSCode edit 需要统一模型 |
| Remote / bridge / server / trusted device | `remote-runtime-connectivity` | 远程模式必须是协议 transport，不应侵入 runtime |
| Tests / replay / golden traces | `testing-regression` | 自回归必须覆盖 protocol、bus、session、policy、skill/plugin/hook/MCP |

### 10.2 仍未进入第一版 OpenSpec 的产品层能力

这些能力在参考实现中存在，但不建议塞进第一个基础框架。它们可以以后单独开 OpenSpec：

| 能力 | 建议阶段 | 原因 |
| --- | --- | --- |
| Voice / STT / voice mode | 后续 host capability | 属于输入 host 体验，不影响 core runtime 第一版 |
| Vim mode / keybindings / input buffer | 后续 CLI UX | 适合放在 `apps/cli` 或 TUI 包，不应污染 runtime |
| Terminal TUI 复杂组件、virtual scroll、React/Ink state | 后续 CLI UX | 第一版重点是 headless runtime 和协议 |
| Notifications / banners / tips / recommendation UI | 后续 host UX | 可由 protocol event + host renderer 承接 |
| Chrome/browser/native host integration | 后续 connector/host adapter | 先把 remote/host protocol 定义好，再做具体 host |
| Marketplace recommendation / plugin hint | 后续 plugin discovery | 基础架构先做 plugin policy、lockfile、install/update |
| Team memory sync / enterprise remote managed settings | 后续 enterprise | 第一版先定义 memory/config/credential/policy 扩展点 |
| Full local daemon/server product | 后续 transport | 第一版只定义 remote runtime connectivity contracts |
| Full sandbox enforcement matrix | 后续 security hardening | 第一版先提供 sandbox contract 和 development adapter |
| Auto-update UI and release channels | 后续 distribution UX | 第一版定义 distribution/update contracts 与签名方向 |

### 10.3 参考实现中值得避免的历史负担

- 入口过重：启动、配置、认证、插件、MCP、TUI、headless、remote 混在一个入口会让后续演进困难。
- Tool 接口过宽：执行、权限、prompt、UI、telemetry、classifier 不应由一个接口承担。
- Command、Skill、Workflow、MCP prompt、Plugin command 概念重叠：DeepSeek 应拆成 `command-system`、`skill-system`、`workflow-orchestration`、`mcp-gateway`。
- Plugin 权限过宽：插件只是包分发，不应成为 runtime 特权边界。
- Hook 缺少治理会导致不可预测行为：必须有 ordering、timeout、isolation、failure policy 和 replay。
- Context 管理分散：应统一到 ContextGraph、Memory、Cache、Workspace State。
- Shell/文件权限不能只靠字符串规则：Policy、Approval、Sandbox、PlatformRuntime 必须共同生效。

### 10.4 当前 OpenSpec 还要继续关注的开放问题

- 插件包格式是否需要同时支持目录包、压缩包、registry artifact 和 workspace-local package。
- Skill 的模型投影策略：默认只投影 summary，还是由 context router 按需展开。
- Hook 是否允许修改输入，还是只能输出 suggestion，由 owning subsystem 决定是否应用。
- MCP gateway 的第一版是否只做 fake/in-process adapter，真实 transport 后置。
- Workspace edit transaction 是否第一版就支持 rollback，还是只保存 rollback metadata。
- Usage budget 第一版是否只做 token/time fake accounting，真实 provider pricing 后置。
