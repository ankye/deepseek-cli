# cli-diagnostics-release-readiness Specification

## Purpose
TBD - created by archiving change polish-cli-diagnostics-and-release-readiness. Update Purpose after archive.
## Requirements
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

The CLI SHALL provide release-readiness evidence before publishing or host promotion, including both individual latest verification artifacts and the generated acceptance evidence index in text and structured output modes.

CLI 必须在发布或 host promotion 前提供 release-readiness evidence，且必须在 text 与 structured output modes 中同时包含单独的 latest verification artifacts 与生成的 acceptance evidence index。

#### Scenario: Package surface is checked / Package Surface 被检查

- **WHEN** release readiness runs for the CLI npm package
- **THEN** evidence includes package name, version, bin entry, build output path, expected tarball files, publish access, and a status for generated bundles being excluded from source commits
- **中文** 当 release readiness 针对 CLI npm package 运行时，evidence 必须包含 package name、version、bin entry、build output path、expected tarball files、publish access，以及 generated bundles 不进入源码提交面的状态。

#### Scenario: Acceptance evidence is linked / 验收证据被链接

- **WHEN** release readiness is rendered
- **THEN** output links or lists the generated acceptance index, OpenSpec validation, typecheck, lint, unit/contract/integration/golden/matrix/e2e tests, CLI build, headless smoke, boundary checks, and reference hygiene evidence in text and structured output modes
- **中文** 当 release readiness 被渲染时，output 必须在 text 与 structured output modes 链接或列出 generated acceptance index、OpenSpec validation、typecheck、lint、unit/contract/integration/golden/matrix/e2e tests、CLI build、headless smoke、boundary checks 和 reference hygiene evidence。

### Requirement: Diagnostics Remain Host Adapter Work / 诊断保持 Host Adapter 职责

CLI diagnostics SHALL render and assemble evidence without directly executing model, tool, scheduler, sandbox, MCP, plugin, or workflow primitives.

CLI diagnostics 必须只渲染和组装 evidence，不得直接执行 model、tool、scheduler、sandbox、MCP、plugin 或 workflow primitives。

#### Scenario: Diagnostics consume shared results / Diagnostics 消费共享结果

- **WHEN** diagnostics needs readiness, privacy, platform, package, approval, or trace data
- **THEN** it consumes shared command-system, observability, platform, distribution, protocol, or testing-regression records rather than private runtime internals
- **中文** 当 diagnostics 需要 readiness、privacy、platform、package、approval 或 trace data 时，必须消费共享 command-system、observability、platform、distribution、protocol 或 testing-regression records，而不是 private runtime internals。

### Requirement: CLI Doctor Shows Index Provider Diagnostics / CLI Doctor 显示 Index Provider 诊断

CLI diagnostics and readiness doctor SHALL surface index provider status from shared provider diagnostics without direct SDK imports, live model calls, vector database calls, or raw credential reads.

CLI diagnostics 与 readiness doctor 必须从 shared provider diagnostics 暴露 index provider status，不得直接导入 SDK、发起 live model calls、调用 vector database 或读取 raw credentials。

#### Scenario: Doctor includes provider summary / Doctor 包含 Provider Summary
- **WHEN** a user runs `deepseek diagnostics doctor` or `deepseek readiness doctor`
- **THEN** the result includes PageIndex, ZVec, and code-index status checks plus bounded provider summary metadata
- **中文** 当用户运行 `deepseek diagnostics doctor` 或 `deepseek readiness doctor` 时，结果必须包含 PageIndex、ZVec 与 code-index status checks，以及有界 provider summary metadata。

#### Scenario: Structured provider diagnostics stay terminal-safe / 结构化 Provider 诊断保持终端安全
- **WHEN** diagnostics doctor is rendered as JSON or JSONL
- **THEN** index provider diagnostics are valid JSON objects with stable `kind` or check ids, redaction metadata, and no ANSI, cursor state, raw secrets, SDK instances, or host UI objects
- **中文** 当 diagnostics doctor 以 JSON 或 JSONL 渲染时，index provider diagnostics 必须是有效 JSON objects，包含稳定 `kind` 或 check ids、redaction metadata，且不包含 ANSI、cursor state、raw secrets、SDK instances 或 host UI objects。

