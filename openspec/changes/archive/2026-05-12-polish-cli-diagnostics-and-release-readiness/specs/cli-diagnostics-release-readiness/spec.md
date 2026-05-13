## ADDED Requirements

### Requirement: CLI Diagnostics Command Surface / CLI 诊断命令表面

The CLI SHALL expose diagnostics commands that render doctor, support-bundle, and release-readiness evidence from shared readiness, observability, platform, and package contracts.

CLI 必须暴露 diagnostics commands，从共享 readiness、observability、platform 和 package contracts 渲染 doctor、support-bundle 与 release-readiness evidence。

#### Scenario: Diagnostics bundle renders redacted support evidence / Diagnostics Bundle 渲染脱敏支持证据

- **WHEN** a user runs `deepseek diagnostics bundle`
- **THEN** the CLI emits a bounded local diagnostic bundle with schema version, bundle id, selected record count, redaction summary, privacy decision, reference pit fixture ids, and no raw secret material
- **中文** 当用户运行 `deepseek diagnostics bundle` 时，CLI 必须输出有界 local diagnostic bundle，包含 schema version、bundle id、selected record count、redaction summary、privacy decision、reference pit fixture ids，且不包含 raw secret material。

#### Scenario: Diagnostics release renders readiness gate / Diagnostics Release 渲染发布门禁

- **WHEN** a user runs `deepseek diagnostics release`
- **THEN** the CLI emits package metadata, expected publish surface, acceptance evidence pointers, ignored forbidden path status, and required verification command names in text and structured output modes
- **中文** 当用户运行 `deepseek diagnostics release` 时，CLI 必须在 text 与 structured output modes 输出 package metadata、expected publish surface、acceptance evidence pointers、ignored forbidden path status 和 required verification command names。

### Requirement: CLI Diagnostics Structured Output Parity / CLI 诊断结构化输出一致性

CLI diagnostics SHALL support text, JSON, and JSONL output without terminal control sequences in structured modes.

CLI diagnostics 必须支持 text、JSON 和 JSONL 输出，并且 structured modes 不得包含 terminal control sequences。

#### Scenario: JSONL diagnostics are line-oriented / JSONL 诊断按行输出

- **WHEN** diagnostics output mode is JSONL
- **THEN** each emitted line is a valid JSON object with a stable `kind`, schema version, redaction metadata, and no ANSI, spinner, cursor, or prompt state
- **中文** 当 diagnostics output mode 是 JSONL 时，每一行都必须是有效 JSON object，包含稳定的 `kind`、schema version、redaction metadata，且不包含 ANSI、spinner、cursor 或 prompt state。

#### Scenario: Text diagnostics are terminal-profile safe / Text 诊断适配终端 Profile

- **WHEN** diagnostics output is rendered in text mode for CI, non-TTY, no-color, or unknown-width profiles
- **THEN** output remains deterministic line text with explicit status labels and does not require color semantics, raw input, cursor movement, or alternate-screen state
- **中文** 当 diagnostics output 在 CI、non-TTY、no-color 或 unknown-width profiles 下以 text mode 渲染时，输出必须保持确定性 line text，带明确 status labels，且不依赖颜色语义、raw input、cursor movement 或 alternate-screen state。

### Requirement: CLI Release Readiness Evidence / CLI 发布就绪证据

The CLI SHALL provide release-readiness evidence before publishing or host promotion.

CLI 必须在发布或 host promotion 前提供 release-readiness evidence。

#### Scenario: Package surface is checked / Package Surface 被检查

- **WHEN** release readiness runs for the CLI npm package
- **THEN** evidence includes package name, version, bin entry, build output path, expected tarball files, publish access, and a status for generated bundles being excluded from source commits
- **中文** 当 release readiness 针对 CLI npm package 运行时，evidence 必须包含 package name、version、bin entry、build output path、expected tarball files、publish access，以及 generated bundles 不进入源码提交面的状态。

#### Scenario: Acceptance evidence is linked / 验收证据被链接

- **WHEN** release readiness is rendered
- **THEN** output links or lists OpenSpec validation, typecheck, lint, unit/contract/integration/golden/matrix/e2e tests, CLI build, headless smoke, boundary checks, and reference hygiene evidence
- **中文** 当 release readiness 被渲染时，输出必须链接或列出 OpenSpec validation、typecheck、lint、unit/contract/integration/golden/matrix/e2e tests、CLI build、headless smoke、boundary checks 和 reference hygiene evidence。

### Requirement: Diagnostics Remain Host Adapter Work / 诊断保持 Host Adapter 职责

CLI diagnostics SHALL render and assemble evidence without directly executing model, tool, scheduler, sandbox, MCP, plugin, or workflow primitives.

CLI diagnostics 必须只渲染和组装 evidence，不得直接执行 model、tool、scheduler、sandbox、MCP、plugin 或 workflow primitives。

#### Scenario: Diagnostics consume shared results / Diagnostics 消费共享结果

- **WHEN** diagnostics needs readiness, privacy, platform, package, approval, or trace data
- **THEN** it consumes shared command-system, observability, platform, distribution, protocol, or testing-regression records rather than private runtime internals
- **中文** 当 diagnostics 需要 readiness、privacy、platform、package、approval 或 trace data 时，必须消费共享 command-system、observability、platform、distribution、protocol 或 testing-regression records，而不是 private runtime internals。
