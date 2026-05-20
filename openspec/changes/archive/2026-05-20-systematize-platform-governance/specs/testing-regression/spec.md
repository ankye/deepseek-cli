## ADDED Requirements

### Requirement: Package Evidence Matrix / 包级证据矩阵

The regression suite SHALL produce or validate a package-level evidence matrix that separates lint, contract, integration, golden, matrix, e2e, live smoke, and acceptance evidence.

回归套件必须生成或校验包级证据矩阵，分别记录 lint、contract、integration、golden、matrix、e2e、live smoke 与 acceptance evidence。

#### Scenario: Evidence matrix distinguishes coverage types / 证据矩阵区分覆盖类型

- **WHEN** tests or acceptance tooling summarize package readiness
- **THEN** the matrix records which evidence types exist for each risk-bearing package and does not treat contract-only coverage as product readiness
- **中文** 当测试或验收工具汇总 package readiness 时，矩阵必须记录每个有风险 package 具备哪些证据类型，且不得把仅有 contract coverage 当作产品就绪。

#### Scenario: Sparse product coverage is visible / 稀疏产品覆盖可见

- **WHEN** e2e or live smoke coverage is sparse compared with package count or host surface claims
- **THEN** the evidence matrix reports a warning or release-blocking governance finding according to the configured launch gate
- **中文** 当 e2e 或 live smoke 覆盖相对 package 数量或 host surface 声明偏稀疏时，证据矩阵必须根据配置的 launch gate 报告 warning 或 release-blocking 治理发现。

### Requirement: Governance Fixture Coverage / 治理 Fixture 覆盖

Regression coverage SHALL include deterministic fixtures for ghost aliases, placeholder claims, deferred providers, rollout-gated modes, and host promotion gates.

回归覆盖必须包含关于幽灵 alias、占位声明、deferred providers、rollout-gated modes 与 host promotion gates 的确定性 fixtures。

#### Scenario: Ghost alias fixture fails lint / 幽灵 Alias Fixture 触发 Lint

- **WHEN** a fixture contains a `@deepseek/*` alias whose package target is missing and has no retired/merged governance record
- **THEN** the lint or regression test reports a stable governance diagnostic id
- **中文** 当 fixture 包含指向缺失 package 且没有 retired/merged 治理记录的 `@deepseek/*` alias 时，lint 或 regression test 必须报告稳定 governance diagnostic id。

#### Scenario: Placeholder claim fixture fails readiness / 占位声明 Fixture 触发 Readiness 失败

- **WHEN** a fixture claims remote, update, semantic indexing, or host promotion capability is product-ready while only placeholder or deferred evidence exists
- **THEN** readiness reports a release-blocking governance diagnostic
- **中文** 当 fixture 声称 remote、update、semantic indexing 或 host promotion 能力产品就绪，但只有 placeholder 或 deferred 证据时，readiness 必须报告 release-blocking governance diagnostic。

### Requirement: Governance Evidence Is Replay-Safe / 治理证据可 Replay

Governance findings SHALL be deterministic, redaction-aware, and suitable for golden replay and acceptance evidence.

治理发现必须确定性、具备 redaction，并适合 golden replay 与 acceptance evidence。

#### Scenario: Governance output is stable / 治理输出稳定

- **WHEN** the same repository state is evaluated twice
- **THEN** governance finding ids, maturity states, severities, and evidence references are stable except for explicitly allowed timestamps or environment metadata
- **中文** 当同一仓库状态被评估两次时，治理 finding id、成熟度状态、严重度和 evidence references 必须稳定，除非是显式允许的时间戳或环境元数据。

### Requirement: Kernel Governance Regression Fixtures / 内核治理回归 Fixtures

Regression coverage SHALL include deterministic fixtures for runtime kernel boundary violations, UAPI breaking changes, policy bypass attempts, unscoped agent writes, module private-object access, central-file growth, and context prefix instability.

回归覆盖必须包含 runtime kernel boundary violations、UAPI breaking changes、policy bypass attempts、unscoped agent writes、module private-object access、central-file growth 与 context prefix instability 的确定性 fixtures。

#### Scenario: Policy bypass fixture fails / Policy 绕过 Fixture 失败

- **WHEN** a fixture package attempts to execute file, shell, credential, plugin, MCP, or remote work without a policy decision record
- **THEN** regression tests produce a stable governance diagnostic and fail the readiness gate for the fixture
- **中文** 当 fixture package 尝试在没有 policy decision record 的情况下执行 file、shell、credential、plugin、MCP 或 remote work 时，回归测试必须产生稳定 governance diagnostic，并使该 fixture 的 readiness gate 失败。

#### Scenario: Unscoped agent fixture fails / 未限定 Scope 的 Agent Fixture 失败

- **WHEN** a fixture proposes write-capable worker execution without path, tool, budget, scratchpad, checkpoint, and lineage scopes
- **THEN** regression tests report missing agent namespace/quota evidence
- **中文** 当 fixture 在缺少 path、tool、budget、scratchpad、checkpoint 与 lineage scopes 时提议可写 worker execution，回归测试必须报告缺失 agent namespace/quota evidence。