### Requirement: CLI Doctor Reports Provider Manifest Source / CLI Doctor 报告 Provider Manifest 来源

CLI diagnostics and readiness doctor SHALL report index provider manifest source, activation evidence status, and validation diagnostics from shared provider normalization without exposing raw secrets or executing provider SDKs; text output SHALL include the same missing-evidence reason that structured output carries.

CLI diagnostics 与 readiness doctor 必须从 shared provider normalization 报告 index provider manifest source、activation evidence status 与 validation diagnostics，且不得暴露 raw secrets 或执行 provider SDKs；text output 必须包含 structured output 携带的同一 missing-evidence reason。

#### Scenario: Doctor includes manifest source metadata / Doctor 包含 Manifest Source Metadata
- **WHEN** a user runs `deepseek diagnostics doctor` or `deepseek readiness doctor`
- **THEN** provider diagnostics include manifest source scope, source id, provider count, effective statuses, requested statuses when downgraded, activation evidence statuses, and validation diagnostic codes
- **中文** 当用户运行 `deepseek diagnostics doctor` 或 `deepseek readiness doctor` 时，provider diagnostics 必须包含 manifest source scope、source id、provider count、effective statuses、降级时的 requested statuses、activation evidence statuses，以及 validation diagnostic codes。

#### Scenario: Doctor does not execute configured semantic providers / Doctor 不执行已配置 Semantic Providers
- **WHEN** a manifest requests ZVec, embedding, or code-index enablement
- **THEN** doctor output is produced from shared manifest normalization only and does not call vector databases, embedding providers, model providers, code analyzers, or credential resolvers for those providers
- **中文** 当 manifest 请求启用 ZVec、embedding 或 code-index 时，doctor output 必须只来自 shared manifest normalization，不得调用 vector databases、embedding providers、model providers、code analyzers 或这些 providers 的 credential resolvers。

#### Scenario: Doctor reports missing activation evidence / Doctor 报告缺失 Activation Evidence
- **WHEN** a semantic provider is requested as `enabled` but the shared resolver downgrades it because activation evidence is missing or unknown
- **THEN** doctor output includes the effective `deferred` status, requested `enabled` status, missing evidence kinds, and typed diagnostic codes in text and structured modes without exposing provider credentials or SDK objects
- **中文** 当 semantic provider 被请求为 `enabled`，但 shared resolver 因 activation evidence 缺失或 unknown 而将其降级时，doctor output 必须在 text 与 structured modes 包含 effective `deferred` status、requested `enabled` status、missing evidence kinds 与 typed diagnostic codes，且不得暴露 provider credentials 或 SDK objects。

### Requirement: CLI Index Provider Command Is Local And Safe / CLI Index Provider 命令本地且安全

The CLI SHALL expose local `index-provider status` and `index-provider set` commands that inspect and persist provider manifest intent without executing semantic providers, live model calls, vector databases, code analyzers, or credential resolvers.

CLI 必须暴露本地 `index-provider status` 与 `index-provider set` 命令，用于检查和持久化 provider manifest intent，且不得执行 semantic providers、live model calls、vector databases、code analyzers 或 credential resolvers。

#### Scenario: Status renders effective provider diagnostics / Status 渲染 Effective Provider Diagnostics
- **WHEN** a user runs `deepseek index-provider status`
- **THEN** the CLI renders manifest source, provider count, requested statuses, effective statuses, implementation evidence, and validation diagnostic codes in text and structured modes
- **中文** 当用户运行 `deepseek index-provider status` 时，CLI 必须在 text 与 structured modes 渲染 manifest source、provider count、requested statuses、effective statuses、implementation evidence 与 validation diagnostic codes。

