# evidence-first-agent-workflow Specification

## Purpose
Define evidence-first agent workflow requirements for grounding actions in gathered context, policy decisions, verification, and traceable outcomes.

定义 evidence-first agent workflow 对 context grounding、policy decisions、verification 与可追踪 outcomes 的要求。

## Requirements
### Requirement: Fact-Sensitive Tasks Require Evidence / 事实敏感任务必须搜证

The system SHALL require an evidence discovery phase before producing answers, edits, generated artifacts, command recommendations, product copy, release notes, or evaluation conclusions for fact-sensitive project tasks.

系统必须在为事实敏感项目任务产出回答、编辑、生成产物、命令建议、产品文案、发布说明或评估结论之前，先执行 evidence discovery phase。

#### Scenario: Current project task triggers evidence discovery / 当前项目任务触发搜证
- **WHEN** the user asks about the current repository, product, CLI commands, package metadata, architecture, roadmap, generated product page, release state, code behavior, or evaluation comparison
- **THEN** the agent workflow creates an evidence plan and inspects relevant local project sources before producing factual output
- **中文** 当用户询问当前仓库、产品、CLI 命令、package metadata、架构、路线图、生成产品页、发布状态、代码行为或评估对比时，agent workflow 必须先创建 evidence plan 并检查相关本地项目来源，再产出事实性输出。

#### Scenario: User does not need to ask for evidence / 用户无需额外要求搜证
- **WHEN** a task is fact-sensitive by content or workspace context
- **THEN** evidence discovery is required even if the user did not explicitly say "verify", "read the repo", "search evidence", or "cite sources"
- **中文** 当任务因内容或 workspace context 属于 fact-sensitive 时，即使用户没有明确说“验证”、“读仓库”、“搜证”或“引用来源”，也必须执行 evidence discovery。

### Requirement: Evidence Plans Are Explicit / 证据计划显式化

The system SHALL create an evidence plan that declares why evidence is required, which fact classes must be grounded, which sources are eligible, and what blocks output.

系统必须创建 evidence plan，声明为什么需要证据、哪些 fact classes 必须接地、哪些 sources 可用，以及什么条件会阻断输出。

#### Scenario: Evidence plan declares required source coverage / 证据计划声明来源覆盖
- **WHEN** a fact-sensitive task begins
- **THEN** the evidence plan records required fact classes, candidate source groups, minimum source coverage, freshness policy, redaction policy, and stop conditions
- **中文** 当 fact-sensitive task 开始时，evidence plan 必须记录 required fact classes、candidate source groups、minimum source coverage、freshness policy、redaction policy 与 stop conditions。

#### Scenario: Missing evidence blocks factual claims / 缺少证据阻断事实声明
- **WHEN** required evidence cannot be found or cannot be safely projected
- **THEN** the workflow either asks for clarification, marks the relevant claim as unknown or assumption, or blocks the artifact from being scored as solved
- **中文** 当 required evidence 找不到或无法安全投影时，workflow 必须请求澄清、将相关声明标为 unknown 或 assumption，或阻止该产物评分为 solved。

### Requirement: Evidence Manifests Ground Output Claims / 证据清单接地输出声明

The system SHALL produce evidence manifests for generated artifacts or reports that make project/product claims.

系统必须为包含项目/产品声明的生成产物或报告生成 evidence manifests。

#### Scenario: Generated product page carries manifest / 生成产品页携带清单
- **WHEN** the agent generates a product webpage for DeepSeek CLI or another project artifact
- **THEN** the generated output includes an evidence manifest that references inspected source files, fact classes, claim groundings, assumptions, unsupported claim count, and redaction metadata
- **中文** 当 agent 为 DeepSeek CLI 或其他项目产物生成产品网页时，生成输出必须包含 evidence manifest，引用已检查 source files、fact classes、claim groundings、assumptions、unsupported claim count 与 redaction metadata。

