## ADDED Requirements

### Requirement: Delivery Capability Contracts Are Host-Neutral / 交付能力契约 Host-Neutral

`@deepseek/platform-contracts` SHALL define serializable, versioned, implementation-free DTOs for project rule evidence, output contracts, verification expectations, verification results, delivery layer summaries, and execution profiles.

`@deepseek/platform-contracts` 必须定义 serializable、versioned、implementation-free DTOs，覆盖 project rule evidence、output contracts、verification expectations、verification results、delivery layer summaries 与 execution profiles。

#### Scenario: Output contract DTO crosses packages / Output Contract DTO 跨包传递

- **WHEN** CLI, runtime, prompt assembly, verifier, testing regression, or evaluation code needs to describe a JSON, schema, file artifact, command plan, or completion criterion
- **THEN** it uses shared output-contract DTOs from `platform-contracts`
- **AND** the DTO contains schema version, contract kind, required artifacts, validation hints, redaction metadata, and replay fingerprints without concrete implementation objects
- **中文** 当 CLI、runtime、prompt assembly、verifier、testing regression 或 evaluation code 需要描述 JSON、schema、file artifact、command plan 或 completion criterion 时，必须使用 `platform-contracts` 的共享 output-contract DTO；该 DTO 必须包含 schema version、contract kind、required artifacts、validation hints、redaction metadata 与 replay fingerprints，且不包含 concrete implementation objects。

#### Scenario: Execution profile DTO is platform agnostic / Execution Profile DTO 平台无关

- **WHEN** a shell, test, git, external harness, or future host execution path requests noninteractive behavior
- **THEN** the request carries an execution profile DTO with intent, environment policy, timeout class, interactivity policy, and redaction metadata
- **AND** `platform-contracts` does not import Node process APIs, shell implementations, or host adapter code
- **中文** 当 shell、test、git、external harness 或未来 host execution path 请求 noninteractive behavior 时，请求必须携带 execution profile DTO，包含 intent、environment policy、timeout class、interactivity policy 与 redaction metadata；`platform-contracts` 不得导入 Node process APIs、shell implementations 或 host adapter code。

### Requirement: Delivery Layer Summary Is Scoreable / 交付层摘要可评分

Delivery layer summaries SHALL distinguish passed, failed, partial, missing, fake, disabled, unavailable, not applicable, and not assessed outcomes.

Delivery layer summaries 必须区分 passed、failed、partial、missing、fake、disabled、unavailable、not applicable 与 not assessed outcomes。

#### Scenario: Fake implementation cannot masquerade as complete / Fake 实现不能伪装完成

- **WHEN** a delivery layer is backed only by deterministic fakes, adapter-only behavior, or in-memory test scaffolding
- **THEN** its summary status is `fake`, `not_assessed`, or `missing` rather than `passed`
- **中文** 当某个交付层只由 deterministic fakes、adapter-only behavior 或 in-memory test scaffolding 支撑时，其 summary status 必须为 `fake`、`not_assessed` 或 `missing`，而不是 `passed`。
