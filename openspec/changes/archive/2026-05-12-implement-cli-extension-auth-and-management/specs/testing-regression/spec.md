## ADDED Requirements

### Requirement: CLI Extension Management Regression / CLI 扩展管理回归

The regression suite SHALL include deterministic coverage for CLI extension listing, plugin install/apply/snapshot/verify, skill list/activate, credential scope diagnostics, MCP test projection, and text/JSON/JSONL parity.

Regression suite 必须为 CLI extension listing、plugin install/apply/snapshot/verify、skill list/activate、credential scope diagnostics、MCP test projection 和 text/JSON/JSONL parity 提供确定性覆盖。

#### Scenario: Extension CLI smoke is deterministic / 扩展 CLI Smoke 确定
- **WHEN** CLI extension management tests run
- **THEN** they use local manifests, deterministic fakes, fake credentials, and fake/in-process MCP by default without requiring network, live marketplaces, real MCP servers, real credentials, or editor hosts
- **中文** 当 CLI extension management tests 运行时，默认必须使用 local manifests、deterministic fakes、fake credentials 和 fake/in-process MCP，且不要求 network、live marketplaces、real MCP servers、real credentials 或 editor hosts。

#### Scenario: Output parity is tested / 输出一致性被测试
- **WHEN** text, JSON, and JSONL extension outputs are produced for the same fixture
- **THEN** tests assert equivalent target ids, statuses, diagnostics, permission diff counts, credential scope ids, redaction metadata, and reference pit fixture ids
- **中文** 当同一 fixture 产出 text、JSON 和 JSONL extension outputs 时，测试必须断言 target ids、statuses、diagnostics、permission diff counts、credential scope ids、redaction metadata 和 reference pit fixture ids 等价。

### Requirement: Extension Pit Fixture Coverage / 扩展坑位 Fixture 覆盖

Extension management regression SHALL assert reference pit fixture ids for permission expansion, MCP/plugin precedence, immutable env snapshots, diagnostic redaction, and legacy contribution normalization.

Extension management regression 必须断言 permission expansion、MCP/plugin precedence、immutable env snapshots、diagnostic redaction 和 legacy contribution normalization 的 reference pit fixture ids。

#### Scenario: Required pit ids are asserted / 必需坑位 ID 被断言
- **WHEN** extension regression tests serialize evidence
- **THEN** they assert `pit.extension-permission-expansion.permission-diff`, `pit.mcp-plugin-precedence.enterprise-deny`, `pit.env-snapshot.immutable-startup`, `pit.diagnostic-redaction.support-bundle`, and `pit.legacy-contribution-normalization.manifest-boundary` appear in the relevant records
- **中文** 当 extension regression tests 序列化 evidence 时，必须断言相关 records 中出现 `pit.extension-permission-expansion.permission-diff`、`pit.mcp-plugin-precedence.enterprise-deny`、`pit.env-snapshot.immutable-startup`、`pit.diagnostic-redaction.support-bundle` 和 `pit.legacy-contribution-normalization.manifest-boundary`。

#### Scenario: Raw reference source is absent / 原始参考源码不存在
- **WHEN** extension management fixtures or tests are scanned
- **THEN** they contain DeepSeek-owned synthetic manifests and pit ids only, with no copied reference implementation source or tracked `参考/` files
- **中文** 当扫描 extension management fixtures 或 tests 时，它们只能包含 DeepSeek-owned synthetic manifests 和 pit ids，不得包含复制的参考实现源码或 tracked `参考/` files。
