## ADDED Requirements

### Requirement: Shell And Test Tools Support Noninteractive Execution / Shell 与 Test 工具支持非交互执行

Shell/process, git-backed evidence, and test command tools SHALL support a governed noninteractive execution profile that prevents pagers, editors, credential prompts, and unbounded terminal state from blocking agent delivery.

shell/process、git-backed evidence 与 test command tools 必须支持受治理的 noninteractive execution profile，防止 pagers、editors、credential prompts 与无边界 terminal state 阻塞 agent delivery。

#### Scenario: Noninteractive command avoids pagers and prompts / 非交互命令避免 Pager 与 Prompt

- **WHEN** a process-like core tool executes with the noninteractive profile
- **THEN** the tool applies platform-appropriate environment policy such as disabling git pagers and credential prompts, bounding output, and marking terminal capabilities as noninteractive
- **AND** the result evidence records the effective profile without exposing secrets
- **中文** 当 process-like core tool 使用 noninteractive profile 执行时，工具必须应用平台适配的 environment policy，例如禁用 git pagers 与 credential prompts、限制输出并将 terminal capabilities 标记为 noninteractive；结果证据必须记录 effective profile 且不暴露 secrets。

#### Scenario: Interactive blocker becomes typed diagnostic / 交互阻塞变成类型化诊断

- **WHEN** a command appears to require a pager, editor, password prompt, TTY input, or other unsupported interactivity
- **THEN** the tool returns a typed diagnostic and bounded output evidence that can feed self-repair
- **中文** 当命令看起来需要 pager、editor、password prompt、TTY input 或其他不支持的交互时，工具必须返回 typed diagnostic 与有界 output evidence，并可进入 self-repair。

### Requirement: Data Artifact Semantics Are Verifiable / 数据产物语义可验证

Core coding tools and artifact checkers SHALL expose enough structured evidence for generated data artifacts to be checked for schema compliance, id/name semantics, referential integrity, and aggregate consistency when such expectations are available.

core coding tools 与 artifact checkers 必须为生成的数据产物暴露足够的结构化证据，以便在存在相关期望时检查 schema compliance、id/name semantics、referential integrity 与 aggregate consistency。

#### Scenario: JSON artifact checker reports semantic mismatch / JSON 产物检查报告语义不匹配

- **WHEN** a generated JSON artifact passes parse checks but violates discovered schema semantics, foreign-key expectations, or aggregate consistency
- **THEN** the checker returns a typed verification failure with bounded diagnostics for repair
- **中文** 当生成的 JSON artifact 通过 parse checks 但违反 discovered schema semantics、foreign-key expectations 或 aggregate consistency 时，checker 必须返回 typed verification failure 与有界 diagnostics 供修复使用。
