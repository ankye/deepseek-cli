## ADDED Requirements

### Requirement: Policy Pit Fixtures / Policy 坑位 Fixtures

Policy and sandbox behavior SHALL include deterministic negative fixtures for permission bypass, headless approval defaults, shell parser fallback risks, and hard safety checks.

policy 与 sandbox 行为必须包含针对 permission bypass、headless approval defaults、shell parser fallback risks 和 hard safety checks 的确定性负向 fixtures。

#### Scenario: Bypass cannot disable hard safety / Bypass 不能关闭硬安全

- **WHEN** a policy request is labeled as bypass or break-glass but contains raw secret exposure, unsafe path scope, missing sandbox enforcement, or unavailable required platform capability
- **THEN** policy still returns rewrite, deny, require-sandbox, or another non-allow decision with audit evidence
- **中文** 当 policy request 标记为 bypass 或 break-glass，但包含 raw secret exposure、unsafe path scope、missing sandbox enforcement 或 unavailable required platform capability 时，policy 仍必须返回 rewrite、deny、require-sandbox 或其他非 allow decision，并带 audit evidence。

#### Scenario: Headless approval fails closed / Headless 审批 Fail Closed

- **WHEN** headless execution requires approval and no explicit approval decision can be obtained
- **THEN** the approval broker denies by default and records a deterministic reason without mutating workspace state
- **中文** 当 headless execution 需要审批且无法获得显式 approval decision 时，approval broker 必须默认 deny，并记录确定性 reason，且不修改 workspace state。

#### Scenario: Shell parser fallback is explicit / Shell Parser Fallback 显式化

- **WHEN** process execution includes wrappers, env prefixes, pipes, newlines, nested shells, PowerShell syntax, or parser-unavailable fallback
- **THEN** the policy fixture records the shell risk as rejected, sandbox-required, or manually reviewable rather than silently allowing execution
- **中文** 当 process execution 包含 wrappers、env prefixes、pipes、newlines、nested shells、PowerShell syntax 或 parser-unavailable fallback 时，policy fixture 必须将 shell risk 记录为 rejected、sandbox-required 或 manually reviewable，而不是静默 allow execution。
