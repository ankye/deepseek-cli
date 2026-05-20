# prompt-assembly Specification

## Purpose
Define prompt assembly requirements for composing runtime context, work orders, tool projections, redaction, and provider-ready messages.

定义 prompt assembly 对 runtime context、work orders、tool projections、redaction 与 provider-ready messages 组合的要求。

## Requirements
### Requirement: Dedicated Prompt Assembly Package / 独立 Prompt Assembly Package

The system SHALL provide a dedicated `@deepseek/prompt-assembly` workspace package that assembles provider-neutral model request plans from typed contracts without importing CLI, VSCode, runtime implementation internals, provider SDKs, Node filesystem/process APIs, or testing fakes.

系统必须提供独立的 `@deepseek/prompt-assembly` workspace package，基于 typed contracts 组装 provider-neutral model request plans，且不得导入 CLI、VSCode、runtime implementation internals、provider SDKs、Node filesystem/process APIs 或 testing fakes。

#### Scenario: Package exports host-neutral assembler / Package 导出 host-neutral assembler
- **WHEN** another package imports the public exports of `@deepseek/prompt-assembly`
- **THEN** it can construct or use a `PromptAssembler` through platform-contract DTOs without depending on any app host or provider implementation
- **中文** 当其他 package 导入 `@deepseek/prompt-assembly` 的 public exports 时，必须能够通过 platform-contract DTOs 构造或使用 `PromptAssembler`，且不依赖任何 app host 或 provider implementation。

#### Scenario: Architecture lint protects the boundary / 架构 lint 保护边界
- **WHEN** boundary checks inspect `src/packages/prompt-assembly`
- **THEN** imports from app packages, runtime internals, provider SDKs, Node filesystem/process APIs, and testing fake packages are reported as violations
- **中文** 当 boundary checks 检查 `src/packages/prompt-assembly` 时，来自 app packages、runtime internals、provider SDKs、Node filesystem/process APIs 与 testing fake packages 的导入必须被报告为违规。

### Requirement: Prompt Assembly Contracts / Prompt Assembly 契约

The system SHALL define serializable prompt assembly contracts in `@deepseek/platform-contracts` for inputs, sections, section providers, budget reports, tool plans, assembly traces, and assembly results.

系统必须在 `@deepseek/platform-contracts` 中定义可序列化的 prompt assembly contracts，覆盖 inputs、sections、section providers、budget reports、tool plans、assembly traces 与 assembly results。

#### Scenario: Assembly input is serializable / Assembly input 可序列化
- **WHEN** a host or runtime prepares a prompt assembly request
- **THEN** the input can be represented as serializable DTOs containing session/turn identity, user prompt, mode, context projection evidence, reference evidence, tool policy, model/profile metadata, and compatibility metadata
- **中文** 当 host 或 runtime 准备 prompt assembly request 时，input 必须能表示为可序列化 DTOs，包含 session/turn identity、user prompt、mode、context projection evidence、reference evidence、tool policy、model/profile metadata 与 compatibility metadata。

#### Scenario: Assembly result is replayable / Assembly result 可 replay
- **WHEN** the assembler returns a result
- **THEN** the result includes provider-neutral messages, prompt text, sections, tool plan, budget report, trace metadata, redaction metadata, compatibility metadata, and a stable fingerprint
- **中文** 当 assembler 返回 result 时，result 必须包含 provider-neutral messages、prompt text、sections、tool plan、budget report、trace metadata、redaction metadata、compatibility metadata 与 stable fingerprint。

### Requirement: Extensible Section Registry / 可扩展 Section Registry

The prompt assembly package SHALL support a deterministic section registry where built-in and future section providers contribute typed section candidates without changing the runtime agent loop.

Prompt assembly package 必须支持 deterministic section registry，使 built-in 与未来 section providers 可以贡献 typed section candidates，且不需要修改 runtime agent loop。

#### Scenario: Built-in providers contribute sections / 内置 Provider 贡献 Sections
- **WHEN** the default assembler receives a normal coding turn
- **THEN** it can collect section candidates for operating rules, project instructions, task intent, output contract, projected context evidence, PageIndex recall evidence, tool-result evidence, skill context, and tool policy through registered providers
- **中文** 当默认 assembler 接收普通 coding turn 时，必须能通过 registered providers 收集 operating rules、project instructions、task intent、output contract、projected context evidence、PageIndex recall evidence、tool-result evidence、skill context 与 tool policy 的 section candidates。

