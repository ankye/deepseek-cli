## MODIFIED Requirements

### Requirement: Skill System Regression Coverage / Skill System 回归覆盖

The regression framework SHALL include deterministic unit, contract, integration, golden, compatibility, and matrix coverage for skills v1 without requiring live plugins, external catalogs, network access, or host-specific APIs.

regression framework 必须为 skills v1 提供 deterministic unit、contract、integration、golden、compatibility 和 matrix 覆盖，且不要求 live plugins、external catalogs、network access 或 host-specific APIs。

#### Scenario: Golden replay includes skill activation / golden replay 包含 skill activation

- **WHEN** a golden trace includes trusted skill activation and context segment projection
- **THEN** replay asserts stable manifest schema, loading metadata, context segment fingerprints, redaction metadata, and no raw secret-like content
- **中文** 当 golden trace 包含 trusted skill activation 与 context segment projection 时，replay 必须断言 stable manifest schema、loading metadata、context segment fingerprints、redaction metadata 和无 raw secret-like content。

#### Scenario: Matrix covers trust and loading modes / matrix 覆盖 trust 与 loading modes

- **WHEN** matrix tests run
- **THEN** they cover trusted built-in skills, untrusted workspace skills, disabled skills, malformed manifests, summary-only listing, explicit activation, and bounded projection
- **中文** 当 matrix tests 运行时，必须覆盖 trusted built-in skills、untrusted workspace skills、disabled skills、malformed manifests、summary-only listing、explicit activation 和 bounded projection。

#### Scenario: Compatibility requires skill schemas / compatibility 要求 skill schemas

- **WHEN** compatibility tests inspect skill manifests, activation results, summaries, or context segments
- **THEN** missing or unsupported schema versions fail closed with deterministic diagnostics
- **中文** 当 compatibility tests 检查 skill manifests、activation results、summaries 或 context segments 时，missing 或 unsupported schema versions 必须以 deterministic diagnostics 安全失败。