#### Scenario: Report carries claim grounding / 报告携带声明接地
- **WHEN** the agent produces an evaluation report, competitive comparison, release note, or roadmap summary
- **THEN** the report evidence includes claim grounding records for commands, package names, feature claims, release status, benchmark/evaluation conclusions, and assumptions
- **中文** 当 agent 产出 evaluation report、competitive comparison、release note 或 roadmap summary 时，报告 evidence 必须包含 commands、package names、feature claims、release status、benchmark/evaluation conclusions 与 assumptions 的 claim grounding records。

### Requirement: Claims Have Certainty Classes / 声明具有确定性分类

The system SHALL classify factual claims as verified, inferred, assumption, or unsupported before final output is accepted.

系统必须在最终输出被接受前，将事实声明分类为 verified、inferred、assumption 或 unsupported。

#### Scenario: Verified claim cites evidence / 已验证声明引用证据
- **WHEN** a claim is marked verified
- **THEN** it references one or more evidence items that directly support the claim
- **中文** 当 claim 被标记为 verified 时，它必须引用一个或多个直接支持该声明的 evidence items。

#### Scenario: Unsupported claim is not silently emitted / 未支持声明不得静默输出
- **WHEN** a claim has no evidence and is not explicitly allowed as an assumption
- **THEN** the workflow removes it, rewrites it as unknown, asks for clarification, or fails the relevant artifact check
- **中文** 当 claim 没有证据且未被明确允许作为 assumption 时，workflow 必须移除它、改写为 unknown、请求澄清，或让相关 artifact check 失败。

### Requirement: Command And Package Claims Are Strict / 命令与包声明严格校验

The system SHALL treat install commands, executable names, package names, CLI subcommands, flags, and release availability as strict claims that require direct evidence.

系统必须将安装命令、可执行名、package names、CLI subcommands、flags 与发布可用性视为需要直接证据的严格声明。

#### Scenario: Nonexistent command is rejected / 不存在命令被拒绝
- **WHEN** generated output claims an install or run command such as `npx deepseek-cli init`
- **THEN** the claim must be supported by package metadata, README, command index, or command parser evidence, otherwise the output is flagged with an unsupported-command diagnostic
- **中文** 当生成输出声明 `npx deepseek-cli init` 等安装或运行命令时，该声明必须由 package metadata、README、command index 或 command parser evidence 支持，否则输出必须被标记为 unsupported-command diagnostic。

#### Scenario: Package identity uses canonical metadata / Package 身份使用规范元数据
- **WHEN** generated output names the published CLI package or executable
- **THEN** it uses canonical package metadata and bin metadata from the repository rather than model-invented aliases
- **中文** 当生成输出命名已发布 CLI package 或 executable 时，必须使用仓库中的规范 package metadata 与 bin metadata，而不是模型虚构别名。

### Requirement: Assumptions Are Explicit / 假设必须显式

The system SHALL allow assumption-based output only when the user asks for speculative work or evidence is unavailable and the output clearly labels assumptions.

系统仅在用户要求 speculative work，或证据不可用且输出明确标注 assumptions 时，才允许 assumption-based output。

#### Scenario: Creative task can proceed with assumptions / 创意任务可带假设推进
- **WHEN** the user explicitly asks for brainstorming, fictional copy, future vision, or non-factual creative variants
- **THEN** the workflow may proceed without full evidence coverage but marks assumption-based content and prevents it from being scored as factual product evidence
- **中文** 当用户明确要求 brainstorming、fictional copy、future vision 或非事实创意变体时，workflow 可以在不完整 evidence coverage 下推进，但必须标注 assumption-based content，并防止其被评分为 factual product evidence。

#### Scenario: Fact task cannot hide assumptions / 事实任务不得隐藏假设
- **WHEN** the task is fact-sensitive and generated output includes inferred or assumption-based content
- **THEN** the output or manifest identifies those claims separately from verified claims
- **中文** 当任务为 fact-sensitive 且生成输出包含 inferred 或 assumption-based content 时，输出或 manifest 必须将这些声明与 verified claims 分开标识。