#### Scenario: New provider is added without loop changes / 新 Provider 无需修改 Loop 即可加入
- **WHEN** a new section provider such as ZVec semantic recall is registered with a stable id, priority, trust level, budget class, and compatibility metadata
- **THEN** the assembler can consider its sections through the same ordering, redaction, budgeting, and trace rules without requiring changes to `agent-loop.ts`
- **中文** 当一个新 section provider（例如 ZVec semantic recall）以 stable id、priority、trust level、budget class 与 compatibility metadata 注册时，assembler 必须能通过同一套 ordering、redaction、budgeting 与 trace rules 处理它的 sections，且不要求修改 `agent-loop.ts`。

#### Scenario: Provider failure is structured / Provider 失败结构化
- **WHEN** a section provider fails, is incompatible, or returns invalid section data
- **THEN** the assembler excludes that provider's sections, records a typed diagnostic and exclusion reason, and continues assembling safe remaining sections unless the failed provider was marked required
- **中文** 当 section provider 失败、不兼容或返回无效 section data 时，assembler 必须排除该 provider 的 sections，记录 typed diagnostic 与 exclusion reason，并继续组装安全的剩余 sections，除非该 provider 被标记为 required。

### Requirement: Deterministic Section Ordering And Budgeting / 确定性 Section 排序与预算

The prompt assembly package SHALL order, deduplicate, redact, and fit sections under a deterministic budget strategy while preserving the exact user prompt as a user message.

Prompt assembly package 必须在 deterministic budget strategy 下对 sections 进行排序、去重、脱敏与预算裁剪，同时将用户原始 prompt 保留为 user message。

#### Scenario: User prompt remains exact / 用户 Prompt 保持精确
- **WHEN** context, memory, PageIndex, ZVec, tool, or project sections are included
- **THEN** the original submitted user prompt remains an exact user message and is not mutated by appended context
- **中文** 当 context、memory、PageIndex、ZVec、tool 或 project sections 被包含时，用户提交的原始 prompt 必须保持为精确 user message，不得被追加 context 后修改。

#### Scenario: Budget exclusions are explainable / 预算排除可解释
- **WHEN** a section cannot fit within the configured budget
- **THEN** the budget report records the section id, section kind, token estimate, priority, and an exclusion reason such as `budget-exceeded`, `duplicate-fingerprint`, `policy-excluded`, `stale-suppressed`, or `provider-incompatible`
- **中文** 当某个 section 无法放入配置预算时，budget report 必须记录 section id、section kind、token estimate、priority，以及 `budget-exceeded`、`duplicate-fingerprint`、`policy-excluded`、`stale-suppressed` 或 `provider-incompatible` 等 exclusion reason。

#### Scenario: Duplicate evidence is deduplicated / 重复证据被去重
- **WHEN** multiple providers return sections with the same evidence fingerprint
- **THEN** the assembler keeps the highest-priority eligible section and records duplicate exclusions for the others
- **中文** 当多个 providers 返回具有相同 evidence fingerprint 的 sections 时，assembler 必须保留最高优先级的 eligible section，并为其他 sections 记录 duplicate exclusions。

### Requirement: Provider-Neutral Request Planning / Provider-Neutral Request Planning

The prompt assembly package SHALL output provider-neutral request plans and SHALL NOT serialize provider-specific HTTP or SDK request bodies.

Prompt assembly package 必须输出 provider-neutral request plans，且不得序列化 provider-specific HTTP 或 SDK request bodies。

#### Scenario: Model gateway owns provider serialization / Model Gateway 负责 Provider 序列化
- **WHEN** an assembly result is passed to the model gateway
- **THEN** the gateway can serialize messages, tools, tool choice, reasoning options, and metadata for the target provider without requiring provider SDK types in prompt assembly contracts
- **中文** 当 assembly result 传给 model gateway 时，gateway 必须能为目标 provider 序列化 messages、tools、tool choice、reasoning options 与 metadata，且 prompt assembly contracts 不需要 provider SDK types。

#### Scenario: Provider constraints are declarative / Provider 约束声明式表达
- **WHEN** a provider has message ordering, system message, tool schema, or cache constraints
- **THEN** those constraints are represented as declarative compatibility metadata and reflected in assembly diagnostics rather than hard-coded provider SDK logic
- **中文** 当 provider 有 message ordering、system message、tool schema 或 cache constraints 时，这些约束必须表示为 declarative compatibility metadata，并反映到 assembly diagnostics，而不是硬编码 provider SDK 逻辑。

### Requirement: Prompt Assembly Evidence And Redaction / Prompt Assembly 证据与脱敏

The prompt assembly package SHALL produce bounded, redacted, replayable assembly evidence suitable for runtime events, diagnostics, evaluation, and golden replay.

