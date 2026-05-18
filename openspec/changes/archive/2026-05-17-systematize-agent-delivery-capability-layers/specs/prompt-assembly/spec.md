## ADDED Requirements

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
