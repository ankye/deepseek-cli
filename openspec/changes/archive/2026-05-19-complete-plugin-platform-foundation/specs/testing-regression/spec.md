## ADDED Requirements

### Requirement: Complete Plugin Platform Regression Matrix / 完整插件平台回归矩阵

The regression suite SHALL cover plugin lifecycle, API levels, contribution catalog, hooks, permissions, credentials, dependency resolution, conflicts, compatibility, rollback, health, host projection, and runtime governance.

Regression suite 必须覆盖 plugin lifecycle、API levels、contribution catalog、hooks、permissions、credentials、dependency resolution、conflicts、compatibility、rollback、health、host projection 与 runtime governance。

#### Scenario: Lifecycle matrix covers every state / 生命周期矩阵覆盖所有状态
- **WHEN** plugin lifecycle tests run
- **THEN** they cover discovered, validated, resolved, installed, enabled, activated, degraded, disabled, uninstalled, quarantined, update-staged, updated, rollback-ready, rolled-back, and health-checked states with deterministic replay fingerprints
- **中文** 当 plugin lifecycle tests 运行时，必须覆盖 discovered、validated、resolved、installed、enabled、activated、degraded、disabled、uninstalled、quarantined、update-staged、updated、rollback-ready、rolled-back 与 health-checked 状态，并带确定性 replay fingerprints。

#### Scenario: Catalog matrix covers contribution kinds / 目录矩阵覆盖贡献类型
- **WHEN** plugin catalog tests run
- **THEN** they cover command, action, target resolver, result-list provider, keymap, palette entry, render hint, hook, skill, tool, MCP connector, agent, context provider, memory/cache provider, workflow template, model profile, config fragment, diagnostics provider, and resource bundle descriptors
- **中文** 当 plugin catalog tests 运行时，必须覆盖 command、action、target resolver、result-list provider、keymap、palette entry、render hint、hook、skill、tool、MCP connector、agent、context provider、memory/cache provider、workflow template、model profile、config fragment、diagnostics provider 与 resource bundle descriptors。

#### Scenario: Governance matrix blocks private execution / 治理矩阵阻止私有执行
- **WHEN** malformed or malicious plugin fixtures attempt private callbacks, host layout mutation, runtime kernel access, raw credential access, direct filesystem/process/network imports, or undeclared owner routes
- **THEN** tests assert deterministic validation or activation denial before projection or execution
- **中文** 当 malformed 或 malicious plugin fixtures 尝试 private callbacks、host layout mutation、runtime kernel access、raw credential access、direct filesystem/process/network imports 或 undeclared owner routes 时，测试必须断言在 projection 或 execution 前发生确定性 validation 或 activation denial。

### Requirement: Plugin Host Projection Regression / 插件 Host 投影回归

Plugin projection tests SHALL cover CLI text, TUI inspector, JSON, JSONL, diagnostics, and future host descriptors without executing plugin handlers.

Plugin projection tests 必须覆盖 CLI text、TUI inspector、JSON、JSONL、diagnostics 与未来 host descriptors，且不得执行 plugin handlers。

#### Scenario: Projection remains inert / 投影保持惰性
- **WHEN** projection tests request all plugin states and contribution kinds
- **THEN** counters prove no command handler, hook handler, tool handler, MCP call, model call, filesystem mutation, process execution, or host callback ran
- **中文** 当 projection tests 请求所有 plugin states 与 contribution kinds 时，计数器必须证明没有 command handler、hook handler、tool handler、MCP call、model call、filesystem mutation、process execution 或 host callback 被运行。

#### Scenario: Inspector shows complete contract / 检查器展示完整契约
- **WHEN** plugin inspector tests render plugin details
- **THEN** they assert lifecycle state, API levels, source, trust, version, integrity, permissions, credentials, dependencies, conflicts, health, audit links, contribution list, and owner execution routes
- **中文** 当 plugin inspector tests 渲染 plugin details 时，必须断言 lifecycle state、API levels、source、trust、version、integrity、permissions、credentials、dependencies、conflicts、health、audit links、contribution list 与 owner execution routes。