Prompt assembly package 必须生成有界、脱敏、可 replay 的 assembly evidence，适用于 runtime events、diagnostics、evaluation 与 golden replay。

#### Scenario: Trace excludes raw secrets / Trace 排除原始 Secrets
- **WHEN** an assembly result contains section traces
- **THEN** traces include ids, kinds, source metadata, fingerprints, token estimates, bounded redacted previews, and redaction classes, but do not persist raw unbounded section content or detected secrets
- **中文** 当 assembly result 包含 section traces 时，traces 必须包含 ids、kinds、source metadata、fingerprints、token estimates、有界脱敏 previews 与 redaction classes，但不得持久化 raw unbounded section content 或检测到的 secrets。

#### Scenario: Fingerprint is stable for equivalent inputs / 等价输入生成稳定 Fingerprint
- **WHEN** the assembler receives equivalent inputs with equivalent ordered sections, tool plan, budget decisions, and provider-neutral metadata
- **THEN** it returns the same assembly fingerprint across runs
- **中文** 当 assembler 接收等价 inputs，并具有等价 ordered sections、tool plan、budget decisions 与 provider-neutral metadata 时，必须跨运行返回相同 assembly fingerprint。

### Requirement: Prompt Assembly Replay / Prompt Assembly 可重放

The prompt assembly package SHALL support deterministic replay of prompt assembly decisions from captured assembly inputs, registry metadata, compatibility metadata, and redacted evidence fingerprints.

Prompt assembly package 必须支持基于 captured assembly inputs、registry metadata、compatibility metadata 与 redacted evidence fingerprints 对 prompt assembly decisions 进行确定性 replay。

#### Scenario: Replay reproduces assembly structure / Replay 复现 Assembly 结构
- **WHEN** a replay harness reruns assembly with the same input DTOs, package version, registered provider ids, provider compatibility metadata, budget configuration, and evidence fingerprints
- **THEN** it reproduces the same section order, inclusion/exclusion decisions, tool plan summary, budget report, prompt message roles, and assembly fingerprint
- **中文** 当 replay harness 使用相同 input DTOs、package version、registered provider ids、provider compatibility metadata、budget configuration 与 evidence fingerprints 重新运行 assembly 时，必须复现相同的 section order、inclusion/exclusion decisions、tool plan summary、budget report、prompt message roles 与 assembly fingerprint。

#### Scenario: Replay explains drift / Replay 解释漂移
- **WHEN** a replayed assembly result differs from the captured assembly evidence
- **THEN** the replay report identifies the first structural drift point, such as changed provider version, changed section fingerprint, changed budget estimate, changed ordering rule, changed tool projection, or missing evidence
- **中文** 当 replayed assembly result 与 captured assembly evidence 不一致时，replay report 必须识别第一个结构漂移点，例如 changed provider version、changed section fingerprint、changed budget estimate、changed ordering rule、changed tool projection 或 missing evidence。

#### Scenario: Replay does not require raw prompt persistence / Replay 不要求持久化 Raw Prompt
- **WHEN** only redacted assembly evidence is available
- **THEN** replay can still validate structural decisions and fingerprints for non-secret metadata without requiring raw unbounded prompt or secret content to be persisted
- **中文** 当只有 redacted assembly evidence 可用时，replay 仍必须能验证 structural decisions 与 non-secret metadata fingerprints，且不要求持久化 raw unbounded prompt 或 secret content。

### Requirement: Project Rule Sections Are First-Class / 项目规则 Section 是一等上下文

Prompt assembly SHALL project repository and host project rules as prioritized runtime-owned sections without mutating the exact user prompt.

prompt assembly 必须将 repository 与 host project rules 作为有优先级的 runtime-owned sections 投影，并保持用户原始 prompt 不被修改。

#### Scenario: Repository rules are included with provenance / 仓库规则带 Provenance 注入

- **WHEN** a workspace contains applicable project rule sources such as `AGENTS.md`, future `CLAUDE.md`-style files, host policy, or OpenSpec guidance
- **THEN** prompt assembly includes bounded rule sections with source path or source id, priority, scope, freshness metadata, and redaction metadata
- **中文** 当 workspace 包含适用的 project rule sources，例如 `AGENTS.md`、未来 `CLAUDE.md` 风格文件、host policy 或 OpenSpec guidance 时，prompt assembly 必须注入有界 rule sections，包含 source path 或 source id、priority、scope、freshness metadata 与 redaction metadata。

#### Scenario: Rule conflicts are explicit / 规则冲突显式化