#### Scenario: Set previews normalized result / Set 预览归一化结果
- **WHEN** a user runs `deepseek index-provider set zvec enabled`
- **THEN** the CLI writes safe provider intent and outputs the normalized result showing `zvec` requested as `enabled` while effective status remains `deferred` until implementation evidence exists
- **中文** 当用户运行 `deepseek index-provider set zvec enabled` 时，CLI 必须写入安全 provider intent，并输出 normalized result，显示 `zvec` requested 为 `enabled`，但在 implementation evidence 存在前 effective status 仍为 `deferred`。

### Requirement: Index Provider Safety Appears In Readiness Evidence / Index Provider 安全性进入可用性证据

CLI diagnostics and release readiness evidence SHALL include test or evidence references for index provider status/configuration safety, activation evidence gating, and text-mode evidence rendering when the index-provider command surface is present.

当 index-provider command surface 存在时，CLI diagnostics 与 release readiness evidence 必须包含 index provider status/configuration safety、activation evidence gating 与 text-mode evidence rendering 的测试或证据引用。

#### Scenario: Release evidence covers local provider intent safety / 发布证据覆盖本地 Provider Intent 安全
- **WHEN** release readiness evidence is generated or reviewed
- **THEN** it identifies the local readiness or e2e suite that proves `index-provider set` writes only provider intent and does not execute semantic providers or expose raw secrets
- **中文** 当生成或评审 release readiness evidence 时，必须标识 local readiness 或 e2e suite，证明 `index-provider set` 只写入 provider intent，不执行 semantic providers，也不暴露 raw secrets。

#### Scenario: Release evidence covers provider activation evidence gate / 发布证据覆盖 Provider Activation Evidence Gate
- **WHEN** release readiness evidence is generated or reviewed
- **THEN** it identifies the contract suite that proves semantic providers remain deferred unless required activation evidence is present
- **中文** 当生成或评审 release readiness evidence 时，必须标识 contract suite，证明 semantic providers 在缺少 required activation evidence 时保持 deferred。

#### Scenario: Release evidence covers text-mode provider evidence / 发布证据覆盖 Text Mode Provider Evidence
- **WHEN** release readiness evidence is generated or reviewed
- **THEN** it identifies the CLI or e2e suite that proves `index-provider` and `diagnostics doctor` text output render activation evidence and missing-evidence reasons without terminal controls or raw secrets
- **中文** 当生成或评审 release readiness evidence 时，必须标识 CLI 或 e2e suite，证明 `index-provider` 与 `diagnostics doctor` text output 会渲染 activation evidence 与 missing-evidence reasons，且不包含 terminal controls 或 raw secrets。

### Requirement: Release Diagnostics Verify Local Evidence Gates / Release 诊断验证本地证据门禁

CLI release diagnostics SHALL report structured local evidence for acceptance files, build artifacts, and npm package surface safety before declaring the CLI release gate ready.

CLI release diagnostics 必须报告 acceptance files、build artifacts 与 npm package surface safety 的结构化本地证据，然后才能声明 CLI release gate ready。

#### Scenario: Missing build artifact fails release readiness / 缺失构建产物导致发布就绪失败

- **WHEN** `diagnostics release` runs and the configured CLI build output path is missing
- **THEN** release readiness status is `fail`, the failed check cites the missing build output path, and suggested actions include running the CLI build command
- **中文** 当 `diagnostics release` 运行且配置的 CLI build output path 缺失时，release readiness status 必须为 `fail`，失败 check 必须引用缺失 build output path，并建议运行 CLI build command。

#### Scenario: Missing acceptance evidence warns release readiness / 缺失验收证据导致发布就绪警告

- **WHEN** `diagnostics release` runs and one or more declared acceptance evidence files are missing
- **THEN** release readiness status is at least `warn`, JSON/JSONL output lists missing evidence paths, and text output renders the same evidence gate summary
- **中文** 当 `diagnostics release` 运行且一个或多个声明的 acceptance evidence 文件缺失时，release readiness status 至少为 `warn`，JSON/JSONL output 必须列出 missing evidence paths，text output 必须渲染同一 evidence gate summary。

