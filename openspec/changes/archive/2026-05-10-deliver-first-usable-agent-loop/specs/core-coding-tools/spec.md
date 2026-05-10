## ADDED Requirements

### Requirement: Model-Visible Core Tool Projection / 面向模型的核心工具投影

Core coding tools SHALL expose model-visible tool schemas derived from registered executable capabilities, policy state, platform availability, and provider compatibility metadata.

core coding tools 必须暴露 model-visible tool schemas，其来源必须是已注册 executable capabilities、policy state、platform availability 和 provider compatibility metadata。

#### Scenario: Disabled or unavailable tool is hidden / 禁用或不可用工具被隐藏

- **WHEN** a tool is disabled by policy, unavailable on the active platform, or unsupported by the selected provider profile
- **THEN** the model-visible tool projection excludes the tool and executable lookup rejects direct invocation
- **中文** 当工具被 policy 禁用、在当前平台不可用，或被所选 provider profile 不支持时，model-visible tool projection 必须排除该工具，executable lookup 也必须拒绝直接调用。

#### Scenario: Projected schema is executable / 投影 schema 可执行

- **WHEN** runtime projects a core coding tool to the model
- **THEN** the same capability id, version, input schema, side-effect metadata, timeout defaults, and replay policy are available to the governed execution pipeline
- **中文** 当 runtime 把 core coding tool 投影给模型时，同一 capability id、version、input schema、side-effect metadata、timeout defaults 和 replay policy 必须可用于受治理 execution pipeline。

### Requirement: Core Tool Preflight for Model Calls / 模型调用的核心工具预检

Core coding tools SHALL validate and normalize model-supplied inputs before execution, including workspace paths, platform command semantics, output bounds, resource locks, and side-effect metadata.

core coding tools 必须在执行前校验并归一化模型提供的输入，包括 workspace paths、platform command semantics、output bounds、resource locks 和 side-effect metadata。

#### Scenario: Path is normalized before read / 读取前路径被归一化

- **WHEN** a model requests a file read with provider-specific path separators, relative segments, or workspace aliases
- **THEN** the tool preflight resolves the path through the platform workspace contract and rejects escapes before reading
- **中文** 当模型请求 file read 且输入包含 provider-specific path separators、relative segments 或 workspace aliases 时，tool preflight 必须通过 platform workspace contract 解析路径，并在读取前拒绝 escape。

#### Scenario: Shell command is platform checked / Shell 命令经过平台检查

- **WHEN** a model requests a shell or test command
- **THEN** the tool preflight checks shell profile availability, cwd, argv, environment scope, timeout, policy metadata, and resource locks before scheduler submission
- **中文** 当模型请求 shell 或 test command 时，tool preflight 必须在 scheduler submission 前检查 shell profile availability、cwd、argv、environment scope、timeout、policy metadata 和 resource locks。

### Requirement: Tool Result Feedback Shape / 工具结果反馈形态

Core coding tools SHALL produce bounded, provider-neutral tool result messages suitable for returning to the model and richer replay evidence suitable for trace, audit, and golden tests.

core coding tools 必须生成有界 provider-neutral tool result messages 以回传模型，并生成更丰富的 replay evidence 用于 trace、audit 和 golden tests。

#### Scenario: Tool result separates model preview and evidence / 工具结果分离模型预览与证据

- **WHEN** a core tool completes
- **THEN** the result includes a bounded model-facing preview, structured evidence, affected paths when any, redaction metadata, diagnostics, and replay metadata
- **中文** 当 core tool 完成时，结果必须包含有界 model-facing preview、structured evidence、适用时的 affected paths、redaction metadata、diagnostics 和 replay metadata。