- **WHEN** project rules conflict with memory, previous conversation context, provider defaults, or generated guidance
- **THEN** prompt assembly records the conflict and preserves the higher-priority current rule according to instruction priority
- **中文** 当 project rules 与 memory、previous conversation context、provider defaults 或 generated guidance 冲突时，prompt assembly 必须记录 conflict，并按 instruction priority 保留更高优先级的当前规则。

### Requirement: Output Contract Sections Are Typed / 输出契约 Section 类型化

Prompt assembly SHALL include typed output-contract sections for tasks that require JSON, schema-compliant artifacts, file mutations, command plans, or explicit completion criteria.

prompt assembly 必须为要求 JSON、schema-compliant artifacts、file mutations、command plans 或 explicit completion criteria 的任务注入 typed output-contract sections。

#### Scenario: JSON schema contract is model-visible / JSON Schema 契约对模型可见

- **WHEN** a task has a discovered or requested JSON schema
- **THEN** prompt assembly includes a bounded output-contract section that describes required files, schema shape, strict JSON requirements, and verification expectations
- **中文** 当任务存在已发现或用户要求的 JSON schema 时，prompt assembly 必须注入有界 output-contract section，描述 required files、schema shape、strict JSON requirements 与 verification expectations。

#### Scenario: Command plan contract is generic / Command Plan 契约通用化

- **WHEN** the active tool projection requires model text to carry executable command intent, such as no model-visible tools or an external harness bridge
- **THEN** prompt assembly uses a generic command-plan output contract rather than benchmark-specific hidden prompt rules
- **中文** 当 active tool projection 要求模型文本携带 executable command intent，例如没有 model-visible tools 或外部 harness bridge 时，prompt assembly 必须使用通用 command-plan output contract，而不是 benchmark-specific hidden prompt rules。

### Requirement: Prompt Assembly Consumes Pipeline Manifest / Prompt Assembly 消费管道 Manifest

Prompt assembly SHALL consume context pipeline manifests as typed ordered evidence and SHALL NOT rebuild, reorder, or retrieve upstream context directly.

Prompt assembly 必须将 context pipeline manifests 作为类型化有序证据消费，且不得直接重建、重排或检索上游 context。

#### Scenario: Manifest order is preserved / Manifest 顺序被保留

- **WHEN** prompt assembly receives a pipeline manifest with kernel, project, session, and current-turn layers
- **THEN** model-visible sections preserve that layer order and preserve block order within each layer unless a block is explicitly excluded by assembly policy
- **中文** 当 prompt assembly 收到包含 kernel、project、session 与 current-turn layers 的 pipeline manifest 时，模型可见 sections 必须保持该层顺序，并保持每层内 block 顺序，除非某 block 被 assembly policy 显式排除。

#### Scenario: Assembly does not fetch context / Assembly 不获取 Context

- **WHEN** prompt assembly needs project rules, memory, file evidence, PageIndex recall, tool-result evidence, or code-intelligence evidence
- **THEN** it consumes manifest blocks supplied by runtime/context-engine instead of scanning files, querying stores, or reading host UI state
- **中文** 当 prompt assembly 需要 project rules、memory、file evidence、PageIndex recall、tool-result evidence 或 code-intelligence evidence 时，必须消费 runtime/context-engine 提供的 manifest blocks，而不是扫描文件、查询 stores 或读取 host UI state。

### Requirement: Stable Prefix Section Planning / 稳定前缀 Section Planning

Prompt assembly SHALL emit section plans that preserve stable prefix blocks ahead of volatile current-turn content and record prefix fingerprints in assembly evidence.

Prompt assembly 必须输出 section plans，将稳定前缀 blocks 保持在易变 current-turn content 前面，并在 assembly evidence 中记录 prefix fingerprints。

#### Scenario: Stable sections precede current turn / 稳定 Section 位于当前回合之前

- **WHEN** a prompt is assembled for a normal coding turn
- **THEN** kernel and project sections appear before session summaries and current user input, preserving the manifest prefix order
- **中文** 当为普通 coding turn 组装 prompt 时，kernel 与 project sections 必须出现在 session summaries 与当前用户输入之前，并保持 manifest prefix order。

#### Scenario: Assembly evidence carries hashes / Assembly 证据携带 Hashes

- **WHEN** prompt assembly returns a result
- **THEN** the result includes pipeline fingerprint, layer prefix hashes, included block ids, excluded block ids, and cache hint summary
- **中文** 当 prompt assembly 返回结果时，结果必须包含 pipeline fingerprint、layer prefix hashes、included block ids、excluded block ids 与 cache hint summary。

