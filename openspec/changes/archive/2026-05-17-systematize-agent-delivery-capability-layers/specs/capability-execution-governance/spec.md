## ADDED Requirements

### Requirement: Execution Profiles Are Governed Envelope Metadata / Execution Profile 是受治理 Envelope 元数据

Governed execution envelopes SHALL carry execution profile metadata for process-like capabilities, including interactivity, environment policy, timeout class, output bounds, and replay policy.

受治理 execution envelopes 必须为 process-like capabilities 携带 execution profile metadata，包括 interactivity、environment policy、timeout class、output bounds 与 replay policy。

#### Scenario: Noninteractive profile is evaluated before scheduling / 调度前评估 Noninteractive Profile

- **WHEN** a shell, test, git, or external command capability requests a noninteractive profile
- **THEN** policy and sandbox evaluate the requested interactivity level, environment additions, cwd, command summary, timeout, and output bounds before scheduling
- **中文** 当 shell、test、git 或 external command capability 请求 noninteractive profile 时，policy 与 sandbox 必须在调度前评估 requested interactivity level、environment additions、cwd、command summary、timeout 与 output bounds。

#### Scenario: Adapter cannot bypass governed execution / Adapter 不得绕过受治理执行

- **WHEN** an evaluation adapter needs to run a command, check an artifact, or invoke the CLI
- **THEN** it either calls the published CLI surface or a governed runtime capability and records the envelope evidence
- **AND** it does not call lower-level primitives to create product behavior that the CLI cannot reproduce
- **中文** 当 evaluation adapter 需要运行命令、检查 artifact 或调用 CLI 时，必须调用已发布 CLI surface 或受治理 runtime capability 并记录 envelope evidence；不得通过 lower-level primitives 创造 CLI 无法复现的产品行为。

### Requirement: Hidden Prompt Rules Are Not Capability Execution / 隐藏 Prompt 规则不是 Capability Execution

Capability execution governance SHALL treat adapter-only hidden prompt rules as evaluation diagnostics, not as executable product capability.

capability execution governance 必须将 adapter-only hidden prompt rules 视为 evaluation diagnostics，而不是 executable product capability。

#### Scenario: Prompt-only workaround is scored as gap / 仅 Prompt 绕过计为缺口

- **WHEN** a benchmark succeeds only because an adapter injected hidden task-specific instructions outside prompt assembly contracts
- **THEN** delivery evidence records a product-layer gap and the scorecard does not mark the corresponding capability complete
- **中文** 当 benchmark 只有因为 adapter 在 prompt assembly contracts 外注入隐藏任务专用指令才成功时，delivery evidence 必须记录 product-layer gap，scorecard 不得将对应 capability 标记为完成。