#### Scenario: Unsafe package surface fails release readiness / 不安全包内容导致发布就绪失败

- **WHEN** CLI package metadata would include files outside README, dist output, and package metadata
- **THEN** release readiness status is `fail` and diagnostics report the unexpected package paths without exposing local secrets or ignored reference material
- **中文** 当 CLI package metadata 会包含 README、dist output 与 package metadata 之外的文件时，release readiness status 必须为 `fail`，diagnostics 必须报告 unexpected package paths，且不暴露本地 secrets 或 ignored reference material。

### Requirement: Release Evidence Rendering Remains Parity Safe / Release 证据渲染保持一致安全

CLI diagnostics release text, JSON, and JSONL output SHALL derive from the same structured release evidence records.

CLI diagnostics release 的 text、JSON 与 JSONL 输出必须来自同一套 structured release evidence records。

#### Scenario: Text and JSONL share release gates / Text 与 JSONL 共享发布门禁

- **WHEN** `diagnostics release` renders local evidence gate checks
- **THEN** text output and JSONL output include the same build artifact status, acceptance evidence status, and package surface status without terminal control sequences
- **中文** 当 `diagnostics release` 渲染本地 evidence gate checks 时，text output 与 JSONL output 必须包含同一 build artifact status、acceptance evidence status 与 package surface status，且不得包含 terminal control sequences。

### Requirement: CLI Diagnostics Verify Summarizes Release Gates / CLI Diagnostics Verify 汇总发布门禁

CLI diagnostics SHALL expose a read-only `diagnostics verify` command that derives a decision-ready release verification summary from the same structured evidence used by `diagnostics release`.

CLI diagnostics 必须暴露只读 `diagnostics verify` 命令，并从 `diagnostics release` 使用的同一套结构化证据中派生可决策的发布验证 summary。

#### Scenario: Verify reports blocking release checks / Verify 报告阻塞发布检查

- **WHEN** `deepseek diagnostics verify` runs and any release readiness check has status `fail`
- **THEN** the command reports verification status `blocked`, lists the blocking check ids and messages, includes the next suggested action, and does not run publish, network, model, provider, or full test commands
- **中文** 当 `deepseek diagnostics verify` 运行且任意 release readiness check 状态为 `fail` 时，命令必须报告 verification status 为 `blocked`，列出 blocking check ids 与 messages，包含下一条 suggested action，并且不得运行 publish、network、model、provider 或完整测试命令。

#### Scenario: Verify reports warning release checks / Verify 报告警告发布检查

- **WHEN** `deepseek diagnostics verify` runs and release readiness has warnings but no failures
- **THEN** the command reports verification status `warn`, lists warning check ids, missing acceptance evidence paths when present, and the command plan needed before publishing
- **中文** 当 `deepseek diagnostics verify` 运行且 release readiness 有 warning 但没有 failure 时，命令必须报告 verification status 为 `warn`，列出 warning check ids、存在时的 missing acceptance evidence paths，以及发布前所需 command plan。

#### Scenario: Verify reports publish-dry-run readiness / Verify 报告 Publish Dry-Run 就绪

- **WHEN** `deepseek diagnostics verify` runs and release readiness status is `pass`
- **THEN** the command reports verification status `ready`, includes the publish dry-run command as the next action, and preserves the underlying release evidence in JSON and JSONL output
- **中文** 当 `deepseek diagnostics verify` 运行且 release readiness status 为 `pass` 时，命令必须报告 verification status 为 `ready`，将 publish dry-run command 作为 next action，并在 JSON 与 JSONL output 中保留底层 release evidence。

### Requirement: CLI Diagnostics Verify Rendering Is Parity Safe / CLI Diagnostics Verify 渲染保持一致安全

CLI diagnostics verify text, JSON, and JSONL output SHALL derive from the same verification summary and release evidence records without terminal controls or raw secrets.

CLI diagnostics verify 的 text、JSON 与 JSONL output 必须来自同一 verification summary 和 release evidence records，且不得包含 terminal controls 或 raw secrets。

#### Scenario: Verify JSONL is scriptable / Verify JSONL 可脚本化

- **WHEN** `deepseek diagnostics verify --output jsonl` runs
- **THEN** every emitted line is a valid JSON object with stable `kind`, schema version, status, redaction metadata, and no ANSI, cursor state, raw secrets, SDK instances, or host UI objects
- **中文** 当 `deepseek diagnostics verify --output jsonl` 运行时，每一行都必须是有效 JSON object，包含稳定 `kind`、schema version、status、redaction metadata，且不包含 ANSI、cursor state、raw secrets、SDK instances 或 host UI objects。

### Requirement: CLI Diagnostics Refresh Regenerates Acceptance Evidence / CLI Diagnostics Refresh 重新生成验收证据

CLI diagnostics SHALL expose a controlled `diagnostics refresh` command that regenerates local acceptance evidence files through built-in allowlisted validation plans.

CLI diagnostics 必须暴露受控的 `diagnostics refresh` 命令，通过内置 allowlisted validation plans 重新生成本地 acceptance evidence files。

#### Scenario: Default refresh writes release-critical evidence / 默认 Refresh 写入发布关键证据

- **WHEN** `deepseek diagnostics refresh` runs from the repository root
- **THEN** it runs only the default allowlisted release-critical plan, writes command output to `tests/acceptance/latest/*.txt`, includes `release-verify.txt`, and emits a summary with refreshed paths, exit codes, status, and next action
- **中文** 当 `deepseek diagnostics refresh` 从 repository root 运行时，它必须只运行默认 allowlisted release-critical plan，将命令输出写入 `tests/acceptance/latest/*.txt`，包含 `release-verify.txt`，并输出包含 refreshed paths、exit codes、status 与 next action 的 summary。

#### Scenario: Full refresh extends the allowlist / Full Refresh 扩展 Allowlist

- **WHEN** `deepseek diagnostics refresh --full` runs
- **THEN** it includes the default refresh plan plus heavier deterministic suites such as contracts, integration, golden, versioning, matrix, and e2e, while still rejecting user-supplied command strings
- **中文** 当 `deepseek diagnostics refresh --full` 运行时，它必须包含默认 refresh plan，并额外包含 contracts、integration、golden、versioning、matrix 与 e2e 等更重但确定性的 suites，同时仍然拒绝用户自定义 command strings。

#### Scenario: Refresh does not execute unsafe commands / Refresh 不执行不安全命令

- **WHEN** `diagnostics refresh` receives extra positional arguments or command-like input
- **THEN** the CLI reports typed diagnostics and does not execute publish, network, model, provider, live-test, or arbitrary shell commands
- **中文** 当 `diagnostics refresh` 收到额外 positional arguments 或类似 command 的输入时，CLI 必须报告 typed diagnostics，且不得执行 publish、network、model、provider、live-test 或任意 shell commands。

### Requirement: CLI Diagnostics Refresh Rendering Is Evidence Safe / CLI Diagnostics Refresh 渲染保持证据安全

CLI diagnostics refresh text, JSON, and JSONL output SHALL derive from the same refresh summary records and SHALL not expose raw secrets or terminal controls.

CLI diagnostics refresh 的 text、JSON 与 JSONL output 必须来自同一套 refresh summary records，且不得暴露 raw secrets 或 terminal controls。

#### Scenario: Refresh JSONL is scriptable / Refresh JSONL 可脚本化

- **WHEN** `deepseek diagnostics refresh --output jsonl` runs
- **THEN** each line is a valid JSON object with stable `kind`, schema version, step id, output path, exit code, redaction metadata, and no ANSI/cursor state/raw secrets
- **中文** 当 `deepseek diagnostics refresh --output jsonl` 运行时，每一行都必须是有效 JSON object，包含稳定 `kind`、schema version、step id、output path、exit code、redaction metadata，且不包含 ANSI/cursor state/raw secrets。
